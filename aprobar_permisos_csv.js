const { run } = require('./database/db_config');

async function aprobarPermisosHistoricos() {
    console.log('🔄 Aprobando permisos históricos del CSV...');
    
    try {
        let aprobados = 0;
        
        // Aprobar permisos en un rango amplio de IDs
        for (let id = 34; id <= 300; id++) {
            try {
                const result = await run(
                    'UPDATE solicitudes_permisos SET estado = ? WHERE id = ? AND estado = ? AND observaciones LIKE ?',
                    ['APROBADO', id, 'PENDIENTE', '%CSV%']
                );
                
                if (result && result.length > 0) {
                    aprobados++;
                    if (aprobados % 10 === 0) {
                        console.log(`✅ Aprobados ${aprobados} permisos...`);
                    }
                }
            } catch (error) {
                // Ignorar errores de IDs que no existen
                if (!error.message.includes('null value') && !error.message.includes('not found')) {
                    console.log(`❌ Error en ID ${id}: ${error.message}`);
                }
            }
        }
        
        console.log(`🎉 Proceso completado: ${aprobados} permisos históricos aprobados`);
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

if (require.main === module) {
    aprobarPermisosHistoricos().then(() => process.exit(0));
}

module.exports = { aprobarPermisosHistoricos };