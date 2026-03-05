const AWS = require('aws-sdk');
const logger = require('../../utils/logger');

class SESProvider {
  constructor() {
    this.ses = new AWS.SES({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.name = 'SES';
  }

  async send(to, subject, body) {
    try {
      const params = {
        Source: process.env.SES_FROM_EMAIL,
        Destination: {
          ToAddresses: [to]
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: body }
          }
        }
      };

      const result = await this.ses.sendEmail(params).promise();
      
      logger.info('SES email sent', {
        to,
        messageId: result.MessageId,
        service: 'herald'
      });

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'SES'
      };
    } catch (error) {
      logger.error('SES send failed', {
        to,
        error: error.message,
        service: 'herald'
      });
      throw error;
    }
  }

  async checkHealth() {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.includes('test_')) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = SESProvider;
