const { query } = require('./database/db_config');

async function testFinalDashboard() {
    console.log('🧪 Test FINAL del dashboard - Miguel Rodriguez (ID 72)...');
    
    try {
        // Usar la MISMA query que el dashboard API
        console.log('\n📊 Ejecutando query EXACTA del dashboard API...');
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
        
        console.log('\n📊 RESULTADO FINAL:');
        if (estadisticas && estadisticas.length > 0) {
            const stats = estadisticas[0];
            console.log(`   Total: ${stats.total}`);
            console.log(`   Pendientes: ${stats.pendientes}`);
            console.log(`   Aprobadas: ${stats.aprobadas}`);
            console.log(`   Rechazadas: ${stats.rechazadas}`);
            console.log(`   Canceladas: ${stats.canceladas || 0}`);
            
            console.log('\n🎯 INTERPRETACIÓN:');
            if (stats.total === 9 && stats.aprobadas === 9 && stats.pendientes === 0) {
                console.log('✅ ¡PERFECTO! Dashboard mostrará los valores correctos:');
                console.log('   📊 Total: 9 (correcto según CSV)');
                console.log('   ✅ Aprobadas: 9 (permisos históricos aprobados)');
                console.log('   ⏳ Pendientes: 0 (sin solicitudes pendientes)');
                console.log('   ❌ Rechazadas: 0 (sin rechazos)');
            } else {
                console.log(`⚠️ Valores inesperados - necesita más corrección`);
            }
        } else {
            console.log('❌ No se obtuvieron estadísticas');
        }
        
    } catch (error) {
        console.error('❌ Error en test final:', error);
    }
}

testFinalDashboard();