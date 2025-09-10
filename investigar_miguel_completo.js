const { run } = require('./database/db_config');

async function investigarMiguelCompleto() {
    console.log('🔍 Investigando TODOS los permisos de Miguel Rodriguez (ID 72)...');
    
    try {
        // Intentar encontrar todos los permisos usando un rango muy amplio
        let permisosEncontrados = 0;
        let permisosDetalle = [];
        
        console.log('📊 Buscando permisos en un rango amplio (ID 1-500)...');
        
        for (let id = 1; id <= 500; id++) {
            try {
                const result = await run('UPDATE solicitudes_permisos SET updated_at = updated_at WHERE id = ? AND empleado_id = 72', [id]);
                if (result) {
                    permisosEncontrados++;
                    permisosDetalle.push(id);
                    if (permisosDetalle.length <= 10) {
                        console.log(`   ✅ Encontrado permiso ID: ${id}`);
                    } else if (permisosDetalle.length === 11) {
                        console.log(`   ... (mostrando solo los primeros 10)`);
                    }
                }
            } catch (error) {
                // El permiso no existe - normal
            }
        }
        
        console.log(`\n📊 RESULTADO COMPLETO:`);
        console.log(`   Total permisos encontrados: ${permisosEncontrados}`);
        console.log(`   Permisos esperados según CSV: 9`);
        
        if (permisosEncontrados > 9) {
            console.log(`\n⚠️ PROBLEMA: Miguel tiene ${permisosEncontrados - 9} permisos de MÁS`);
            console.log(`🔧 SOLUCIÓN: Necesitamos eliminar TODOS sus permisos y recrear solo los 9 correctos`);
            
            // Mostrar todos los IDs si no son demasiados
            if (permisosDetalle.length <= 50) {
                console.log(`\n🆔 IDs de permisos existentes:`);
                console.log(`   ${permisosDetalle.join(', ')}`);
            } else {
                console.log(`\n🆔 IDs (primeros 20): ${permisosDetalle.slice(0, 20).join(', ')}`);
                console.log(`   ... y ${permisosDetalle.length - 20} más`);
            }
        }
        
        // Verificar los rangos específicos
        console.log(`\n📋 Distribución por rangos:`);
        const rangos = [
            { nombre: '1-50', inicio: 1, fin: 50 },
            { nombre: '51-100', inicio: 51, fin: 100 },
            { nombre: '101-200', inicio: 101, fin: 200 },
            { nombre: '201-300', inicio: 201, fin: 300 },
            { nombre: '301-400', inicio: 301, fin: 400 },
            { nombre: '401-500', inicio: 401, fin: 500 }
        ];
        
        rangos.forEach(rango => {
            const enRango = permisosDetalle.filter(id => id >= rango.inicio && id <= rango.fin);
            if (enRango.length > 0) {
                console.log(`   ${rango.nombre}: ${enRango.length} permisos - IDs: ${enRango.join(', ')}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error investigando Miguel:', error);
    }
}

investigarMiguelCompleto();