const serverless = require('serverless-http');

// Importar la aplicación Express completa desde el servidor principal
const app = require('../../server.js');

// Para debugging en Netlify
console.log('🚀 Netlify Function iniciada');
console.log('🌐 Configurando serverless handler...');

// Exportar la función serverless
module.exports.handler = serverless(app, {
    binary: ['image/*', 'application/pdf', 'font/*']
});