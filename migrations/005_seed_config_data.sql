-- Seed product
INSERT INTO products (code, name, description, is_active, daily_limit)
VALUES ('HAPPIDOST', 'HappiDost Application', 'Main HappiDost product for all messaging', true, 50000)
ON CONFLICT (code) DO NOTHING;

-- Seed SMS templates
INSERT INTO message_templates (product_code, channel, code, name, content, variables, is_active)
VALUES
  ('HAPPIDOST', 'SMS', 'OTP_LOGIN', 'Login OTP',
   '{{otp}} is your OTP for Happidost login. Valid for 10 minutes. Do not share with anyone.',
   ARRAY['otp'], true),

  ('HAPPIDOST', 'SMS', 'OTP_VERIFICATION', 'Verification OTP',
   '{{otp}} is your OTP for Happidost verification. Do not share it with anyone.',
   ARRAY['otp'], true),

  ('HAPPIDOST', 'SMS', 'ACCOUNT_ALERT', 'Account Alert',
   'Alert for account {{accountId}}: {{message}}',
   ARRAY['accountId', 'message'], true)
ON CONFLICT (product_code, channel, code) DO NOTHING;

-- Seed Email templates
INSERT INTO message_templates (product_code, channel, code, name, subject, content, variables, is_active)
VALUES
  ('HAPPIDOST', 'EMAIL', 'OTP_PHONE_VERIFY', 'Phone Verification OTP Email',
   'Your Dost OTP - Valid for 10 Minutes',
   '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: #f0f0ff; border-radius: 8px; margin: 20px 0; letter-spacing: 6px; }
    .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 13px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Dear Dost,</p>
    <p>Your One-Time Password (OTP) for Phone verification (ending with {{phoneLast4}}) is:</p>
    <div class="otp-code">{{otp}}</div>
    <p>This OTP is valid for 10 minutes from the time of generation.</p>
    <p>Generated on: {{generatedAt}}</p>
    <div class="note">
      <strong>Please do not share this OTP with anyone.</strong> Our team will never ask for your OTP over call, message, or email.
    </div>
    <div class="footer">
      <p>This is a system generated mail. Please don''t reply to it.</p>
      <p>Your Dost</p>
    </div>
  </div>
</body>
</html>',
   ARRAY['otp', 'phoneLast4', 'generatedAt'], true),

  ('HAPPIDOST', 'EMAIL', 'OTP_EMAIL_VERIFY', 'Email Verification OTP Email',
   'Your Dost OTP - Valid for 10 Minutes',
   '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: #f0f0ff; border-radius: 8px; margin: 20px 0; letter-spacing: 6px; }
    .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 13px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Dear Dost,</p>
    <p>Your One-Time Password (OTP) for email verification (ending with {{emailLast4}}) is:</p>
    <div class="otp-code">{{otp}}</div>
    <p>This OTP is valid for 10 minutes from the time of generation.</p>
    <p>Generated on: {{generatedAt}}</p>
    <div class="note">
      <strong>Please do not share this OTP with anyone.</strong> Our team will never ask for your OTP over call, message, or email.
    </div>
    <div class="footer">
      <p>This is a system generated mail. Please don''t reply to it.</p>
      <p>Your Dost</p>
    </div>
  </div>
</body>
</html>',
   ARRAY['otp', 'emailLast4', 'generatedAt'], true),

  ('HAPPIDOST', 'EMAIL', 'WELCOME_EMAIL', 'Welcome Email',
   'Welcome to HappiDost!',
   '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome to HappiDost!</h1></div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Your account has been created successfully.</p>
      <p><strong>Account ID:</strong> {{accountId}}</p>
      <p>We are thrilled to have you join our community.</p>
    </div>
    <div class="footer">
      <p>This is a system generated mail. Please don''t reply to it.</p>
      <p>Your Dost</p>
    </div>
  </div>
</body>
</html>',
   ARRAY['name', 'accountId'], true),

  ('HAPPIDOST', 'EMAIL', 'PASSWORD_RESET', 'Password Reset',
   'Reset Your HappiDost Password',
   '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
    .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 13px; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Password Reset Request</h1></div>
    <div class="content">
      <p>Dear Dost,</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="{{resetLink}}" class="button">Reset Password</a>
      <div class="note">
        <strong>Important:</strong> This link expires in 1 hour. If you did not request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>This is a system generated mail. Please don''t reply to it.</p>
      <p>Your Dost</p>
    </div>
  </div>
</body>
</html>',
   ARRAY['resetLink'], true)
ON CONFLICT (product_code, channel, code) DO NOTHING;

-- Seed provider configurations
INSERT INTO provider_configs (product_code, channel, provider, config, priority, is_active)
VALUES
  ('HAPPIDOST', 'SMS', 'FAST2SMS', '{"apiKey": "env:FAST2SMS_API_KEY"}'::jsonb, 1, true),
  ('HAPPIDOST', 'SMS', 'BULKSMS', '{"apiKey": "env:BULKSMS_API_KEY"}'::jsonb, 2, true),
  ('HAPPIDOST', 'EMAIL', 'SES', '{"region": "env:AWS_REGION"}'::jsonb, 1, true),
  ('HAPPIDOST', 'EMAIL', 'GMAIL', '{"user": "env:GMAIL_USER"}'::jsonb, 2, true)
ON CONFLICT (product_code, channel, provider) DO NOTHING;
