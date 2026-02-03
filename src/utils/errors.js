/**
 * Custom Error Classes
 */
class MessageError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'MessageError';
    this.code = code;
    this.details = details;
    this.statusCode = this._mapStatusCode(code);
  }

  _mapStatusCode(code) {
    const statusMap = {
      MISSING_VARIABLES: 400,
      INVALID_PRODUCT: 400,
      INVALID_TEMPLATE: 400,
      INVALID_CHANNEL: 400,
      RATE_LIMIT_EXCEEDED: 429,
      PRODUCT_NOT_FOUND: 404,
      TEMPLATE_NOT_FOUND: 404,
      ALL_PROVIDERS_FAILED: 503,
      PROVIDER_TIMEOUT: 504
    };
    return statusMap[code] || 500;
  }

  toJSON(correlationId) {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        correlationId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

class ValidationError extends MessageError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, details);
  }
}

class RateLimitError extends MessageError {
  constructor(productCode, limit) {
    super('RATE_LIMIT_EXCEEDED', `Daily limit ${limit} exceeded for ${productCode}`, {
      productCode,
      limit
    });
  }
}

module.exports = {
  MessageError,
  ValidationError,
  RateLimitError
};
