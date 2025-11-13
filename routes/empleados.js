const express = require('express');
const { query, get, run } = require('../database/db_config');
const jwt = require('jsonwebtoken');
const { sincronizarNombreEmpleado, verificarYCorregirInconsistencias } = require('../utils/sincronizarEmpleados');
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
    // Verificar si el usuario es admin por tipo o por rol
    const isAdmin = req.user.type === 'admin' ||
                    req.user.rol === 'admin' ||
                    req.user.rol === 'SUPER_ADMIN' ||
                    req.user.rol === 'administrador';

    if (!isAdmin) {
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
                visualizacion, autorizacion, negociacion_colectiva,
                permisos_primer_semestre, permisos_segundo_semestre,
                uso_primer_semestre, uso_segundo_semestre,
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
            visualizacion, autorizacion,
            // Campos alternativos del frontend
            apellidoPaterno, apellidoMaterno, fechaIngreso,
            negociacionColectiva
        } = req.body;

        // Construir nombre completo si viene separado
        const nombreCompleto = apellidoPaterno
            ? `${nombre} ${apellidoPaterno}${apellidoMaterno ? ' ' + apellidoMaterno : ''}`
            : nombre;

        // Generar número automáticamente si no viene
        let numeroEmpleado = numero;
        if (!numeroEmpleado) {
            // Buscar el número máximo existente para evitar duplicados
            const maxNumero = await query(`
                SELECT CAST(numero AS INTEGER) as num
                FROM empleados
                WHERE numero GLOB '[0-9]*'
                ORDER BY CAST(numero AS INTEGER) DESC
                LIMIT 1
            `);

            const siguienteNumero = maxNumero.length > 0 && maxNumero[0].num ? maxNumero[0].num + 1 : 1;
            numeroEmpleado = String(siguienteNumero).padStart(6, '0');
        }

        // Validaciones básicas
        if (!nombreCompleto || !rut || !cargo) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, RUT y cargo son campos obligatorios'
            });
        }

        // Verificar que no exista el RUT
        const existeEmpleado = await get(
            'SELECT id FROM empleados WHERE rut = ?',
            [rut]
        );

        if (existeEmpleado) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un empleado con ese RUT'
            });
        }

        // Usar negociacionColectiva o negociacion_colectiva
        const negCol = negociacionColectiva !== undefined ? negociacionColectiva : negociacion_colectiva;

        // Generar email genérico basado en RUT si no viene
        const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
        const emailGenerico = `${rutLimpio}@empresa.cl`;

        // Generar contraseña por defecto hasheada
        const bcrypt = require('bcryptjs');
        const defaultPassword = 'usuario123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const result = await run(`
            INSERT INTO empleados (
                numero, nombre, rut, fecha_nacimiento, cargo, negociacion_colectiva,
                visualizacion, autorizacion, email, password_hash, primer_login,
                email_verificado, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
        `, [
            numeroEmpleado, nombreCompleto, rut, fecha_nacimiento || fechaIngreso, cargo,
            negCol ? 1 : 0, visualizacion, autorizacion, emailGenerico, passwordHash
        ]);

        // Obtener el empleado recién creado para devolver todos los datos
        const empleadoCreado = await get('SELECT * FROM empleados WHERE id = ?', [result.lastID]);

        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente. Contraseña por defecto: usuario123',
            data: {
                id: result.lastID,
                numero: numeroEmpleado,
                defaultPassword: 'usuario123',
                empleado: empleadoCreado
            }
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
            numero,
            rut,
            nombre,
            fecha_nacimiento,
            cargo,
            negociacion_colectiva,
            visualizacion,
            autorizacion,
            uso_primer_semestre,
            uso_segundo_semestre,
            sin_goce,
            beneficio_licencia,
            licencias_total,
            atrasos,
            atrasos_justificados,
            no_marcaciones,
            activo
        } = req.body;

        // Validación de campos requeridos (solo los obligatorios según schema)
        if (!rut || !nombre || !cargo) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: rut, nombre y cargo son obligatorios'
            });
        }

        // Verificar que el empleado existe y obtener nombre anterior
        const empleadoExistente = await get(
            'SELECT id, numero, nombre FROM empleados WHERE id = ?',
            [id]
        );

        if (!empleadoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const nombreAnterior = empleadoExistente.nombre;

        // Verificar que no exista otro empleado con el mismo RUT
        const duplicado = await get(
            'SELECT id FROM empleados WHERE rut = ? AND id != ?',
            [rut, id]
        );

        if (duplicado) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otro empleado con ese RUT'
            });
        }

        // Si se proporciona un número diferente, verificar que no esté duplicado
        if (numero !== undefined && numero !== empleadoExistente.numero) {
            const numeroDuplicado = await get(
                'SELECT id FROM empleados WHERE numero = ? AND id != ?',
                [numero, id]
            );

            if (numeroDuplicado) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro empleado con ese número'
                });
            }
        }

        // Actualizar empleado con todos los campos del schema real
        await run(`
            UPDATE empleados SET
                numero = COALESCE(?, numero),
                nombre = ?,
                rut = ?,
                fecha_nacimiento = COALESCE(?, fecha_nacimiento),
                cargo = ?,
                negociacion_colectiva = COALESCE(?, negociacion_colectiva),
                visualizacion = COALESCE(?, visualizacion),
                autorizacion = COALESCE(?, autorizacion),
                uso_primer_semestre = COALESCE(?, uso_primer_semestre),
                uso_segundo_semestre = COALESCE(?, uso_segundo_semestre),
                sin_goce = COALESCE(?, sin_goce),
                beneficio_licencia = COALESCE(?, beneficio_licencia),
                licencias_total = COALESCE(?, licencias_total),
                atrasos = COALESCE(?, atrasos),
                atrasos_justificados = COALESCE(?, atrasos_justificados),
                no_marcaciones = COALESCE(?, no_marcaciones),
                activo = COALESCE(?, activo),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            numero,
            nombre,
            rut,
            fecha_nacimiento,
            cargo,
            negociacion_colectiva !== undefined ? (negociacion_colectiva ? 1 : 0) : null,
            visualizacion,
            autorizacion,
            uso_primer_semestre,
            uso_segundo_semestre,
            sin_goce,
            beneficio_licencia,
            licencias_total,
            atrasos,
            atrasos_justificados,
            no_marcaciones,
            activo !== undefined ? (activo ? 1 : 0) : null,
            id
        ]);

        // Sincronizar referencias si el nombre cambió
        if (nombre && nombre !== nombreAnterior) {
            console.log(`\n🔄 Nombre cambió de "${nombreAnterior}" a "${nombre}"`);
            console.log('   Sincronizando todas las referencias...');

            try {
                const resultadoSync = await sincronizarNombreEmpleado(id, nombreAnterior, nombre);
                console.log(`   ✅ Sincronización completada: ${resultadoSync.total} referencias actualizadas`);
            } catch (syncError) {
                console.error('   ⚠️ Error en sincronización (continúa la actualización):', syncError.message);
                // No fallar la actualización si falla la sincronización
            }
        }

        // Obtener el empleado actualizado para devolver la información completa
        const empleadoActualizado = await get(
            'SELECT * FROM empleados WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Empleado actualizado exitosamente',
            empleado: empleadoActualizado
        });

    } catch (error) {
        console.error('Error actualizando empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
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

// Eliminar empleado permanentemente (hard delete)
router.delete('/:id/permanent', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Intentando eliminar permanentemente empleado ID: ${id}`);

        // Verificar que el empleado exista y esté inactivo
        const empleado = await get('SELECT id, nombre, activo FROM empleados WHERE id = ?', [id]);

        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        if (empleado.activo === 1) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden eliminar empleados inactivos. Primero debe desactivar el empleado.'
            });
        }

        // VERIFICAR SI TIENE SOLICITUDES DE PERMISOS ASOCIADAS
        const solicitudes = await get(
            'SELECT COUNT(*) as total FROM solicitudes_permisos WHERE empleado_id = ?',
            [id]
        );

        if (solicitudes && solicitudes.total > 0) {
            console.log(`   ⚠️ El empleado "${empleado.nombre}" tiene ${solicitudes.total} solicitudes de permisos`);
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el empleado "${empleado.nombre}" porque tiene ${solicitudes.total} solicitud(es) de permisos asociadas. La eliminación causaría pérdida de información histórica.`,
                error: 'TIENE_SOLICITUDES',
                detalles: {
                    empleado: empleado.nombre,
                    solicitudes: solicitudes.total
                }
            });
        }

        // Verificar si hay notificaciones asociadas
        const notificaciones = await get(
            'SELECT COUNT(*) as total FROM notificaciones WHERE empleado_id = ?',
            [id]
        );

        if (notificaciones && notificaciones.total > 0) {
            console.log(`   ℹ️ Eliminando ${notificaciones.total} notificaciones asociadas...`);
            await run('DELETE FROM notificaciones WHERE empleado_id = ?', [id]);
        }

        // Si llegamos aquí, el empleado NO tiene solicitudes - es seguro eliminarlo
        console.log(`   ✅ Empleado "${empleado.nombre}" no tiene solicitudes - procediendo con eliminación`);

        const result = await run('DELETE FROM empleados WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        console.log(`   ✅ Empleado "${empleado.nombre}" eliminado permanentemente`);

        res.json({
            success: true,
            message: `Empleado "${empleado.nombre}" eliminado permanentemente`
        });

    } catch (error) {
        console.error('❌ Error eliminando empleado permanentemente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
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


// Sincronizar referencias de todos los empleados (endpoint manual para corrección masiva)
router.post('/sincronizar', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log('\n🔄 Iniciando sincronización manual del sistema...');

        const resultado = await verificarYCorregirInconsistencias();

        res.json({
            success: true,
            message: 'Sincronización completada',
            resultado: resultado
        });

    } catch (error) {
        console.error('Error sincronizando sistema:', error);
        res.status(500).json({
            success: false,
            message: 'Error al sincronizar el sistema',
            error: error.message
        });
    }
});

