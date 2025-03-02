const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for your application',
    },
    servers: [{ url: 'http://localhost:3000/api/v1', description: 'Development server' }],
  },
  apis: ['./src/**/*.js'], // Adjust to match your route file paths
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
fs.writeFileSync(path.join(__dirname, 'docs', 'swagger.json'), JSON.stringify(swaggerSpec, null, 2));
console.log('Swagger specification generated successfully.');