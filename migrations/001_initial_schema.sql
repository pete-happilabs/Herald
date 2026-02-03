-- Herald Messaging Service Database Schema

CREATE TABLE IF NOT EXISTS message_log (
  id BIGSERIAL PRIMARY KEY,
  correlation_id UUID NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('SMS', 'EMAIL')),
  provider VARCHAR(20),
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
  provider_message_id VARCHAR(100),
  variables JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_message_log_correlation_id ON message_log(correlation_id);
CREATE INDEX idx_message_log_product_code ON message_log(product_code);
CREATE INDEX idx_message_log_status ON message_log(status);
CREATE INDEX idx_message_log_created_at ON message_log(created_at DESC);
CREATE INDEX idx_message_log_channel ON message_log(channel);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_log_updated_at
  BEFORE UPDATE ON message_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE message_log IS 'Audit log of all sent messages';
COMMENT ON COLUMN message_log.correlation_id IS 'Unique request correlation ID for tracing';
COMMENT ON COLUMN message_log.product_code IS 'Product that sent the message';
COMMENT ON COLUMN message_log.status IS 'Message delivery status';
