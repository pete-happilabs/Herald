/**
 * Configuration Service
 * Provides in-memory lookup for products, templates, and pipelines
 */
const config = require('../config');
const { MessageError } = require('../utils/errors');

class ConfigService {
  /**
   * Get product by code
   */
  getProduct(code) {
    const product = config.products.find(
      p => p.code === code && p.status === 'ACTIVE'
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
    return config.products.filter(p => p.status === 'ACTIVE');
  }

  /**
   * Get template for specific product, channel, and template code
   */
  getTemplate(productCode, channel, templateCode) {
    const template = config.templates.find(
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
    return config.templates.filter(t => t.productCode === productCode && t.isActive);
  }

  /**
   * Get pipelines for a channel (SMS or EMAIL)
   */
  getPipelines(channel) {
    const channelPipelines = config.pipelines[channel];

    if (!channelPipelines) {
      throw new MessageError(
        'INVALID_CHANNEL',
        `No pipelines configured for channel: ${channel}`
      );
    }

    return channelPipelines.filter(p => p.isActive).sort((a, b) => a.priority - b.priority);
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
