/**
 * API Key Authentication Middleware
 */
const logger = require('../utils/logger');

async function authenticationMiddleware(request, reply) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('Missing API key', {
      ip: request.ip,
      path: request.url
    });
    return reply.code(401).send({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required'
      }
    });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn('Invalid API key', {
      ip: request.ip,
      path: request.url
    });
    return reply.code(401).send({
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key'
      }
    });
  }

  // API key is valid, continue
}

module.exports = authenticationMiddleware;