// Actualizar permisos de un empleado (endpoint específico para configuración)
router.put('/:id/permisos', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { permisos_primer_semestre, permisos_segundo_semestre } = req.body;

        // Validar que se proporcionaron los campos necesarios
        if (permisos_primer_semestre === undefined || permisos_segundo_semestre === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren permisos_primer_semestre y permisos_segundo_semestre'
            });
        }

        // Validar que sean números válidos
        const p1 = parseInt(permisos_primer_semestre);
        const p2 = parseInt(permisos_segundo_semestre);

        if (isNaN(p1) || isNaN(p2) || p1 < 0 || p2 < 0) {
            return res.status(400).json({
                success: false,
                message: 'Los permisos deben ser números enteros no negativos'
            });
        }

        // Verificar que el empleado existe
        const empleado = await get('SELECT id FROM empleados WHERE id = ?', [id]);

        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Actualizar solo los permisos
        await run(
            `UPDATE empleados
             SET permisos_primer_semestre = ?,
                 permisos_segundo_semestre = ?
             WHERE id = ?`,
            [p1, p2, id]
        );

        res.json({
            success: true,
            message: 'Permisos actualizados correctamente',
            data: {
                id: parseInt(id),
                permisos_primer_semestre: p1,
                permisos_segundo_semestre: p2
            }
        });

    } catch (error) {
        console.error('Error actualizando permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los permisos',
            error: error.message
        });
    }
});

module.exports = router;