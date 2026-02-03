const Redis = require('ioredis');
const ArchivedMessage = require('../../models/ArchivedMessage');
const logger = require('../../utils/logger');

class DLQService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.archivedMessage = new ArchivedMessage();
    this.DLQ_KEY = 'herald:dlq';
  }

  async getAllMessages(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      // Get messages from Redis DLQ
      const messages = await this.redis.lrange(this.DLQ_KEY, offset, offset + limit - 1);
      const total = await this.redis.llen(this.DLQ_KEY);

      const parsed = messages.map(msg => {
        try {
          return JSON.parse(msg);
        } catch (e) {
          logger.error('Failed to parse DLQ message', { error: e.message });
          return null;
        }
      }).filter(Boolean);

      return {
        messages: parsed,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Error fetching DLQ messages', { error: error.message });
      throw error;
    }
  }

  async getMessageByCorrelationId(correlationId) {
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      
      for (const msg of messages) {
        const parsed = JSON.parse(msg);
        if (parsed.correlationId === correlationId) {
          return parsed;
        }
      }

      // Check archived messages
      const archived = await this.archivedMessage.findByCorrelationId(correlationId);
      if (archived) {
        return {
          ...archived,
          source: 'archive',
          variables: archived.variables
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching message', { correlationId, error: error.message });
      throw error;
    }
  }

  async deleteMessage(correlationId) {
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      let deleted = false;

      for (let i = 0; i < messages.length; i++) {
        const parsed = JSON.parse(messages[i]);
        if (parsed.correlationId === correlationId) {
          await this.redis.lrem(this.DLQ_KEY, 1, messages[i]);
          deleted = true;
          logger.info('Message deleted from DLQ', { correlationId });
          break;
        }
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting message', { correlationId, error: error.message });
      throw error;
    }
  }

  async getCount() {
    try {
      return await this.redis.llen(this.DLQ_KEY);
    } catch (error) {
      logger.error('Error getting DLQ count', { error: error.message });
      return 0;
    }
  }

  async clearAll() {
    try {
      const count = await this.redis.llen(this.DLQ_KEY);
      await this.redis.del(this.DLQ_KEY);
      logger.info('DLQ cleared', { count });
      return count;
    } catch (error) {
      logger.error('Error clearing DLQ', { error: error.message });
      throw error;
    }
  }

  async getAnalytics() {
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      const parsed = messages.map(msg => JSON.parse(msg));

      // Group by channel
      const byChannel = {};
      const byProductCode = {};
      const byError = {};

      parsed.forEach(msg => {
        // By channel
        byChannel[msg.channel] = (byChannel[msg.channel] || 0) + 1;

        // By product code
        byProductCode[msg.productCode] = (byProductCode[msg.productCode] || 0) + 1;

        // By error type
        const errorType = msg.error?.split(':')[0] || 'Unknown';
        byError[errorType] = (byError[errorType] || 0) + 1;
      });

      // Get archived statistics
      const archivedStats = await this.archivedMessage.getStatistics(30);

      return {
        current: {
          total: parsed.length,
          byChannel,
          byProductCode,
          byError
        },
        archived: archivedStats,
        summary: {
          oldestMessage: parsed.length > 0 ? parsed[parsed.length - 1].timestamp : null,
          newestMessage: parsed.length > 0 ? parsed[0].timestamp : null
        }
      };
    } catch (error) {
      logger.error('Error getting analytics', { error: error.message });
      throw error;
    }
  }
}

module.exports = DLQService;
