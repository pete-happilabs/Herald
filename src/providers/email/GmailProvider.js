const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class GmailProvider {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    this.name = 'GMAIL';
  }

  async send(to, subject, body) {
    try {
      // DEBUG: Log what we received
      logger.info('Gmail send called', {
        service: 'herald',
        to,
        subject,
        bodyType: typeof body,
        bodyKeys: typeof body === 'object' ? Object.keys(body) : 'N/A'
      });

      // Handle if body is an object (shouldn't happen, but defensive)
      let emailBody = body;
      let emailSubject = subject;
      
      if (typeof body === 'object' && body !== null) {
        logger.warn('Gmail received object instead of string', {
          service: 'herald',
          bodyStructure: JSON.stringify(body).substring(0, 200)
        });
        emailBody = body.body || body.html || body.content || JSON.stringify(body);
        emailSubject = body.subject || subject;
      }

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: to,
        subject: emailSubject,
        html: emailBody
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Gmail email sent', {
        to,
        messageId: result.messageId,
        service: 'herald'
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'GMAIL'
      };
    } catch (error) {
      logger.error('Gmail send failed', {
        to,
        error: error.message,
        service: 'herald'
      });
      throw error;
    }
  }

  async checkHealth() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Gmail health check failed', {
        error: error.message,
        service: 'herald'
      });
      return false;
    }
  }
}

module.exports = GmailProvider;
