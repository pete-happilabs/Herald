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
      success: false,
      error: 'Invalid API key'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn('Invalid API key', {
      ip: request.ip,
      path: request.url
    });
    return reply.code(401).send({
      success: false,
      error: 'Invalid API key'
    });
  }
}

module.exports = authenticationMiddleware;
