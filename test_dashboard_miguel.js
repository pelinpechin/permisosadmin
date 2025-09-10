const { query } = require('./database/db_config');

async function testDashboardMiguel() {
    console.log('🧪 Probando dashboard de Miguel Rodriguez (ID 72)...');
    
    try {
        // Obtener estadísticas igual que en el API
        console.log('\n1. Obteniendo estadísticas de solicitudes...');
        const estadisticas = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobadas,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazadas,
                SUM(CASE WHEN estado = 'CANCELADO' THEN 1 ELSE 0 END) as canceladas
            FROM solicitudes_permisos 
            WHERE empleado_id = ?
        `, [72]);
        
        console.log('📊 Estadísticas obtenidas:', estadisticas[0]);
        
        // Obtener datos del empleado
        console.log('\n2. Obteniendo datos del empleado...');
        const empleado = await query('SELECT * FROM empleados WHERE id = ?', [72]);
        console.log('👤 Empleado:', empleado[0]?.nombre || 'No encontrado');
        
        // Obtener solicitudes recientes
        console.log('\n3. Obteniendo solicitudes recientes...');
        const solicitudesRecientes = await query(`
            SELECT sp.*, tp.nombre as tipo_nombre, sp.estado, sp.fecha_desde
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id = ?
            ORDER BY sp.created_at DESC
            LIMIT 5
        `, [72]);
        
        console.log(`📋 Solicitudes recientes (${solicitudesRecientes?.length || 0}):`);
        if (solicitudesRecientes?.length > 0) {
            solicitudesRecientes.forEach((sol, i) => {
                console.log(`   ${i + 1}. ${sol.fecha_desde} - ${sol.tipo_nombre} - ${sol.estado}`);
            });
        }
        
        // Mostrar como se vería en el dashboard
        console.log('\n🎯 Como aparecería en el dashboard:');
        console.log(`   Total: ${estadisticas[0]?.total || 0}`);
        console.log(`   Pendientes: ${estadisticas[0]?.pendientes || 0}`);
        console.log(`   Aprobadas: ${estadisticas[0]?.aprobadas || 0}`);
        console.log(`   Rechazadas: ${estadisticas[0]?.rechazadas || 0}`);
        
    } catch (error) {
        console.error('❌ Error testando dashboard:', error);
    }
}

testDashboardMiguel();