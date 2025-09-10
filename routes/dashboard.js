const express = require('express');
const { query, get, run } = require('../database/db_config');
const jwt = require('jsonwebtoken');
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

// Dashboard principal para administradores
router.get('/admin', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        
        // Estadísticas generales
        const estadisticasGeneralesQuery = await query(`
            SELECT 
                (SELECT COUNT(*) FROM empleados WHERE activo = 1) as total_empleados,
                (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'PENDIENTE') as solicitudes_pendientes,
                (SELECT COUNT(*) FROM solicitudes_permisos WHERE DATE(created_at) = DATE('now')) as solicitudes_hoy,
                (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'APROBADO' AND strftime('%Y-%m', fecha_desde) = strftime('%Y-%m', 'now')) as aprobadas_mes_actual
        `);
        const estadisticasGenerales = estadisticasGeneralesQuery[0];
        
        // Solicitudes por estado
        const solicitudesPorEstado = await query(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM solicitudes_permisos
            WHERE strftime('%Y', created_at) = strftime('%Y', 'now')
            GROUP BY estado
        `);
        
        // Tipos de permisos más solicitados
        const tiposPermisosPopulares = await query(`
            SELECT 
                tp.nombre,
                tp.codigo,
                tp.color_hex,
                COUNT(sp.id) as cantidad
            FROM tipos_permisos tp
            LEFT JOIN solicitudes_permisos sp ON tp.id = sp.tipo_permiso_id
                AND strftime('%Y', sp.created_at) = strftime('%Y', 'now')
            WHERE tp.activo = 1
            GROUP BY tp.id, tp.nombre, tp.codigo, tp.color_hex
            ORDER BY cantidad DESC
            LIMIT 5
        `);
        
        // Solicitudes por mes (últimos 12 meses)
        const solicitudesPorMes = await query(`
            SELECT 
                strftime('%Y-%m', created_at) as mes,
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazadas
            FROM solicitudes_permisos
            WHERE date(created_at) >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY mes DESC
        `);
        
        // Empleados con más solicitudes
        const empleadosActivosSolicitudes = await query(`
            SELECT 
                e.nombre,
                e.cargo,
                COUNT(sp.id) as total_solicitudes,
                COUNT(CASE WHEN sp.estado = 'APROBADO' THEN 1 END) as aprobadas
            FROM empleados e
            LEFT JOIN solicitudes_permisos sp ON e.id = sp.empleado_id
                AND strftime('%Y', sp.created_at) = strftime('%Y', 'now')
            WHERE e.activo = 1
            GROUP BY e.id, e.nombre, e.cargo
            HAVING total_solicitudes > 0
            ORDER BY total_solicitudes DESC
            LIMIT 10
        `);
        
        // Solicitudes recientes (últimas 5)
        const solicitudesRecientes = await query(`
            SELECT 
                sp.id,
                sp.estado,
                sp.fecha_desde,
                sp.created_at,
                e.nombre as empleado_nombre,
                tp.nombre as tipo_permiso,
                tp.color_hex
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            ORDER BY sp.created_at DESC
            LIMIT 5
        `);
        
        res.json({
            success: true,
            data: {
                estadisticas_generales: estadisticasGenerales,
                solicitudes_por_estado: solicitudesPorEstado,
                tipos_permisos_populares: tiposPermisosPopulares,
                solicitudes_por_mes: solicitudesPorMes,
                empleados_activos: empleadosActivosSolicitudes,
                solicitudes_recientes: solicitudesRecientes
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo dashboard admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Dashboard para empleados
router.get('/empleado', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'empleado') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        
        const empleadoId = req.user.id;
        
        // Información del empleado
        const infoEmpleado = await get(`
            SELECT 
                nombre, rut, cargo, fecha_nacimiento,
                uso_primer_semestre, uso_segundo_semestre,
                sin_goce, beneficio_licencia, licencias_total,
                atrasos, atrasos_justificados, no_marcaciones
            FROM empleados
            WHERE id = ? AND activo = 1
        `, [empleadoId]);
        
        if (!infoEmpleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        // Estadísticas de solicitudes del empleado
        const estadisticasSolicitudes = await get(`
            SELECT 
                COUNT(*) as total_solicitudes,
                COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazadas,
                COUNT(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN 1 END) as este_mes
            FROM solicitudes_permisos
            WHERE empleado_id = ?
        `, [empleadoId]);
        
        // Solicitudes por tipo de permiso
        const solicitudesPorTipo = await query(`
            SELECT 
                tp.nombre,
                tp.codigo,
                tp.color_hex,
                COUNT(sp.id) as cantidad,
                COUNT(CASE WHEN sp.estado = 'APROBADO' THEN 1 END) as aprobadas
            FROM tipos_permisos tp
            LEFT JOIN solicitudes_permisos sp ON tp.id = sp.tipo_permiso_id AND sp.empleado_id = ?
            WHERE tp.activo = 1
            GROUP BY tp.id, tp.nombre, tp.codigo, tp.color_hex
            ORDER BY cantidad DESC
        `, [empleadoId]);
        
        // Historial de solicitudes por mes (últimos 6 meses)
        const historialMensual = await query(`
            SELECT 
                strftime('%Y-%m', created_at) as mes,
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas
            FROM solicitudes_permisos
            WHERE empleado_id = ? 
                AND date(created_at) >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY mes DESC
        `, [empleadoId]);
        
        // Próximas fechas de permisos aprobados
        const proximosPermisos = await query(`
            SELECT 
                sp.fecha_desde,
                sp.fecha_hasta,
                tp.nombre as tipo_permiso,
                tp.codigo,
                tp.color_hex
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id = ? 
                AND sp.estado = 'APROBADO'
                AND sp.fecha_desde >= DATE('now')
            ORDER BY sp.fecha_desde ASC
            LIMIT 5
        `, [empleadoId]);
        
        // Solicitudes recientes
        const solicitudesRecientes = await query(`
            SELECT 
                sp.id,
                sp.estado,
                sp.fecha_desde,
                sp.fecha_hasta,
                sp.motivo,
                sp.created_at,
                sp.fecha_aprobacion,
                tp.nombre as tipo_permiso,
                tp.color_hex,
                ua.nombre as aprobado_por
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE sp.empleado_id = ?
            ORDER BY sp.created_at DESC
            LIMIT 5
        `, [empleadoId]);
        
        // Notificaciones no leídas
        const notificacionesNoLeidas = await query(`
            SELECT 
                titulo,
                mensaje,
                tipo,
                created_at
            FROM notificaciones
            WHERE empleado_id = ? AND leida = 0
            ORDER BY created_at DESC
            LIMIT 5
        `, [empleadoId]);
        
        res.json({
            success: true,
            data: {
                info_empleado: infoEmpleado,
                estadisticas_solicitudes: estadisticasSolicitudes,
                solicitudes_por_tipo: solicitudesPorTipo,
                historial_mensual: historialMensual,
                proximos_permisos: proximosPermisos,
                solicitudes_recientes: solicitudesRecientes,
                notificaciones: notificacionesNoLeidas
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo dashboard empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener notificaciones
router.get('/notificaciones', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, leida = '' } = req.query;
        
        let sql = 'SELECT * FROM notificaciones WHERE ';
        let params = [];
        
        if (req.user.type === 'empleado') {
            sql += 'empleado_id = ?';
            params.push(req.user.id);
        } else {
            sql += '(admin_id = ? OR empleado_id IS NULL)';
            params.push(req.user.id);
        }
        
        if (leida !== '') {
            sql += ' AND leida = ?';
            params.push(leida === 'true' ? 1 : 0);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const notificaciones = await query(sql, params);
        
        res.json({
            success: true,
            data: notificaciones
        });
        
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Marcar notificación como leída
router.put('/notificaciones/:id/leida', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        let sql = 'UPDATE notificaciones SET leida = 1 WHERE id = ?';
        let params = [id];
        
        if (req.user.type === 'empleado') {
            sql += ' AND empleado_id = ?';
            params.push(req.user.id);
        } else {
            sql += ' AND (admin_id = ? OR empleado_id IS NULL)';
            params.push(req.user.id);
        }
        
        const result = await run(sql, params);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });
        
    } catch (error) {
        console.error('Error marcando notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Reporte de permisos por período
router.get('/reportes/permisos', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        
        const { 
            fecha_inicio = '', 
            fecha_fin = '', 
            empleado_id = '', 
            tipo_permiso_id = '',
            estado = ''
        } = req.query;
        
        let sql = `
            SELECT 
                e.numero as empleado_numero,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.nombre as tipo_permiso,
                tp.codigo as tipo_codigo,
                sp.fecha_desde,
                sp.fecha_hasta,
                sp.motivo,
                sp.estado,
                sp.created_at as fecha_solicitud,
                sp.fecha_aprobacion,
                ua.nombre as aprobado_por,
                sp.rechazado_motivo
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE 1=1
        `;
        const params = [];
        
        if (fecha_inicio) {
            sql += ' AND sp.fecha_desde >= ?';
            params.push(fecha_inicio);
        }
        
        if (fecha_fin) {
            sql += ' AND sp.fecha_desde <= ?';
            params.push(fecha_fin);
        }
        
        if (empleado_id) {
            sql += ' AND sp.empleado_id = ?';
            params.push(empleado_id);
        }
        
        if (tipo_permiso_id) {
            sql += ' AND sp.tipo_permiso_id = ?';
            params.push(tipo_permiso_id);
        }
        
        if (estado) {
            sql += ' AND sp.estado = ?';
            params.push(estado);
        }
        
        sql += ' ORDER BY sp.fecha_desde DESC, e.nombre ASC';
        
        const reporte = await query(sql, params);
        
        res.json({
            success: true,
            data: reporte
        });
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;