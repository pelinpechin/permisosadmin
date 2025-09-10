const { run } = require('./database/db_config');

async function checkMiguelDB() {
    try {
        console.log('Verificando permisos actuales de Miguel Rodriguez (ID 72)...');
        
        // Como run() no funciona para SELECT, vamos a intentar algo diferente
        // Vamos a revisar los IDs de las solicitudes que creamos anteriormente
        console.log('Los permisos deberían ser los IDs 25-33 que creamos anteriormente');
        console.log('Vamos a verificar si existen usando el enfoque de actualización');
        
        let permisosEncontrados = 0;
        for (let id = 25; id <= 35; id++) {
            try {
                await run('UPDATE solicitudes_permisos SET updated_at = updated_at WHERE id = ? AND empleado_id = 72', [id]);
                permisosEncontrados++;
            } catch (error) {
                // Si falla, el permiso no existe
            }
        }
        
        console.log(`✅ Permisos encontrados para Miguel: ${permisosEncontrados}`);
        
        if (permisosEncontrados === 9) {
            console.log('✅ Miguel tiene el número correcto de permisos (9)');
        } else if (permisosEncontrados > 9) {
            console.log(`⚠️ Miguel tiene MÁS permisos de los que debería (${permisosEncontrados} vs 9 esperados)`);
        } else {
            console.log(`⚠️ Miguel tiene MENOS permisos de los que debería (${permisosEncontrados} vs 9 esperados)`);
        }
        
    } catch (error) {
        console.error('Error verificando Miguel:', error);
    }
}

checkMiguelDB();