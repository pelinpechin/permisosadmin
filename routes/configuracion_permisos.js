const express = require('express');
const jwt = require('jsonwebtoken');
const { query, run, get } = require('../database/db_config');

const router = express.Router();

// Middleware para verificar token de admin
function verificarTokenAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025');

        if (decoded.type !== 'admin') {
            return res.status(403).json({ error: 'Acceso solo para administradores' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Error verificando token admin:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * GET /api/configuracion-permisos/configuraciones
 * Obtener configuraciones del sistema
 */
router.get('/configuraciones', verificarTokenAdmin, async (req, res) => {
    try {
        console.log('📋 Obteniendo configuraciones del sistema...');

        const configuraciones = await query('SELECT * FROM configuraciones_sistema');

        // Convertir a objeto key-value
        const config = {};
        configuraciones.forEach(c => {
            config[c.clave] = {
                valor: c.valor,
                descripcion: c.descripcion,
                tipo: c.tipo
            };
        });

        res.json({ success: true, configuraciones: config });

    } catch (error) {
        console.error('❌ Error obteniendo configuraciones:', error);
        res.status(500).json({ error: 'Error obteniendo configuraciones' });
    }
});

/**
 * PUT /api/configuracion-permisos/configuraciones
 * Actualizar configuración del sistema
 */
router.put('/configuraciones', verificarTokenAdmin, async (req, res) => {
    try {
        const { clave, valor } = req.body;

        console.log(`🔧 Actualizando configuración: ${clave} = ${valor}`);

        await run(`
            UPDATE configuraciones_sistema
            SET valor = ?, updated_at = CURRENT_TIMESTAMP
            WHERE clave = ?
        `, [valor, clave]);

        res.json({ success: true, message: 'Configuración actualizada' });

    } catch (error) {
        console.error('❌ Error actualizando configuración:', error);
        res.status(500).json({ error: 'Error actualizando configuración' });
    }
});

/**
 * GET /api/configuracion-permisos/empleados-permisos
 * Obtener lista de empleados con sus días de permisos
 */
router.get('/empleados-permisos', verificarTokenAdmin, async (req, res) => {
    try {
        console.log('📋 Obteniendo empleados con días de permisos...');

        const empleados = await query(`
            SELECT
                id,
                numero,
                nombre,
                rut,
                cargo,
                fecha_ingreso,
                uso_primer_semestre,
                uso_segundo_semestre,
                ROUND((JULIANDAY('now') - JULIANDAY(fecha_ingreso)) / 30.44, 1) as meses_antiguedad
            FROM empleados
            WHERE activo = 1
            ORDER BY nombre ASC
        `);

        res.json({ success: true, empleados });

    } catch (error) {
        console.error('❌ Error obteniendo empleados:', error);
        res.status(500).json({ error: 'Error obteniendo empleados' });
    }
});

/**
 * PUT /api/configuracion-permisos/empleado-permisos/:id
 * Actualizar días de permisos de un empleado
 */
router.put('/empleado-permisos/:id', verificarTokenAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { uso_primer_semestre, uso_segundo_semestre } = req.body;

        console.log(`🔧 Actualizando permisos del empleado ${id}:`, {
            uso_primer_semestre,
            uso_segundo_semestre
        });

        // Validar que sean números válidos
        if (uso_primer_semestre < 0 || uso_segundo_semestre < 0) {
            return res.status(400).json({ error: 'Los días no pueden ser negativos' });
        }

        await run(`
            UPDATE empleados
            SET
                uso_primer_semestre = ?,
                uso_segundo_semestre = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [uso_primer_semestre, uso_segundo_semestre, id]);

        res.json({ success: true, message: 'Días de permisos actualizados' });

    } catch (error) {
        console.error('❌ Error actualizando días de permisos:', error);
        res.status(500).json({ error: 'Error actualizando días de permisos' });
    }
});

/**
 * POST /api/configuracion-permisos/resetear-semestre
 * Resetear días usados de un semestre para todos los empleados
 */
router.post('/resetear-semestre', verificarTokenAdmin, async (req, res) => {
    try {
        const { semestre } = req.body; // 1 o 2

        console.log(`🔄 Reseteando días del semestre ${semestre}...`);

        if (semestre !== 1 && semestre !== 2) {
            return res.status(400).json({ error: 'Semestre inválido. Debe ser 1 o 2' });
        }

        const columna = semestre === 1 ? 'uso_primer_semestre' : 'uso_segundo_semestre';

        await run(`
            UPDATE empleados
            SET ${columna} = 0, updated_at = CURRENT_TIMESTAMP
            WHERE activo = 1
        `);

        res.json({ success: true, message: `Días del ${semestre}° semestre reseteados` });

    } catch (error) {
        console.error('❌ Error reseteando semestre:', error);
        res.status(500).json({ error: 'Error reseteando semestre' });
    }
});

/**
 * GET /api/configuracion-permisos/zonas-horarias
 * Obtener lista de zonas horarias disponibles
 */
router.get('/zonas-horarias', verificarTokenAdmin, async (req, res) => {
    try {
        // Zonas horarias comunes de Chile y América
        const zonasHorarias = [
            { value: 'America/Santiago', label: 'Chile Continental (UTC-3)', offset: -3 },
            { value: 'Pacific/Easter', label: 'Isla de Pascua (UTC-5)', offset: -5 },
            { value: 'America/Punta_Arenas', label: 'Punta Arenas (UTC-3)', offset: -3 },
            { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)', offset: -3 },
            { value: 'America/Lima', label: 'Lima (UTC-5)', offset: -5 },
            { value: 'America/Bogota', label: 'Bogotá (UTC-5)', offset: -5 },
            { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)', offset: -6 },
            { value: 'America/New_York', label: 'Nueva York (UTC-4/-5)', offset: -4 },
            { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-7/-8)', offset: -7 },
            { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)', offset: 1 }
        ];

        res.json({ success: true, zonas: zonasHorarias });

    } catch (error) {
        console.error('❌ Error obteniendo zonas horarias:', error);
        res.status(500).json({ error: 'Error obteniendo zonas horarias' });
    }
});

/**
 * PUT /api/configuracion-permisos/zona-horaria
 * Actualizar zona horaria del sistema
 */
router.put('/zona-horaria', verificarTokenAdmin, async (req, res) => {
    try {
        const { zona_horaria, utc_offset } = req.body;

        console.log(`🌍 Actualizando zona horaria del sistema: ${zona_horaria} (UTC${utc_offset})`);

        // Actualizar zona horaria
        await run(`
            UPDATE configuraciones_sistema
            SET valor = ?, updated_at = CURRENT_TIMESTAMP
            WHERE clave = 'zona_horaria'
        `, [zona_horaria]);

        // Actualizar offset UTC
        await run(`
            UPDATE configuraciones_sistema
            SET valor = ?, updated_at = CURRENT_TIMESTAMP
            WHERE clave = 'utc_offset'
        `, [String(utc_offset)]);

        // Limpiar cache de timezone
        const { clearCache } = require('../utils/timezone');
        clearCache();

        res.json({ success: true, message: 'Zona horaria actualizada correctamente' });

    } catch (error) {
        console.error('❌ Error actualizando zona horaria:', error);
        res.status(500).json({ error: 'Error actualizando zona horaria' });
    }
});

module.exports = router;
