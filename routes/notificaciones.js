const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, run, get } = require('../database/db_config');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';

// Middleware para verificar token de empleado
const verificarTokenEmpleado = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const tipoToken = decoded.type || decoded.tipo;
        if (tipoToken !== 'empleado') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        req.empleado = decoded;
        next();
    } catch (error) {
        console.error('❌ Error en verificación token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Middleware para verificar token de admin
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

// Middleware para verificar que sea admin
const verifyAdmin = (req, res, next) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};

// Obtener notificaciones del empleado logueado
router.get('/empleado', verificarTokenEmpleado, async (req, res) => {
    try {
        const empleadoId = req.empleado.id;

        const notificaciones = await query(`
            SELECT
                n.*,
                s.tipo_permiso_id,
                s.fecha_desde,
                s.estado as solicitud_estado,
                tp.nombre as tipo_permiso_nombre
            FROM notificaciones n
            LEFT JOIN solicitudes_permisos s ON n.solicitud_id = s.id
            LEFT JOIN tipos_permisos tp ON s.tipo_permiso_id = tp.id
            WHERE n.empleado_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [empleadoId]);

        res.json({
            success: true,
            notificaciones: notificaciones || []
        });
    } catch (error) {
        console.error('❌ Error obteniendo notificaciones empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones'
        });
    }
});

// Obtener notificaciones del admin logueado
router.get('/admin', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;

        const notificaciones = await query(`
            SELECT
                n.*,
                s.tipo_permiso_id,
                s.fecha_desde,
                s.estado as solicitud_estado,
                e.nombre as empleado_nombre,
                tp.nombre as tipo_permiso_nombre
            FROM notificaciones n
            LEFT JOIN solicitudes_permisos s ON n.solicitud_id = s.id
            LEFT JOIN empleados e ON s.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON s.tipo_permiso_id = tp.id
            WHERE n.admin_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [adminId]);

        res.json({
            success: true,
            notificaciones: notificaciones || []
        });
    } catch (error) {
        console.error('❌ Error obteniendo notificaciones admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones'
        });
    }
});

// Marcar notificación como leída
router.put('/:id/leer', async (req, res) => {
    try {
        const { id } = req.params;

        await run(`
            UPDATE notificaciones
            SET leida = 1
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Notificación marcada como leída'
        });
    } catch (error) {
        console.error('❌ Error marcando notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar notificación'
        });
    }
});

// Marcar todas las notificaciones como leídas (para empleado)
router.put('/empleado/leer-todas', verificarTokenEmpleado, async (req, res) => {
    try {
        const empleadoId = req.empleado.id;

        await run(`
            UPDATE notificaciones
            SET leida = 1
            WHERE empleado_id = ? AND leida = 0
        `, [empleadoId]);

        res.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        });
    } catch (error) {
        console.error('❌ Error marcando todas notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar notificaciones'
        });
    }
});

// Marcar todas las notificaciones como leídas (para admin)
router.put('/admin/leer-todas', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;

        await run(`
            UPDATE notificaciones
            SET leida = 1
            WHERE admin_id = ? AND leida = 0
        `, [adminId]);

        res.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        });
    } catch (error) {
        console.error('❌ Error marcando todas notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar notificaciones'
        });
    }
});

// Eliminar notificación
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await run(`
            DELETE FROM notificaciones
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Notificación eliminada'
        });
    } catch (error) {
        console.error('❌ Error eliminando notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar notificación'
        });
    }
});

// Contar notificaciones no leídas (empleado)
router.get('/empleado/contar-no-leidas', verificarTokenEmpleado, async (req, res) => {
    try {
        const empleadoId = req.empleado.id;

        const result = await get(`
            SELECT COUNT(*) as count
            FROM notificaciones
            WHERE empleado_id = ? AND leida = 0
        `, [empleadoId]);

        res.json({
            success: true,
            count: result ? result.count : 0
        });
    } catch (error) {
        console.error('❌ Error contando notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar notificaciones'
        });
    }
});

// Contar notificaciones no leídas (admin)
router.get('/admin/contar-no-leidas', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;

        const result = await get(`
            SELECT COUNT(*) as count
            FROM notificaciones
            WHERE admin_id = ? AND leida = 0
        `, [adminId]);

        res.json({
            success: true,
            count: result ? result.count : 0
        });
    } catch (error) {
        console.error('❌ Error contando notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar notificaciones'
        });
    }
});

module.exports = router;
