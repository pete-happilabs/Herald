/**
 * Message Service
 * Core message sending logic with retry, circuit breaker, and failover
 */
const CircuitBreaker = require('opossum');
const Bottleneck = require('bottleneck');
const configService = require('./ConfigService');
const pipelineService = require('./PipelineService');
const ProviderFactory = require('../providers/ProviderFactory');
const db = require('../lib/db');
const redis = require('../lib/redis');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const { MessageError, RateLimitError } = require('../utils/errors');

class MessageService {
  constructor() {
    this.circuitBreakers = new Map();
    this.rateLimiters = new Map();
    this._initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for all providers
   */
  _initializeCircuitBreakers() {
    const smsPipelines = configService.getPipelines('SMS').map(p => ({ ...p, channel: 'SMS' }));
    const emailPipelines = configService.getPipelines('EMAIL').map(p => ({ ...p, channel: 'EMAIL' }));
    const allPipelines = [...smsPipelines, ...emailPipelines];

    allPipelines.forEach(pipeline => {
      const breaker = new CircuitBreaker(async message => this._sendWithRetry(pipeline, message), {
        timeout: pipeline.timeout || 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        name: pipeline.provider
      });

      breaker.on('open', () => {
        logger.error(`Circuit breaker OPEN for ${pipeline.provider}`);
        metrics.circuitBreakerOpen.inc({ provider: pipeline.provider }, 1);
        pipelineService.updatePipelineHealth(pipeline.channel || 'UNKNOWN', pipeline.provider, false);
      });

      breaker.on('halfOpen', () => {
        logger.info(`Circuit breaker HALF-OPEN for ${pipeline.provider}`);
      });

      breaker.on('close', () => {
        logger.info(`Circuit breaker CLOSED for ${pipeline.provider}`);
      });

      this.circuitBreakers.set(pipeline.provider, breaker);

      if (pipeline.rateLimit) {
        this.rateLimiters.set(pipeline.provider, new Bottleneck(pipeline.rateLimit));
        logger.debug('Rate limiter initialized', {
          provider: pipeline.provider,
          config: pipeline.rateLimit
        });
      }
    });

    logger.info('Circuit breakers and rate limiters initialized', {
      count: this.circuitBreakers.size
    });
  }

  /**
   * Send message with full production features
   */
  async send({ productCode, channel, templateCode, to, variables, correlationId }) {
    const startTime = Date.now();

    try {
      const product = configService.getProduct(productCode);
      await this._checkRateLimit(productCode, product.dailyLimit);

      const template = configService.getTemplate(productCode, channel, templateCode);
      this._validateVariables(template, variables);

      const content = this._renderTemplate(template, variables);
      const subject = template.subject ? this._renderTemplate({ body: template.subject }, variables) : undefined;

      const result = await this._sendWithFailover({
        channel,
        to,
        content,
        subject,
        template,
        productCode,
        correlationId,
        variables
      });

      await this._incrementRateLimit(productCode);

      const duration = (Date.now() - startTime) / 1000;
      metrics.messagesSent.inc({ channel, provider: result.provider, status: 'success' });
      metrics.sendDuration.observe({ channel, provider: result.provider }, duration);

      logger.info('Message sent successfully', {
        correlationId,
        productCode,
        channel,
        provider: result.provider,
        duration
      });

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      metrics.messagesSent.inc({ channel, provider: 'unknown', status: 'failed' });

      logger.error('Message send failed', {
        correlationId,
        productCode,
        channel,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  /**
   * Send with automatic failover across providers
   */
  async _sendWithFailover({ channel, to, content, subject, template, productCode, correlationId, variables }) {
    const pipelines = configService.getPipelines(channel);
    const errors = [];

    for (const pipeline of pipelines) {
      try {
        const isHealthy = await pipelineService.checkPipelineHealth(channel, pipeline.provider);
        if (!isHealthy) {
          logger.warn('Skipping unhealthy pipeline', { provider: pipeline.provider });
          continue;
        }

        const breaker = this.circuitBreakers.get(pipeline.provider);
        if (breaker.opened || breaker.isOpen) {
          logger.warn('Circuit breaker open, skipping', { provider: pipeline.provider });
          continue;
        }

        const rateLimiter = this.rateLimiters.get(pipeline.provider);
        const sendFn = rateLimiter
          ? () =>
              rateLimiter.schedule(() =>
                breaker.fire({
                  to,
                  content,
                  subject,
                  template: template.templateCode,
                  variables,
                  config: pipeline.config
                })
              )
          : () =>
              breaker.fire({
                to,
                content,
                subject,
                template: template.templateCode,
                variables,
                config: pipeline.config
              });

        const response = await sendFn();

        await this._logMessage({
          correlationId,
          productCode,
          templateCode: template.templateCode,
          channel,
          provider: pipeline.provider,
          recipient: to,
          status: 'SENT',
          providerMessageId: response.messageId,
          variables
        });

        return {
          success: true,
          messageId: response.messageId,
          provider: pipeline.provider,
          correlationId
        };
      } catch (error) {
        errors.push({ provider: pipeline.provider, error: error.message });

        await this._logMessage({
          correlationId,
          productCode,
          templateCode: template.templateCode,
          channel,
          provider: pipeline.provider,
          recipient: to,
          status: 'FAILED',
          errorMessage: error.message,
          variables
        });

        logger.warn('Provider send failed, trying next', {
          provider: pipeline.provider,
          error: error.message
        });
      }
    }

    await this._sendToDLQ({
      correlationId,
      productCode,
      channel,
      templateCode: template.templateCode,
      to,
      variables,
      errors
    });

    throw new MessageError('ALL_PROVIDERS_FAILED', `All ${channel} providers failed`, { errors });
  }

  /**
   * Send with exponential backoff retry
   */
  async _sendWithRetry(pipeline, message) {
    const maxRetries = pipeline.maxRetries || 3;
    const provider = ProviderFactory.create(pipeline.provider);

    if (!provider) {
      throw new Error(`Provider ${pipeline.provider} not found`);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // For SMS, pass template code and variables to provider
        if (message.template && message.variables) {
          return await provider.send(message.to, message.template, message.variables);
        }
        // For EMAIL, pass subject and body
        return await provider.send(message.to, message.subject, message.content);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt - 1) * 1000;
        logger.warn('Retrying send', {
          provider: pipeline.provider,
          attempt,
          maxRetries,
          delay
        });

        await this._sleep(delay);
      }
    }
  }

  /**
   * Send failed message to Dead Letter Queue
   */
  async _sendToDLQ(data) {
    const dlqData = {
      ...data,
      failedAt: new Date().toISOString(),
      attempts: (data.attempts || 0) + 1
    };

    await redis.lpush('dlq:messages', JSON.stringify(dlqData));

    const dlqSize = await redis.llen('dlq:messages');
    metrics.dlqSize.set(dlqSize);

    logger.error('Message sent to DLQ', {
      correlationId: data.correlationId,
      dlqSize
    });

    if (dlqSize > 100) {
      await this._alertDLQThreshold(dlqSize);
    }
  }

  /**
   * Render template with variables
   */
  _renderTemplate(template, variables) {
    const content = template.body || template.content || '';
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Validate required template variables
   */
  _validateVariables(template, variables) {
    // Extract variables from template content
    const content = template.body || template.content || '';
    const subject = template.subject || '';
    const fullTemplate = content + ' ' + subject;
    
    // Find all {{variable}} patterns
    const variablePattern = /\{\{(\w+)\}\}/g;
    const requiredVars = [];
    let match;
    
    while ((match = variablePattern.exec(fullTemplate)) !== null) {
      if (!requiredVars.includes(match[1])) {
        requiredVars.push(match[1]);
      }
    }
    
    // Check for missing variables
    const missing = requiredVars.filter(v => !variables[v] && variables[v] !== 0 && variables[v] !== '');

    if (missing.length > 0) {
      throw new MessageError('MISSING_VARIABLES', `Missing required variables: ${missing.join(', ')}`, {
        missing
      });
    }
  }

  /**
   * Check product daily rate limit
   */
  async _checkRateLimit(productCode, dailyLimit) {
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:${productCode}:${today}`;
    const count = await redis.get(key);

    if (count && parseInt(count, 10) >= dailyLimit) {
      throw new RateLimitError(productCode, dailyLimit);
    }
  }

  /**
   * Increment product rate limit counter
   */
  async _incrementRateLimit(productCode) {
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:${productCode}:${today}`;

    await redis.incr(key);
    await redis.expire(key, 86400);
  }

  /**
   * Log message to database
   */
  async _logMessage(data) {
    try {
      await db.query(
        `INSERT INTO message_log 
         (correlation_id, product_code, template_code, channel, provider, recipient, 
          status, provider_message_id, variables, error_message, attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          data.correlationId,
          data.productCode,
          data.templateCode,
          data.channel,
          data.provider || null,
          data.recipient,
          data.status,
          data.providerMessageId || null,
          JSON.stringify(data.variables || {}),
          data.errorMessage || null,
          data.attempts || 1
        ]
      );
    } catch (error) {
      logger.error('Failed to log message', {
        correlationId: data.correlationId,
        error: error.message
      });
    }
  }

  /**
   * Alert when DLQ threshold exceeded
   */
  async _alertDLQThreshold(size) {
    logger.error('DLQ threshold exceeded', { size });
    // TODO: Implement Slack/PagerDuty alerting
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new MessageService();
