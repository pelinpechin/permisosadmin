const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db_config');
const router = express.Router();

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error en verificación token:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
};

/**
 * GET /api/aprobar/pendientes
 * Obtener todas las solicitudes pendientes
 */
router.get('/pendientes', verificarToken, async (req, res) => {
    try {
        const solicitudes = await db.query(`
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.codigo as tipo_codigo,
                tp.nombre as tipo_nombre,
                tp.color_hex as tipo_color
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.estado = 'PENDIENTE'
            ORDER BY sp.created_at DESC
        `);

        res.json({
            success: true,
            solicitudes: solicitudes || []
        });

    } catch (error) {
        console.error('Error obteniendo solicitudes pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/aprobar/:id/aprobar
 * Aprobar una solicitud específica
 */
router.put('/:id/aprobar', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Actualizar estado a APROBADO
        await db.run(`
            UPDATE solicitudes_permisos 
            SET estado = 'APROBADO', 
                fecha_aprobacion = CURRENT_TIMESTAMP,
                aprobado_por = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND estado = 'PENDIENTE'
        `, [req.usuario.id, id]);

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente'
        });

    } catch (error) {
        console.error('Error aprobando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/aprobar/:id/rechazar
 * Rechazar una solicitud específica
 */
router.put('/:id/rechazar', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        // Actualizar estado a RECHAZADO
        await db.run(`
            UPDATE solicitudes_permisos 
            SET estado = 'RECHAZADO', 
                fecha_aprobacion = CURRENT_TIMESTAMP,
                aprobado_por = ?,
                rechazado_motivo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND estado = 'PENDIENTE'
        `, [req.usuario.id, motivo || 'Sin motivo especificado', id]);

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente'
        });

    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;