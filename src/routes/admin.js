/**
 * Admin & Monitoring Routes
 */
const db = require('../lib/db');
const redis = require('../lib/redis');
const messageQueue = require('../queue/messageQueue');
const metrics = require('../utils/metrics');

async function adminRoutes(fastify, options) {
  /**
   * GET /health
   * Deep health check
   */
  fastify.get('/health', async (request, reply) => {
    try {
      const checks = {
        redis: false,
        database: false,
        queue: false
      };

      // Check Redis
      try {
        const pong = await redis.ping();
        checks.redis = pong === 'PONG';
      } catch (error) {
        checks.redis = false;
      }

      // Check Database
      try {
        await db.query('SELECT 1');
        checks.database = true;
      } catch (error) {
        checks.database = false;
      }

      // Check Queue
      try {
        checks.queue = await messageQueue.isReady();
      } catch (error) {
        checks.queue = false;
      }

      const healthy = Object.values(checks).every((c) => c === true);
      const status = healthy ? 'healthy' : 'degraded';

      return reply.code(healthy ? 200 : 503).send({
        status,
        checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /metrics
   * Prometheus metrics endpoint
   */
  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return metrics.register.metrics();
  });

  /**
   * GET /stats
   * Application statistics
   */
  fastify.get('/stats', async (request, reply) => {
    const queueCounts = await messageQueue.getJobCounts();
    const dlqSize = await redis.llen('dlq:messages');

    return reply.send({
      queue: queueCounts,
      dlq: { size: dlqSize },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = adminRoutes;
