const axios = require('axios');
const logger = require('../../utils/logger');

class BulkSMSProvider {
  constructor() {
    this.apiKey = process.env.BULKSMS_API_KEY;
    this.baseUrl = process.env.BULKSMS_API_URL || 'https://www.bulksmsplans.com/api/send_sms';
    this.senderId = process.env.BULKSMS_SENDER_ID || process.env.FAST2SMS_SENDER_ID || 'DOSTAI';
    this.entityId = process.env.BULKSMS_ENTITY_ID || process.env.FAST2SMS_ENTITY_ID;
    this.name = 'BULKSMS';
  }

  async send(to, template, variables = {}) {
    try {
      const templateConfig = this.getTemplateConfig(template);

      if (!templateConfig) {
        throw new Error(`Template ${template} not configured for BulkSMS`);
      }

      const message = this.renderMessage(templateConfig.content, variables);
      const phoneNumber = this.formatPhoneNumber(to);

      const payload = {
        api_id: this.apiKey,
        message: message,
        to: phoneNumber,
        sender: templateConfig.senderId || this.senderId,
        template_id: templateConfig.templateId,
        entity_id: this.entityId
      };

      logger.info('Sending BulkSMS', {
        to,
        template,
        templateId: templateConfig.templateId,
        service: 'herald'
      });

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && (response.data.success || response.data.status === 'success')) {
        logger.info('BulkSMS sent successfully', {
          to,
          template,
          messageId: response.data.message_id || response.data.request_id,
          service: 'herald'
        });

        return {
          success: true,
          messageId: response.data.message_id || response.data.request_id,
          provider: 'BULKSMS'
        };
      }

      throw new Error(response.data?.message || 'BulkSMS API returned failure');
    } catch (error) {
      logger.error('BulkSMS send failed', {
        to,
        template,
        error: error.message,
        service: 'herald'
      });
      throw error;
    }
  }

  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  }

  renderMessage(content, variables) {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  getTemplateConfig(templateCode) {
    const templates = {
      'OTP_VERIFICATION': {
        templateId: process.env.BULKSMS_OTP_TEMPLATE_ID || '',
        senderId: this.senderId,
        content: '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.'
      },
      'OTP_LOGIN': {
        templateId: process.env.BULKSMS_OTP_TEMPLATE_ID || '',
        senderId: this.senderId,
        content: '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.'
      }
    };

    return templates[templateCode];
  }

  async checkHealth() {
    if (!this.apiKey || this.apiKey.includes('test_')) {
      return false;
    }
    return true;
  }
}

module.exports = BulkSMSProvider;
