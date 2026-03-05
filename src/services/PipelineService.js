/**
 * Pipeline Service
 * Manages pipeline health, balance, and status checks
 */
const redis = require('../lib/redis');
const configService = require('./ConfigService');
const providers = require('../providers');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

class PipelineService {
  /**
   * Select best available pipeline for channel
   */
  async selectPipeline(channel) {
    const pipelines = configService.getPipelines(channel);

    for (const pipeline of pipelines) {
      const isOperational = await this.checkPipelineHealth(channel, pipeline.provider);

      if (isOperational) {
        logger.debug('Pipeline selected', {
          channel,
          provider: pipeline.provider,
          priority: pipeline.priority
        });
        return pipeline;
      }
    }

    throw new Error(`No operational ${channel} pipeline available`);
  }

  /**
   * Check if pipeline is healthy
   */
  async checkPipelineHealth(channel, provider) {
    const key = `pipeline:${channel}:${provider}:operational`;
    const status = await redis.get(key);

    // Default to true if not set
    return status !== 'false';
  }

  /**
   * Update pipeline health status
   */
  async updatePipelineHealth(channel, provider, isOperational) {
    const key = `pipeline:${channel}:${provider}:operational`;
    await redis.set(key, isOperational.toString());

    logger.info('Pipeline health updated', {
      channel,
      provider,
      isOperational
    });

    metrics.pipelineHealth.set({ channel, provider }, isOperational ? 1 : 0);
  }

  /**
   * Get SMS balance for provider
   */
  async getSmsBalance(provider) {
    const balance = await redis.get(`sms:${provider}:balance`);
    return balance ? parseInt(balance) : null;
  }

  /**
   * Update SMS balance
   */
  async updateSmsBalance(provider, balance) {
    await redis.set(`sms:${provider}:balance`, balance);
    await redis.set(`sms:${provider}:lastChecked`, Date.now());

    // Mark as non-operational if balance is 0
    const operational = balance > 0;
    await this.updatePipelineHealth('SMS', provider, operational);

    logger.info('SMS balance updated', { provider, balance, operational });

    metrics.smsBalance.set({ provider }, balance);
  }

  /**
   * Get last balance check timestamp
   */
  async getLastBalanceCheck(provider) {
    const timestamp = await redis.get(`sms:${provider}:lastChecked`);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  /**
   * Get pipeline status for all channels
   */
  async getStatusCheck() {
    const smsStatus = await this._getChannelStatus('SMS');
    const emailStatus = await this._getChannelStatus('EMAIL');

    return {
      sms: smsStatus,
      email: emailStatus
    };
  }

  async _getChannelStatus(channel) {
    const pipelines = configService.getPipelines(channel);
    const status = [];

    for (const pipeline of pipelines) {
      const isOperational = await this.checkPipelineHealth(channel, pipeline.provider);

      const item = {
        provider: pipeline.provider,
        priority: pipeline.priority,
        isOperational
      };

      if (channel === 'SMS') {
        item.balance = await this.getSmsBalance(pipeline.provider);
        const lastChecked = await this.getLastBalanceCheck(pipeline.provider);
        item.lastCheckedAt = lastChecked ? lastChecked.toISOString() : null;
      }

      status.push(item);
    }

    return status;
  }
}

module.exports = new PipelineService();
