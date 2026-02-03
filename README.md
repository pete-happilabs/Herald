# Herald - Production-Grade Messaging Service

Multi-tenant messaging service with SMS and Email support, built with Fastify and Bull queue.

## Features

- âœ… Multi-provider failover (Fast2SMS, BulkSMS, AWS SES, Gmail)
- âœ… Automatic retry with exponential backoff
- âœ… Circuit breaker pattern per provider
- âœ… Dead Letter Queue for failed messages
- âœ… Async processing with Bull queue
- âœ… Idempotency support
- âœ… Rate limiting per product
- âœ… Prometheus metrics
- âœ… Comprehensive logging
- âœ… Health checks
- âœ… Graceful shutdown

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

## System Overview

\`\`\`
                    +------------------+
                    |     Clients      |
                    |   (REST API)     |
                    +--------+---------+
                             |
                             v
                    +------------------+       +----------------+
                    |   API Server     |------>|     Redis      |
                    |   (Express.js)   |       |    (Queue)     |
                    +------------------+       +-------+--------+
                                                       |
                    +----------------------------------+----------------------------------+
                    |                                  |                                  |
                    v                                  v                                  v
            +----------------+                +----------------+                +----------------+
            |   Worker 1     |                |   Worker 2     |                |   Worker N     |
            | Circuit Breaker|                | Circuit Breaker|                | Circuit Breaker|
            | Rate Limiter   |                | Rate Limiter   |                | Rate Limiter   |
            +-------+--------+                +-------+--------+                +-------+--------+
                    |                                  |                                  |
                    +----------------------------------+----------------------------------+
                                                       |
                    +----------------------------------+----------------------------------+
                    |                                  |                                  |
                    v                                  v                                  v
            +----------------+                +----------------+                +----------------+
            |   Fast2SMS     |                |     Gmail      |                |    AWS SES     |
            | (Priority 1)   |                |  (Priority 2)  |                | (Priority 1)   |
            |  SMS Provider  |                | Email Provider |                | Email Provider |
            +----------------+                +----------------+                +----------------+
                    |                                  |                                  |
                    v                                  v                                  v
            +-------------------------------------------------------------------------+
            |                          PostgreSQL                                     |
            |                       (Message Logging)                                 |
            +------------------------------------+------------------------------------+
                                                 |
                                                 v
                    +----------------+       +----------------+
                    |  Prometheus    |------>|    Grafana     |
                    |   (Metrics)    |       |  (Dashboard)   |
                    +----------------+       +----------------+
```

## License

MIT
