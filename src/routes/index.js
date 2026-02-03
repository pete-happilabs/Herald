/**
 * Route Aggregator
 */
const messagingRoutes = require('./messaging');
const adminRoutes = require('./admin');

async function routes(fastify, options) {
  // Register messaging routes
  fastify.register(messagingRoutes, { prefix: '/api/v1' });

  // Register admin routes (no auth required for health/metrics)
  fastify.register(adminRoutes);
}

module.exports = routes;
