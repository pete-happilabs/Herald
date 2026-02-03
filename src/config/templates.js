const templates = {
  EMAIL: {
    WELCOME_EMAIL: {
      subject: 'Welcome to {{productName}}',
      body: `
        <h1>Welcome {{name}}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Account ID: {{accountId}}</p>
      `
    },
    PASSWORD_RESET: {
      subject: 'Password Reset Request',
      body: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="{{resetLink}}">Reset Password</a>
      `
    }
  },
  SMS: {
    OTP_VERIFICATION: {
      body: '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.'
    },
    OTP_LOGIN: {
      body: '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.'
    },
    ACCOUNT_ALERT: {
      body: 'Alert for account {{accountId}}: {{message}}'
    }
  }
};

// Product-specific template mappings
const productTemplates = {
  HAPPIDOST: {
    EMAIL: ['WELCOME_EMAIL', 'PASSWORD_RESET'],
    SMS: ['OTP_VERIFICATION', 'OTP_LOGIN', 'ACCOUNT_ALERT']
  }
};

module.exports = {
  templates,
  productTemplates
};
