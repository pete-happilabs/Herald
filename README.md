# Herald - Production-Grade Messaging Service

Multi-tenant messaging service with SMS and Email support, built with Fastify and Bull queue.

## Features

- Multi-provider failover (Fast2SMS, BulkSMS, AWS SES, Gmail)
- Automatic retry with exponential backoff
- Circuit breaker pattern per provider
- Dead Letter Queue with auto-retry and archival
- Async processing with Bull queue
- Idempotency support
- Rate limiting (daily per product + 100 req/min)
- DB-driven config with Redis caching
- Prometheus metrics
- Health checks and graceful shutdown

## Tech Stack

- **Framework**: Fastify 4.x
- **Queue**: Bull (Redis-backed)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Monitoring**: Prometheus + Grafana

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/pete-happilabs/Herald.git
cd Herald
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start with Docker (recommended)
```bash
docker-compose up -d
```

This starts all services: API, Workers (x2), DLT service, PostgreSQL, Redis, Prometheus, Grafana.

Migrations and seed data run automatically on first start.

### 4. Start without Docker
```bash
# Run migrations manually
psql $DATABASE_URL < migrations/001_initial_schema.sql
psql $DATABASE_URL < migrations/002_dlq_archive_schema.sql
psql $DATABASE_URL < migrations/003_sms_templates.sql
psql $DATABASE_URL < migrations/004_config_tables.sql
psql $DATABASE_URL < migrations/005_seed_config_data.sql

# Terminal 1: API Server
npm start

# Terminal 2: Worker
npm run worker

# Terminal 3: DLT Service
npm run dlt
```

## API

**Base URL**: `http://localhost:3000`
**Auth**: `X-API-Key` header required on all endpoints except `/health` and `/metrics`

### Send Message

```
POST /api/v1/send
```

```json
{
  "productCode": "HAPPIDOST",
  "channel": "SMS",
  "templateCode": "OTP_VERIFICATION",
  "to": "9876543210",
  "variables": {
    "otp": "845291"
  }
}
```

**Response** (202):
```json
{
  "success": true,
  "message": "Message queued successfully",
  "jobId": "job_abc123",
  "queueName": "message-queue"
}
```

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/metrics` | Prometheus metrics (no auth) |
| GET | `/api/v1/jobs/:jobId` | Job status |
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/:code` | Product details + templates |
| GET | `/api/v1/status` | Pipeline status |
| GET | `/api/v1/dlq/stats` | DLQ statistics |

### Error Responses

| Code | Format |
|------|--------|
| 400 | `{ success: false, error: "Validation failed", details: {} }` |
| 401 | `{ success: false, error: "Invalid API key" }` |
| 404 | `{ success: false, error: "Product not found", details: {} }` |
| 429 | `{ success: false, error: "Rate limit exceeded", retryAfter: 60, limit: {} }` |
| 500 | `{ success: false, error: "Internal server error" }` |

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | REST API, request validation, job queuing |
| Worker (x2) | - | Bull queue consumer, sends via providers |
| DLT | 3002 | Dead Letter Queue management, auto-retry, archival |
| PostgreSQL | 5432 | Message log, archived messages, config tables |
| Redis | 6379 | Queue, caching, rate limits, DLQ |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards (admin/admin) |

## Configuration

Config is DB-driven with file-based fallback. On startup, `ConfigService` loads from PostgreSQL and caches in Redis (5 min TTL).

**DB tables** (source of truth):
- `products` - registered products with daily limits
- `message_templates` - SMS/email templates with variables
- `provider_configs` - provider priority chains per channel

**File fallback** (used if DB is empty):
- `src/config/products.js`
- `src/config/templates.js`
- `src/config/pipelines.js`

## Providers

### SMS
| Provider | Priority | Status |
|----------|----------|--------|
| Fast2SMS | 1 | DLT-compliant, production |
| BulkSMS | 2 | Fallback |

### Email
| Provider | Priority | Status |
|----------|----------|--------|
| AWS SES | 1 | Primary |
| Gmail SMTP | 2 | Fallback |

## Templates

### SMS
| Code | Variables |
|------|-----------|
| `OTP_LOGIN` | `otp` |
| `OTP_VERIFICATION` | `otp` |
| `ACCOUNT_ALERT` | `accountId`, `message` |

### Email
| Code | Subject | Variables |
|------|---------|-----------|
| `OTP_PHONE_VERIFY` | Your Dost OTP - Valid for 10 Minutes | `otp`, `phoneLast4`, `generatedAt` |
| `OTP_EMAIL_VERIFY` | Your Dost OTP - Valid for 10 Minutes | `otp`, `emailLast4`, `generatedAt` |
| `WELCOME_EMAIL` | Welcome to HappiDost! | `name`, `accountId` |
| `PASSWORD_RESET` | Reset Your HappiDost Password | `resetLink` |

## Architecture

```
Client --> API Server (Fastify:3000) --> Redis Queue (Bull)
                                              |
                                    Worker Pool (x2)
                                    - Circuit Breaker
                                    - Rate Limiter
                                    - Retry + Failover
                                              |
                          +-------------------+-------------------+
                          |                   |                   |
                     Fast2SMS           BulkSMS             SES / Gmail
                    (SMS P1)           (SMS P2)          (Email P1 / P2)
                          |                   |                   |
                          +-------------------+-------------------+
                                              |
                                         PostgreSQL
                                       (Message Log)
                                              |
                          +-------------------+-------------------+
                          |                                       |
                     Prometheus                             DLT Service
                      (Metrics)                         (Auto-retry, Archive)
                          |
                       Grafana
```
