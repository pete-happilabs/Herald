/**
 * Prometheus Metrics
 * Exposes application metrics for monitoring
 */
const client = require('prom-client');
const redis = require('../lib/redis');

// Create registry
const register = new client.Registry();

// Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'herald_'
});

// Custom metrics

// Messages sent counter - reads from Redis
const messagesSent = new client.Counter({
  name: 'herald_messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['channel', 'provider', 'status'],
  registers: [register],
  async collect() {
    // Read metrics from Redis and update counter
    const keys = await redis.keys('metrics:messages_sent:*');
    
    for (const key of keys) {
      const value = await redis.get(key);
      if (value) {
        // Parse key: metrics:messages_sent:SMS:FAST2SMS:success
        const parts = key.split(':');
        const channel = parts[2];
        const provider = parts[3];
        const status = parts[4];
        
        // Reset and set the counter value
        this.labels(channel, provider, status).inc(parseInt(value, 10));
      }
    }
  }
});

// Message send duration
const sendDuration = new client.Histogram({
  name: 'herald_message_send_duration_seconds',
  help: 'Message send duration in seconds',
  labelNames: ['channel', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Queue jobs
const queueJobsActive = new client.Gauge({
  name: 'herald_queue_jobs_active',
  help: 'Number of jobs currently being processed',
  registers: [register]
});

const queueJobsCompleted = new client.Counter({
  name: 'herald_queue_jobs_completed_total',
  help: 'Total number of completed jobs',
  registers: [register]
});

const queueJobsFailed = new client.Counter({
  name: 'herald_queue_jobs_failed_total',
  help: 'Total number of failed jobs',
  registers: [register]
});

const queueJobsStalled = new client.Counter({
  name: 'herald_queue_jobs_stalled_total',
  help: 'Total number of stalled jobs',
  registers: [register]
});

// Dead Letter Queue size
const dlqSize = new client.Gauge({
  name: 'herald_dlq_messages_count',
  help: 'Number of messages in dead letter queue',
  registers: [register]
});

// Circuit breaker status
const circuitBreakerStatus = new client.Gauge({
  name: 'herald_circuit_breaker_status',
  help: 'Circuit breaker status (0=closed, 1=open, 2=half-open)',
  labelNames: ['provider'],
  registers: [register]
});

// Rate limiter
const rateLimiterHits = new client.Counter({
  name: 'herald_rate_limiter_hits_total',
  help: 'Total number of rate limiter hits',
  labelNames: ['provider'],
  registers: [register]
});

module.exports = {
  register,
  messagesSent,
  sendDuration,
  queueJobsActive,
  queueJobsCompleted,
  queueJobsFailed,
  queueJobsStalled,
  circuitBreakerStatus,
  rateLimiterHits,
  dlqSize
};
