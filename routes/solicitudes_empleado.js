const express = require('express');
const jwt = require('jsonwebtoken');
const { query, run } = require('../database/db_config');
const router = express.Router();

// Middleware para verificar token de empleado
const verificarTokenEmpleado = (req, res, next) => {
    try {
        console.log('🔐 ===== MIDDLEWARE EJECUTÁNDOSE =====');
        console.log('🔐 URL:', req.url);
        console.log('🔐 Method:', req.method);
        console.log('🔐 Headers completos:', req.headers);
        console.log('🔐 Body:', req.body);
        console.log('🔐 Authorization header:', req.headers.authorization);
        
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('❌ No token en headers');
            return res.status(401).json({ error: 'Token requerido' });
        }

        console.log('🔍 Token encontrado:', token.substring(0, 20) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decodificado:', decoded);
        
        const tipoToken = decoded.type || decoded.tipo;
        if (tipoToken !== 'empleado') {
            console.log('❌ Tipo incorrecto:', tipoToken, 'esperado: empleado');
            return res.status(403).json({ error: 'No autorizado' });
        }

        req.empleado = decoded;
        console.log('✅ Empleado autenticado:', decoded.nombre);
        next();
    } catch (error) {
        console.error('❌ Error en verificación token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        res.status(500).json({ error: 'Error verificando token' });
    }
};

/**
 * GET /api/solicitudes-empleado/tipos-permisos
 * Obtener tipos de permisos disponibles
 */
router.get('/tipos-permisos', verificarTokenEmpleado, async (req, res) => {
    try {
        const tipos = await query('SELECT * FROM tipos_permisos WHERE activo = 1 ORDER BY codigo');
        
        // Filtrar solo los tipos que puede solicitar un empleado
        const tiposEmpleado = tipos.filter(tipo => 
            ['T', 'AM', 'PM', 'S', 'C'].includes(tipo.codigo)
        );
        
        res.json({
            success: true,
            data: tiposEmpleado
        });
    } catch (error) {
        console.error('Error obteniendo tipos de permisos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/**
 * POST /api/solicitudes-empleado/crear
 * Crear nueva solicitud de permiso
 */
router.post('/crear', verificarTokenEmpleado, async (req, res) => {
    try {
        console.log('🎯 ===== ROUTE HANDLER EJECUTÁNDOSE =====');
        console.log('🎯 req.body completo:', req.body);
        console.log('🎯 req.empleado:', req.empleado);
        
        const { tipo_permiso_id, fecha_inicio, fecha_fin, motivo, observaciones } = req.body;
        
        console.log('📝 Datos recibidos:', { tipo_permiso_id, fecha_inicio, fecha_fin, motivo, observaciones });
        console.log('📝 Request body completo:', req.body);
        console.log('📝 Headers:', req.headers);
        console.log('📝 Empleado autenticado:', req.empleado);
        
        if (!tipo_permiso_id || !fecha_inicio || !motivo) {
            console.log('❌ Validación fallida:', {
                tipo_permiso_id: !!tipo_permiso_id,
                fecha_inicio: !!fecha_inicio,
                motivo: !!motivo,
                tipo_permiso_id_value: tipo_permiso_id,
                fecha_inicio_value: fecha_inicio,
                motivo_value: motivo
            });
            return res.status(400).json({ error: 'Tipo de permiso, fecha de inicio y motivo son requeridos' });
        }

        // Validar que la fecha sea futura
        const fechaPermiso = new Date(fecha_inicio);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaPermiso < hoy) {
            return res.status(400).json({ error: 'La fecha del permiso debe ser futura' });
        }

        // Validar que tipo_permiso_id sea un número válido
        const tipoPermisoIdNum = parseInt(tipo_permiso_id);
        if (isNaN(tipoPermisoIdNum)) {
            return res.status(400).json({ error: 'ID de tipo de permiso inválido' });
        }

        // Verificar que el tipo de permiso existe
        const tipoPermisoQuery = await query('SELECT * FROM tipos_permisos WHERE id = ? AND activo = 1', [tipoPermisoIdNum]);
        
        if (tipoPermisoQuery.length === 0) {
            return res.status(400).json({ error: 'Tipo de permiso no encontrado' });
        }
        
        const tipoPermiso = tipoPermisoQuery[0];

        // ⚡ VALIDAR LÍMITES DE PERMISOS ANTES DE CREAR SOLICITUD
        const validacionLimites = await validarLimitesPermisos(req.empleado.id, tipoPermiso.codigo, fecha_inicio);
        if (!validacionLimites.permitido) {
            return res.status(400).json({ 
                error: validacionLimites.mensaje,
                detalles: validacionLimites.detalles
            });
        }

        // Crear solicitud (usando las columnas correctas de la base de datos)
        const result = await run(`
            INSERT INTO solicitudes_permisos (
                empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta,
                motivo, observaciones, estado
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
        `, [
            req.empleado.id,
            tipoPermisoIdNum,
            fecha_inicio,
            fecha_fin || fecha_inicio,  // Si no hay fecha_fin, usar fecha_inicio
            motivo,
            observaciones || null
        ]);

        console.log('✅ Solicitud creada con ID:', result);

        // 🔔 CREAR NOTIFICACIÓN PARA EL SUPERVISOR
        try {
            await crearNotificacionSupervisor(req.empleado, result, tipoPermiso, fecha_inicio, motivo);
            console.log('📧 Notificación enviada al supervisor');
        } catch (notificationError) {
            console.error('⚠️ Error enviando notificación:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: 'Solicitud creada exitosamente. Se ha notificado al supervisor y autorizador.',
            data: {
                id: result,
                tipo_permiso_id: tipoPermisoIdNum,
                tipo_permiso_nombre: tipoPermiso.nombre,
                fecha_inicio,
                fecha_fin: fecha_fin || fecha_inicio,
                motivo,
                estado: 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('Error creando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/solicitudes-empleado/historial
 * Obtener historial de solicitudes del empleado
 */
router.get('/historial', verificarTokenEmpleado, async (req, res) => {
    try {
        const solicitudes = await query(`
            SELECT sp.*, tp.codigo as tipo_permiso_codigo, tp.nombre as tipo_permiso_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id = ? 
            ORDER BY sp.created_at DESC
        `, [req.empleado.id]);

        res.json({
            success: true,
            data: solicitudes || []
        });

    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
router.post('/crear', verificarTokenEmpleado, async (req, res) => {
    try {
        const { tipoPermisoId, fechaDesde, fechaHasta, motivo, observaciones } = req.body;
        
        if (!tipoPermisoId || !fechaDesde || !motivo) {
            return res.status(400).json({ error: 'Tipo de permiso, fecha y motivo son requeridos' });
        }

        // Validar tipo de permiso
        const tipoPermiso = await query(
            'SELECT * FROM tipos_permisos WHERE id = ? AND activo = 1',
            [tipoPermisoId]
        );

        if (tipoPermiso.length === 0) {
            return res.status(400).json({ error: 'Tipo de permiso inválido' });
        }

        // Validar fechas
        const fechaDesdeObj = new Date(fechaDesde);
        const fechaHastaObj = fechaHasta ? new Date(fechaHasta) : fechaDesdeObj;
        
        if (fechaDesdeObj < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({ error: 'La fecha no puede ser anterior a hoy' });
        }

        if (fechaHastaObj < fechaDesdeObj) {
            return res.status(400).json({ error: 'La fecha hasta no puede ser anterior a la fecha desde' });
        }

        // Crear solicitud
        const solicitud = {
            empleado_id: req.empleado.id,
            tipo_permiso_id: tipoPermisoId,
            fecha_solicitud: new Date().toISOString().split('T')[0],
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta || fechaDesde,
            motivo: motivo.trim(),
            observaciones: observaciones?.trim() || null,
            estado: 'PENDIENTE'
        };

        const resultado = await run(`
            INSERT INTO solicitudes_permisos 
            (empleado_id, tipo_permiso_id, fecha_solicitud, fecha_desde, fecha_hasta, motivo, observaciones, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            solicitud.empleado_id,
            solicitud.tipo_permiso_id, 
            solicitud.fecha_solicitud,
            solicitud.fecha_desde,
            solicitud.fecha_hasta,
            solicitud.motivo,
            solicitud.observaciones,
            solicitud.estado
        ]);

        // Obtener la solicitud creada con joins
        const solicitudCreada = await query(`
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.codigo as tipo_codigo,
                tp.nombre as tipo_nombre,
                tp.color_hex as tipo_color
            FROM solicitudes_permisos sp
            JOIN empleados e ON sp.empleado_id = e.id
            JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.id = ?
        `, [resultado.lastID]);

        // Crear notificación para supervisores
        await crearNotificacionSupervisor(solicitudCreada[0]);

        res.json({
            success: true,
            message: 'Solicitud creada exitosamente',
            solicitud: solicitudCreada[0]
        });

    } catch (error) {
        console.error('Error creando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/solicitudes-empleado/mis-solicitudes
 * Obtener solicitudes del empleado autenticado
 */
router.get('/mis-solicitudes', verificarTokenEmpleado, async (req, res) => {
    try {
        const { estado, limite = 20, pagina = 1 } = req.query;
        
        let whereClause = 'WHERE sp.empleado_id = ?';
        let params = [req.empleado.id];
        
        if (estado && estado !== 'todos') {
            whereClause += ' AND sp.estado = ?';
            params.push(estado.toUpperCase());
        }
        
        const offset = (pagina - 1) * limite;
        
        const solicitudes = await query(`
            SELECT 
                sp.*,
                tp.codigo as tipo_codigo,
                tp.nombre as tipo_nombre,
                tp.color_hex as tipo_color,
                tp.descripcion as tipo_descripcion
            FROM solicitudes_permisos sp
            JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            ${whereClause}
            ORDER BY sp.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limite), offset]);

        // Contar total
        const totalQuery = await query(`
            SELECT COUNT(*) as total
            FROM solicitudes_permisos sp
            ${whereClause}
        `, params);
        
        const total = totalQuery[0]?.total || 0;
        
        res.json({
            solicitudes,
            pagination: {
                total,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/solicitudes-empleado/detalle/:id
 * Obtener detalle de una solicitud específica
 */
router.get('/detalle/:id', verificarTokenEmpleado, async (req, res) => {
    try {
        const { id } = req.params;
        
        const solicitud = await query(`
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                e.supervisor as empleado_supervisor,
                tp.codigo as tipo_codigo,
                tp.nombre as tipo_nombre,
                tp.color_hex as tipo_color,
                tp.descripcion as tipo_descripcion,
                ua.nombre as aprobado_por_nombre
            FROM solicitudes_permisos sp
            JOIN empleados e ON sp.empleado_id = e.id
            JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE sp.id = ? AND sp.empleado_id = ?
        `, [id, req.empleado.id]);

        if (solicitud.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json(solicitud[0]);

    } catch (error) {
        console.error('Error obteniendo detalle de solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/solicitudes-empleado/cancelar/:id
 * Cancelar una solicitud pendiente
 */
router.put('/cancelar/:id', verificarTokenEmpleado, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que la solicitud pertenece al empleado y está pendiente
        const solicitud = await query(
            'SELECT * FROM solicitudes_permisos WHERE id = ? AND empleado_id = ? AND estado = "PENDIENTE"',
            [id, req.empleado.id]
        );

        if (solicitud.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada o no puede ser cancelada' });
        }

        // Cancelar solicitud
        await run(
            'UPDATE solicitudes_permisos SET estado = "CANCELADO" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Solicitud cancelada exitosamente'
        });

    } catch (error) {
        console.error('Error cancelando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/solicitudes-empleado/dashboard
 * Dashboard del empleado con estadísticas
 */
router.get('/dashboard', verificarTokenEmpleado, async (req, res) => {
    try {
        console.log('Dashboard para empleado:', req.empleado.nombre, 'ID:', req.empleado.id);
        
        // Obtener datos completos del empleado incluyendo datos de permisos utilizados
        console.log('🔍 Consultando empleado completo con ID:', req.empleado.id);
        const empleadoCompleto = await query(
            `SELECT * FROM empleados WHERE id = ?`,
            [req.empleado.id]
        );
        console.log('🔍 Empleado completo obtenido:', empleadoCompleto?.length > 0 ? 'SÍ' : 'NO');
        
        if (!empleadoCompleto || empleadoCompleto.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const empleado = empleadoCompleto[0];
        console.log('📊 Datos de permisos del empleado:');
        console.log('   - Uso 1° Semestre:', empleado.uso_primer_semestre);
        console.log('   - Uso 2° Semestre:', empleado.uso_segundo_semestre); 
        console.log('   - Sin goce:', empleado.sin_goce);
        console.log('   - Atrasos:', empleado.atrasos);
        console.log('   - Licencias:', empleado.licencias_total);
        
        // Obtener estadísticas de solicitudes
        const estadisticas = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobadas,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazadas,
                SUM(CASE WHEN estado = 'CANCELADO' THEN 1 ELSE 0 END) as canceladas
            FROM solicitudes_permisos 
            WHERE empleado_id = ?
        `, [req.empleado.id]);
        
        // Obtener solicitudes recientes (últimas 5)
        const solicitudesRecientes = await query(`
            SELECT sp.*, tp.nombre as tipo_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id = ?
            ORDER BY sp.created_at DESC
            LIMIT 5
        `, [req.empleado.id]);
        
        res.json({
            empleado: {
                id: empleado.id,
                nombre: empleado.nombre,
                rut: empleado.rut,
                email: empleado.email,
                cargo: empleado.cargo,
                supervisor: empleado.supervisor,
                negociacion_colectiva: empleado.negociacion_colectiva,
                visualizacion: empleado.visualizacion,
                autorizacion: empleado.autorizacion,
                uso_primer_semestre: empleado.uso_primer_semestre,
                uso_segundo_semestre: empleado.uso_segundo_semestre,
                sin_goce: empleado.sin_goce,
                beneficio_licencia: empleado.beneficio_licencia,
                licencias_total: empleado.licencias_total,
                atrasos: empleado.atrasos,
                atrasos_justificados: empleado.atrasos_justificados,
                no_marcaciones: empleado.no_marcaciones
            },
            estadisticas: {
                total: estadisticas[0]?.total || 0, 
                pendientes: estadisticas[0]?.pendientes || 0, 
                aprobadas: estadisticas[0]?.aprobadas || 0, 
                rechazadas: estadisticas[0]?.rechazadas || 0, 
                canceladas: estadisticas[0]?.canceladas || 0
            },
            solicitudesRecientes: solicitudesRecientes || [],
            notificaciones: [],
            mensaje: 'Bienvenido al Sistema de Permisos Administrativos'
        });

    } catch (error) {
        console.error('Error obteniendo dashboard empleado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * Función auxiliar para crear notificación para supervisores
 */
async function crearNotificacionSupervisor(solicitud) {
    try {
        console.log('📧 Creando notificación para supervisores de:', solicitud.empleado_nombre);
        
        // 1. Obtener información completa del empleado que hizo la solicitud
        const empleado = await get('SELECT * FROM empleados WHERE id = ?', [solicitud.empleado_id]);
        
        if (!empleado) {
            console.log('❌ No se encontró empleado para notificar supervisores');
            return;
        }
        
        console.log('👤 Empleado:', empleado.nombre);
        console.log('📋 Supervisor Visualización:', empleado.visualizacion);
        console.log('📋 Supervisor Autorización:', empleado.autorizacion);
        
        // 2. Notificar al supervisor de VISUALIZACIÓN (si existe)
        if (empleado.visualizacion) {
            await notificarSupervisorVisualizacion(empleado, solicitud);
        }
        
        // 3. Notificar al supervisor de AUTORIZACIÓN (si existe)
        if (empleado.autorizacion) {
            await notificarSupervisorAutorizacion(empleado, solicitud);
        }
        
        // 4. También notificar a todos los administradores del sistema
        await notificarAdministradores(solicitud);
        
    } catch (error) {
        console.error('❌ Error creando notificaciones:', error);
    }
}

// Notificar al supervisor de visualización
async function notificarSupervisorVisualizacion(empleado, solicitud) {
    try {
        const supervisorNombre = empleado.visualizacion;
        
        // Buscar al supervisor en empleados (porque pueden ser empleados)
        const supervisor = await query(
            'SELECT * FROM empleados WHERE nombre = ? AND activo = 1',
            [supervisorNombre]
        );
        
        if (supervisor.length > 0) {
            const sup = supervisor[0];
            console.log('📧 Notificando supervisor de visualización:', sup.nombre);
            
            // Crear notificación para empleado supervisor
            await run(`
                INSERT INTO notificaciones (
                    empleado_id, tipo, titulo, mensaje, leida, created_at
                ) VALUES (?, 'NUEVA_SOLICITUD', ?, ?, 0, CURRENT_TIMESTAMP)
            `, [
                sup.id,
                '👁️ Nueva Solicitud de Permiso (Para su conocimiento)',
                `${empleado.nombre} ha solicitado ${solicitud.tipo_nombre} para el ${formatDate(solicitud.fecha_desde)}. Motivo: ${solicitud.motivo}. (Solo para su conocimiento - no requiere acción)`
            ]);
            console.log('✅ Notificación de visualización creada para:', sup.nombre);
        } else {
            console.log('⚠️ No se encontró supervisor de visualización:', supervisorNombre);
        }
    } catch (error) {
        console.error('❌ Error notificando supervisor visualización:', error);
    }
}

// Notificar al supervisor de autorización
async function notificarSupervisorAutorizacion(empleado, solicitud) {
    try {
        const autorizadorNombre = empleado.autorizacion;
        
        // Buscar al autorizador en empleados
        const autorizador = await query(
            'SELECT * FROM empleados WHERE nombre = ? AND activo = 1',
            [autorizadorNombre]
        );
        
        if (autorizador.length > 0) {
            const auth = autorizador[0];
            console.log('📧 Notificando supervisor de autorización:', auth.nombre);
            
            // Crear notificación para empleado autorizador
            await run(`
                INSERT INTO notificaciones (
                    empleado_id, tipo, titulo, mensaje, leida, created_at
                ) VALUES (?, 'SOLICITUD_APROBACION', ?, ?, 0, CURRENT_TIMESTAMP)
            `, [
                auth.id,
                '⚡ Solicitud Pendiente de Aprobación',
                `${empleado.nombre} solicita ${solicitud.tipo_nombre} para el ${formatDate(solicitud.fecha_desde)}. REQUIERE TU APROBACIÓN. Motivo: ${solicitud.motivo}`
            ]);
            console.log('✅ Notificación de aprobación creada para:', auth.nombre);
        } else {
            console.log('⚠️ No se encontró supervisor de autorización:', autorizadorNombre);
        }
    } catch (error) {
        console.error('❌ Error notificando supervisor autorización:', error);
    }
}

// Notificar a todos los administradores del sistema
async function notificarAdministradores(solicitud) {
    try {
        console.log('📧 Notificando administradores del sistema...');
        
        const administradores = await query(
            'SELECT * FROM usuarios_admin WHERE activo = 1'
        );
        
        for (const admin of administradores) {
            await run(`
                INSERT INTO notificaciones (
                    admin_id, tipo, titulo, mensaje, leida, created_at
                ) VALUES (?, 'NUEVA_SOLICITUD', ?, ?, 0, CURRENT_TIMESTAMP)
            `, [
                admin.id,
                '📋 Nueva Solicitud de Permiso',
                `${solicitud.empleado_nombre} (${solicitud.empleado_cargo}) ha solicitado ${solicitud.tipo_nombre} para el ${formatDate(solicitud.fecha_desde)}.`
            ]);
        }
        console.log(`✅ Notificado a ${administradores.length} administradores`);
    } catch (error) {
        console.error('❌ Error notificando administradores:', error);
    }
}

// Helper function para formatear fechas
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CL');
}

/**
 * Crear notificación para supervisor (solo visualización)
 */
async function crearNotificacionSupervisor(empleado, solicitudId, tipoPermiso, fechaPermiso, motivo) {
    try {
        // 1. Obtener datos completos del empleado incluyendo campo visualizacion
        const empleadoCompleto = await query('SELECT * FROM empleados WHERE id = ?', [empleado.id]);
        
        if (!empleadoCompleto || empleadoCompleto.length === 0) {
            console.log('❌ No se encontró empleado completo');
            return;
        }
        
        const supervisorNombre = empleadoCompleto[0].visualizacion;
        console.log('🔍 Buscando supervisor (VISUALIZACION):', supervisorNombre);
        
        if (!supervisorNombre) {
            console.log('⚠️ Empleado no tiene supervisor asignado en campo VISUALIZACION');
            return;
        }
        
        // 2. Buscar al supervisor en usuarios_admin por nombre exacto
        let supervisor = await query(
            'SELECT * FROM usuarios_admin WHERE nombre = ? AND activo = 1',
            [supervisorNombre]
        );

        if (supervisor.length === 0) {
            console.log('🔍 Buscando con LIKE...');
            // Buscar con LIKE si no se encuentra exacto
            supervisor = await query(
                'SELECT * FROM usuarios_admin WHERE nombre LIKE ? AND activo = 1',
                [`%${supervisorNombre}%`]
            );
        }

        if (supervisor.length > 0) {
            const sup = supervisor[0];
            console.log('👤 Supervisor encontrado:', sup.nombre);

            // 3. Crear notificación para el supervisor (usuarios_admin)
            await run(`
                INSERT INTO notificaciones (
                    admin_id, solicitud_id, tipo, titulo, mensaje, leida, created_at
                ) VALUES (?, ?, 'NUEVA_SOLICITUD', ?, ?, 0, datetime('now'))
            `, [
                sup.id,
                solicitudId,
                '🔔 Nueva Solicitud de Permiso - Solo Visualización',
                `${empleadoCompleto[0].nombre} ha solicitado ${tipoPermiso.nombre} para el ${fechaPermiso}. Motivo: ${motivo}. (Solo notificación - no requiere aprobación por usted)`
            ]);
            console.log('✅ Notificación creada para supervisor:', sup.nombre);
        } else {
            console.warn('⚠️ No se encontró supervisor:', supervisorNombre);
        }
    } catch (error) {
        console.error('❌ Error creando notificación supervisor:', error);
    }
}

/**
 * Crear solicitud de aprobación para autorizador
 */
async function crearSolicitudAprobacion(empleado, solicitudId, tipoPermiso, fechaPermiso, motivo) {
    try {
        const personaAutorizar = empleado.autorizacion || empleado.supervisor;
        console.log('🔍 Buscando autorizador:', personaAutorizar);
        
        // Buscar al autorizador
        let autorizador = await query(
            'SELECT * FROM empleados WHERE nombre LIKE ? AND activo = 1',
            [`%${personaAutorizar}%`]
        );

        if (autorizador.length === 0) {
            // Si no está en empleados, buscar en usuarios_admin
            autorizador = await query(
                'SELECT * FROM usuarios_admin WHERE nombre LIKE ? AND activo = 1',
                [`%${personaAutorizar}%`]
            );
        }

        if (autorizador.length > 0) {
            const auth = autorizador[0];
            console.log('👤 Autorizador encontrado:', auth.nombre);

            // Si es empleado (tiene RUT)
            if (auth.rut) {
                await run(`
                    INSERT INTO notificaciones (
                        empleado_id, tipo, titulo, mensaje, leida, created_at
                    ) VALUES (?, 'SOLICITUD_APROBACION', ?, ?, 0, CURRENT_TIMESTAMP)
                `, [
                    auth.id,
                    '⚡ Solicitud Pendiente de Aprobación',
                    `${empleado.nombre} solicita ${tipoPermiso} para el ${fechaPermiso.toLocaleDateString()}. REQUIERE TU APROBACIÓN. Motivo: ${motivo}`
                ]);
                console.log('✅ Solicitud de aprobación creada para empleado:', auth.nombre);
            } else {
                // Si es usuario admin
                await run(`
                    INSERT INTO notificaciones_admin (
                        admin_id, solicitud_id, tipo, titulo, mensaje, leida, created_at
                    ) VALUES (?, ?, 'SOLICITUD_APROBACION', ?, ?, 0, CURRENT_TIMESTAMP)
                `, [
                    auth.id,
                    solicitudId,
                    '⚡ Solicitud Pendiente de Aprobación',
                    `${empleado.nombre} (${empleado.cargo}) solicita ${tipoPermiso} para el ${fechaPermiso.toLocaleDateString()}. REQUIERE APROBACIÓN.`
                ]);
                console.log('✅ Solicitud de aprobación admin creada para:', auth.nombre);
            }
        } else {
            console.warn('⚠️ No se encontró autorizador:', personaAutorizar);
        }
    } catch (error) {
        console.error('❌ Error creando solicitud aprobación:', error);
    }
}

/**
 * PUT /api/solicitudes-empleado/:id/editar
 * Editar solicitud de permiso (solo si está PENDIENTE)
 */
router.put('/:id/editar', verificarTokenEmpleado, async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_permiso, fecha_solicitud, motivo } = req.body;
        
        console.log('✏️ Editando solicitud:', { id, tipo_permiso, fecha_solicitud, motivo });
        
        if (!tipo_permiso || !fecha_solicitud || !motivo) {
            return res.status(400).json({ error: 'Tipo de permiso, fecha y motivo son requeridos' });
        }
        
        // Verificar que la solicitud existe y pertenece al empleado
        const solicitudExistente = await query(`
            SELECT * FROM solicitudes_permisos 
            WHERE id = ? AND empleado_id = ?
        `, [id, req.empleado.id]);
        
        if (!solicitudExistente || solicitudExistente.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudExistente[0];
        
        // Solo se pueden editar solicitudes PENDIENTES
        if (solicitud.estado !== 'PENDIENTE') {
            return res.status(400).json({ 
                error: `No se puede editar una solicitud ${solicitud.estado}. Solo se pueden editar solicitudes PENDIENTES.` 
            });
        }
        
        // Validar tipo de permiso
        if (!['T', 'AM', 'PM', 'C', 'S'].includes(tipo_permiso)) {
            return res.status(400).json({ error: 'Tipo de permiso inválido' });
        }
        
        // Obtener el ID del tipo de permiso basado en el código
        const tipoPermisoQuery = await query('SELECT id FROM tipos_permisos WHERE codigo = ? AND activo = 1', [tipo_permiso]);
        
        if (tipoPermisoQuery.length === 0) {
            return res.status(400).json({ error: 'Tipo de permiso no encontrado' });
        }
        
        const tipoPermisoId = tipoPermisoQuery[0].id;
        
        // Actualizar solicitud
        await run(`
            UPDATE solicitudes_permisos 
            SET tipo_permiso_id = ?, fecha_desde = ?, fecha_hasta = ?, motivo = ?, updated_at = datetime('now')
            WHERE id = ? AND empleado_id = ?
        `, [
            tipoPermisoId,
            fecha_solicitud,
            fecha_solicitud,
            motivo,
            id,
            req.empleado.id
        ]);
        
        console.log('✅ Solicitud actualizada exitosamente');
        
        res.json({
            success: true,
            message: 'Solicitud actualizada exitosamente',
            solicitud: {
                id: parseInt(id),
                tipo_permiso,
                fecha_solicitud,
                motivo,
                estado: 'PENDIENTE'
            }
        });
        
    } catch (error) {
        console.error('Error editando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/solicitudes-empleado/:id/eliminar
 * Eliminar solicitud de permiso (solo si está PENDIENTE o CANCELADO)
 */
router.delete('/:id/eliminar', verificarTokenEmpleado, async (req, res) => {
    try {
        const { id } = req.params;
        const empleadoId = req.empleado.id;

        console.log(`🗑️ Solicitud de eliminación - ID: ${id}, Empleado: ${empleadoId}`);

        // Verificar que la solicitud existe y pertenece al empleado
        const solicitudExistente = await query(
            'SELECT * FROM solicitudes_permisos WHERE id = ? AND empleado_id = ?',
            [id, empleadoId]
        );

        if (!solicitudExistente || solicitudExistente.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const solicitud = solicitudExistente[0];

        // Solo permitir eliminar si está PENDIENTE o CANCELADO
        if (!['PENDIENTE', 'CANCELADO'].includes(solicitud.estado)) {
            return res.status(400).json({ 
                error: `No se puede eliminar una solicitud ${solicitud.estado}. Solo se pueden eliminar solicitudes PENDIENTES o CANCELADAS.` 
            });
        }

        // Eliminar la solicitud
        await run('DELETE FROM solicitudes_permisos WHERE id = ? AND empleado_id = ?', [id, empleadoId]);

        console.log(`✅ Solicitud ${id} eliminada exitosamente`);

        res.json({
            success: true,
            message: 'Solicitud eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * Validar límites de permisos administrativos
 * @param {number} empleadoId - ID del empleado
 * @param {string} codigoPermiso - Código del tipo de permiso (T, AM, PM, C, S)
 * @param {string} fechaPermiso - Fecha del permiso solicitado
 * @returns {Object} - {permitido: boolean, mensaje: string, detalles: object}
 */
async function validarLimitesPermisos(empleadoId, codigoPermiso, fechaPermiso) {
    try {
        console.log(`🔍 Validando límites para empleado ${empleadoId}, permiso ${codigoPermiso}, fecha ${fechaPermiso}`);
        
        // 1. Los permisos de cumpleaños y sin goce no cuentan para límites administrativos
        if (['C', 'S'].includes(codigoPermiso)) {
            console.log(`✅ Permiso ${codigoPermiso} no cuenta para límites administrativos`);
            return {
                permitido: true,
                mensaje: `Permiso ${codigoPermiso} permitido - no cuenta para límites administrativos`,
                detalles: { tipo: 'sin_limite' }
            };
        }

        // 2. Solo validar límites para permisos administrativos (T, AM, PM)
        if (!['T', 'AM', 'PM'].includes(codigoPermiso)) {
            return {
                permitido: true,
                mensaje: 'Tipo de permiso no administrativo',
                detalles: { tipo: 'no_administrativo' }
            };
        }

        // 3. Obtener datos del empleado incluyendo negociación colectiva
        const empleadoQuery = await query(
            'SELECT negociacion_colectiva, uso_primer_semestre, uso_segundo_semestre FROM empleados WHERE id = ?',
            [empleadoId]
        );

        if (empleadoQuery.length === 0) {
            return {
                permitido: false,
                mensaje: 'Empleado no encontrado',
                detalles: { error: 'empleado_no_encontrado' }
            };
        }

        const empleado = empleadoQuery[0];
        const tieneNegociacionColectiva = empleado.negociacion_colectiva === 1;
        
        console.log(`👤 Empleado: negociación_colectiva=${tieneNegociacionColectiva}, uso_1°=${empleado.uso_primer_semestre}, uso_2°=${empleado.uso_segundo_semestre}`);

        // 4. Determinar período y límites según negociación colectiva
        const fechaPermisoObj = new Date(fechaPermiso);
        const mes = fechaPermisoObj.getMonth() + 1; // 1-12
        const esPrimerSemestre = mes <= 6;
        const año = fechaPermisoObj.getFullYear();
        
        let limites, usoActual, periodo;
        
        if (tieneNegociacionColectiva) {
            // CON NEGOCIACIÓN COLECTIVA: Límite anual total de 6 permisos
            // - T vale 1.0, AM vale 0.5, PM vale 0.5
            // - Total combinado no puede exceder 6.0
            const usoTotalAnual = (empleado.uso_primer_semestre || 0) + (empleado.uso_segundo_semestre || 0);
            
            limites = { maxTotal: 6.0 };
            usoActual = { total: usoTotalAnual };
            periodo = `año ${año}`;
            
            // Calcular cuánto se añadiría con este permiso
            const valorPermiso = codigoPermiso === 'T' ? 1.0 : 0.5;
            const nuevoTotal = usoTotalAnual + valorPermiso;
            
        } else {
            // SIN NEGOCIACIÓN COLECTIVA: Límite semestral total de 3 permisos
            // - T vale 1.0, AM vale 0.5, PM vale 0.5
            // - Total combinado no puede exceder 3.0 por semestre
            const usoSemestre = esPrimerSemestre ? (empleado.uso_primer_semestre || 0) : (empleado.uso_segundo_semestre || 0);
            
            limites = { maxTotal: 3.0 };
            usoActual = { total: usoSemestre };
            periodo = esPrimerSemestre ? `primer semestre ${año}` : `segundo semestre ${año}`;
            
            // Calcular cuánto se añadiría con este permiso
            const valorPermiso = codigoPermiso === 'T' ? 1.0 : 0.5;
            const nuevoTotal = usoSemestre + valorPermiso;
        }

        // 5. Validar límites
        console.log(`📊 Límite: ${limites.maxTotal} permisos totales para el ${periodo}`);
        console.log(`📊 Uso actual: ${usoActual.total}`);
        console.log(`📊 Valor permiso solicitado: ${codigoPermiso === 'T' ? '1.0' : '0.5'}`);
        
        const valorPermiso = codigoPermiso === 'T' ? 1.0 : 0.5;
        const nuevoTotal = usoActual.total + valorPermiso;
        
        if (nuevoTotal > limites.maxTotal) {
            const disponible = Math.max(0, limites.maxTotal - usoActual.total);
            return {
                permitido: false,
                mensaje: `Este permiso ${codigoPermiso} (valor ${valorPermiso}) excedería tu límite de ${limites.maxTotal} permisos para el ${periodo}. Actualmente has usado ${usoActual.total} y solo tienes ${disponible} disponibles.`,
                detalles: {
                    tipo: 'limite_total_excedido',
                    limite: limites.maxTotal,
                    usado: usoActual.total,
                    disponible: disponible,
                    valorPermiso: valorPermiso,
                    periodo: periodo
                }
            };
        }

        // 6. Permiso concedido
        const disponibleDespues = limites.maxTotal - nuevoTotal;
            
        console.log(`✅ Permiso ${codigoPermiso} permitido. Disponibles después: ${disponibleDespues} para el ${periodo}`);
        
        return {
            permitido: true,
            mensaje: `Permiso ${codigoPermiso} aprobado. Después de este permiso te quedarán ${disponibleDespues} permisos disponibles para el ${periodo}.`,
            detalles: {
                tipo: 'aprobado',
                limite: limites.maxTotal,
                usado: usoActual.total,
                valorPermiso: valorPermiso,
                disponibleDespues: disponibleDespues,
                periodo: periodo,
                negociacion_colectiva: tieneNegociacionColectiva
            }
        };

    } catch (error) {
        console.error('❌ Error validando límites de permisos:', error);
        return {
            permitido: false,
            mensaje: 'Error interno validando límites de permisos',
            detalles: { error: 'error_interno', detalle: error.message }
        };
    }
}

/**
 * GET /api/solicitudes-empleado/subordinados
 * Obtener solicitudes de empleados subordinados (para supervisores)
 */
router.get('/subordinados', verificarTokenEmpleado, async (req, res) => {
    try {
        console.log('👁️ === SOLICITUDES DE SUBORDINADOS ===');
        console.log('👁️ Supervisor:', req.empleado);
        
        const supervisorId = req.empleado.id;
        const supervisorNombre = req.empleado.nombre || '';
        
        // Buscar empleados que tienen este usuario como supervisor (por ID o nombre)
        const subordinados = await query(`
            SELECT id, nombre, rut, cargo 
            FROM empleados 
            WHERE (supervisor = ? OR supervisor LIKE ?) 
            AND activo = 1
        `, [supervisorId, `%${supervisorNombre}%`]);
        
        console.log('👥 Subordinados encontrados por BD:', subordinados ? subordinados.length : 0);
        
        // CONFIGURACIÓN DE JERARQUÍA DE SUPERVISORES
        let todosLosSubordinados = subordinados || [];
        
        // Mapeo específico de supervisores según la jerarquía real
        const jerarquiaSupervisores = {
            'andrea': ['francisco', 'mancilla'],
            'ronny': ['miguel', 'rodriguez'], 
            'cisterna': ['miguel', 'rodriguez'],
            'patricio': [], // Patricio es autoridad máxima
            'bravo': []     // Patricio Bravo es autoridad máxima
        };
        
        console.log('🔍 Verificando jerarquía para:', supervisorNombre);
        
        // Buscar si el usuario actual es supervisor según la jerarquía
        for (const [supervisor, subordinadosNombres] of Object.entries(jerarquiaSupervisores)) {
            if (supervisorNombre.toLowerCase().includes(supervisor)) {
                console.log(`🔧 CONFIGURANDO supervisión para ${supervisorNombre}`);
                
                // Buscar subordinados específicos por nombre
                for (const nombreSubordinado of subordinadosNombres) {
                    const empleadosEncontrados = await query(`
                        SELECT id, nombre, rut, cargo 
                        FROM empleados 
                        WHERE nombre LIKE ? AND activo = 1
                    `, [`%${nombreSubordinado}%`]);
                    
                    if (empleadosEncontrados && empleadosEncontrados.length > 0) {
                        // Evitar duplicados
                        empleadosEncontrados.forEach(emp => {
                            if (!todosLosSubordinados.find(s => s.id === emp.id)) {
                                todosLosSubordinados.push(emp);
                            }
                        });
                    }
                }
                
                if (todosLosSubordinados.length > 0) {
                    console.log(`👥 ${supervisorNombre} supervisa a: ${todosLosSubordinados.map(e => e.nombre).join(', ')}`);
                }
                break;
            }
        }
        
        if (!todosLosSubordinados || todosLosSubordinados.length === 0) {
            return res.json({
                success: true,
                data: [],
                subordinados: [],
                message: 'No tienes empleados bajo tu supervisión'
            });
        }
        
        // Obtener IDs de subordinados
        const subordinadosIds = todosLosSubordinados.map(emp => emp.id);
        
        // Definir qué estados puede ver cada supervisor
        const estadosPermitidos = ['PENDIENTE'];
        const nombre = supervisorNombre.toLowerCase();
        
        if (nombre.includes('ronny') || nombre.includes('cisterna') || nombre.includes('patricio') || nombre.includes('bravo')) {
            // Supervisores de nivel superior ven solicitudes ya aprobadas por supervisor directo
            estadosPermitidos.push('APROBADO_SUPERVISOR');
            console.log('🔝 Supervisor de nivel superior - ve APROBADO_SUPERVISOR y PENDIENTE');
        } else {
            console.log('👥 Supervisor directo - solo ve PENDIENTE');
        }
        
        // Consultar solicitudes según nivel del supervisor
        const solicitudesQuery = `
            SELECT sp.*, 
                   e.nombre as empleado_nombre, e.rut as empleado_rut, e.cargo as empleado_cargo,
                   tp.codigo as tipo_codigo, tp.nombre as tipo_nombre, tp.descripcion as tipo_descripcion, tp.color_hex as tipo_color
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id IN (${subordinadosIds.map(() => '?').join(',')})
            AND sp.estado IN (${estadosPermitidos.map(() => '?').join(',')})
            ORDER BY sp.created_at DESC
        `;
        
        const solicitudes = await query(solicitudesQuery, [...subordinadosIds, ...estadosPermitidos]);
        
        console.log('📋 Solicitudes pendientes encontradas:', solicitudes ? solicitudes.length : 0);
        
        // Formatear respuesta
        const solicitudesFormateadas = (solicitudes || []).map(solicitud => ({
            id: solicitud.id,
            empleado: {
                id: solicitud.empleado_id,
                nombre: solicitud.empleado_nombre,
                rut: solicitud.empleado_rut,
                cargo: solicitud.empleado_cargo
            },
            tipo_permiso: {
                codigo: solicitud.tipo_codigo,
                nombre: solicitud.tipo_nombre,
                descripcion: solicitud.tipo_descripcion,
                color_hex: solicitud.tipo_color
            },
            fecha_desde: solicitud.fecha_desde,
            fecha_hasta: solicitud.fecha_hasta,
            motivo: solicitud.motivo,
            observaciones: solicitud.observaciones,
            estado: solicitud.estado,
            created_at: solicitud.created_at,
            updated_at: solicitud.updated_at
        }));
        
        res.json({
            success: true,
            data: solicitudesFormateadas,
            subordinados: todosLosSubordinados,
            message: `Encontradas ${solicitudesFormateadas.length} solicitudes de ${todosLosSubordinados.length} subordinados`
        });
        
    } catch (error) {
        console.error('💥 Error en subordinados:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
});

/**
 * POST /api/solicitudes-empleado/aprobar-supervisor/:id
 * Aprobar una solicitud como supervisor
 */
router.post('/aprobar-supervisor/:id', verificarTokenEmpleado, async (req, res) => {
    try {
        console.log('👁️ === APROBACION SUPERVISOR ===');
        console.log('👁️ Usuario:', req.empleado);
        
        const solicitudId = req.params.id;
        const supervisorNombre = (req.empleado.nombre || '').toLowerCase();
        
        // Determinar el tipo de supervisor
        const esAutoridad = supervisorNombre.includes('ronny') || supervisorNombre.includes('cisterna') || 
                           supervisorNombre.includes('patricio') || supervisorNombre.includes('bravo');
        
        console.log('🔍 Es autoridad máxima:', esAutoridad);
        
        if (esAutoridad) {
            // Autoridad máxima: aprobación final
            await run(`
                UPDATE solicitudes_permisos 
                SET estado = 'APROBADO', 
                    fecha_aprobacion = CURRENT_TIMESTAMP,
                    aprobado_por = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND estado IN ('PENDIENTE', 'APROBADO_SUPERVISOR')
            `, [req.empleado.id, solicitudId]);
            
            console.log('✅ Solicitud APROBADA FINALMENTE por autoridad');
        } else {
            // Supervisor directo: primera aprobación
            await run(`
                UPDATE solicitudes_permisos 
                SET estado = 'APROBADO_SUPERVISOR',
                    visto_por_supervisor = true,
                    fecha_visto_supervisor = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND estado = 'PENDIENTE'
            `, [solicitudId]);
            
            console.log('✅ Solicitud APROBADA por supervisor directo');
        }
        
        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente'
        });
        
    } catch (error) {
        console.error('💥 Error aprobando solicitud:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
});

/**
 * POST /api/solicitudes-empleado/rechazar-supervisor/:id
 * Rechazar una solicitud como supervisor
 */
router.post('/rechazar-supervisor/:id', verificarTokenEmpleado, async (req, res) => {
    try {
        const solicitudId = req.params.id;
        const { motivo } = req.body;
        
        await run(`
            UPDATE solicitudes_permisos 
            SET estado = 'RECHAZADO',
                fecha_aprobacion = CURRENT_TIMESTAMP,
                aprobado_por = ?,
                rechazado_motivo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND estado IN ('PENDIENTE', 'APROBADO_SUPERVISOR')
        `, [req.empleado.id, motivo || 'Sin motivo especificado', solicitudId]);
        
        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente'
        });
        
    } catch (error) {
        console.error('💥 Error rechazando solicitud:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
});

module.exports = router;