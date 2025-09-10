const express = require('express');
const { query, get, run } = require('../database/db_config');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';

// Middleware para verificar token
const verifyToken = (req, res, next) => {
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
};

// Configurar nodemailer para notificaciones
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'sistema@empresa.cl',
        pass: process.env.SMTP_PASS || 'password'
    }
});

// Función para crear notificación
const createNotification = async (empleado_id, admin_id, titulo, mensaje, tipo = 'INFO') => {
    try {
        await run(`
            INSERT INTO notificaciones (empleado_id, admin_id, titulo, mensaje, tipo)
            VALUES (?, ?, ?, ?, ?)
        `, [empleado_id, admin_id, titulo, mensaje, tipo]);
    } catch (error) {
        console.error('Error creando notificación:', error);
    }
};

// Obtener tipos de permisos
router.get('/tipos', verifyToken, async (req, res) => {
    try {
        const tipos = await query(
            'SELECT * FROM tipos_permisos WHERE activo = 1 ORDER BY nombre'
        );
        
        res.json({
            success: true,
            data: tipos
        });
        
    } catch (error) {
        console.error('Error obteniendo tipos de permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear solicitud de permiso
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            tipo_permiso_id,
            fecha_desde,
            fecha_hasta,
            motivo,
            observaciones
        } = req.body;
        
        // Validaciones básicas
        if (!tipo_permiso_id || !fecha_desde || !motivo) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de permiso, fecha desde y motivo son obligatorios'
            });
        }
        
        // Verificar que el tipo de permiso existe
        const tipoPermiso = await get(
            'SELECT * FROM tipos_permisos WHERE id = ? AND activo = 1',
            [tipo_permiso_id]
        );
        
        if (!tipoPermiso) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de permiso no válido'
            });
        }
        
        // Verificar que la fecha no sea en el pasado
        const fechaDesde = new Date(fecha_desde);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaDesde < hoy) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden solicitar permisos para fechas pasadas'
            });
        }
        
        // Para empleados, verificar que sea su propia solicitud
        let empleado_id = req.body.empleado_id;
        if (req.user.type === 'empleado') {
            empleado_id = req.user.id;
        }
        
        if (!empleado_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de empleado requerido'
            });
        }
        
        // Verificar que no haya otra solicitud pendiente para el mismo día
        const solicitudExistente = await get(`
            SELECT id FROM solicitudes_permisos 
            WHERE empleado_id = ? 
            AND fecha_desde = ? 
            AND estado IN ('PENDIENTE', 'APROBADO')
        `, [empleado_id, fecha_desde]);
        
        if (solicitudExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una solicitud para esta fecha'
            });
        }
        
        // Crear la solicitud
        const result = await run(`
            INSERT INTO solicitudes_permisos (
                empleado_id, tipo_permiso_id, fecha_solicitud, fecha_desde, 
                fecha_hasta, motivo, observaciones, created_at
            ) VALUES (?, ?, DATE('now'), ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            empleado_id, tipo_permiso_id, fecha_desde, 
            fecha_hasta || fecha_desde, motivo, observaciones
        ]);
        
        // Obtener datos del empleado para encontrar su supervisor
        const empleado = await get(
            'SELECT nombre, rut, supervisor, visualizacion FROM empleados WHERE id = ?',
            [empleado_id]
        );
        
        if (empleado) {
            // Buscar al supervisor en usuarios_admin por visualización
            let supervisor = await get(
                'SELECT id, nombre FROM usuarios_admin WHERE nombre = ? AND activo = 1',
                [empleado.visualizacion]
            );
            
            // Si no se encuentra por visualización, buscar por supervisor
            if (!supervisor && empleado.supervisor) {
                supervisor = await get(
                    'SELECT id, nombre FROM usuarios_admin WHERE nombre = ? AND activo = 1',
                    [empleado.supervisor]
                );
            }
            
            if (supervisor) {
                // Crear notificación específica para el supervisor
                await run(`
                    INSERT INTO notificaciones (admin_id, solicitud_id, tipo, titulo, mensaje, leida, created_at)
                    VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
                `, [
                    supervisor.id,
                    result.lastID || result.id,
                    'NUEVA_SOLICITUD',
                    '🔔 Nueva Solicitud de Permiso',
                    `${empleado.nombre} (${empleado.rut}) ha solicitado un permiso tipo ${tipoPermiso.nombre} para el ${fecha_desde}. Motivo: ${motivo}`
                ]);
                
                console.log(`📨 Notificación enviada a ${supervisor.nombre} para solicitud de ${empleado.nombre}`);
            }
        }
        
        // También crear notificación general para todos los admin
        await createNotification(
            null, // admin_id será null para notificaciones generales
            null,
            'Nueva Solicitud de Permiso',
            `${req.user.nombre} ha solicitado un permiso tipo ${tipoPermiso.nombre} para el ${fecha_desde}`,
            'SOLICITUD'
        );
        
        res.status(201).json({
            success: true,
            message: 'Solicitud de permiso creada exitosamente',
            data: { id: result.id }
        });
        
    } catch (error) {
        console.error('Error creando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener solicitudes de permisos
router.get('/', verifyToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            estado = '',
            empleado_id = '',
            fecha_desde = '',
            fecha_hasta = '',
            tipo_permiso = ''
        } = req.query;
        
        let sql = `
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.nombre as tipo_permiso_nombre,
                tp.codigo as tipo_permiso_codigo,
                tp.color_hex as tipo_permiso_color,
                ua.nombre as aprobado_por_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE 1=1
        `;
        const params = [];
        
        // Si es empleado, solo puede ver sus propias solicitudes
        if (req.user.type === 'empleado') {
            sql += ' AND sp.empleado_id = ?';
            params.push(req.user.id);
        } else if (empleado_id) {
            sql += ' AND sp.empleado_id = ?';
            params.push(empleado_id);
        }
        
        if (estado) {
            sql += ' AND sp.estado = ?';
            params.push(estado);
        }
        
        if (fecha_desde) {
            sql += ' AND sp.fecha_desde >= ?';
            params.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            sql += ' AND sp.fecha_desde <= ?';
            params.push(fecha_hasta);
        }
        
        if (tipo_permiso) {
            sql += ' AND sp.tipo_permiso_id = ?';
            params.push(tipo_permiso);
        }
        
        sql += ' ORDER BY sp.created_at DESC';
        
        // Paginación
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const solicitudes = await query(sql, params);
        
        // Contar total
        let countSql = `
            SELECT COUNT(*) as total 
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            WHERE 1=1
        `;
        const countParams = [];
        
        if (req.user.type === 'empleado') {
            countSql += ' AND sp.empleado_id = ?';
            countParams.push(req.user.id);
        } else if (empleado_id) {
            countSql += ' AND sp.empleado_id = ?';
            countParams.push(empleado_id);
        }
        
        if (estado) {
            countSql += ' AND sp.estado = ?';
            countParams.push(estado);
        }
        
        if (fecha_desde) {
            countSql += ' AND sp.fecha_desde >= ?';
            countParams.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            countSql += ' AND sp.fecha_desde <= ?';
            countParams.push(fecha_hasta);
        }
        
        if (tipo_permiso) {
            countSql += ' AND sp.tipo_permiso_id = ?';
            countParams.push(tipo_permiso);
        }
        
        const countResult = await get(countSql, countParams);
        const total = countResult ? countResult.total : 0;
        
        res.json({
            success: true,
            data: {
                solicitudes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener solicitud por ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = `
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                e.email as empleado_email,
                tp.nombre as tipo_permiso_nombre,
                tp.codigo as tipo_permiso_codigo,
                tp.descripcion as tipo_permiso_descripcion,
                tp.color_hex as tipo_permiso_color,
                tp.requiere_autorizacion,
                tp.afecta_sueldo,
                ua.nombre as aprobado_por_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE sp.id = ?
        `;
        
        const solicitud = await get(sql, [id]);
        
        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        
        // Los empleados solo pueden ver sus propias solicitudes
        if (req.user.type === 'empleado' && req.user.id != solicitud.empleado_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver esta solicitud'
            });
        }
        
        res.json({
            success: true,
            data: solicitud
        });
        
    } catch (error) {
        console.error('Error obteniendo solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Aprobar o rechazar solicitud (solo administradores)
router.put('/:id/estado', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden aprobar/rechazar solicitudes'
            });
        }
        
        const { id } = req.params;
        const { estado, motivo_rechazo } = req.body;
        
        if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido. Debe ser APROBADO o RECHAZADO'
            });
        }
        
        if (estado === 'RECHAZADO' && !motivo_rechazo) {
            return res.status(400).json({
                success: false,
                message: 'El motivo de rechazo es obligatorio'
            });
        }
        
        // Verificar que la solicitud existe y está pendiente
        const solicitud = await get(`
            SELECT sp.*, e.nombre as empleado_nombre, e.email as empleado_email,
                   tp.nombre as tipo_permiso_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.id = ? AND sp.estado = 'PENDIENTE'
        `, [id]);
        
        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o ya fue procesada'
            });
        }
        
        // Actualizar el estado
        await run(`
            UPDATE solicitudes_permisos 
            SET estado = ?, fecha_aprobacion = CURRENT_TIMESTAMP, 
                aprobado_por = ?, rechazado_motivo = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [estado, req.user.id, motivo_rechazo, id]);
        
        // Crear notificación para el empleado
        const mensajeNotificacion = estado === 'APROBADO' 
            ? `Tu solicitud de ${solicitud.tipo_permiso_nombre} para el ${solicitud.fecha_desde} ha sido aprobada`
            : `Tu solicitud de ${solicitud.tipo_permiso_nombre} para el ${solicitud.fecha_desde} ha sido rechazada. Motivo: ${motivo_rechazo}`;
        
        await createNotification(
            solicitud.empleado_id,
            req.user.id,
            `Solicitud ${estado.toLowerCase()}`,
            mensajeNotificacion,
            estado === 'APROBADO' ? 'SUCCESS' : 'WARNING'
        );
        
        // Enviar email de notificación (si está configurado)
        if (solicitud.empleado_email && process.env.SMTP_USER) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: solicitud.empleado_email,
                    subject: `Solicitud de permiso ${estado.toLowerCase()}`,
                    html: `
                        <h2>Estado de tu solicitud de permiso</h2>
                        <p><strong>Empleado:</strong> ${solicitud.empleado_nombre}</p>
                        <p><strong>Tipo de permiso:</strong> ${solicitud.tipo_permiso_nombre}</p>
                        <p><strong>Fecha:</strong> ${solicitud.fecha_desde}</p>
                        <p><strong>Estado:</strong> ${estado}</p>
                        ${motivo_rechazo ? `<p><strong>Motivo:</strong> ${motivo_rechazo}</p>` : ''}
                        <p><strong>Procesado por:</strong> ${req.user.nombre}</p>
                        <p><strong>Fecha de procesamiento:</strong> ${new Date().toLocaleString('es-CL')}</p>
                    `
                });
            } catch (emailError) {
                console.error('Error enviando email:', emailError);
            }
        }
        
        res.json({
            success: true,
            message: `Solicitud ${estado.toLowerCase()} exitosamente`
        });
        
    } catch (error) {
        console.error('Error procesando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Estadísticas de permisos
router.get('/data/estadisticas', verifyToken, async (req, res) => {
    try {
        const { empleado_id = '', ano = new Date().getFullYear() } = req.query;
        
        let whereClause = `WHERE strftime('%Y', sp.fecha_desde) = '${ano}'`;
        let params = [];
        
        if (req.user.type === 'empleado') {
            whereClause += ' AND sp.empleado_id = ?';
            params.push(req.user.id);
        } else if (empleado_id) {
            whereClause += ' AND sp.empleado_id = ?';
            params.push(empleado_id);
        }
        
        // Estadísticas generales
        const general = await get(`
            SELECT 
                COUNT(*) as total_solicitudes,
                COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazadas
            FROM solicitudes_permisos sp ${whereClause}
        `, params);
        
        // Por tipo de permiso
        const porTipo = await query(`
            SELECT 
                tp.nombre,
                tp.codigo,
                tp.color_hex,
                COUNT(sp.id) as cantidad,
                COUNT(CASE WHEN sp.estado = 'APROBADO' THEN 1 END) as aprobadas
            FROM tipos_permisos tp
            LEFT JOIN solicitudes_permisos sp ON tp.id = sp.tipo_permiso_id AND strftime('%Y', sp.fecha_desde) = '${ano}'
            ${req.user.type === 'empleado' ? 'AND sp.empleado_id = ?' : empleado_id ? 'AND sp.empleado_id = ?' : ''}
            WHERE tp.activo = 1
            GROUP BY tp.id, tp.nombre, tp.codigo, tp.color_hex
            ORDER BY cantidad DESC
        `, params);
        
        // Por mes
        const porMes = await query(`
            SELECT 
                strftime('%m', sp.fecha_desde) as mes,
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas
            FROM solicitudes_permisos sp ${whereClause}
            GROUP BY strftime('%m', sp.fecha_desde)
            ORDER BY mes
        `, params);
        
        res.json({
            success: true,
            data: {
                general,
                por_tipo: porTipo,
                por_mes: porMes
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Cancelar solicitud (solo si está pendiente y es del mismo empleado)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const solicitud = await get(
            'SELECT empleado_id, estado FROM solicitudes_permisos WHERE id = ?',
            [id]
        );
        
        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }
        
        // Solo el empleado propietario puede cancelar (o admin)
        if (req.user.type === 'empleado' && req.user.id != solicitud.empleado_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para cancelar esta solicitud'
            });
        }
        
        if (solicitud.estado !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar solicitudes pendientes'
            });
        }
        
        await run(
            'DELETE FROM solicitudes_permisos WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Solicitud cancelada exitosamente'
        });
        
    } catch (error) {
        console.error('Error cancelando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;