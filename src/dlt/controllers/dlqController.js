const DLQService = require('../services/DLQService');
const ReplayService = require('../services/ReplayService');
const logger = require('../../utils/logger');

class DLQController {
  constructor() {
    this.dlqService = new DLQService();
    this.replayService = new ReplayService();
  }

  async getAllMessages(request, reply) {
    try {
      const { limit, offset, channel, productCode } = request.query;
      
      const result = await this.dlqService.getAllMessages({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        channel,
        productCode
      });

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getAllMessages', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async getMessage(request, reply) {
    try {
      const { correlationId } = request.params;
      
      const message = await this.dlqService.getMessageByCorrelationId(correlationId);
      
      if (!message) {
        return reply.code(404).send({
          success: false,
          error: 'Message not found'
        });
      }

      reply.send({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error in getMessage', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async deleteMessage(request, reply) {
    try {
      const { correlationId } = request.params;
      
      const deleted = await this.dlqService.deleteMessage(correlationId);
      
      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: 'Message not found'
        });
      }

      reply.send({
        success: true,
        message: 'Message deleted successfully',
        correlationId
      });
    } catch (error) {
      logger.error('Error in deleteMessage', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async replayMessage(request, reply) {
    try {
      const { correlationId } = request.params;
      
      const result = await this.replayService.replayMessage(correlationId);
      
      reply.send({
        success: true,
        message: 'Message replayed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in replayMessage', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async replayBatch(request, reply) {
    try {
      const { channel, productCode, all } = request.body;
      
      let result;
      if (all === true) {
        result = await this.replayService.replayAll();
      } else {
        result = await this.replayService.replayBatch({ channel, productCode });
      }
      
      reply.send({
        success: true,
        message: 'Batch replay completed',
        data: result
      });
    } catch (error) {
      logger.error('Error in replayBatch', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async getCount(request, reply) {
    try {
      const count = await this.dlqService.getCount();
      
      reply.send({
        success: true,
        count
      });
    } catch (error) {
      logger.error('Error in getCount', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }

  async clearAll(request, reply) {
    try {
      const count = await this.dlqService.clearAll();
      
      reply.send({
        success: true,
        message: 'DLQ cleared successfully',
        cleared: count
      });
    } catch (error) {
      logger.error('Error in clearAll', { error: error.message });
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = DLQController;
