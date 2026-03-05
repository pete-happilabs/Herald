const cron = require('node-cron');
const ReplayService = require('../services/ReplayService');
const DLQService = require('../services/DLQService');
const logger = require('../../utils/logger');

class AutoRetryJob {
  constructor() {
    this.replayService = new ReplayService();
    this.dlqService = new DLQService();
    this.running = false;
  }

  start() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      if (this.running) {
        logger.info('Auto-retry already running, skipping');
        return;
      }

      this.running = true;
      logger.info('Auto-retry job started');

      try {
        const dlqCount = await this.dlqService.getCount();
        
        if (dlqCount === 0) {
          logger.info('DLQ is empty, nothing to retry');
          return;
        }

        // Get all DLQ messages
        const result = await this.dlqService.getAllMessages({ limit: 100 });
        const messages = result.messages;

        let retried = 0;
        const now = Date.now();

        for (const msg of messages) {
          const messageTime = new Date(msg.timestamp).getTime();
          const ageMinutes = (now - messageTime) / (1000 * 60);

          // Retry strategy: 1min, 5min, 15min
          const attempts = msg.retryAttempts || 0;
          let shouldRetry = false;

          if (attempts === 0 && ageMinutes >= 1) shouldRetry = true;
          else if (attempts === 1 && ageMinutes >= 5) shouldRetry = true;
          else if (attempts === 2 && ageMinutes >= 15) shouldRetry = true;

          if (shouldRetry && attempts < 3) {
            try {
              await this.replayService.replayMessage(msg.correlationId);
              retried++;
              logger.info('Auto-retry successful', { 
                correlationId: msg.correlationId,
                attempt: attempts + 1
              });
            } catch (error) {
              logger.error('Auto-retry failed', { 
                correlationId: msg.correlationId,
                error: error.message 
              });
            }
          }
        }

        logger.info('Auto-retry job completed', { retried, total: messages.length });
      } catch (error) {
        logger.error('Auto-retry job error', { error: error.message });
      } finally {
        this.running = false;
      }
    });

    logger.info('Auto-retry job scheduled (every 15 minutes)');
  }
}

module.exports = AutoRetryJob;
