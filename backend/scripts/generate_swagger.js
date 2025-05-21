const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eBay Sales Tool API',
      version: '1.0.0',
      description: 'API documentation for the eBay Sales Tool',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
  },
  apis: [path.join(__dirname, '../src/routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
fs.writeFileSync(path.join(__dirname, '../../swagger.json'), JSON.stringify(swaggerSpec, null, 2));
console.log('Swagger JSON generated at ./swagger.json');
