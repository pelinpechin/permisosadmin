const { supabase } = require('./database/db_config');

async function investigarGuillermoBarria() {
    console.log('🔍 Investigando GUILLERMO BARRIA URIBE (el que tiene a Miguel como supervisor)...');
    
    try {
        // 1. Obtener datos específicos de Guillermo Barria
        const { data: guillermo, error: errorGuillermo } = await supabase
            .from('empleados')
            .select('*')
            .eq('rut', '18.208.947-8');
            
        if (errorGuillermo || !guillermo || guillermo.length === 0) {
            console.log('❌ No se encontró Guillermo Barria Uribe');
            return;
        }
        
        const guillermoData = guillermo[0];
        console.log('✅ Guillermo Barria encontrado:');
        console.log(`   ID: ${guillermoData.id}`);
        console.log(`   Nombre: ${guillermoData.nombre}`);
        console.log(`   RUT: ${guillermoData.rut}`);
        console.log(`   Supervisor: ${guillermoData.visualizacion}`);
        console.log(`   Autorizador: ${guillermoData.autorizacion}`);
        
        // 2. Verificar que Miguel Rodriguez es efectivamente su supervisor
        const esMiguelSupervisor = guillermoData.visualizacion && 
                                  guillermoData.visualizacion.toUpperCase().includes('MIGUEL');
        
        console.log(`\n👤 ¿Miguel es supervisor?: ${esMiguelSupervisor ? '✅ SÍ' : '❌ NO'}`);
        
        if (!esMiguelSupervisor) {
            console.log('❌ ERROR: Miguel NO es supervisor de este Guillermo');
            return;
        }
        
        // 3. Buscar Miguel en usuarios_admin
        const { data: miguelAdmin, error: errorMiguel } = await supabase
            .from('usuarios_admin')
            .select('*')
            .ilike('nombre', '%MIGUEL%')
            .eq('activo', true);
            
        console.log(`\n👨‍💼 Miguel en usuarios_admin:`);
        if (miguelAdmin && miguelAdmin.length > 0) {
            miguelAdmin.forEach(admin => {
                console.log(`   - ${admin.nombre} (ID: ${admin.id}) - Rol: ${admin.rol}`);
            });
        } else {
            console.log('❌ Miguel NO encontrado en usuarios_admin');
        }
        
        // 4. Buscar solicitudes de Guillermo Barria
        console.log(`\n📋 Buscando solicitudes de Guillermo Barria (ID ${guillermoData.id})...`);
        
        const { data: solicitudes, error: errorSolicitudes } = await supabase
            .from('solicitudes_permisos')
            .select(`
                *,
                tipos_permisos!inner(nombre, codigo)
            `)
            .eq('empleado_id', guillermoData.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (errorSolicitudes) {
            console.log('❌ Error buscando solicitudes:', errorSolicitudes.message);
            return;
        }
        
        if (!solicitudes || solicitudes.length === 0) {
            console.log('❌ No se encontraron solicitudes de Guillermo Barria');
            console.log('💡 Posible causa: Guillermo aún no ha hecho solicitudes');
            return;
        }
        
        console.log(`✅ Solicitudes encontradas (${solicitudes.length}):`);
        
        for (let i = 0; i < solicitudes.length; i++) {
            const sol = solicitudes[i];
            const fechaCreacion = new Date(sol.created_at).toLocaleString();
            
            console.log(`\n   ${i+1}. SOLICITUD ID: ${sol.id}`);
            console.log(`      Tipo: ${sol.tipos_permisos.nombre} (${sol.tipos_permisos.codigo})`);
            console.log(`      Estado: ${sol.estado}`);
            console.log(`      Fecha permiso: ${sol.fecha_desde}`);
            console.log(`      Creada: ${fechaCreacion}`);
            console.log(`      Motivo: ${sol.motivo?.substring(0, 80)}...`);
            
            // 5. Verificar notificaciones para esta solicitud
            console.log(`      🔔 Verificando notificaciones...`);
            
            const { data: notificaciones, error: errorNotif } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('solicitud_id', sol.id);
                
            if (errorNotif) {
                console.log(`         ❌ Error consultando notificaciones: ${errorNotif.message}`);
                continue;
            }
            
            if (!notificaciones || notificaciones.length === 0) {
                console.log(`         ❌ NO HAY NOTIFICACIONES para esta solicitud`);
                console.log(`         🔧 PROBLEMA: Sistema no generó notificación`);
            } else {
                console.log(`         ✅ ${notificaciones.length} notificación(es) encontrada(s):`);
                
                notificaciones.forEach((notif, idx) => {
                    console.log(`            ${idx+1}. Admin ID: ${notif.admin_id}`);
                    console.log(`               Tipo: ${notif.tipo}`);
                    console.log(`               Título: ${notif.titulo}`);
                    console.log(`               Leída: ${notif.leida ? 'Sí' : 'No'}`);
                    console.log(`               Creada: ${new Date(notif.created_at).toLocaleString()}`);
                    
                    // Verificar si la notificación fue para Miguel
                    if (miguelAdmin && miguelAdmin.length > 0) {
                        const esPsraMiguel = miguelAdmin.some(admin => admin.id === notif.admin_id);
                        console.log(`               ¿Es para Miguel?: ${esPsraMiguel ? '✅ SÍ' : '❌ NO'}`);
                    }
                });
            }
        }
        
        // 6. Resumen y diagnóstico
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 RESUMEN FINAL:');
        console.log(`${'='.repeat(60)}`);
        
        const solicitudesSinNotif = solicitudes.filter(async (sol) => {
            const { data } = await supabase
                .from('notificaciones')
                .select('id')
                .eq('solicitud_id', sol.id);
            return !data || data.length === 0;
        });
        
        console.log(`✅ Guillermo Barria Uribe encontrado (ID: ${guillermoData.id})`);
        console.log(`✅ Miguel SÍ es su supervisor: ${guillermoData.visualizacion}`);
        console.log(`✅ Miguel existe en usuarios_admin: ${miguelAdmin?.length || 0} cuenta(s)`);
        console.log(`📋 Total solicitudes de Guillermo: ${solicitudes.length}`);
        
        if (solicitudes.length > 0) {
            console.log(`\n💡 POSIBLES CAUSAS DE FALTA DE NOTIFICACIONES:`);
            console.log(`   1. Error en la función crearNotificacionSupervisor()`);
            console.log(`   2. Miguel no tiene el ID correcto en usuarios_admin`);
            console.log(`   3. Sistema no está ejecutando la función de notificaciones`);
            console.log(`   4. Error de base de datos al crear notificaciones`);
            
            console.log(`\n🔧 SIGUIENTE PASO:`);
            console.log(`   Revisar logs del servidor cuando Guillermo crea una solicitud`);
            console.log(`   Verificar que se ejecute crearNotificacionSupervisor()`);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

investigarGuillermoBarria();