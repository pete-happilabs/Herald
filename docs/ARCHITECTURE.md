# Architecture

Herald uses a microservices architecture with queue-based async processing and multi-provider failover.

## High-Level Overview

\\\mermaid
flowchart LR
    A[Client] -->|HTTP POST| B(API Server)
    B -->|Enqueue| C{Redis Queue}
    C -->|Process| D[Worker Pool]
    D -->|Failover| E[SMS Providers]
    D -->|Failover| F[Email Providers]
    D -->|Log| G[(Database)]
    G -->|Metrics| H[Monitoring]
\\\

## Components

### API Server
- Express.js REST API
- API key authentication
- Request validation
- Job queuing

### Workers
- Bull queue processors
- Circuit breaker pattern (Opossum)
- Rate limiting (Bottleneck)
- Retry with exponential backoff
- Provider failover logic

### Providers

**SMS Providers (Priority Order)**
1. Fast2SMS (DLT compliant for India)
2. BulkSMS (Fallback)

**Email Providers (Priority Order)**
1. AWS SES (Primary)
2. Gmail SMTP (Fallback)
3. SendGrid (Fallback)

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **PostgreSQL**: Message logging and audit trail

### Dead Letter Queue (DLQ)
- Separate service for failed messages
- Auto-retry mechanism (configurable interval)
- Manual retry UI
- Message archival after retention period

## Message Flow

\\\mermaid
sequenceDiagram
    autonumber
    Client->>+API: POST /api/v1/send
    API->>API: Validate & Authenticate
    API->>+Queue: Add Job
    Queue-->>-API: Job ID
    API-->>-Client: 202 Accepted
    
    Queue->>+Worker: Dequeue Job
    Worker->>Worker: Check Rate Limit
    Worker->>+Provider1: Attempt Send
    
    alt Provider1 Success
        Provider1-->>Worker: 200 OK
        Worker->>Database: Log Success
    else Provider1 Fails
        Provider1-->>Worker: Error
        Worker->>+Provider2: Failover Attempt
        Provider2-->>-Worker: 200 OK
        Worker->>Database: Log Success
    else All Providers Fail
        Worker->>DLQ: Move to Dead Letter
        Worker->>Database: Log Failure
    end
    
    Worker-->>-Queue: Job Complete
\\\

## Resilience Patterns

### Circuit Breaker
Each provider has an independent circuit breaker:
- **Closed**: Normal operation, requests go through
- **Open**: Provider failing, requests rejected immediately
- **Half-Open**: Testing if provider recovered

### Rate Limiting
- Per-provider rate limits (e.g., 100 req/min)
- Per-product daily limits
- Prevents quota exhaustion

### Retry Strategy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max 5 retry attempts
- Failed jobs move to DLQ

### Failover
Automatic switch to next provider when:
- Circuit breaker opens
- Rate limit exceeded
- Provider returns 5xx errors

## Deployment Architecture

\\\
Docker Compose Services:
├── api (port 3000)
├── worker (2 replicas)
├── dlt-service (port 3002)
├── postgres (port 5432)
├── redis (port 6379)
├── prometheus (port 9090)
└── grafana (port 3001)
\\\

All services run in isolated Docker containers with health checks and restart policies.
