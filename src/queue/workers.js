/**
 * Queue Worker Process
 * Processes messages from Bull queue
 */
const messageQueue = require('./messageQueue');
const messageService = require('../services/MessageService');
const redis = require('../lib/redis');
const logger = require('../utils/logger');

/**
 * Process message jobs
 */
messageQueue.process(async job => {
  const { data } = job;
  const { productCode, channel, templateCode, to, variables, correlationId } = data;

  logger.info('Processing message job', {
    jobId: job.id,
    correlationId,
    productCode,
    channel
  });

  try {
    job.progress(10);

    const result = await messageService.send({
      productCode,
      channel,
      templateCode,
      to,
      variables,
      correlationId: correlationId || job.id
    });

    job.progress(100);

    logger.info('Job processed successfully', {
      jobId: job.id,
      correlationId,
      result
    });

    // Store metrics in Redis for API to read
    await redis.incr(`metrics:messages_sent:${channel}:${result.provider}:success`);

    return result;
  } catch (error) {
    logger.error('Job processing failed', {
      jobId: job.id,
      correlationId,
      error: error.message,
      stack: error.stack
    });

    // Store failure metric
    await redis.incr(`metrics:messages_sent:${channel}:unknown:failed`);

    throw error;
  }
});

logger.info('Queue worker started and ready to process jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully...');
  await messageQueue.close();
  logger.info('Worker closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully...');
  await messageQueue.close();
  logger.info('Worker closed');
  process.exit(0);
});
