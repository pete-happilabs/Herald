/**
 * Worker Entry Point
 * Runs queue worker in separate process
 */
require('dotenv').config();
const logger = require('./utils/logger');
const configService = require('./services/ConfigService');

async function startWorker() {
  logger.info('Starting Herald worker process...');

  // Initialize config from DB before starting queue processing
  await configService.initialize();

  // Initialize worker
  require('./queue/workers');
}

startWorker().catch(error => {
  logger.error('Failed to start worker', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

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
