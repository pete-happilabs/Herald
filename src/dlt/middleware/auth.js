const logger = require('../../utils/logger');

function authMiddleware(request, reply, done) {
  const apiKey = request.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!apiKey) {
    logger.warn('DLT request without API key');
    return reply.code(401).send({
      success: false,
      error: 'API key required'
    });
  }

  if (apiKey !== expectedKey) {
    logger.warn('DLT request with invalid API key', { providedKey: apiKey.substring(0, 8) + '...' });
    return reply.code(403).send({
      success: false,
      error: 'Invalid API key'
    });
  }

  done();
}

module.exports = authMiddleware;
