const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const db = require('./database/db_config');

// Try to load errorHandler middleware (optional)
let errorHandler, verifyDatabaseIntegrity, logDatabaseOperation;
try {
    const errorHandlerModule = require('./middleware/errorHandler');
    errorHandler = errorHandlerModule.errorHandler;
    verifyDatabaseIntegrity = errorHandlerModule.verifyDatabaseIntegrity;
    logDatabaseOperation = errorHandlerModule.logDatabaseOperation;
} catch (err) {
    console.warn('⚠️ errorHandler middleware not available, using defaults');
    errorHandler = (err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    };
    verifyDatabaseIntegrity = async () => true;
    logDatabaseOperation = () => {};
}

const app = express();
const PORT = process.env.PORT || 3447;

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitar CSP temporalmente para evitar conflictos
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos con cache control
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        // Deshabilitar caché para archivos HTML
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/empleados', require('./routes/empleados'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/empleados-auth', require('./routes/empleados_auth'));
app.use('/api/solicitudes-empleado', require('./routes/solicitudes_empleado'));
app.use('/api/aprobar', require('./routes/aprobar_solicitudes'));
app.use('/api/admin', require('./routes/admin_simple'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/configuracion-permisos', require('./routes/configuracion_permisos'));
app.use('/api/equipo', require('./routes/calendario_equipo'));
app.use('/api/validar', require('./routes/validar_qr'));

// Rutas alias para compatibilidad
const permisosRouter = require('./routes/permisos');

// Alias: /api/tipos-permisos -> /api/permisos/tipos
app.use('/api/tipos-permisos', (req, res, next) => {
  req.url = '/tipos';
  permisosRouter(req, res, next);
});

// Alias: /api/solicitudes -> /api/permisos
app.use('/api/solicitudes', permisosRouter);

// Alias: /api/mis-solicitudes -> /api/permisos
app.use('/api/mis-solicitudes', permisosRouter);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aprobar.html'));
});

// Ruta especial para portal empleado SIN CACHÉ (cache-busting)
const fs = require('fs');
app.get('/portal-empleado', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'portal_empleado_completo.html');

  // Leer el archivo
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error al cargar el archivo');
    }

    // Añadir un comentario con timestamp para forzar que el navegador lo vea como diferente
    const timestamp = Date.now();
    const modifiedData = data.replace('</head>', `<!-- Cache-Bust: ${timestamp} -->\n</head>`);

    // Enviar con headers muy fuertes de no-cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    res.send(modifiedData);
  });
});

// Nueva ruta V2 - archivo completamente nuevo para bypass de caché
app.get('/portal-empleado-v2', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'portal_empleado_v2.html');

  // Leer el archivo
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error al cargar el archivo');
    }

    // Añadir un comentario con timestamp para forzar que el navegador lo vea como diferente
    const timestamp = Date.now();
    const modifiedData = data.replace('</head>', `<!-- V2 Cache-Bust: ${timestamp} -->\n</head>`);

    // Enviar con headers muy fuertes de no-cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    res.send(modifiedData);
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

// Manejo de errores globales con el error handler mejorado
app.use(errorHandler);

// Inicializar servidor con verificación de base de datos
app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Accede a: http://localhost:${PORT}`);

  // Verificar integridad de base de datos al iniciar
  const sqlite3 = require('sqlite3').verbose();
  const dbInstance = new sqlite3.Database(path.join(__dirname, 'database', 'permisos_admin.db'));

  const isHealthy = await verifyDatabaseIntegrity(dbInstance);
  if (isHealthy) {
    console.log('✅ Base de datos verificada correctamente');
    logDatabaseOperation('SERVER_START', { status: 'healthy', port: PORT });
  } else {
    console.error('⚠️ Advertencia: Problemas detectados en la base de datos');
    logDatabaseOperation('SERVER_START', { status: 'unhealthy', port: PORT });
  }

  dbInstance.close();
});

module.exports = app;