const { run } = require('./database/db_config');

async function aprobarPermisosHistoricosMiguel() {
    console.log('✅ Aprobando permisos históricos de Miguel Rodriguez (IDs 394-402)...');
    
    try {
        // Actualizar todos los permisos de Miguel a APROBADO
        const result = await run(`
            UPDATE solicitudes_permisos 
            SET estado = 'APROBADO', 
                observaciones = 'Permiso histórico corregido según CSV original',
                updated_at = datetime('now')
            WHERE empleado_id = 72 AND id >= 394 AND id <= 402
        `);
        
        console.log(`✅ Permisos históricos aprobados: ${result?.affectedRows || result?.changes || 'operación completada'}`);
        console.log('🎉 Miguel Rodriguez ahora tiene sus 9 permisos históricos correctamente aprobados');
        
    } catch (error) {
        console.error('❌ Error aprobando permisos históricos:', error);
    }
}

aprobarPermisosHistoricosMiguel();