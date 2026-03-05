const axios = require('axios');
const logger = require('../../utils/logger');

class Fast2SMSProvider {
  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY;
    this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
    this.senderId = process.env.FAST2SMS_SENDER_ID || 'DOSTAI';
    this.name = 'FAST2SMS';
  }

  async send(to, template, variables = {}) {
    try {
      // Get template configuration
      const templateConfig = this.getTemplateConfig(template);
      
      if (!templateConfig) {
        throw new Error(`Template ${template} not configured for Fast2SMS DLT`);
      }

      // Format variables for Fast2SMS (pipe-separated with trailing pipe)
      const variableValues = this.formatVariables(templateConfig.variables, variables);

      // Build request payload
      const payload = {
        route: 'dlt',
        sender_id: templateConfig.senderId || this.senderId,
        message: templateConfig.messageId,
        variables_values: variableValues,
        flash: 0,
        numbers: this.formatPhoneNumber(to)
      };

      logger.info('Sending Fast2SMS DLT SMS', {
        to,
        template,
        messageId: templateConfig.messageId,
        service: 'herald'
      });

      // Make API request
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Check response
      if (response.data && response.data.return === true) {
        logger.info('Fast2SMS DLT SMS sent successfully', {
          to,
          template,
          messageId: response.data.message,
          service: 'herald'
        });

        return {
          success: true,
          messageId: response.data.message,
          provider: 'FAST2SMS'
        };
      } else {
        throw new Error(response.data.message || 'Fast2SMS API returned failure');
      }

    } catch (error) {
      logger.error('Fast2SMS DLT send failed', {
        to,
        template,
        error: error.message,
        service: 'herald'
      });
      throw error;
    }
  }

  formatPhoneNumber(phone) {
    // Remove +91 or any country code, Fast2SMS expects 10-digit numbers
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  }

  formatVariables(templateVars, actualValues) {
    // Fast2SMS expects: "value1|value2|value3|"
    // Always ends with a pipe
    const values = templateVars.map(varName => {
      return actualValues[varName] || '';
    });
    return values.join('|') + '|';
  }

  getTemplateConfig(templateCode) {
    // Template configurations
    const templates = {
      'OTP_VERIFICATION': {
        messageId: '208230',
        senderId: 'DOSTAI',
        variables: ['otp'],
        content: '{#VAR#} is your OTP for Happidost verification. Do not share it with anyone.'
      },
      'OTP_LOGIN': {
        messageId: '208230',
        senderId: 'DOSTAI',
        variables: ['otp'],
        content: '{#VAR#} is your OTP for Happidost verification. Do not share it with anyone.'
      }
      // Add more templates here as you create them
    };

    return templates[templateCode];
  }

  async checkHealth() {
    try {
      // Fast2SMS doesn't have a dedicated health endpoint
      // We check if API key is configured
      if (!this.apiKey || this.apiKey.includes('test_')) {
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Fast2SMS health check failed', {
        error: error.message,
        service: 'herald'
      });
      return false;
    }
  }
}

module.exports = Fast2SMSProvider;
