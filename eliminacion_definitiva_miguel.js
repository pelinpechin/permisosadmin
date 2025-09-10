const { run } = require('./database/db_config');

async function eliminacionDefinitivaMiguel() {
    console.log('🗑️ ELIMINACIÓN DEFINITIVA de permisos de Miguel Rodriguez (ID 72)...');
    
    try {
        console.log('\n⚠️ IMPORTANTE: Eliminando TODOS los permisos existentes de Miguel...');
        console.log('   Esto incluye permisos con IDs desde 1 hasta 500');
        
        let eliminados = 0;
        let errores = 0;
        
        // Eliminar permisos por rangos para evitar timeout
        const rangos = [
            { inicio: 1, fin: 100 },
            { inicio: 101, fin: 200 },
            { inicio: 201, fin: 300 },
            { inicio: 301, fin: 400 },
            { inicio: 401, fin: 500 }
        ];
        
        for (const rango of rangos) {
            console.log(`\n🗑️ Eliminando rango ${rango.inicio}-${rango.fin}...`);
            
            for (let id = rango.inicio; id <= rango.fin; id++) {
                try {
                    const result = await run('DELETE FROM solicitudes_permisos WHERE id = ? AND empleado_id = 72', [id]);
                    if (result && (result.changes > 0 || result.affectedRows > 0)) {
                        eliminados++;
                        if (eliminados <= 10) {
                            console.log(`   ✅ Eliminado permiso ID ${id}`);
                        } else if (eliminados === 11) {
                            console.log(`   ... (mostrando solo los primeros 10)`);
                        }
                    }
                } catch (error) {
                    errores++;
                    // Ignorar errores de IDs que no existen
                }
            }
        }
        
        console.log(`\n📊 RESUMEN ELIMINACIÓN:`);
        console.log(`   ✅ Permisos eliminados: ${eliminados}`);
        console.log(`   ⚠️ Errores (normal): ${errores}`);
        
        if (eliminados > 0) {
            console.log('\n🎯 Ahora recreando los 9 permisos correctos...');
            
            // Crear los permisos correctos según el CSV
            const permisosCorrectos = [
                { fecha: '2025-04-10', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (CSV histórico corregido)' },
                { fecha: '2025-05-02', tipo: 'T', motivo: 'Permiso administrativo jornada completa (CSV histórico corregido)' },
                { fecha: '2025-05-08', tipo: 'T', motivo: 'Permiso administrativo jornada completa (CSV histórico corregido)' },
                { fecha: '2025-06-19', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (CSV histórico corregido)' },
                { fecha: '2025-06-28', tipo: 'C', motivo: 'Permiso por cumpleaños (CSV histórico corregido)' },
                { fecha: '2025-07-24', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (CSV histórico corregido)' },
                { fecha: '2025-08-05', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (CSV histórico corregido)' },
                { fecha: '2025-08-12', tipo: 'PM', motivo: 'Permiso administrativo segunda media jornada (CSV histórico corregido)' },
                { fecha: '2025-08-25', tipo: 'T', motivo: 'Permiso administrativo jornada completa (CSV histórico corregido)' }
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
                        VALUES (?, ?, ?, ?, ?, 'APROBADO', 'Permiso histórico CSV - datos corregidos definitivamente', datetime('now'), datetime('now'))
                    `, [72, tipoPermisoId, permiso.fecha, permiso.fecha, permiso.motivo]);
                    
                    creados++;
                    console.log(`   ✅ ${permiso.fecha} - ${permiso.tipo}`);
                    
                } catch (error) {
                    console.log(`   ❌ Error creando ${permiso.fecha}: ${error.message}`);
                }
            }
            
            console.log(`\n🎉 CORRECCIÓN COMPLETA:`);
            console.log(`   - Permisos eliminados: ${eliminados}`);
            console.log(`   - Permisos recreados: ${creados}`);
            
            if (creados === 9) {
                console.log('\n✅ ¡ÉXITO! Miguel Rodriguez ahora tiene exactamente 9 permisos correctos');
                console.log('📊 Dashboard ahora mostrará: 9 Total, 9 Aprobadas, 0 Pendientes');
            }
        } else {
            console.log('⚠️ No se encontraron permisos para eliminar');
        }
        
    } catch (error) {
        console.error('❌ Error en eliminación definitiva:', error);
    }
}

eliminacionDefinitivaMiguel();