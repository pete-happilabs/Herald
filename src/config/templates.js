const templates = {
  EMAIL: {
    OTP_PHONE_VERIFY: {
      subject: 'Your Dost OTP - Valid for 10 Minutes',
      body: `Dear Dost,

Your One-Time Password (OTP) for Phone verification (ending with {{phoneLast4}}) is:

{{otp}}

This OTP is valid for 10 minutes from the time of generation.

Generated on: {{generatedAt}}

Please do not share this OTP with anyone. Our team will never ask for your OTP over call, message, or email.

This is a system generated mail. Please don't reply to it.

Your Dost`
    },
    OTP_EMAIL_VERIFY: {
      subject: 'Your Dost OTP - Valid for 10 Minutes',
      body: `Dear Dost,

Your One-Time Password (OTP) for email verification (ending with {{emailLast4}}) is:

{{otp}}

This OTP is valid for 10 minutes from the time of generation.

Generated on: {{generatedAt}}

Please do not share this OTP with anyone. Our team will never ask for your OTP over call, message, or email.

This is a system generated mail. Please don't reply to it.

Your Dost`
    },
    WELCOME_EMAIL: {
      subject: 'Welcome to HappiDost!',
      body: `Dear {{name}},

Your account has been created successfully.

Account ID: {{accountId}}

We are thrilled to have you join our community.

Your Dost`
    },
    PASSWORD_RESET: {
      subject: 'Reset Your HappiDost Password',
      body: `Dear Dost,

We received a request to reset your password. Click the link below to create a new password:

{{resetLink}}

This link expires in 1 hour. If you did not request this, please ignore this email.

Your Dost`
    }
  },
  SMS: {
    OTP_VERIFICATION: {
      body: '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.'
    },
    OTP_LOGIN: {
      body: '{{otp}} is your OTP for Happidost login. Valid for 10 minutes. Do not share with anyone.'
    },
    ACCOUNT_ALERT: {
      body: 'Alert for account {{accountId}}: {{message}}'
    }
  }
};

const productTemplates = {
  HAPPIDOST: {
    EMAIL: ['OTP_PHONE_VERIFY', 'OTP_EMAIL_VERIFY', 'WELCOME_EMAIL', 'PASSWORD_RESET'],
    SMS: ['OTP_VERIFICATION', 'OTP_LOGIN', 'ACCOUNT_ALERT']
  }
};

module.exports = {
  templates,
  productTemplates
};
