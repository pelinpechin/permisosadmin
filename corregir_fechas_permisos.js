const { run } = require('./database/db_config');

async function corregirFechasPermisos() {
    console.log('🔧 Corrigiendo fechas de permisos históricos del CSV...');
    
    try {
        // Los permisos que ya se crearon pueden tener problemas de zona horaria
        // Vamos a actualizar las fechas para asegurar que sean correctas
        
        console.log('📅 Actualizando fechas para evitar problemas de zona horaria...');
        
        // Actualizar permisos que fueron creados desde CSV
        let permisosCorregidos = 0;
        
        for (let id = 25; id <= 500; id++) {
            try {
                // Para cada permiso del CSV, asegurar que la fecha esté en formato correcto
                // sin zona horaria para evitar conversiones UTC
                await run(`
                    UPDATE solicitudes_permisos 
                    SET 
                        fecha_desde = DATE(fecha_desde),
                        fecha_hasta = DATE(fecha_hasta),
                        updated_at = datetime('now')
                    WHERE id = ? AND observaciones LIKE '%CSV%'
                `, [id]);
                
                permisosCorregidos++;
                
                if (permisosCorregidos % 50 === 0) {
                    console.log(`✅ Procesados ${permisosCorregidos} permisos...`);
                }
                
            } catch (error) {
                // Ignorar errores de IDs que no existen
                if (!error.message.includes('null value') && !error.message.includes('not found')) {
                    console.log(`❌ Error en ID ${id}: ${error.message}`);
                }
            }
        }
        
        console.log(`🎉 Proceso completado: ${permisosCorregidos} fechas de permisos corregidas`);
        
        console.log('\n📋 Nota: Las fechas ahora deberían mostrarse correctamente sin diferencia de un día.');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

if (require.main === module) {
    corregirFechasPermisos().then(() => process.exit(0));
}

module.exports = { corregirFechasPermisos };