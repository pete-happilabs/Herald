require('dotenv').config();
require('./server'); // Start DLT API server

const AutoRetryJob = require('./jobs/autoRetry');
const ArchivalJob = require('./jobs/archival');
const logger = require('../utils/logger');

// Start background jobs
if (process.env.DLT_AUTO_RETRY_ENABLED === 'true') {
  const autoRetry = new AutoRetryJob();
  autoRetry.start();
  logger.info('DLT Auto-retry job enabled');
} else {
  logger.info('DLT Auto-retry job disabled');
}

const archival = new ArchivalJob();
archival.start();
logger.info('DLT Archival job enabled');

logger.info('Herald DLT service fully initialized', {
  port: process.env.DLT_PORT || 3002,
  autoRetry: process.env.DLT_AUTO_RETRY_ENABLED === 'true',
  archiveAge: process.env.DLT_ARCHIVE_AGE_HOURS || 168,
  cleanupAge: process.env.DLT_ARCHIVE_CLEANUP_DAYS || 90
});
