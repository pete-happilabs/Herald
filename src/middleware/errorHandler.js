/**
 * Global Error Handler
 */
const logger = require('../utils/logger');
const { MessageError } = require('../utils/errors');

async function errorHandler(error, request, reply) {
  logger.error('Request error', {
    correlationId: request.correlationId,
    method: request.method,
    url: request.url,
    error: error.message,
    stack: error.stack
  });

  // Handle MessageError (includes RateLimitError, ValidationError)
  if (error instanceof MessageError) {
    return reply.code(error.statusCode).send(error.toJSON());
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const details = {};
    for (const v of error.validation) {
      const field = v.params?.missingProperty || v.instancePath?.replace('/', '') || 'unknown';
      details[field] = v.message;
    }
    return reply.code(400).send({
      success: false,
      error: 'Validation failed',
      details
    });
  }

  // Generic error
  return reply.code(error.statusCode || 500).send({
    success: false,
    error: 'Internal server error',
    message: error.message || 'Failed to queue message'
  });
}

module.exports = errorHandler;
