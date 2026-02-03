/**
 * Fastify Application Setup
 */
const fastify = require('fastify');
const cors = require('@fastify/cors');
const correlationIdMiddleware = require('./middleware/correlationId');
const authenticationMiddleware = require('./middleware/authentication');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

async function buildApp() {
  const app = fastify({
    logger: false, // Use Winston instead
    requestIdLogLabel: 'correlationId',
    disableRequestLogging: true,
    trustProxy: true
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // Global hooks
  app.addHook('onRequest', correlationIdMiddleware);

  // Authentication (skip for health/metrics)
  app.addHook('onRequest', async (request, reply) => {
    if (
      request.url === '/health' ||
      request.url === '/metrics' ||
      request.url.startsWith('/health')
    ) {
      return;
    }
    await authenticationMiddleware(request, reply);
  });

  // Request logging
  app.addHook('onRequest', (request, reply, done) => {
    logger.info('Incoming request', {
      correlationId: request.correlationId,
      method: request.method,
      url: request.url,
      ip: request.ip
    });
    done();
  });

  // Response logging
  app.addHook('onResponse', (request, reply, done) => {
    logger.info('Request completed', {
      correlationId: request.correlationId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime()
    });
    done();
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await app.register(routes);

  return app;
}

module.exports = buildApp;
