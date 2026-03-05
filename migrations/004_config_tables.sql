-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 50000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL REFERENCES products(code),
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('SMS', 'EMAIL')),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_code, channel, code)
);

-- Provider configurations table
CREATE TABLE IF NOT EXISTS provider_configs (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL REFERENCES products(code),
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('SMS', 'EMAIL')),
  provider VARCHAR(20) NOT NULL,
  config JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_code, channel, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_lookup ON message_templates(product_code, channel, code);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_configs_lookup ON provider_configs(product_code, channel);
CREATE INDEX IF NOT EXISTS idx_provider_configs_active ON provider_configs(is_active);

-- Updated timestamp triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_configs_updated_at
  BEFORE UPDATE ON provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
