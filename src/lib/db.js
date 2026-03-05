/**
 * PostgreSQL Database Connection Pool
 */
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', err => {
  logger.error('Unexpected database error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end()
};
