/**
 * Bull Queue Configuration
 * Handles async message processing with retry and DLQ
 */
const Bull = require('bull');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const messageQueue = new Bull('messages', process.env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
    timeout: 60000
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 2
  }
});

// Queue events
messageQueue.on('error', error => {
  logger.error('Queue error', { error: error.message });
});

messageQueue.on('waiting', jobId => {
  logger.debug('Job waiting', { jobId });
});

messageQueue.on('active', job => {
  logger.info('Job started', { jobId: job.id, data: job.data });
  metrics.queueJobsActive.inc();
});

messageQueue.on('completed', (job, result) => {
  logger.info('Job completed', {
    jobId: job.id,
    duration: Date.now() - job.processedOn,
    result
  });
  metrics.queueJobsCompleted.inc();
  metrics.queueJobsActive.dec();
});

messageQueue.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job.id,
    attempts: job.attemptsMade,
    error: error.message
  });
  metrics.queueJobsFailed.inc();
  metrics.queueJobsActive.dec();
});

messageQueue.on('stalled', job => {
  logger.warn('Job stalled', { jobId: job.id });
  metrics.queueJobsStalled.inc();
});

messageQueue.on('progress', (job, progress) => {
  logger.debug('Job progress', { jobId: job.id, progress });
});

// Clean old jobs periodically
setInterval(async () => {
  await messageQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 hours
  await messageQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 days
}, 60 * 60 * 1000); // Every hour

module.exports = messageQueue;
