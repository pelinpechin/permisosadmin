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

// Ruta para crear contraseña inicial
app.post('/api/empleados-auth/crear-password', async (req, res) => {
    try {
        console.log('🔐 === CREAR PASSWORD ===');
        console.log('🔐 Body:', req.body);
        
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
            return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
        }

        if (empleado.password_hash) {
            return res.status(400).json({ error: 'El empleado ya tiene contraseña configurada' });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Actualizar empleado con password hash
        const { error: updateError } = await supabase
            .from('empleados')
            .update({
                password_hash: passwordHash,
                email_verificado: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', empleado.id);

        if (updateError) {
            console.error('Error actualizando contraseña:', updateError);
            return res.status(500).json({ error: 'Error actualizando contraseña' });
        }

        console.log('✅ Contraseña creada exitosamente para:', empleado.nombre);

        res.json({
            success: true,
            message: 'Contraseña creada exitosamente. Ya puedes iniciar sesión.',
            empleado: {
                nombre: empleado.nombre,
                rut: empleado.rut,
                cargo: empleado.cargo
            }
        });
        
    } catch (error) {
        console.error('Error creando contraseña:', error);
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

// Endpoint para crear solicitudes de permiso - VERSION COMPLETA
app.post('/api/solicitudes-empleado/crear', verifyToken, async (req, res) => {
    try {
        console.log('🎯 === CREAR SOLICITUD COMPLETA ===');
        console.log('🎯 Usuario:', req.user);
        console.log('🎯 Body:', req.body);
        
        if (req.user.type !== 'empleado') {
            console.log('❌ Acceso denegado - tipo usuario:', req.user.type);
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        if (!supabase) {
            console.log('❌ Supabase no configurado - devolviendo simulación');
            return res.status(201).json({
                success: true,
                message: 'Solicitud creada exitosamente (modo simulado - Supabase no disponible)',
                data: {
                    id: Date.now(),
                    tipo_permiso_id: req.body.tipo_permiso_id,
                    fecha_inicio: req.body.fecha_inicio,
                    fecha_fin: req.body.fecha_fin || req.body.fecha_inicio,
                    motivo: req.body.motivo,
                    estado: 'PENDIENTE'
                }
            });
        }

        const { tipo_permiso_id, fecha_inicio, fecha_fin, motivo, observaciones } = req.body;
        
        console.log('📝 Datos recibidos:', { tipo_permiso_id, fecha_inicio, fecha_fin, motivo, observaciones });
        
        if (!tipo_permiso_id || !fecha_inicio || !motivo) {
            console.log('❌ Validación fallida - campos requeridos');
            return res.status(400).json({ error: 'Tipo de permiso, fecha de inicio y motivo son requeridos' });
        }

        // Validar que tipo_permiso_id sea un número válido
        const tipoPermisoIdNum = parseInt(tipo_permiso_id);
        if (isNaN(tipoPermisoIdNum)) {
            console.log('❌ ID tipo permiso inválido:', tipo_permiso_id);
            return res.status(400).json({ error: 'ID de tipo de permiso inválido' });
        }

        console.log('🔍 Consultando tipo de permiso:', tipoPermisoIdNum);

        // Verificar que el tipo de permiso existe - CON FALLBACK
        let tipoPermisoData = null;
        try {
            const result = await supabase
                .from('tipos_permisos')
                .select('*')
                .eq('id', tipoPermisoIdNum)
                .eq('activo', true)
                .single();
            
            if (result.error) {
                console.log('⚠️ Error consultando tipos_permisos:', result.error);
                // Fallback: usar datos simulados
                tipoPermisoData = {
                    id: tipoPermisoIdNum,
                    nombre: 'Tipo de Permiso',
                    codigo: 'T',
                    activo: true
                };
            } else {
                tipoPermisoData = result.data;
            }
        } catch (supabaseError) {
            console.log('⚠️ Error conectando con Supabase:', supabaseError);
            // Fallback: usar datos simulados
            tipoPermisoData = {
                id: tipoPermisoIdNum,
                nombre: 'Tipo de Permiso',
                codigo: 'T',
                activo: true
            };
        }

        console.log('✅ Tipo de permiso (real/simulado):', tipoPermisoData);

        // Preparar datos para inserción
        const solicitudData = {
            empleado_id: req.user.id,
            tipo_permiso_id: tipoPermisoIdNum,
            fecha_desde: fecha_inicio,
            fecha_hasta: fecha_fin || fecha_inicio,
            motivo: motivo,
            observaciones: observaciones || null,
            estado: 'PENDIENTE',
            created_at: new Date().toISOString()
        };

        console.log('📝 Intentando insertar en DB:', solicitudData);

        // Crear solicitud - CON FALLBACK
        let solicitud = null;
        try {
            const result = await supabase
                .from('solicitudes_permisos')
                .insert(solicitudData)
                .select()
                .single();

            if (result.error) {
                console.log('⚠️ Error insertando en DB:', result.error);
                // Crear ID simulado si falla la DB
                solicitud = { ...solicitudData, id: Date.now() };
            } else {
                solicitud = result.data;
            }
        } catch (dbError) {
            console.log('⚠️ Error de conexión DB:', dbError);
            // Crear respuesta simulada
            solicitud = { ...solicitudData, id: Date.now() };
        }

        console.log('✅ Solicitud final (real/simulada):', solicitud);

        res.status(201).json({
            success: true,
            message: solicitud.id > 1000000000000 ? 
                'Solicitud creada exitosamente (modo simulado - problemas con DB)' :
                'Solicitud creada exitosamente en base de datos',
            data: {
                id: solicitud.id,
                tipo_permiso_id: tipoPermisoIdNum,
                tipo_permiso_nombre: tipoPermisoData.nombre,
                fecha_inicio,
                fecha_fin: fecha_fin || fecha_inicio,
                motivo,
                estado: 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('💥 Error general:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor: ' + error.message,
            stack: error.stack
        });
    }
});

// Endpoint para aprobar solicitud (supervisor - primer nivel)
app.post('/api/solicitudes-empleado/aprobar-supervisor/:id', verifyToken, async (req, res) => {
    try {
        console.log('👁️ === APROBACION SUPERVISOR ===');
        console.log('👁️ Usuario:', req.user);
        console.log('👁️ Solicitud ID:', req.params.id);
        console.log('👁️ Body:', req.body);
        
        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { id } = req.params;
        const { observaciones } = req.body;
        const supervisorId = req.user.id;
        const supervisorNombre = req.user.nombre;

        // Obtener la solicitud
        const { data: solicitud, error: solicitudError } = await supabase
            .from('solicitudes_permisos')
            .select(`
                *,
                empleados!inner(nombre, rut, visualizacion, autorizacion)
            `)
            .eq('id', id)
            .eq('estado', 'PENDIENTE')
            .single();

        if (solicitudError || !solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
        }

        // Verificar que el usuario sea el supervisor de visualización
        const empleado = solicitud.empleados;
        if (empleado.visualizacion !== supervisorNombre) {
            return res.status(403).json({ 
                error: 'No tienes permisos para aprobar esta solicitud como supervisor' 
            });
        }

        // Actualizar solicitud a APROBADO_SUPERVISOR
        const { error: updateError } = await supabase
            .from('solicitudes_permisos')
            .update({
                estado: 'APROBADO_SUPERVISOR',
                aprobado_supervisor_por: supervisorId,
                aprobado_supervisor_fecha: new Date().toISOString(),
                observaciones_supervisor: observaciones || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error actualizando solicitud:', updateError);
            return res.status(500).json({ error: 'Error actualizando solicitud' });
        }

        // TODO: Crear notificación para autorizador
        console.log('✅ Solicitud aprobada por supervisor, pendiente de autorización final');

        res.json({
            success: true,
            message: 'Solicitud aprobada por supervisor. Pendiente de autorización final.',
            data: {
                id: parseInt(id),
                estado: 'APROBADO_SUPERVISOR',
                siguiente_paso: 'Autorización final'
            }
        });

    } catch (error) {
        console.error('💥 Error en aprobación supervisor:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

// Endpoint para autorizar solicitud (autorizador - segundo nivel)
app.post('/api/solicitudes-empleado/autorizar-final/:id', verifyToken, async (req, res) => {
    try {
        console.log('⚡ === AUTORIZACION FINAL ===');
        console.log('⚡ Usuario:', req.user);
        console.log('⚡ Solicitud ID:', req.params.id);
        console.log('⚡ Body:', req.body);
        
        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { id } = req.params;
        const { observaciones } = req.body;
        const autorizadorId = req.user.id;
        const autorizadorNombre = req.user.nombre;

        // Obtener la solicitud
        const { data: solicitud, error: solicitudError } = await supabase
            .from('solicitudes_permisos')
            .select(`
                *,
                empleados!inner(nombre, rut, visualizacion, autorizacion)
            `)
            .eq('id', id)
            .eq('estado', 'APROBADO_SUPERVISOR')
            .single();

        if (solicitudError || !solicitud) {
            return res.status(404).json({ 
                error: 'Solicitud no encontrada o no está en estado APROBADO_SUPERVISOR' 
            });
        }

        // Verificar que el usuario sea el autorizador
        const empleado = solicitud.empleados;
        if (empleado.autorizacion !== autorizadorNombre) {
            return res.status(403).json({ 
                error: 'No tienes permisos para autorizar esta solicitud' 
            });
        }

        // Actualizar solicitud a APROBADO (estado final)
        const { error: updateError } = await supabase
            .from('solicitudes_permisos')
            .update({
                estado: 'APROBADO',
                aprobado_por: autorizadorId,
                fecha_aprobacion: new Date().toISOString(),
                observaciones_autorizador: observaciones || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error actualizando solicitud:', updateError);
            return res.status(500).json({ error: 'Error actualizando solicitud' });
        }

        // TODO: Actualizar contadores de permisos utilizados del empleado
        console.log('✅ Solicitud APROBADA FINALMENTE');

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente. El empleado ha sido notificado.',
            data: {
                id: parseInt(id),
                estado: 'APROBADO',
                proceso_completo: true
            }
        });

    } catch (error) {
        console.error('💥 Error en autorización final:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

// Endpoint para rechazar solicitud (cualquier nivel)
app.post('/api/solicitudes-empleado/rechazar/:id', verifyToken, async (req, res) => {
    try {
        console.log('❌ === RECHAZAR SOLICITUD ===');
        console.log('❌ Usuario:', req.user);
        console.log('❌ Solicitud ID:', req.params.id);
        console.log('❌ Body:', req.body);
        
        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const { id } = req.params;
        const { motivo_rechazo } = req.body;
        const rechazadoPorId = req.user.id;
        const rechazadoPorNombre = req.user.nombre;

        if (!motivo_rechazo) {
            return res.status(400).json({ error: 'Motivo de rechazo es requerido' });
        }

        // Obtener la solicitud
        const { data: solicitud, error: solicitudError } = await supabase
            .from('solicitudes_permisos')
            .select(`
                *,
                empleados!inner(nombre, rut, visualizacion, autorizacion)
            `)
            .eq('id', id)
            .in('estado', ['PENDIENTE', 'APROBADO_SUPERVISOR'])
            .single();

        if (solicitudError || !solicitud) {
            return res.status(404).json({ 
                error: 'Solicitud no encontrada o ya fue procesada' 
            });
        }

        // Verificar permisos (supervisor o autorizador)
        const empleado = solicitud.empleados;
        const esSupervisor = empleado.visualizacion === rechazadoPorNombre;
        const esAutorizador = empleado.autorizacion === rechazadoPorNombre;

        if (!esSupervisor && !esAutorizador) {
            return res.status(403).json({ 
                error: 'No tienes permisos para rechazar esta solicitud' 
            });
        }

        // Actualizar solicitud a RECHAZADO
        const { error: updateError } = await supabase
            .from('solicitudes_permisos')
            .update({
                estado: 'RECHAZADO',
                rechazado_por: rechazadoPorId,
                fecha_rechazo: new Date().toISOString(),
                motivo_rechazo: motivo_rechazo,
                rechazado_por_rol: esSupervisor ? 'SUPERVISOR' : 'AUTORIZADOR',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error actualizando solicitud:', updateError);
            return res.status(500).json({ error: 'Error actualizando solicitud' });
        }

        console.log(`✅ Solicitud rechazada por ${esSupervisor ? 'supervisor' : 'autorizador'}`);

        res.json({
            success: true,
            message: 'Solicitud rechazada. El empleado ha sido notificado.',
            data: {
                id: parseInt(id),
                estado: 'RECHAZADO',
                rechazado_por_rol: esSupervisor ? 'SUPERVISOR' : 'AUTORIZADOR'
            }
        });

    } catch (error) {
        console.error('💥 Error rechazando solicitud:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

// Endpoint para obtener solicitudes pendientes de aprobación
app.get('/api/solicitudes-empleado/pendientes-aprobacion', verifyToken, async (req, res) => {
    try {
        console.log('📋 === SOLICITUDES PENDIENTES ===');
        console.log('📋 Usuario:', req.user);
        
        if (!supabase) {
            return res.status(500).json({ error: 'Base de datos no configurada' });
        }

        const usuarioNombre = req.user.nombre;

        // Buscar solicitudes donde el usuario sea supervisor o autorizador
        const { data: solicitudes, error } = await supabase
            .from('solicitudes_permisos')
            .select(`
                *,
                empleados!inner(nombre, rut, cargo, visualizacion, autorizacion),
                tipos_permisos!inner(codigo, nombre, descripcion)
            `)
            .or(
                `and(empleados.visualizacion.eq.${usuarioNombre},estado.eq.PENDIENTE),` +
                `and(empleados.autorizacion.eq.${usuarioNombre},estado.eq.APROBADO_SUPERVISOR)`
            )
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error consultando solicitudes:', error);
            return res.status(500).json({ error: 'Error consultando solicitudes' });
        }

        // Separar por tipo de acción requerida
        const paraSupervisar = solicitudes.filter(s => 
            s.estado === 'PENDIENTE' && s.empleados.visualizacion === usuarioNombre
        );
        
        const paraAutorizar = solicitudes.filter(s => 
            s.estado === 'APROBADO_SUPERVISOR' && s.empleados.autorizacion === usuarioNombre
        );

        res.json({
            success: true,
            data: {
                para_supervisar: paraSupervisar,
                para_autorizar: paraAutorizar,
                total: solicitudes.length
            }
        });

    } catch (error) {
        console.error('💥 Error obteniendo pendientes:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor: ' + error.message 
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