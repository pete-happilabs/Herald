/**
 * Correlation ID Middleware
 * Adds unique ID to every request for tracing
 */
const crypto = require('crypto');

async function correlationIdMiddleware(request, reply) {
  request.correlationId =
    request.headers['x-correlation-id'] ||
    request.headers['x-request-id'] ||
    crypto.randomUUID();

  reply.header('X-Correlation-ID', request.correlationId);
}

module.exports = correlationIdMiddleware;
