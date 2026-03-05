const cron = require('node-cron');
const ArchiveService = require('../services/ArchiveService');
const logger = require('../../utils/logger');

class ArchivalJob {
  constructor() {
    this.archiveService = new ArchiveService();
  }

  start() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Archival job started');

      try {
        // Archive messages older than 7 days
        const archiveResult = await this.archiveService.archiveOldMessages(168);
        logger.info('Messages archived', archiveResult);

        // Clean archives older than 90 days
        const cleanResult = await this.archiveService.cleanOldArchives(90);
        logger.info('Old archives cleaned', cleanResult);

      } catch (error) {
        logger.error('Archival job error', { error: error.message });
      }
    });

    logger.info('Archival job scheduled (daily at 2 AM)');
  }
}

module.exports = ArchivalJob;
