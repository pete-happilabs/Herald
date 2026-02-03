const pipelines = {
  SMS: [
    {
      provider: 'FAST2SMS',
      priority: 1,
      config: {
        maxRetries: 2,
        timeout: 10000,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        }
      }
    }
  ],
  EMAIL: [
    {
      provider: 'SES',
      priority: 1,
      config: {
        maxRetries: 2,
        timeout: 10000,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        }
      }
    },
    {
      provider: 'GMAIL',
      priority: 2,
      config: {
        maxRetries: 2,
        timeout: 10000,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        }
      }
    }
  ]
};

module.exports = pipelines;
