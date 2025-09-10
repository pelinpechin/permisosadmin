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

// Obtener todos los empleados
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', cargo = '', activo = '' } = req.query;
        
        let sql = `
            SELECT 
                id, numero, nombre, rut, fecha_nacimiento, cargo, 
                negociacion_colectiva, uso_primer_semestre, uso_segundo_semestre,
                sin_goce, beneficio_licencia, licencias_total, atrasos, 
                atrasos_justificados, no_marcaciones, activo, created_at
            FROM empleados 
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            sql += ' AND (nombre LIKE ? OR rut LIKE ? OR cargo LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (cargo) {
            sql += ' AND cargo = ?';
            params.push(cargo);
        }
        
        if (activo !== '') {
            sql += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }
        
        sql += ' ORDER BY nombre ASC';
        
        // Paginación
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        
        const empleados = await query(sql, params);
        
        // Contar total para paginación
        let countSql = 'SELECT COUNT(*) as total FROM empleados WHERE 1=1';
        const countParams = [];
        
        if (search) {
            countSql += ' AND (nombre LIKE ? OR rut LIKE ? OR cargo LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (cargo) {
            countSql += ' AND cargo = ?';
            countParams.push(cargo);
        }
        
        if (activo !== '') {
            countSql += ' AND activo = ?';
            countParams.push(activo === 'true' ? 1 : 0);
        }
        
        const countResult = await get(countSql, countParams);
        const total = countResult.total;
        
        res.json({
            success: true,
            data: {
                empleados,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo empleados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener empleados con información de permisos (DEBE ir ANTES de /:id)
router.get('/con-permisos', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const empleados = await query(`
            SELECT 
                e.id,
                e.nombre,
                e.rut,
                e.cargo,
                e.visualizacion,
                e.autorizacion,
                COUNT(sp.id) as total_permisos,
                COUNT(CASE WHEN sp.estado = 'PENDIENTE' THEN 1 END) as pendientes,
                COUNT(CASE WHEN sp.estado = 'APROBADO' THEN 1 END) as aprobados,
                COUNT(CASE WHEN sp.estado = 'RECHAZADO' THEN 1 END) as rechazados
            FROM empleados e
            LEFT JOIN solicitudes_permisos sp ON e.id = sp.empleado_id
            WHERE e.activo = 1
            GROUP BY e.id, e.nombre, e.rut, e.cargo, e.visualizacion, e.autorizacion
            ORDER BY e.nombre ASC
        `);

        // Obtener permisos recientes para cada empleado
        for (let empleado of empleados) {
            const permisosRecientes = await query(`
                SELECT 
                    sp.id,
                    sp.fecha_desde,
                    sp.estado,
                    tp.nombre as tipo_permiso,
                    tp.codigo,
                    tp.color_hex
                FROM solicitudes_permisos sp
                LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
                WHERE sp.empleado_id = ?
                ORDER BY sp.created_at DESC
                LIMIT 3
            `, [empleado.id]);
            
            empleado.permisos_recientes = permisosRecientes;
        }

        res.json({
            success: true,
            data: empleados
        });
        
    } catch (error) {
        console.error('Error obteniendo empleados con permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener permisos específicos de un empleado (DEBE ir ANTES de /:id)
router.get('/:id/permisos', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const empleadoId = req.params.id;

        // Obtener información del empleado
        const empleado = await get(`
            SELECT 
                id, nombre, rut, cargo, visualizacion, autorizacion,
                uso_primer_semestre, uso_segundo_semestre
            FROM empleados 
            WHERE id = ? AND activo = 1
        `, [empleadoId]);

        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Obtener estadísticas de permisos
        const estadisticas = await get(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobados,
                COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazados
            FROM solicitudes_permisos
            WHERE empleado_id = ?
        `, [empleadoId]);

        // Obtener todos los permisos del empleado
        const permisos = await query(`
            SELECT 
                sp.id,
                sp.fecha_desde,
                sp.fecha_hasta,
                sp.motivo,
                sp.estado,
                sp.created_at,
                sp.fecha_aprobacion,
                tp.nombre as tipo_permiso_nombre,
                tp.codigo as tipo_permiso_codigo,
                tp.color_hex as tipo_permiso_color,
                ua.nombre as aprobado_por,
                sp.rechazado_motivo
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id
            WHERE sp.empleado_id = ?
            ORDER BY sp.created_at DESC
        `, [empleadoId]);

        res.json({
            success: true,
            data: {
                empleado,
                estadisticas: estadisticas || { total: 0, pendientes: 0, aprobados: 0, rechazados: 0 },
                permisos
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo permisos del empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener empleado por ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Los empleados solo pueden ver su propia información
        if (req.user.type === 'empleado' && req.user.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes acceder a tu propia información'
            });
        }
        
        const empleado = await get(
            'SELECT * FROM empleados WHERE id = ? AND activo = 1',
            [id]
        );
        
        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: empleado
        });
        
    } catch (error) {
        console.error('Error obteniendo empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo empleado
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const {
            numero, nombre, rut, fecha_nacimiento, cargo, negociacion_colectiva,
            visualizacion, autorizacion
        } = req.body;
        
        // Validaciones básicas
        if (!numero || !nombre || !rut || !cargo) {
            return res.status(400).json({
                success: false,
                message: 'Número, nombre, RUT y cargo son campos obligatorios'
            });
        }
        
        // Verificar que no exista el número o RUT
        const existeEmpleado = await get(
            'SELECT id FROM empleados WHERE numero = ? OR rut = ?',
            [numero, rut]
        );
        
        if (existeEmpleado) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un empleado con ese número o RUT'
            });
        }
        
        const result = await run(`
            INSERT INTO empleados (
                numero, nombre, rut, fecha_nacimiento, cargo, negociacion_colectiva,
                visualizacion, autorizacion, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            numero, nombre, rut, fecha_nacimiento, cargo, 
            negociacion_colectiva ? 1 : 0, visualizacion, autorizacion
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente',
            data: { id: result.id }
        });
        
    } catch (error) {
        console.error('Error creando empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar empleado
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numero, nombre, rut, fecha_nacimiento, cargo, negociacion_colectiva,
            visualizacion, autorizacion, uso_primer_semestre, uso_segundo_semestre,
            sin_goce, beneficio_licencia, licencias_total, atrasos, 
            atrasos_justificados, no_marcaciones, activo
        } = req.body;
        
        // Verificar que el empleado existe
        const empleadoExistente = await get(
            'SELECT id FROM empleados WHERE id = ?',
            [id]
        );
        
        if (!empleadoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        // Verificar que no exista otro empleado con el mismo número o RUT
        const duplicado = await get(
            'SELECT id FROM empleados WHERE (numero = ? OR rut = ?) AND id != ?',
            [numero, rut, id]
        );
        
        if (duplicado) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otro empleado con ese número o RUT'
            });
        }
        
        await run(`
            UPDATE empleados SET
                numero = ?, nombre = ?, rut = ?, fecha_nacimiento = ?, cargo = ?,
                negociacion_colectiva = ?, visualizacion = ?, autorizacion = ?,
                uso_primer_semestre = ?, uso_segundo_semestre = ?, sin_goce = ?,
                beneficio_licencia = ?, licencias_total = ?, atrasos = ?,
                atrasos_justificados = ?, no_marcaciones = ?, activo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            numero, nombre, rut, fecha_nacimiento, cargo,
            negociacion_colectiva ? 1 : 0, visualizacion, autorizacion,
            uso_primer_semestre || 0, uso_segundo_semestre || 0, sin_goce || 0,
            beneficio_licencia || 0, licencias_total || 0, atrasos || 0,
            atrasos_justificados || 0, no_marcaciones || 0, activo !== false ? 1 : 0,
            id
        ]);
        
        res.json({
            success: true,
            message: 'Empleado actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error actualizando empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Desactivar empleado (soft delete)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await run(
            'UPDATE empleados SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Empleado desactivado exitosamente'
        });
        
    } catch (error) {
        console.error('Error desactivando empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener cargos únicos
router.get('/data/cargos', verifyToken, async (req, res) => {
    try {
        const cargos = await query(
            'SELECT DISTINCT cargo FROM empleados WHERE activo = 1 ORDER BY cargo'
        );
        
        res.json({
            success: true,
            data: cargos.map(c => c.cargo)
        });
        
    } catch (error) {
        console.error('Error obteniendo cargos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Estadísticas de empleados
router.get('/data/estadisticas', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_empleados,
                COUNT(CASE WHEN activo = 1 THEN 1 END) as activos,
                COUNT(CASE WHEN activo = 0 THEN 1 END) as inactivos,
                COUNT(CASE WHEN negociacion_colectiva = 1 THEN 1 END) as con_negociacion,
                AVG(uso_primer_semestre + uso_segundo_semestre) as promedio_permisos_usados,
                SUM(atrasos) as total_atrasos,
                SUM(no_marcaciones) as total_no_marcaciones
            FROM empleados
        `);
        
        const porCargo = await query(`
            SELECT 
                cargo,
                COUNT(*) as cantidad,
                AVG(uso_primer_semestre + uso_segundo_semestre) as promedio_permisos
            FROM empleados 
            WHERE activo = 1 
            GROUP BY cargo 
            ORDER BY cantidad DESC
        `);
        
        res.json({
            success: true,
            data: {
                general: stats[0],
                por_cargo: porCargo
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


module.exports = router;