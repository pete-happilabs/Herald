# Architecture

## System Overview

\\\
┌─────────────┐
│   Clients   │
│ (REST API)  │
└──────┬──────┘
       │
       v
┌─────────────────┐      ┌──────────────┐
│   API Server    │─────>│    Redis     │
│   (Express)     │      │   (Queue)    │
└─────────────────┘      └──────┬───────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         v                      v                      v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Worker 1     │    │    Worker 2     │    │    Worker N     │
│ Circuit Breaker │    │ Circuit Breaker │    │ Circuit Breaker │
│  Rate Limiter   │    │  Rate Limiter   │    │  Rate Limiter   │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         v                      v                      v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fast2SMS      │    │     Gmail       │    │    AWS SES      │
│   (Priority 1)  │    │   (Priority 2)  │    │  (Priority 1)   │
│   SMS Provider  │    │  Email Provider │    │ Email Provider  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         v                      v                      v
┌───────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                │
│                   (Message Logging)                            │
└───────────────────────────────────────────────────────────────┘
         │                      
         v                      
┌─────────────────┐    ┌─────────────────┐    
│   Prometheus    │    │     Grafana     │    
│   (Metrics)     │───>│   (Dashboard)   │    
└─────────────────┘    └─────────────────┘    
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
- **SMS**: Fast2SMS (DLT compliant), BulkSMS
- **Email**: Gmail SMTP, AWS SES, SendGrid

### Monitoring
- Prometheus metrics collection
- Grafana visualization dashboards
- Real-time metrics

### Dead Letter Queue
- Separate service for failed messages
- Auto-retry mechanism
- Manual retry UI
- Message archival
