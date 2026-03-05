const DLQService = require('../services/DLQService');
const ArchivedMessage = require('../../models/ArchivedMessage');
const logger = require('../../utils/logger');

class AnalyticsController {
  constructor() {
    this.dlqService = new DLQService();
    this.archivedMessage = new ArchivedMessage();
  }

  async getAnalytics(request, reply) {
    try {
      const analytics = await this.dlqService.getAnalytics();
      
      reply.send({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getAnalytics', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async getStatistics(request, reply) {
    try {
      const { days = 7 } = request.query;
      
      const stats = await this.archivedMessage.getStatistics(parseInt(days));
      
      reply.send({
        success: true,
        data: {
          period: `${days} days`,
          statistics: stats
        }
      });
    } catch (error) {
      logger.error('Error in getStatistics', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async getHealthStatus(request, reply) {
    try {
      const dlqCount = await this.dlqService.getCount();
      const analytics = await this.dlqService.getAnalytics();
      
      const status = {
        healthy: dlqCount < 100, // Alert if DLQ has more than 100 messages
        dlqCount,
        threshold: 100,
        timestamp: new Date().toISOString()
      };

      reply.send({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error in getHealthStatus', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AnalyticsController;
