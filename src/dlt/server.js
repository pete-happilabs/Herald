require('dotenv').config();
const fastify = require('fastify');
const cors = require('@fastify/cors');
const routes = require('./routes');
const authMiddleware = require('./middleware/auth');
const logger = require('../utils/logger');

const app = fastify({
  logger: false,
  trustProxy: true
});

// Register CORS
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Auth middleware for all routes except /health
app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health') {
    return;
  }
  return authMiddleware(request, reply, () => {});
});

// Register routes
app.register(routes);

// Error handler
app.setErrorHandler((error, request, reply) => {
  logger.error('DLT Server error', {
    error: error.message,
    stack: error.stack,
    url: request.url
  });

  reply.code(500).send({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.DLT_PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    logger.error('Failed to start DLT server', { error: err.message });
    process.exit(1);
  }
  logger.info('Herald DLT service started', { address, port: PORT });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down DLT service gracefully');
  await app.close();
  process.exit(0);
});
