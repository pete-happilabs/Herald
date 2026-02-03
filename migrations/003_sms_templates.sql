CREATE TABLE IF NOT EXISTS sms_templates (
  id SERIAL PRIMARY KEY,
  template_code VARCHAR(50) UNIQUE NOT NULL,
  provider VARCHAR(20) NOT NULL,
  message_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(10) NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO sms_templates (template_code, provider, message_id, sender_id, template_content, variables)
VALUES 
  ('OTP_VERIFICATION', 'FAST2SMS', '208230', 'DOSTAI', '{#VAR#} is your OTP for Happidost verification. Do not share it with anyone.', '["otp"]'),
  ('OTP_LOGIN', 'FAST2SMS', '208230', 'DOSTAI', '{#VAR#} is your OTP for Happidost verification. Do not share it with anyone.', '["otp"]')
ON CONFLICT (template_code) DO UPDATE 
  SET message_id = EXCLUDED.message_id,
      sender_id = EXCLUDED.sender_id,
      template_content = EXCLUDED.template_content,
      variables = EXCLUDED.variables,
      updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_sms_templates_code ON sms_templates(template_code);
