const productsConfig = require('./products');
const templatesConfig = require('./templates');
const pipelinesConfig = require('./pipelines');

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';

// Build products from file config
const products = productsConfig.map(p => ({
  ...p,
  status: p.status || 'ACTIVE'
}));

// Build templates from file config
const templates = [];
Object.keys(templatesConfig.templates).forEach(channel => {
  const channelTemplates = templatesConfig.templates[channel];

  Object.keys(channelTemplates).forEach(templateCode => {
    const template = channelTemplates[templateCode];

    const mappedProducts = Object.keys(templatesConfig.productTemplates).filter(productCode => {
      const productConfig = templatesConfig.productTemplates[productCode];
      return productConfig[channel] && productConfig[channel].includes(templateCode);
    });

    mappedProducts.forEach(productCode => {
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

// Build pipelines from file config
const pipelines = {};
Object.keys(pipelinesConfig).forEach(channel => {
  pipelines[channel] = pipelinesConfig[channel].map((pipeline, index) => ({
    ...pipeline,
    isActive: true,
    priority: pipeline.priority || index + 1
  }));
});

module.exports = {
  port,
  env,
  products,
  templates,
  pipelines
};
