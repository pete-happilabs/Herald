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

  // Handle MessageError
  if (error instanceof MessageError) {
    return reply.code(error.statusCode).send(error.toJSON(request.correlationId));
  }

  // Handle validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Generic error
  return reply.code(error.statusCode || 500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      correlationId: request.correlationId,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = errorHandler;
