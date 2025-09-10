const serverless = require('serverless-http');

// Importar el servidor principal
const app = require('../../server.js');

// Exportar como función serverless para Netlify
module.exports.handler = serverless(app);