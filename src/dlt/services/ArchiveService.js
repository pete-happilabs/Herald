const Redis = require('ioredis');
const ArchivedMessage = require('../../models/ArchivedMessage');
const logger = require('../../utils/logger');

class ArchiveService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.archivedMessage = new ArchivedMessage();
    this.DLQ_KEY = 'herald:dlq';
  }

  async archiveOldMessages(ageInHours = 168) { // 7 days default
    try {
      const messages = await this.redis.lrange(this.DLQ_KEY, 0, -1);
      const now = Date.now();
      const cutoffTime = now - (ageInHours * 60 * 60 * 1000);
      
      let archived = 0;

      for (const msg of messages) {
        const parsed = JSON.parse(msg);
        const messageTime = new Date(parsed.timestamp).getTime();

        if (messageTime < cutoffTime) {
          // Archive to PostgreSQL
          await this.archivedMessage.create({
            correlationId: parsed.correlationId,
            productCode: parsed.productCode,
            channel: parsed.channel,
            templateCode: parsed.templateCode,
            recipient: parsed.to,
            variables: parsed.variables,
            errorMessage: parsed.error,
            failureCount: parsed.attempts || 1,
            firstFailedAt: new Date(parsed.timestamp),
            lastFailedAt: new Date(parsed.lastAttempt || parsed.timestamp)
          });

          // Remove from Redis DLQ
          await this.redis.lrem(this.DLQ_KEY, 1, msg);
          archived++;
        }
      }

      logger.info('Old messages archived', { count: archived, ageInHours });
      
      return {
        success: true,
        archived,
        ageInHours
      };
    } catch (error) {
      logger.error('Error archiving messages', { error: error.message });
      throw error;
    }
  }

  async cleanOldArchives(days = 90) {
    try {
      const deleted = await this.archivedMessage.deleteOlderThan(days);
      logger.info('Old archives cleaned', { deleted, days });
      
      return {
        success: true,
        deleted,
        days
      };
    } catch (error) {
      logger.error('Error cleaning archives', { error: error.message });
      throw error;
    }
  }
}

module.exports = ArchiveService;
