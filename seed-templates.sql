-- Insert HAPPIDOST product
INSERT INTO products (code, name, description, is_active)
VALUES ('HAPPIDOST', 'HappiDost Application', 'Main HappiDost product for all messaging', true)
ON CONFLICT (code) DO NOTHING;

-- ===== EMAIL TEMPLATES =====
INSERT INTO message_templates (product_code, channel, code, name, subject, content, variables, is_active)
VALUES 
  -- Welcome Email
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
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to HappiDost!</h1>
        </div>
        <div class="content">
            <h2>Hello {{name}}!</h2>
            <p>We are thrilled to have you join our community. Your account has been created successfully!</p>
            <p><strong>Your Account ID:</strong> <code>{{accountId}}</code></p>
            <p>Get started by exploring our features and connecting with your Dosts.</p>
            <a href="https://happidost.com/dashboard" class="button">Go to Dashboard</a>
        </div>
        <div class="footer">
            <p>Copyright 2026 HappiDost. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
   ARRAY['name', 'accountId'], true),
  
  -- Password Reset Email
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
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="{{resetLink}}" class="button">Reset Password</a>
            <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This link expires in 1 hour</li>
                    <li>If you did not request this, please ignore this email</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>Copyright 2026 HappiDost. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
   ARRAY['name', 'resetLink'], true),

  -- Transaction Notification Email
  ('HAPPIDOST', 'EMAIL', 'TRANSACTION_NOTIFICATION', 'Transaction Notification', 
   'Transaction Successful',
   '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Transaction Successful</h1>
        </div>
        <div class="content">
            <h2>Hi {{name}},</h2>
            <p>Your transaction was completed successfully!</p>
            <div class="amount">Rs. {{amount}}</div>
            <div class="details">
                <p><strong>Transaction ID:</strong> {{transactionId}}</p>
                <p><strong>Description:</strong> {{description}}</p>
                <p><strong>Date:</strong> {{date}}</p>
            </div>
        </div>
        <div class="footer">
            <p>Copyright 2026 HappiDost. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
   ARRAY['name', 'amount', 'transactionId', 'description', 'date'], true);

-- ===== SMS TEMPLATES =====
INSERT INTO message_templates (product_code, channel, code, name, content, variables, is_active)
VALUES 
  ('HAPPIDOST', 'SMS', 'OTP_LOGIN', 'Login OTP', 
   'Your HappiDost login OTP is {{otp}}. Valid for 10 minutes. Do not share with anyone.',
   ARRAY['otp'], true),
  
  ('HAPPIDOST', 'SMS', 'OTP_TRANSACTION', 'Transaction OTP', 
   'Your transaction OTP is {{otp}}. Amount: Rs.{{amount}}. Valid for 5 minutes.',
   ARRAY['otp', 'amount'], true),
  
  ('HAPPIDOST', 'SMS', 'WELCOME_SMS', 'Welcome SMS', 
   'Welcome to HappiDost, {{name}}! Your account {{accountId}} is ready. Start exploring now!',
   ARRAY['name', 'accountId'], true),

  ('HAPPIDOST', 'SMS', 'VERIFY_ACCOUNT', 'Account Verification', 
   'Verify your HappiDost account with code: {{code}}. Valid for 15 minutes.',
   ARRAY['code'], true);

-- ===== PROVIDER CONFIGURATIONS =====
INSERT INTO provider_configs (product_code, channel, provider, config, priority, is_active)
VALUES 
  ('HAPPIDOST', 'SMS', 'FAST2SMS', '{"apiKey": "env:FAST2SMS_API_KEY"}'::jsonb, 1, true),
  ('HAPPIDOST', 'SMS', 'BULKSMS', '{"apiKey": "env:BULKSMS_API_KEY"}'::jsonb, 2, true),
  ('HAPPIDOST', 'EMAIL', 'GMAIL', '{"user": "env:GMAIL_USER", "password": "env:GMAIL_APP_PASSWORD"}'::jsonb, 1, true),
  ('HAPPIDOST', 'EMAIL', 'SES', '{"region": "env:AWS_REGION", "accessKeyId": "env:AWS_ACCESS_KEY_ID", "secretAccessKey": "env:AWS_SECRET_ACCESS_KEY"}'::jsonb, 2, true)
ON CONFLICT (product_code, channel, provider) DO NOTHING;
