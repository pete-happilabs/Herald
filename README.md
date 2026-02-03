# Herald - Production-Grade Messaging Service

Multi-tenant messaging service with SMS and Email support, built with Fastify and Bull queue.

## Features

- ✅ Multi-provider failover (Fast2SMS, BulkSMS, AWS SES, Gmail)
- ✅ Automatic retry with exponential backoff
- ✅ Circuit breaker pattern per provider
- ✅ Dead Letter Queue for failed messages
- ✅ Async processing with Bull queue
- ✅ Idempotency support
- ✅ Rate limiting per product
- ✅ Prometheus metrics
- ✅ Comprehensive logging
- ✅ Health checks
- ✅ Graceful shutdown

## Tech Stack

- **Framework**: Fastify 4.x
- **Queue**: Bull (Redis-backed)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Monitoring**: Prometheus + Grafana

## Quick Start

### 1. Clone and Install
```bash
git clone <repository>
cd herald
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
```bash
# Run migrations
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

### 4. Start Services

**Development:**
```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Worker
npm run worker
```

**Production with Docker:**
```bash
docker-compose up -d
```

**Production with PM2:**
```bash
pm2 start ecosystem.config.js
```

## API Endpoints

### Send Message
```bash
POST /api/v1/send
Headers:
  X-API-Key: your_api_key
  Idempotency-Key: unique_request_id (optional)
Body:
{
  "productCode": "HAPPIDOST",
  "channel": "SMS",
  "templateCode": "OTP_LOGIN",
  "to": "+919876543210",
  "variables": {
    "otp": "123456"
  }
}
```

### Get Job Status
```bash
GET /api/v1/jobs/:jobId
Headers:
  X-API-Key: your_api_key
```

### Health Check
```bash
GET /health
```

### Metrics
```bash
GET /metrics
```

## Configuration

### Products
Configure products in `src/config/products.js`

### Templates
Configure message templates in `src/config/templates.js`

### Providers
Configure provider pipelines in `src/config/pipelines.js`

## Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Health**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics

## Architecture

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│  API    │────▶│   Bull   │────▶│ Worker  │
│ Server  │     │  Queue   │     │ Process │
└─────────┘     └──────────┘     └─────────┘
     │                │                │
     │                │                │
     ▼                ▼                ▼
┌─────────┐     ┌──────────┐     ┌─────────┐
│PostgreSQL│     │  Redis   │     │Providers│
└─────────┘     └──────────┘     └─────────┘
```

## License

MIT
