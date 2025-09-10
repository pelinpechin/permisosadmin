const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Crear la aplicación Express
const app = express();

// Configurar middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Configurar Supabase
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error configurando Supabase:', error);
    }
}

// Función helper para normalizar RUT
function normalizarRUT(rut) {
    return rut.replace(/\./g, '').replace(/-/g, '');
}

// Middleware para verificar token JWT
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        req.user = decoded;
        next();
    });
}

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        supabase: !!supabase,
        env_vars: {
            supabase_url: !!process.env.SUPABASE_URL,
            supabase_key: !!process.env.SUPABASE_ANON_KEY,
            jwt_secret: !!process.env.JWT_SECRET
        }
    });
});

// Test completamente básico - SIN autenticación ni Supabase
app.get('/api/test-basic', (req, res) => {
    console.log('🟢 TEST BÁSICO EJECUTADO');
    res.json({ 
        status: 'ok', 
        message: 'Función serverless funciona correctamente',
        timestamp: new Date().toISOString()
    });
});

// Test POST básico - SIN autenticación ni Supabase
app.post('/api/test-post', (req, res) => {
    console.log('🟢 TEST POST EJECUTADO');
    console.log('🟢 Body recibido:', req.body);
    res.json({ 
        status: 'ok', 
        message: 'POST funciona correctamente',
        received: req.body,
        timestamp: new Date().toISOString()
    });
});

// Endpoint de prueba para crear solicitud (simple)
app.post('/api/solicitudes-empleado/crear-test', verifyToken, async (req, res) => {
    try {
        console.log('🧪 === TEST CREAR SOLICITUD ===');
        console.log('🧪 Supabase disponible:', !!supabase);
        console.log('🧪 Usuario:', req.user);
        console.log('🧪 Body:', req.body);
        
        if (!supabase) {
            console.log('❌ Supabase no está configurado');
            return res.status(500).json({ 
                error: 'Base de datos no configurada',
                env_check: {
                    supabase_url: !!process.env.SUPABASE_URL,
                    supabase_key: !!process.env.SUPABASE_ANON_KEY
                }
            });
        }
        
        // Test simple: solo devolver los datos sin insertar
        res.json({
            success: true,
            message: 'Test exitoso - endpoint funciona',
            received_data: req.body,
            user: req.user,
            supabase_status: 'connected'
        });
        
    } catch (error) {
        console.error('💥 Error en test:', error);
        res.status(500).json({ 
            error: 'Error en test: ' + error.message,
            stack: error.stack 
        });
    }
});

