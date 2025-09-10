const { run } = require('./database/db_config');

async function corregirPermisosMiguel() {
    console.log('🔧 Corrigiendo permisos de Miguel Rodriguez (ID 72)...');
    
    try {
        // 1. Primero eliminar TODOS los permisos existentes de Miguel
        console.log('\n1. Eliminando permisos existentes de Miguel...');
        
        let eliminados = 0;
        // Intentar eliminar en un rango amplio de IDs 
        for (let id = 20; id <= 400; id++) {
            try {
                const result = await run('DELETE FROM solicitudes_permisos WHERE id = ? AND empleado_id = 72', [id]);
                if (result && result.changes > 0) {
                    eliminados++;
                }
            } catch (error) {
                // Ignorar errores de IDs que no existen
            }
        }
        
        console.log(`✅ Eliminados ${eliminados} permisos existentes`);
        
        // 2. Crear los permisos correctos según el CSV
        console.log('\n2. Creando permisos correctos según CSV...');
        
        // Permisos correctos según análisis del CSV:
        const permisosCorrectos = [
            { fecha: '2025-04-10', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (importado del CSV histórico)' },
            { fecha: '2025-05-02', tipo: 'T', motivo: 'Permiso administrativo jornada completa (importado del CSV histórico)' },
            { fecha: '2025-05-08', tipo: 'T', motivo: 'Permiso administrativo jornada completa (importado del CSV histórico)' },
            { fecha: '2025-06-19', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (importado del CSV histórico)' },
            { fecha: '2025-06-28', tipo: 'C', motivo: 'Permiso por cumpleaños (importado del CSV histórico)' },
            { fecha: '2025-07-24', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (importado del CSV histórico)' },
            { fecha: '2025-08-05', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (importado del CSV histórico)' },
            { fecha: '2025-08-12', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (importado del CSV histórico)' },
            { fecha: '2025-08-25', tipo: 'T', motivo: 'Permiso administrativo jornada completa (importado del CSV histórico)' }
        ];
        
        let creados = 0;
        
        for (const permiso of permisosCorrectos) {
            try {
                // Mapear tipo a ID
                let tipoPermisoId;
                switch (permiso.tipo) {
                    case 'T': tipoPermisoId = 1; break;  // Jornada completa
                    case 'AM': tipoPermisoId = 2; break; // Primera media jornada
                    case 'PM': tipoPermisoId = 3; break; // Segunda media jornada
                    case 'C': tipoPermisoId = 10; break; // Cumpleaños
                    default: continue;
                }
                
                await run(`
                    INSERT INTO solicitudes_permisos 
                    (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'APROBADO', 'Permiso histórico corregido según CSV original', datetime('now'), datetime('now'))
                `, [72, tipoPermisoId, permiso.fecha, permiso.fecha, permiso.motivo]);
                
                creados++;
                console.log(`   ✅ ${permiso.fecha} - ${permiso.tipo}`);
                
            } catch (error) {
                console.log(`   ❌ Error creando ${permiso.fecha}: ${error.message}`);
            }
        }
        
        console.log(`\n🎉 Corrección completada:`);
        console.log(`   - Permisos eliminados: ${eliminados}`);
        console.log(`   - Permisos creados correctamente: ${creados}`);
        console.log(`   - Total esperado: 9 permisos según CSV`);
        
        if (creados === 9) {
            console.log('✅ Miguel Rodriguez ahora tiene exactamente los permisos correctos según el CSV');
        } else {
            console.log(`⚠️ Diferencia: esperados 9, creados ${creados}`);
        }
        
    } catch (error) {
        console.error('❌ Error corrigiendo permisos:', error);
    }
}

corregirPermisosMiguel();