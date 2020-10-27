const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

// const swaggerFile = YAML.load(path.resolve(__dirname, './order-api.yaml'));

module.exports = {
  middleware: [
    swaggerUi.serve,
    // swaggerUi.setup(swaggerFile)
  ],
};
