const GmailProvider = require('./email/GmailProvider');
const SESProvider = require('./email/SESProvider');
const Fast2SMSProvider = require('./sms/Fast2SMSProvider');
const BulkSMSProvider = require('./sms/BulkSMSProvider');

class ProviderFactory {
  static create(providerName) {
    const providers = {
      GMAIL: GmailProvider,
      SES: SESProvider,
      FAST2SMS: Fast2SMSProvider,
      BULKSMS: BulkSMSProvider
    };

    const ProviderClass = providers[providerName];
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    return new ProviderClass();
  }
}

module.exports = ProviderFactory;
