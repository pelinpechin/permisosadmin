const express = require('express');
const jwt = require('jsonwebtoken');
const { query, run } = require('../database/db_config');

const router = express.Router();

// Middleware para verificar token de admin
function verificarTokenAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_super_seguro_2024');
        
        // Verificar que sea admin
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

// GET /api/admin/permisos - Obtener todos los permisos
router.get('/permisos', verificarTokenAdmin, async (req, res) => {
    try {
        console.log('📋 Admin solicitando todos los permisos...');
        
        const { estado } = req.query;
        
        let sql = `
            SELECT 
                sp.*,
                e.nombre as empleado_nombre,
                tp.nombre as tipo_permiso_nombre
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (estado) {
            sql += ' AND sp.estado = ?';
            params.push(estado);
        }
        
        sql += ' ORDER BY sp.created_at DESC';
        
        console.log('🔍 Ejecutando consulta admin permisos:', sql);
        const permisos = await query(sql, params);
        
        console.log(`✅ Se encontraron ${permisos.length} permisos para admin`);
        
        res.json(permisos);
        
    } catch (error) {
        console.error('❌ Error obteniendo permisos para admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/admin/permisos/:id - Actualizar estado de un permiso
router.put('/permisos/:id', verificarTokenAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        
        console.log(`🔄 Admin actualizando permiso ${id} a estado ${estado}`);
        console.log(`📝 Parámetros recibidos:`, {
            id: id,
            id_type: typeof id,
            id_parsed: parseInt(id),
            estado: estado,
            estado_type: typeof estado,
            observaciones: observaciones,
            observaciones_type: typeof observaciones,
            observaciones_processed: observaciones || null
        });
        
        // Validar estado
        if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        
        // Actualizar en la base de datos
        const sql = `
            UPDATE solicitudes_permisos 
            SET estado = ?, observaciones = ?
            WHERE id = ?
        `;
        
        await run(sql, [estado, observaciones || null, parseInt(id)]);
        
        console.log(`✅ Permiso ${id} actualizado a ${estado}`);
        
        // Si el permiso es aprobado, actualizar el contador del empleado
        if (estado === 'APROBADO') {
            try {
                // Obtener información del permiso aprobado
                const permisoInfo = await query(`
                    SELECT sp.empleado_id, sp.fecha_desde, tp.codigo
                    FROM solicitudes_permisos sp
                    LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
                    WHERE sp.id = ?
                `, [parseInt(id)]);
                
                if (permisoInfo && permisoInfo.length > 0) {
                    const { empleado_id, fecha_desde, codigo } = permisoInfo[0];
                    
                    // Determinar qué semestre corresponde
                    const fechaPermiso = new Date(fecha_desde);
                    const mes = fechaPermiso.getMonth() + 1; // 1-12
                    const esPrimerSemestre = mes <= 6;
                    
                    // Determinar el incremento basado en el tipo de permiso
                    // Solo los permisos administrativos (T, AM, PM) cuentan para los límites
                    let incremento = 0; // Por defecto, no cuenta
                    if (codigo === 'T') {
                        incremento = 1.0; // Día completo administrativo
                    } else if (codigo === 'AM' || codigo === 'PM') {
                        incremento = 0.5; // Media jornada administrativa
                    } else if (codigo === 'C') {
                        incremento = 0; // Cumpleaños no cuenta
                        console.log(`🎂 Permiso de cumpleaños aprobado - NO cuenta en límites`);
                    }
                    
                    // Actualizar el contador correspondiente
                    const campoSemestre = esPrimerSemestre ? 'uso_primer_semestre' : 'uso_segundo_semestre';
                    
                    console.log(`📊 Actualizando contador: empleado ${empleado_id}, ${campoSemestre} +${incremento} (${codigo})`);
                    
                    await run(`
                        UPDATE empleados 
                        SET ${campoSemestre} = COALESCE(${campoSemestre}, 0) + ?
                        WHERE id = ?
                    `, [incremento, empleado_id]);
                    
                    console.log(`✅ Contador actualizado: ${campoSemestre} +${incremento}`);
                } else {
                    console.warn('⚠️ No se encontró información del permiso para actualizar contador');
                }
            } catch (counterError) {
                console.error('❌ Error actualizando contador del empleado:', counterError);
                // No fallar la respuesta por este error
            }
        }
        
        // TODO: Aquí se podría enviar notificación al empleado
        
        res.json({ 
            success: true, 
            message: `Permiso ${estado.toLowerCase()} exitosamente` 
        });
        
    } catch (error) {
        console.error('❌ Error actualizando permiso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/admin/empleados/:id/negociacion-colectiva - Cambiar estado de negociación colectiva de un empleado
router.put('/empleados/:id/negociacion-colectiva', verificarTokenAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { negociacion_colectiva } = req.body;
        
        console.log(`🔄 Admin cambiando negociación colectiva del empleado ${id} a ${negociacion_colectiva}`);
        
        // Validar que negociacion_colectiva sea booleano o 0/1
        if (negociacion_colectiva === undefined || negociacion_colectiva === null) {
            return res.status(400).json({ error: 'El campo negociacion_colectiva es requerido' });
        }
        
        const negociacionColectivaValue = negociacion_colectiva === true || negociacion_colectiva === 1 || negociacion_colectiva === '1' ? 1 : 0;
        
        // Verificar que el empleado existe
        const empleado = await query('SELECT * FROM empleados WHERE id = ?', [parseInt(id)]);
        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const empleadoActual = empleado[0];
        console.log(`👤 Empleado: ${empleadoActual.nombre}, negociación actual: ${empleadoActual.negociacion_colectiva}, nueva: ${negociacionColectivaValue}`);
        
        // Actualizar el estado de negociación colectiva
        await run(`
            UPDATE empleados 
            SET negociacion_colectiva = ?
            WHERE id = ?
        `, [negociacionColectivaValue, parseInt(id)]);
        
        console.log(`✅ Negociación colectiva del empleado ${empleadoActual.nombre} actualizada a ${negociacionColectivaValue ? 'SÍ' : 'NO'}`);
        
        res.json({ 
            success: true, 
            message: `Estado de negociación colectiva actualizado exitosamente para ${empleadoActual.nombre}`,
            empleado: {
                id: empleadoActual.id,
                nombre: empleadoActual.nombre,
                negociacion_colectiva: negociacionColectivaValue
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando negociación colectiva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/admin/empleados - Obtener lista de empleados para gestión
router.get('/empleados', verificarTokenAdmin, async (req, res) => {
    try {
        console.log('📋 Admin solicitando lista de empleados...');
        
        const empleados = await query(`
            SELECT 
                id, nombre, rut, email, cargo, 
                negociacion_colectiva, activo,
                uso_primer_semestre, uso_segundo_semestre,
                supervisor, visualizacion, autorizacion
            FROM empleados 
            WHERE activo = 1
            ORDER BY nombre
        `);
        
        console.log(`✅ Se encontraron ${empleados.length} empleados activos`);
        
        res.json(empleados);
        
    } catch (error) {
        console.error('❌ Error obteniendo empleados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/admin/estadisticas - Estadísticas básicas para admin
router.get('/estadisticas', verificarTokenAdmin, async (req, res) => {
    try {
        console.log('📊 Admin solicitando estadísticas...');
        
        const estadisticas = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados
            FROM solicitudes_permisos
        `);
        
        const empleadosActivos = await query(`
            SELECT COUNT(*) as total FROM empleados WHERE activo = 1
        `);
        
        res.json({
            permisos: estadisticas[0],
            empleados: empleadosActivos[0].total
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/admin/anular/:id - Anular una solicitud de permiso
router.put('/anular/:id', verificarTokenAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        console.log(`🔴 Anulando solicitud ID ${id}, motivo:`, motivo);

        // Verificar que la solicitud existe
        const solicitud = await query('SELECT * FROM solicitudes_permisos WHERE id = ?', [id]);

        if (!solicitud || solicitud.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        // Anular la solicitud
        await run(`
            UPDATE solicitudes_permisos SET
                estado = 'ANULADO',
                fecha_anulacion = NOW(),
                rechazado_motivo = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [motivo || 'Anulado por administrador', id]);

        console.log(`✅ Solicitud ${id} anulada exitosamente`);

        res.json({
            success: true,
            message: 'Solicitud anulada exitosamente'
        });
    } catch (error) {
        console.error('💥 Error anulando solicitud:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
});

module.exports = router;