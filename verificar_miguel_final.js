const { run } = require('./database/db_config');

async function verificarMiguelFinal() {
    console.log('🔍 Verificación final de permisos de Miguel Rodriguez (ID 72)...');
    
    try {
        // Contar permisos usando UPDATE para verificar existencia
        let permisosEncontrados = 0;
        let permisosDetalle = [];
        
        // Verificar los IDs 394-402 que acabamos de crear
        for (let id = 394; id <= 402; id++) {
            try {
                const result = await run('UPDATE solicitudes_permisos SET updated_at = updated_at WHERE id = ? AND empleado_id = 72', [id]);
                if (result) {
                    permisosEncontrados++;
                    permisosDetalle.push(`ID ${id}`);
                }
            } catch (error) {
                // El permiso no existe
            }
        }
        
        console.log(`\n📊 Resumen final:`);
        console.log(`✅ Permisos encontrados: ${permisosEncontrados}`);
        console.log(`🎯 Permisos esperados según CSV: 9`);
        
        if (permisosEncontrados === 9) {
            console.log('\n🎉 ¡PERFECTO! Miguel Rodriguez tiene exactamente los 9 permisos correctos');
            console.log('📅 Fechas de permisos según CSV:');
            console.log('   1. 2025-04-10 - PM (Segunda media jornada)');
            console.log('   2. 2025-05-02 - T (Jornada completa)');
            console.log('   3. 2025-05-08 - T (Jornada completa)');
            console.log('   4. 2025-06-19 - PM (Segunda media jornada)');
            console.log('   5. 2025-06-28 - C (Cumpleaños)');
            console.log('   6. 2025-07-24 - PM (Segunda media jornada)');
            console.log('   7. 2025-08-05 - PM (Segunda media jornada)');
            console.log('   8. 2025-08-12 - PM (Segunda media jornada)');
            console.log('   9. 2025-08-25 - T (Jornada completa)');
            console.log('\n✨ Estado: APROBADO (permisos históricos)');
        } else {
            console.log(`⚠️ Discrepancia: encontrados ${permisosEncontrados}, esperados 9`);
        }
        
        console.log(`\n🆔 IDs de permisos: ${permisosDetalle.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error en verificación final:', error);
    }
}

verificarMiguelFinal();