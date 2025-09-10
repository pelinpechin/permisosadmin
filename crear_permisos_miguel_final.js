const { supabase } = require('./database/db_config');

async function crearPermisosMiguelFinal() {
    console.log('➕ Creando los 9 permisos FINALES de Miguel Rodriguez...');
    
    try {
        const permisosCorrectos = [
            { fecha: '2025-04-10', tipo_permiso_id: 3, tipo: 'PM' },
            { fecha: '2025-05-02', tipo_permiso_id: 1, tipo: 'T' },
            { fecha: '2025-05-08', tipo_permiso_id: 1, tipo: 'T' },
            { fecha: '2025-06-19', tipo_permiso_id: 3, tipo: 'PM' },
            { fecha: '2025-06-28', tipo_permiso_id: 10, tipo: 'C' },
            { fecha: '2025-07-24', tipo_permiso_id: 3, tipo: 'PM' },
            { fecha: '2025-08-05', tipo_permiso_id: 3, tipo: 'PM' },
            { fecha: '2025-08-12', tipo_permiso_id: 3, tipo: 'PM' },
            { fecha: '2025-08-25', tipo_permiso_id: 1, tipo: 'T' }
        ];
        
        let creados = 0;
        for (const permiso of permisosCorrectos) {
            const { data: insertData, error: insertError } = await supabase
                .from('solicitudes_permisos')
                .insert({
                    empleado_id: 72,
                    tipo_permiso_id: permiso.tipo_permiso_id,
                    fecha_solicitud: permiso.fecha, // ← AGREGADO el campo requerido
                    fecha_desde: permiso.fecha,
                    fecha_hasta: permiso.fecha,
                    motivo: `Permiso administrativo ${permiso.tipo === 'C' ? 'cumpleaños' : 
                           permiso.tipo === 'T' ? 'jornada completa' : 'segunda media jornada'} (CSV histórico FINAL)`,
                    estado: 'APROBADO',
                    observaciones: 'Permiso histórico CSV - corrección definitiva',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select();
                
            if (insertError) {
                console.log(`   ❌ Error creando ${permiso.fecha}: ${insertError.message}`);
            } else {
                creados++;
                console.log(`   ✅ ${permiso.fecha} - ${permiso.tipo} (ID: ${insertData[0]?.id})`);
            }
        }
        
        console.log(`\n📊 RESULTADO:`);
        console.log(`   - Permisos creados: ${creados}/9`);
        
        if (creados === 9) {
            console.log('\n🎉 ¡ÉXITO TOTAL! Miguel Rodriguez tiene exactamente 9 permisos');
            
            // Verificación final
            console.log('\n✅ Verificación final...');
            const { data: finalData, error: finalError } = await supabase
                .from('solicitudes_permisos')
                .select('id, fecha_desde, estado, tipo_permiso_id')
                .eq('empleado_id', 72)
                .order('fecha_desde');
                
            if (!finalError && finalData) {
                console.log(`📋 Permisos finales (${finalData.length}):`);
                finalData.forEach((p, i) => {
                    const tipoMap = {1: 'T', 2: 'AM', 3: 'PM', 10: 'C'};
                    console.log(`   ${i+1}. ${p.fecha_desde} - ${tipoMap[p.tipo_permiso_id]} - ${p.estado} (ID: ${p.id})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error creando permisos finales:', error);
    }
}

crearPermisosMiguelFinal();