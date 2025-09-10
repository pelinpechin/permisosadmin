const { query, run } = require('./database/db_config');

async function testDashboardGuillermo() {
  console.log('🧪 Probando dashboard de Guillermo...');
  
  try {
    // Simular los datos que llegan al dashboard
    const empleado = {
      id: 1,
      rut: '18.208.947-8',
      nombre: 'Barria Uribe Guillermo David'
    };
    
    console.log('🔍 Consultando empleado completo con ID:', empleado.id);
    
    // Esta es la línea que está fallando
    const empleadoCompleto = await query(
      `SELECT * FROM empleados WHERE id = ?`,
      [empleado.id]
    );
    
    console.log('✅ Empleado completo obtenido:', empleadoCompleto?.length > 0 ? 'SÍ' : 'NO');
    
    if (empleadoCompleto && empleadoCompleto.length > 0) {
      console.log('📊 Datos del empleado:', {
        nombre: empleadoCompleto[0].nombre,
        cargo: empleadoCompleto[0].cargo,
        supervisor: empleadoCompleto[0].supervisor
      });
      
      // Probar otras consultas del dashboard
      console.log('📈 Probando estadísticas...');
      
      const solicitudesStats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas
        FROM solicitudes_permisos 
        WHERE empleado_id = ?
      `, [empleado.id]);
      
      console.log('📊 Estadísticas:', solicitudesStats[0]);
      
      console.log('🎉 Dashboard test completado exitosamente');
    } else {
      console.log('❌ No se encontró empleado completo');
    }
    
  } catch (error) {
    console.error('❌ Error en test dashboard:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDashboardGuillermo();