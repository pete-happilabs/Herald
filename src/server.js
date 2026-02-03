/**
 * Server Entry Point
 */
require('dotenv').config();
const buildApp = require('./app');
const { startBalanceCheckJob } = require('./jobs/balanceCheck');
const logger = require('./utils/logger');
const config = require('./config');

async function start() {
  try {
    const app = await buildApp();

    // Start server
    await app.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    logger.info(`Herald API server listening on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);

    // Start cron jobs
    startBalanceCheckJob();

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      await app.close();
      await require('./lib/redis').quit();
      await require('./lib/db').end();

      logger.info('Server shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

start();
