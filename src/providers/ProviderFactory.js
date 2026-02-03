const GmailProvider = require('./email/GmailProvider');
const SESProvider = require('./email/SESProvider');
const Fast2SMSProvider = require('./sms/Fast2SMSProvider');

class ProviderFactory {
  static create(providerName) {
    const providers = {
      GMAIL: GmailProvider,
      SES: SESProvider,
      FAST2SMS: Fast2SMSProvider
    };

    const ProviderClass = providers[providerName];
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    return new ProviderClass();
  }
}

module.exports = ProviderFactory;
