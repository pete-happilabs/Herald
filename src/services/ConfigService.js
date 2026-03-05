/**
 * Configuration Service
 * DB-driven with Redis cache, file-based fallback
 */
const config = require('../config');
const db = require('../lib/db');
const redis = require('../lib/redis');
const logger = require('../utils/logger');
const { MessageError } = require('../utils/errors');

const CACHE_TTL = 300; // 5 minutes

class ConfigService {
  constructor() {
    this._products = null;
    this._templates = null;
    this._pipelines = null;
    this._initialized = false;
  }

  /**
   * Initialize from DB, cache in Redis. Call at startup.
   */
  async initialize() {
    try {
      await this._loadProducts();
      await this._loadTemplates();
      await this._loadPipelines();
      this._initialized = true;
      logger.info('ConfigService initialized from database');
    } catch (error) {
      logger.warn('ConfigService DB init failed, using file defaults', {
        error: error.message
      });
    }
  }

  async _loadProducts() {
    // Try Redis cache first
    const cached = await redis.get('config:products');
    if (cached) {
      this._products = JSON.parse(cached);
      return;
    }

    const result = await db.query(
      'SELECT code, name, description, is_active, daily_limit FROM products WHERE is_active = true'
    );

    if (result.rows.length > 0) {
      this._products = result.rows.map(p => ({
        code: p.code,
        name: p.name,
        description: p.description,
        status: 'ACTIVE',
        dailyLimit: p.daily_limit
      }));
      await redis.setex('config:products', CACHE_TTL, JSON.stringify(this._products));
    }
  }

  async _loadTemplates() {
    const cached = await redis.get('config:templates');
    if (cached) {
      this._templates = JSON.parse(cached);
      return;
    }

    const result = await db.query(
      `SELECT product_code, channel, code AS template_code, name, subject,
              content AS body, variables, is_active
       FROM message_templates WHERE is_active = true`
    );

    if (result.rows.length > 0) {
      this._templates = result.rows.map(t => ({
        productCode: t.product_code,
        channel: t.channel,
        templateCode: t.template_code,
        name: t.name,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        isActive: t.is_active
      }));
      await redis.setex('config:templates', CACHE_TTL, JSON.stringify(this._templates));
    }
  }

  async _loadPipelines() {
    const cached = await redis.get('config:pipelines');
    if (cached) {
      this._pipelines = JSON.parse(cached);
      return;
    }

    const result = await db.query(
      `SELECT channel, provider, config, priority, is_active
       FROM provider_configs WHERE is_active = true ORDER BY priority`
    );

    if (result.rows.length > 0) {
      this._pipelines = {};
      for (const row of result.rows) {
        if (!this._pipelines[row.channel]) {
          this._pipelines[row.channel] = [];
        }
        this._pipelines[row.channel].push({
          provider: row.provider,
          priority: row.priority,
          config: row.config || {},
          isActive: row.is_active
        });
      }
      await redis.setex('config:pipelines', CACHE_TTL, JSON.stringify(this._pipelines));
    }
  }

  /**
   * Get product by code
   */
  getProduct(code) {
    const products = this._products || config.products;
    const product = products.find(
      p => p.code === code && (p.status === 'ACTIVE' || p.is_active)
    );

    if (!product) {
      throw new MessageError(
        'PRODUCT_NOT_FOUND',
        `Product ${code} not found or inactive`
      );
    }

    return product;
  }

  /**
   * Get all active products
   */
  getAllProducts() {
    const products = this._products || config.products;
    return products.filter(p => p.status === 'ACTIVE' || p.is_active);
  }

  /**
   * Get template for specific product, channel, and template code
   */
  getTemplate(productCode, channel, templateCode) {
    const templates = this._templates || config.templates;
    const template = templates.find(
      t =>
        t.productCode === productCode &&
        t.channel === channel &&
        t.templateCode === templateCode &&
        t.isActive
    );

    if (!template) {
      throw new MessageError(
        'TEMPLATE_NOT_FOUND',
        `Template ${templateCode} not found for ${productCode}/${channel}`
      );
    }

    return template;
  }

  /**
   * Get all templates for a product
   */
  getTemplatesByProduct(productCode) {
    const templates = this._templates || config.templates;
    return templates.filter(t => t.productCode === productCode && t.isActive);
  }

  /**
   * Get pipelines for a channel (SMS or EMAIL)
   */
  getPipelines(channel) {
    const pipelines = this._pipelines || config.pipelines;
    const channelPipelines = pipelines[channel];

    if (!channelPipelines) {
      throw new MessageError(
        'INVALID_CHANNEL',
        `No pipelines configured for channel: ${channel}`
      );
    }

    return channelPipelines
      .filter(p => p.isActive)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get specific pipeline by channel and provider
   */
  getPipeline(channel, provider) {
    const pipelines = this.getPipelines(channel);
    return pipelines.find(p => p.provider === provider);
  }
}

module.exports = new ConfigService();
