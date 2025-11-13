const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db_config');

const router = express.Router();

// Middleware para verificar token (flexible: admin, empleado, supervisor)
function verificarToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025');

        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Error verificando token:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * GET /api/equipo/permisos
 * Obtener permisos del calendario según el rol del usuario
 *
 * Admin/Autorizador: Ve TODOS los permisos aprobados
 * Supervisor: Ve solo permisos de sus subordinados
 * Empleado normal: No debería acceder (pero por si acaso, solo ve los suyos)
 */
router.get('/permisos', verificarToken, async (req, res) => {
    try {
        const { anio, mes } = req.query;
        const userType = req.user.type || req.user.tipo;
        const userId = req.user.id;

        console.log('📅 Obteniendo permisos calendario para:', {
            userType,
            userId,
            anio,
            mes
        });

        let sql = `
            SELECT
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                e.supervisor_id,
                e.es_supervisor,
                tp.nombre as tipo_nombre,
                tp.codigo as tipo_codigo,
                tp.afecta_sueldo
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.estado = 'APROBADO'
        `;

        const params = [];

        // Filtrar por año y mes si se proporcionan
        if (anio && mes) {
            sql += ` AND strftime('%Y', sp.fecha_desde) = ? AND strftime('%m', sp.fecha_desde) = ?`;
            params.push(String(anio), String(mes).padStart(2, '0'));
        }

        // Aplicar filtro según el rol del usuario
        if (userType === 'admin') {
            // Admin ve TODOS los permisos aprobados (sin filtro adicional)
            console.log('👑 Usuario admin: mostrando TODOS los permisos');
        } else if (userType === 'empleado') {
            // Verificar si el empleado es supervisor
            const empleado = await query('SELECT es_supervisor FROM empleados WHERE id = ?', [userId]);

            if (empleado && empleado.length > 0 && empleado[0].es_supervisor) {
                // Es supervisor: mostrar permisos de subordinados
                console.log('👔 Usuario es supervisor: mostrando permisos de subordinados');
                sql += ` AND e.supervisor_id = ?`;
                params.push(userId);
            } else {
                // Empleado normal: solo sus propios permisos (no debería acceder al calendario equipo)
                console.log('👤 Usuario empleado normal: mostrando solo sus permisos');
                sql += ` AND sp.empleado_id = ?`;
                params.push(userId);
            }
        } else {
            // Por si acaso, restricción por defecto
            console.log('⚠️ Tipo de usuario desconocido, mostrando solo permisos del usuario');
            sql += ` AND sp.empleado_id = ?`;
            params.push(userId);
        }

        sql += ' ORDER BY sp.fecha_desde ASC';

        console.log('🔍 Ejecutando consulta SQL calendario');
        const permisos = await query(sql, params);

        console.log(`✅ Se encontraron ${permisos.length} permisos para el calendario`);

        // Debug: ver primeros 3 permisos
        if (permisos.length > 0) {
            console.log('🔍 DEBUG - Primeros permisos:');
            permisos.slice(0, 3).forEach((p, idx) => {
                console.log(`   [${idx}] ${p.empleado_nombre} - Tipo: ${p.tipo_codigo} - afecta_sueldo: ${p.afecta_sueldo} - medio_dia: ${p.medio_dia}`);
            });
        }

        // Procesar permisos para incluir información de visualización
        const permisosConDetalle = permisos.map(permiso => ({
            ...permiso,
            fecha_inicio: permiso.fecha_desde,
            fecha_fin: permiso.fecha_hasta || permiso.fecha_desde,
            es_medio_dia: permiso.medio_dia === 1,
            periodo_medio_dia: permiso.periodo_medio_dia,
            // afecta_sueldo = 0 significa CON goce, = 1 significa SIN goce
            con_goce_sueldo: permiso.afecta_sueldo === 0 ? 1 : 0
        }));

        res.json({
            success: true,
            permisos: permisosConDetalle,
            total: permisosConDetalle.length,
            rol: userType
        });

    } catch (error) {
        console.error('❌ Error obteniendo permisos del calendario:', error);
        res.status(500).json({ error: 'Error obteniendo permisos del calendario', details: error.message });
    }
});

/**
 * GET /api/equipo/subordinados
 * Obtener lista de subordinados de un supervisor
 */
router.get('/subordinados', verificarToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.type || req.user.tipo;

        console.log('👥 Obteniendo subordinados para:', { userId, userType });

        // Admin ve todos los empleados
        if (userType === 'admin') {
            const empleados = await query(`
                SELECT
                    id,
                    nombre,
                    rut,
                    cargo,
                    supervisor_id,
                    es_supervisor
                FROM empleados
                WHERE activo = 1
                ORDER BY nombre ASC
            `);

            return res.json({
                success: true,
                subordinados: empleados,
                total: empleados.length,
                es_admin: true
            });
        }

        // Empleado: verificar si es supervisor
        const empleado = await query('SELECT es_supervisor FROM empleados WHERE id = ?', [userId]);

        if (!empleado || empleado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        if (!empleado[0].es_supervisor) {
            return res.status(403).json({ error: 'No eres supervisor, no tienes subordinados' });
        }

        // Obtener subordinados
        const subordinados = await query(`
            SELECT
                id,
                nombre,
                rut,
                cargo,
                supervisor_id
            FROM empleados
            WHERE supervisor_id = ? AND activo = 1
            ORDER BY nombre ASC
        `, [userId]);

        res.json({
            success: true,
            subordinados,
            total: subordinados.length,
            es_supervisor: true
        });

    } catch (error) {
        console.error('❌ Error obteniendo subordinados:', error);
        res.status(500).json({ error: 'Error obteniendo subordinados', details: error.message });
    }
});

module.exports = router;
