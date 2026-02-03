/**
 * Worker Entry Point
 * Runs queue worker in separate process
 */
require('dotenv').config();
const logger = require('./utils/logger');

logger.info('Starting Herald worker process...');

// Initialize worker
require('./queue/workers');

// Handle uncaught errors
process.on('uncaughtException', error => {
  logger.error('Uncaught exception in worker', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in worker', {
    reason,
    promise
  });
  process.exit(1);
});
