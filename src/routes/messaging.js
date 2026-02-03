/**
 * Messaging Routes
 * Main API endpoints for sending messages
 */
const messageQueue = require('../queue/messageQueue');
const pipelineService = require('../services/PipelineService');
const configService = require('../services/ConfigService');
const redis = require('../lib/redis');
const logger = require('../utils/logger');

// JSON Schema for validation
const sendSchema = {
  body: {
    type: 'object',
    required: ['productCode', 'channel', 'templateCode', 'to', 'variables'],
    properties: {
      productCode: { type: 'string', pattern: '^[A-Z]+$' },
      channel: { type: 'string', enum: ['SMS', 'EMAIL'] },
      templateCode: { type: 'string', minLength: 1 },
      to: { type: 'string', minLength: 1 },
      variables: { type: 'object' }
    }
  }
};

async function messagingRoutes(fastify, options) {
  /**
   * POST /send
   * Queue a message for async processing
   */
  fastify.post('/send', { schema: sendSchema }, async (request, reply) => {
    const idempotencyKey = request.headers['idempotency-key'];

    try {
      // Check idempotency
      if (idempotencyKey) {
        const cached = await redis.get(`idempotency:${idempotencyKey}`);
        if (cached) {
          logger.info('Idempotent request, returning cached response', {
            idempotencyKey,
            correlationId: request.correlationId
          });
          return reply.send(JSON.parse(cached));
        }
      }

      // Add to queue
      const job = await messageQueue.add(
        {
          ...request.body,
          correlationId: request.correlationId
        },
        {
          jobId: `${request.correlationId}-${Date.now()}`
        }
      );

      const response = {
        success: true,
        jobId: job.id,
        status: 'QUEUED',
        correlationId: request.correlationId
      };

      // Cache for idempotency
      if (idempotencyKey) {
        await redis.setex(
          `idempotency:${idempotencyKey}`,
          86400,
          JSON.stringify(response)
        );
      }

      logger.info('Message queued', {
        jobId: job.id,
        correlationId: request.correlationId,
        productCode: request.body.productCode
      });

      return reply.code(202).send(response);
    } catch (error) {
      logger.error('Failed to queue message', {
        correlationId: request.correlationId,
        error: error.message
      });
      throw error;
    }
  });

  /**
   * GET /jobs/:jobId
   * Get job status
   */
  fastify.get('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params;

    const job = await messageQueue.getJob(jobId);

    if (!job) {
      return reply.code(404).send({
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job ${jobId} not found`,
          correlationId: request.correlationId
        }
      });
    }

    const state = await job.getState();
    const progress = job.progress();

    return reply.send({
      jobId: job.id,
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      createdAt: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
    });
  });

  /**
   * GET /status
   * Get pipeline status
   */
  fastify.get('/status', async (request, reply) => {
    const status = await pipelineService.getStatusCheck();
    return reply.send(status);
  });

  /**
   * GET /products
   * Get all products
   */
  fastify.get('/products', async (request, reply) => {
    const products = configService.getAllProducts();
    return reply.send(products);
  });

  /**
   * GET /products/:code
   * Get product details with templates
   */
  fastify.get('/products/:code', async (request, reply) => {
    try {
      const product = configService.getProduct(request.params.code);
      const templates = configService.getTemplatesByProduct(request.params.code);

      return reply.send({
        ...product,
        templates
      });
    } catch (error) {
      return reply.code(404).send({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: error.message,
          correlationId: request.correlationId
        }
      });
    }
  });

  /**
   * GET /dlq/stats
   * Get DLQ statistics
   */
  fastify.get('/dlq/stats', async (request, reply) => {
    const size = await redis.llen('dlq:messages');
    return reply.send({
      dlqSize: size,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /dlq/reprocess
   * Reprocess messages from DLQ
   */
  fastify.post('/dlq/reprocess', async (request, reply) => {
    const limit = request.body?.limit || 10;
    const reprocessed = [];

    for (let i = 0; i < limit; i++) {
      const message = await redis.rpop('dlq:messages');
      if (!message) break;

      const data = JSON.parse(message);
      if (data.attempts < 5) {
        const job = await messageQueue.add(data);
        reprocessed.push(job.id);
      }
    }

    logger.info('DLQ messages reprocessed', {
      count: reprocessed.length,
      correlationId: request.correlationId
    });

    return reply.send({
      reprocessed: reprocessed.length,
      jobIds: reprocessed
    });
  });
}

module.exports = messagingRoutes;
