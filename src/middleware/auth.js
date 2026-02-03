const validateApiKey = (config) => {
  return async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    const validApiKey = process.env.API_KEY || config.apiKey;

    if (!apiKey || apiKey !== validApiKey) {
      return reply.code(401).send({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key'
        }
      });
    }
  };
};

module.exports = { validateApiKey };
