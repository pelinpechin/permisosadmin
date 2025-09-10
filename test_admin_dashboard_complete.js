const { query, get, run } = require('./database/db_config');

async function testCompleteDashboard() {
  console.log('🧪 Probando dashboard admin completo...');
  
  try {
    console.log('1️⃣ Estadísticas generales...');
    const estadisticasGenerales = await query(`
        SELECT 
            (SELECT COUNT(*) FROM empleados WHERE activo = 1) as total_empleados,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'PENDIENTE') as solicitudes_pendientes,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE DATE(created_at) = DATE('now')) as solicitudes_hoy,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'APROBADO' AND strftime('%Y-%m', fecha_desde) = strftime('%Y-%m', 'now')) as aprobadas_mes_actual
    `);
    console.log('✅ Estadísticas generales:', estadisticasGenerales[0]);
    
    console.log('2️⃣ Solicitudes por estado...');
    const solicitudesPorEstado = await query(`
        SELECT 
            estado,
            COUNT(*) as cantidad
        FROM solicitudes_permisos
        WHERE strftime('%Y', created_at) = strftime('%Y', 'now')
        GROUP BY estado
    `);
    console.log('✅ Solicitudes por estado:', solicitudesPorEstado);
    
    console.log('3️⃣ Tipos de permisos más solicitados...');
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
    console.log('✅ Tipos populares:', tiposPermisosPopulares);
    
    console.log('4️⃣ Solicitudes por mes...');
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
    console.log('✅ Solicitudes por mes:', solicitudesPorMes.slice(0, 3));
    
    console.log('5️⃣ Empleados con más solicitudes...');
    const empleadosActivos = await query(`
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
    console.log('✅ Empleados activos:', empleadosActivos.slice(0, 3));
    
    console.log('6️⃣ Solicitudes recientes...');
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
    console.log('✅ Solicitudes recientes:', solicitudesRecientes);
    
    console.log('🎉 Dashboard completo funcionando!');
    
  } catch (error) {
    console.error('❌ Error en dashboard completo:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompleteDashboard();