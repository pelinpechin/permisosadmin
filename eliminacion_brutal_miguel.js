const { supabase } = require('./database/db_config');

async function eliminacionBrutalMiguel() {
    console.log('💥 ELIMINACIÓN BRUTAL de permisos Miguel Rodriguez (ID 72)...');
    console.log('⚠️ Usando Supabase client directo para forzar eliminación');
    
    try {
        // 1. Usar Supabase client directo para DELETE
        console.log('\n🗑️ Paso 1: Eliminar TODOS los permisos con Supabase client...');
        const { data: deleteData, error: deleteError, count } = await supabase
            .from('solicitudes_permisos')
            .delete({ count: 'exact' })
            .eq('empleado_id', 72);
            
        if (deleteError) {
            console.error('❌ Error eliminando:', deleteError);
            throw deleteError;
        }
        
        console.log(`✅ Registros eliminados: ${count || 'operación completada'}`);
        
        // 2. Verificar que no queden permisos
        console.log('\n🔍 Paso 2: Verificar eliminación completa...');
        const { data: checkData, error: checkError } = await supabase
            .from('solicitudes_permisos')
            .select('id')
            .eq('empleado_id', 72);
            
        if (checkError) {
            console.error('❌ Error verificando:', checkError);
        } else {
            console.log(`📊 Permisos restantes: ${checkData?.length || 0}`);
            if (checkData?.length > 0) {
                console.log('⚠️ Aún quedan permisos - intentando eliminar uno por uno...');
                
                // Eliminar uno por uno si quedan
                for (const perm of checkData) {
                    const { error: delError } = await supabase
                        .from('solicitudes_permisos')
                        .delete()
                        .eq('id', perm.id)
                        .eq('empleado_id', 72);
                        
                    if (!delError) {
                        console.log(`   ✅ Eliminado ID ${perm.id}`);
                    }
                }
            }
        }
        
        // 3. Crear los 9 permisos correctos
        console.log('\n➕ Paso 3: Crear los 9 permisos correctos...');
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
                    fecha_desde: permiso.fecha,
                    fecha_hasta: permiso.fecha,
                    motivo: `Permiso administrativo ${permiso.tipo === 'C' ? 'cumpleaños' : 
                           permiso.tipo === 'T' ? 'jornada completa' : 'segunda media jornada'} (CSV histórico FINAL)`,
                    estado: 'APROBADO',
                    observaciones: 'Permiso histórico CSV - corrección definitiva con Supabase',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                
            if (insertError) {
                console.log(`   ❌ Error creando ${permiso.fecha}: ${insertError.message}`);
            } else {
                creados++;
                console.log(`   ✅ ${permiso.fecha} - ${permiso.tipo}`);
            }
        }
        
        console.log(`\n🎉 RESULTADO FINAL:`);
        console.log(`   - Permisos creados: ${creados}/9`);
        
        // 4. Verificación final
        console.log('\n✅ Paso 4: Verificación final...');
        const { data: finalData, error: finalError } = await supabase
            .from('solicitudes_permisos')
            .select('id, fecha_desde, estado')
            .eq('empleado_id', 72)
            .order('fecha_desde');
            
        if (finalError) {
            console.error('❌ Error en verificación final:', finalError);
        } else {
            console.log(`📊 Total permisos FINALES: ${finalData?.length || 0}`);
            if (finalData?.length === 9) {
                console.log('🎉 ¡ÉXITO! Miguel tiene exactamente 9 permisos');
                console.log('📊 Dashboard ahora mostrará: 9 Total, 9 Aprobadas, 0 Pendientes');
            } else {
                console.log(`⚠️ Problema: esperados 9, encontrados ${finalData?.length}`);
            }
        }
        
    } catch (error) {
        console.error('💥 Error en eliminación brutal:', error);
    }
}

eliminacionBrutalMiguel();