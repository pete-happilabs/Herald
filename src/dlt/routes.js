const DLQController = require('./controllers/dlqController');
const AnalyticsController = require('./controllers/analyticsController');

const dlqController = new DLQController();
const analyticsController = new AnalyticsController();

async function routes(fastify, options) {
  // DLQ Management Routes
  fastify.get('/api/v1/dlq', dlqController.getAllMessages.bind(dlqController));
  fastify.get('/api/v1/dlq/count', dlqController.getCount.bind(dlqController));
  fastify.get('/api/v1/dlq/:correlationId', dlqController.getMessage.bind(dlqController));
  fastify.delete('/api/v1/dlq/:correlationId', dlqController.deleteMessage.bind(dlqController));
  fastify.delete('/api/v1/dlq', dlqController.clearAll.bind(dlqController));

  // Replay Routes
  fastify.post('/api/v1/dlq/:correlationId/replay', dlqController.replayMessage.bind(dlqController));
  fastify.post('/api/v1/dlq/replay-batch', dlqController.replayBatch.bind(dlqController));

  // Analytics Routes
  fastify.get('/api/v1/analytics', analyticsController.getAnalytics.bind(analyticsController));
  fastify.get('/api/v1/analytics/statistics', analyticsController.getStatistics.bind(analyticsController));
  fastify.get('/api/v1/analytics/health', analyticsController.getHealthStatus.bind(analyticsController));

  // Health Check
  fastify.get('/health', async (request, reply) => {
    reply.send({ 
      status: 'ok', 
      service: 'herald-dlt',
      timestamp: new Date().toISOString() 
    });
  });
}

module.exports = routes;
