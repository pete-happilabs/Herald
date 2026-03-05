-- DLQ Archive Table for long-term failure tracking
CREATE TABLE IF NOT EXISTS archived_messages (
  id SERIAL PRIMARY KEY,
  correlation_id VARCHAR(255) NOT NULL,
  product_code VARCHAR(50),
  channel VARCHAR(20),
  template_code VARCHAR(50),
  recipient TEXT,
  variables JSONB,
  error_message TEXT,
  failure_count INTEGER DEFAULT 0,
  first_failed_at TIMESTAMP,
  last_failed_at TIMESTAMP,
  archived_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'archived'
);

CREATE INDEX idx_archived_correlation_id ON archived_messages(correlation_id);
CREATE INDEX idx_archived_at ON archived_messages(archived_at);
CREATE INDEX idx_archived_status ON archived_messages(status);
CREATE INDEX idx_archived_channel ON archived_messages(channel);
CREATE INDEX idx_archived_product_code ON archived_messages(product_code);

-- DLQ Statistics View
CREATE OR REPLACE VIEW dlq_statistics AS
SELECT 
  channel,
  product_code,
  DATE(archived_at) as failure_date,
  COUNT(*) as failure_count,
  AVG(failure_count) as avg_retry_attempts
FROM archived_messages
WHERE archived_at >= NOW() - INTERVAL '30 days'
GROUP BY channel, product_code, DATE(archived_at);
