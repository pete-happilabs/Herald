const { Pool } = require('pg');

class ArchivedMessage {
  constructor(pool) {
    this.pool = pool || new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async create(messageData) {
    const query = `
      INSERT INTO archived_messages 
      (correlation_id, product_code, channel, template_code, recipient, 
       variables, error_message, failure_count, first_failed_at, last_failed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      messageData.correlationId,
      messageData.productCode,
      messageData.channel,
      messageData.templateCode,
      messageData.recipient,
      JSON.stringify(messageData.variables),
      messageData.errorMessage,
      messageData.failureCount || 0,
      messageData.firstFailedAt || new Date(),
      messageData.lastFailedAt || new Date()
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findAll(options = {}) {
    const { limit = 50, offset = 0, channel, productCode, startDate, endDate } = options;
    
    let query = 'SELECT * FROM archived_messages WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (channel) {
      query += ` AND channel = $${paramCount++}`;
      values.push(channel);
    }

    if (productCode) {
      query += ` AND product_code = $${paramCount++}`;
      values.push(productCode);
    }

    if (startDate) {
      query += ` AND archived_at >= $${paramCount++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND archived_at <= $${paramCount++}`;
      values.push(endDate);
    }

    query += ` ORDER BY archived_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async findByCorrelationId(correlationId) {
    const query = 'SELECT * FROM archived_messages WHERE correlation_id = $1';
    const result = await this.pool.query(query, [correlationId]);
    return result.rows[0];
  }

  async getStatistics(days = 7) {
    const query = `
      SELECT 
        channel,
        product_code,
        COUNT(*) as total_failures,
        AVG(failure_count) as avg_retries,
        COUNT(DISTINCT DATE(archived_at)) as days_with_failures
      FROM archived_messages
      WHERE archived_at >= NOW() - INTERVAL '${days} days'
      GROUP BY channel, product_code
      ORDER BY total_failures DESC
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async deleteOlderThan(days) {
    const query = `
      DELETE FROM archived_messages 
      WHERE archived_at < NOW() - INTERVAL '${days} days'
      RETURNING COUNT(*)
    `;
    
    const result = await this.pool.query(query);
    return result.rowCount;
  }
}

module.exports = ArchivedMessage;
