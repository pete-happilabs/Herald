/**
 * SMS Balance Check Cron Job
 * Runs daily to check SMS provider balances
 */
const cron = require('node-cron');
const configService = require('../services/ConfigService');
const pipelineService = require('../services/PipelineService');
const providers = require('../providers');
const logger = require('../utils/logger');

function startBalanceCheckJob() {
  // Run daily at 2:00 AM IST
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting daily SMS balance check...');

    const smsPipelines = configService.getPipelines('SMS');

    for (const pipeline of smsPipelines) {
      try {
        const provider = providers[pipeline.provider];

        if (!provider.checkBalance) {
          logger.warn('Provider does not support balance check', {
            provider: pipeline.provider
          });
          continue;
        }

        const balance = await provider.checkBalance(pipeline.config);

        logger.info('SMS balance checked', {
          provider: pipeline.provider,
          balance
        });

        await pipelineService.updateSmsBalance(pipeline.provider, balance);
      } catch (error) {
        logger.error('Failed to check SMS balance', {
          provider: pipeline.provider,
          error: error.message
        });

        // Mark as non-operational
        await pipelineService.updateSmsBalance(pipeline.provider, 0);
      }
    }

    logger.info('Daily SMS balance check completed');
  });

  logger.info('SMS balance check cron job scheduled (Daily 2:00 AM IST)');
}

module.exports = { startBalanceCheckJob };
