/**
 * Redis Client
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error('Redis connection error', { error: err.message });
    return true;
  }
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', err => {
  logger.error('Redis error', { error: err.message });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

module.exports = redis;
