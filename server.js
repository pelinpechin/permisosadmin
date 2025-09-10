const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const db = require('./database/db_config');

const app = express();
const PORT = 3446;

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitar CSP temporalmente para evitar conflictos
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/empleados', require('./routes/empleados'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/empleados-auth', require('./routes/empleados_auth'));
app.use('/api/solicitudes-empleado', require('./routes/solicitudes_empleado'));
app.use('/api/aprobar', require('./routes/aprobar_solicitudes'));
app.use('/api/admin', require('./routes/admin_simple'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aprobar.html'));
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Accede a: http://localhost:${PORT}`);
});

module.exports = app;