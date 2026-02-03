/**
 * Base Provider Abstract Class
 * All providers must extend this class
 */
class BaseProvider {
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new TypeError('Cannot construct BaseProvider instances directly');
    }
    this.name = name;
  }

  /**
   * Send message - must be implemented by subclass
   * @param {Object} options - {to, content, subject, config}
   * @returns {Promise<{messageId: string}>}
   */
  async send(options) {
    throw new Error('send() must be implemented by subclass');
  }

  /**
   * Check balance - for SMS providers
   * @param {Object} config - Provider configuration
   * @returns {Promise<number>} Balance amount
   */
  async checkBalance(config) {
    throw new Error('checkBalance() not implemented');
  }

  /**
   * Validate config before sending
   */
  validateConfig(config, requiredFields) {
    const missing = requiredFields.filter(field => !config[field]);
    if (missing.length > 0) {
      throw new Error(`Missing config fields for ${this.name}: ${missing.join(', ')}`);
    }
  }
}

module.exports = BaseProvider;
