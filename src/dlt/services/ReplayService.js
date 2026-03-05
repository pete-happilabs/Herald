const Redis = require('ioredis');
const Queue = require('bull');
const logger = require('../../utils/logger');

class ReplayService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.messageQueue = new Queue('messages', process.env.REDIS_URL);
    this.DLQ_KEY = 'herald:dlq';
  }

  async replayMessage(correlationId) {
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const parsed = JSON.parse(msg);
        
        if (parsed.correlationId === correlationId) {
          // Add back to queue
          const job = await this.messageQueue.add('send', {
            templateCode: parsed.templateCode,
            channel: parsed.channel,
            to: parsed.to,
            variables: parsed.variables,
            productCode: parsed.productCode,
            correlationId: parsed.correlationId
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000 // 1 minute
            }
          });

          // Remove from DLQ
          await this.redis.lrem(this.DLQ_KEY, 1, msg);
          
          logger.info('Message replayed', { correlationId, jobId: job.id });
          
          return {
            success: true,
            jobId: job.id,
            correlationId
          };
        }
      }

      throw new Error('Message not found in DLQ');
    } catch (error) {
      logger.error('Error replaying message', { correlationId, error: error.message });
      throw error;
    }
  }

  async replayBatch(filters = {}) {
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      const replayed = [];
      const failed = [];

      for (const msg of messages) {
        const parsed = JSON.parse(msg);
        
        // Apply filters
        if (filters.channel && parsed.channel !== filters.channel) continue;
        if (filters.productCode && parsed.productCode !== filters.productCode) continue;
        
        try {
          const result = await this.replayMessage(parsed.correlationId);
          replayed.push(result);
        } catch (error) {
          failed.push({ correlationId: parsed.correlationId, error: error.message });
        }
      }

      logger.info('Batch replay completed', { 
        replayed: replayed.length, 
        failed: failed.length 
      });

      return {
        success: true,
        replayed: replayed.length,
        failed: failed.length,
        details: { replayed, failed }
      };
    } catch (error) {
      logger.error('Error in batch replay', { error: error.message });
      throw error;
    }
  }

  async replayAll() {
    try {
      return await this.replayBatch({});
    } catch (error) {
      logger.error('Error replaying all', { error: error.message });
      throw error;
    }
  }
}

module.exports = ReplayService;