// Ruta de verificar RUT empleado
app.post('/api/empleados-auth/verificar-rut', async (req, res) => {
    try {
        const { rut } = req.body;
        
        if (!rut) {
            return res.status(400).json({ error: 'RUT es requerido' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const rutNormalizado = normalizarRUT(rut);
        
        // Consultar empleados activos
        const { data: empleados, error } = await supabase
            .from('empleados')
            .select('*')
            .eq('activo', true);
        
        if (error) {
            console.error('Error consultando empleados:', error);
            return res.status(500).json({ error: 'Error consultando base de datos' });
        }
        
        const empleado = empleados.find(emp => 
            normalizarRUT(emp.rut) === rutNormalizado
        );

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
        }
        
        res.json({
            empleado: {
                id: empleado.id,
                nombre: empleado.nombre,
                rut: empleado.rut,
                email: empleado.email,
                cargo: empleado.cargo
            },
            tienePassword: !!empleado.password_hash,
            emailVerificado: empleado.email_verificado || false
        });
        
    } catch (error) {
        console.error('Error verificando RUT:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de login empleado
app.post('/api/empleados-auth/login', async (req, res) => {
    try {
        const { rut, password } = req.body;
        
        if (!rut || !password) {
            return res.status(400).json({ error: 'RUT y contraseña son requeridos' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const rutNormalizado = normalizarRUT(rut);
        
        // Consultar empleados activos
        const { data: empleados, error } = await supabase
            .from('empleados')
            .select('*')
            .eq('activo', true);
        
        if (error) {
            console.error('Error consultando empleados:', error);
            return res.status(500).json({ error: 'Error consultando base de datos' });
        }
        
        const empleado = empleados.find(emp => 
            normalizarRUT(emp.rut) === rutNormalizado
        );

        if (!empleado) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (!empleado.password_hash) {
            return res.status(401).json({ error: 'Cuenta no activada. Contacte al administrador.' });
        }

        const passwordValid = await bcrypt.compare(password, empleado.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo,
                type: 'empleado'
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            success: true,
            token,
            empleado: {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de solicitar reset de contraseña
app.post('/api/empleados-auth/solicitar-reset', async (req, res) => {
    try {
        const { rut, email } = req.body;
        
        if (!rut || !email) {
            return res.status(400).json({ error: 'RUT y email son requeridos' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const rutNormalizado = normalizarRUT(rut);
        
        // Consultar empleados activos
        const { data: empleados, error } = await supabase
            .from('empleados')
            .select('*')
            .eq('activo', true);
        
        if (error) {
            console.error('Error consultando empleados:', error);
            return res.status(500).json({ error: 'Error consultando base de datos' });
        }
        
        const empleado = empleados.find(emp => 
            normalizarRUT(emp.rut) === rutNormalizado && 
            emp.email === email
        );

        if (!empleado) {
            return res.status(404).json({ error: 'No se encontró un empleado con ese RUT y email' });
        }

        // Generar token de reset
        const tokenReset = crypto.randomBytes(32).toString('hex');
        const fechaExpiracion = new Date(Date.now() + 3600000); // 1 hora

        // Actualizar empleado con token de reset
        const { error: updateError } = await supabase
            .from('empleados')
            .update({
                token_reset: tokenReset,
                reset_expiracion: fechaExpiracion.toISOString()
            })
            .eq('id', empleado.id);

        if (updateError) {
            console.error('Error actualizando token:', updateError);
            return res.status(500).json({ error: 'Error actualizando información' });
        }

        // Simular envío de email exitoso (sin SMTP configurado)
        console.log('EMAIL SIMULADO - Token de reset:', tokenReset);
        console.log('EMAIL SIMULADO - Para:', email);
        console.log('EMAIL SIMULADO - Empleado:', empleado.nombre);
        
        res.json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email (modo demo)',
            // En desarrollo, devolver el token para testing
            ...(process.env.NODE_ENV !== 'production' && { debug_token: tokenReset })
        });
        
    } catch (error) {
        console.error('Error en solicitar-reset:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para dashboard del empleado
app.get('/api/solicitudes-empleado/dashboard', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'empleado') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const empleadoId = req.user.id;

        // Obtener información del empleado
        const { data: empleado, error: empleadoError } = await supabase
            .from('empleados')
            .select('*')
            .eq('id', empleadoId)
            .eq('activo', true)
            .single();

        if (empleadoError || !empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Estadísticas básicas simuladas
        const estadisticas = {
            total_solicitudes: 0,
            pendientes: 0,
            aprobadas: 0,
            rechazadas: 0
        };

        // Determinar permisos de usuario
        const empleadoNombre = empleado.nombre.toUpperCase();
        const esAdministrador = empleadoNombre.includes('RONNY') || empleadoNombre.includes('PATRICIO BRAVO');
        const esSupervisor = !esAdministrador && empleado.supervisor; // Supervisores que no son administradores
        
        res.json({
            success: true,
            data: {
                empleado: {
                    nombre: empleado.nombre,
                    rut: empleado.rut,
                    cargo: empleado.cargo,
                    email: empleado.email,
                    supervisor: empleado.supervisor || empleado.visualizacion || 'No asignado',
                    fecha_ingreso: empleado.fecha_ingreso,
                    horas_semanales: empleado.horas_semanales
                },
                permisos_usuario: {
                    es_administrador: esAdministrador,
                    es_supervisor: esSupervisor,
                    puede_aprobar: esAdministrador, // Solo administradores pueden aprobar
                    puede_ver_subordinados: esAdministrador || esSupervisor
                },
                estadisticas,
                permisos_utilizados: {
                    primer_semestre: empleado.uso_primer_semestre || 0,
                    segundo_semestre: empleado.uso_segundo_semestre || 0,
                    sin_goce: empleado.sin_goce || 0,
                    licencias: empleado.licencias_total || 0
                }
            }
        });

    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para historial de solicitudes
app.get('/api/solicitudes-empleado/historial', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'empleado') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        // Por ahora devolver historial vacío
        res.json({
            success: true,
            data: []
        });

    } catch (error) {
        console.error('Error en historial:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para tipos de permisos
app.get('/api/solicitudes-empleado/tipos-permisos', verifyToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { data: tipos, error } = await supabase
            .from('tipos_permisos')
            .select('*')
            .eq('activo', true)
            .order('codigo');

        if (error) {
            console.error('Error consultando tipos de permisos:', error);
            return res.status(500).json({ error: 'Error consultando tipos de permisos' });
        }

        res.json({
            success: true,
            data: tipos || []
        });

    } catch (error) {
        console.error('Error en tipos-permisos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para crear solicitudes de permiso - VERSION SIMPLIFICADA TEMPORAL
app.post('/api/solicitudes-empleado/crear', verifyToken, async (req, res) => {
    try {
        console.log('🎯 === CREAR SOLICITUD SIMPLIFICADA ===');
        console.log('🎯 Usuario:', req.user);
        console.log('🎯 Body:', req.body);
        
        // Solo validación básica por ahora
        if (req.user.type !== 'empleado') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // RESPUESTA TEMPORAL SIN BASE DE DATOS
        console.log('✅ Simulando creación exitosa');
        
        res.status(201).json({
            success: true,
            message: 'Solicitud simulada creada exitosamente (modo debug)',
            data: {
                id: Date.now(),
                tipo_permiso_id: req.body.tipo_permiso_id,
                fecha_inicio: req.body.fecha_inicio,
                fecha_fin: req.body.fecha_fin || req.body.fecha_inicio,
                motivo: req.body.motivo,
                estado: 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('💥 Error:', error);
        res.status(500).json({ 
            error: 'Error: ' + error.message,
            stack: error.stack
        });
    }
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Exportar como función serverless para Netlify
module.exports.handler = serverless(app);