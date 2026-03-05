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

  toJSON() {
    const response = {
      success: false,
      error: this.message
    };

    if (Object.keys(this.details).length > 0) {
      // Spread rate limit details at top level
      if (this.code === 'RATE_LIMIT_EXCEEDED') {
        Object.assign(response, this.details);
      } else {
        response.details = this.details;
      }
    }

    return response;
  }
}

class ValidationError extends MessageError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, details);
  }
}

class RateLimitError extends MessageError {
  constructor(productCode, dailyLimit, used) {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', {
      retryAfter: 60,
      limit: {
        daily: dailyLimit,
        used: used || dailyLimit,
        remaining: 0,
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      }
    });
  }
}

module.exports = {
  MessageError,
  ValidationError,
  RateLimitError
};
