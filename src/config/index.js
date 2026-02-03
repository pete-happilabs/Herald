const templatesConfig = require('./templates');
const pipelinesConfig = require('./pipelines');

// Configuration from environment variables
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';

// Convert nested template objects to array format for ConfigService
const templates = [];

Object.keys(templatesConfig.templates).forEach(channel => {
  const channelTemplates = templatesConfig.templates[channel];
  
  Object.keys(channelTemplates).forEach(templateCode => {
    const template = channelTemplates[templateCode];
    
    // Get products that use this template
    const products = Object.keys(templatesConfig.productTemplates).filter(productCode => {
      const productConfig = templatesConfig.productTemplates[productCode];
      return productConfig[channel] && productConfig[channel].includes(templateCode);
    });
    
    // Create template entry for each product
    products.forEach(productCode => {
      templates.push({
        productCode,
        channel,
        templateCode,
        isActive: true,
        ...template
      });
    });
  });
});

// Convert pipelines to array format
const pipelines = {};
Object.keys(pipelinesConfig).forEach(channel => {
  pipelines[channel] = pipelinesConfig[channel].map((pipeline, index) => ({
    ...pipeline,
    isActive: true,
    priority: pipeline.priority || index + 1
  }));
});

// Products configuration
const products = [
  {
    code: 'HAPPIDOST',
    name: 'Happidost',
    status: 'ACTIVE',
    channels: ['EMAIL', 'SMS']
  }
];

module.exports = {
  port,
  env,
  products,
  templates,
  pipelines
};
