const { query, get, run } = require('./database/db_config');

async function testAdminDashboard() {
  console.log('🧪 Probando dashboard de admin (Miguel)...');
  
  try {
    // Esta es la query que está fallando según los logs
    console.log('📊 Probando estadísticas generales (problematica)...');
    
    const estadisticasGeneralesQuery = await query(`
        SELECT 
            (SELECT COUNT(*) FROM empleados WHERE activo = 1) as total_empleados,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'PENDIENTE') as solicitudes_pendientes,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE DATE(created_at) = DATE('now')) as solicitudes_hoy,
            (SELECT COUNT(*) FROM solicitudes_permisos WHERE estado = 'APROBADO' AND strftime('%Y-%m', fecha_desde) = strftime('%Y-%m', 'now')) as aprobadas_mes_actual
    `);
    
    console.log('✅ Estadísticas generales resultado:', estadisticasGeneralesQuery);
    console.log('📊 Primer elemento:', estadisticasGeneralesQuery[0]);
    
    if (estadisticasGeneralesQuery[0]) {
      console.log('🔍 Tipo de dato en [0]:', typeof estadisticasGeneralesQuery[0]);
      console.log('📋 Propiedades:', Object.keys(estadisticasGeneralesQuery[0]));
      
      if (typeof estadisticasGeneralesQuery[0] === 'object') {
        console.log('📈 total_empleados:', estadisticasGeneralesQuery[0].total_empleados);
        console.log('📈 solicitudes_pendientes:', estadisticasGeneralesQuery[0].solicitudes_pendientes);
      }
    }
    
    console.log('🎉 Test completado');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminDashboard();