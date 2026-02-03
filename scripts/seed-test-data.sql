-- Insert test product
INSERT INTO products (code, name, description, is_active)
VALUES ('HAPPIDOST', 'HappiDost Application', 'Main HappiDost product for all messaging', true)
ON CONFLICT (code) DO NOTHING;

-- Insert test SMS templates
INSERT INTO message_templates (product_code, channel, code, name, content, variables, is_active)
VALUES 
  ('HAPPIDOST', 'SMS', 'OTP_LOGIN', 'Login OTP', 
   'Your HappiDost login OTP is {{otp}}. Valid for 10 minutes. Do not share with anyone.', 
   ARRAY['otp'], true),
  
  ('HAPPIDOST', 'SMS', 'OTP_TRANSACTION', 'Transaction OTP', 
   'Your transaction OTP is {{otp}}. Amount: Rs.{{amount}}. Valid for 5 minutes.', 
   ARRAY['otp', 'amount'], true),
  
  ('HAPPIDOST', 'SMS', 'WELCOME', 'Welcome Message', 
   'Welcome to HappiDost, {{name}}! Your account has been created successfully. Start exploring now!', 
   ARRAY['name'], true)
ON CONFLICT (product_code, channel, code) DO NOTHING;

-- Insert test Email templates
INSERT INTO message_templates (product_code, channel, code, name, subject, content, variables, is_active)
VALUES 
  ('HAPPIDOST', 'EMAIL', 'WELCOME_EMAIL', 'Welcome Email', 
   'Welcome to HappiDost!',
   '<h1>Welcome {{name}}!</h1><p>Thank you for joining HappiDost. We are excited to have you on board.</p><p>Your account ID: <strong>{{accountId}}</strong></p>',
   ARRAY['name', 'accountId'], true),
  
  ('HAPPIDOST', 'EMAIL', 'PASSWORD_RESET', 'Password Reset', 
   'Reset Your HappiDost Password',
   '<h2>Password Reset Request</h2><p>Hi {{name}},</p><p>Click the link below to reset your password:</p><a href="{{resetLink}}">Reset Password</a><p>This link expires in 1 hour.</p>',
   ARRAY['name', 'resetLink'], true)
ON CONFLICT (product_code, channel, code) DO NOTHING;

-- Insert provider configurations
INSERT INTO provider_configs (product_code, channel, provider, config, priority, is_active)
VALUES 
  ('HAPPIDOST', 'SMS', 'FAST2SMS', '{"apiKey": "env:FAST2SMS_API_KEY"}', 1, true),
  ('HAPPIDOST', 'SMS', 'BULKSMS', '{"apiKey": "env:BULKSMS_API_KEY"}', 2, true),
  ('HAPPIDOST', 'EMAIL', 'SES', '{"region": "env:AWS_REGION"}', 1, true),
  ('HAPPIDOST', 'EMAIL', 'GMAIL', '{"user": "env:GMAIL_USER"}', 2, true)
ON CONFLICT (product_code, channel, provider) DO NOTHING;

SELECT 'Test data seeded successfully!' as status;
