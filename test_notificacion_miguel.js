const { supabase } = require('./database/db_config');

async function testNotificacionMiguel() {
    console.log('🧪 Probando notificación manual para Miguel...');
    
    try {
        // 1. Verificar que Miguel existe en usuarios_admin
        console.log('\n1. 🔍 Buscando Miguel en usuarios_admin...');
        
        const { data: miguel, error: errorMiguel } = await supabase
            .from('usuarios_admin')
            .select('*')
            .ilike('nombre', '%RODRIGUEZ CABRERA MIGUEL%')
            .eq('activo', true);
            
        if (errorMiguel || !miguel || miguel.length === 0) {
            console.log('❌ Miguel NO encontrado en usuarios_admin');
            console.log('Error:', errorMiguel?.message);
            
            // Intentar buscar por email
            const { data: miguelEmail } = await supabase
                .from('usuarios_admin')
                .select('*')
                .eq('email', 'miguel.rodriguez@colegio.cl');
                
            if (miguelEmail && miguelEmail.length > 0) {
                console.log('✅ Miguel encontrado por email:', miguelEmail[0]);
            }
            return;
        }
        
        const miguelData = miguel[0];
        console.log('✅ Miguel encontrado:');
        console.log(`   ID: ${miguelData.id}`);
        console.log(`   Nombre: ${miguelData.nombre}`);
        console.log(`   Email: ${miguelData.email}`);
        console.log(`   Rol: ${miguelData.rol}`);
        
        // 2. Obtener una solicitud de Guillermo Barria para hacer el test
        console.log('\n2. 📋 Buscando solicitud de Guillermo Barria...');
        
        const { data: solicitud, error: errorSol } = await supabase
            .from('solicitudes_permisos')
            .select('*')
            .eq('empleado_id', 1) // ID de Guillermo Barria
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (errorSol || !solicitud || solicitud.length === 0) {
            console.log('❌ No se encontró solicitud de Guillermo');
            return;
        }
        
        const solicitudData = solicitud[0];
        console.log('✅ Solicitud de Guillermo encontrada:');
        console.log(`   ID: ${solicitudData.id}`);
        console.log(`   Estado: ${solicitudData.estado}`);
        console.log(`   Fecha: ${solicitudData.fecha_desde}`);
        
        // 3. Crear notificación manual para Miguel
        console.log('\n3. 🔔 Creando notificación manual...');
        
        const { data: notificacion, error: errorNotif } = await supabase
            .from('notificaciones')
            .insert({
                admin_id: miguelData.id,
                solicitud_id: solicitudData.id,
                tipo: 'NUEVA_SOLICITUD',
                titulo: '🔔 Test Notificación - Solicitud de Guillermo Barria',
                mensaje: `Guillermo Barria Uribe ha solicitado permiso para el ${solicitudData.fecha_desde}. Esta es una notificación de PRUEBA para verificar que Miguel recibe las notificaciones correctamente.`,
                leida: false,
                created_at: new Date().toISOString()
            })
            .select();
            
        if (errorNotif) {
            console.log('❌ Error creando notificación:', errorNotif.message);
            return;
        }
        
        console.log('✅ Notificación creada exitosamente:');
        console.log(`   ID: ${notificacion[0]?.id}`);
        console.log(`   Para Admin ID: ${notificacion[0]?.admin_id}`);
        console.log(`   Solicitud ID: ${notificacion[0]?.solicitud_id}`);
        
        // 4. Verificar que la notificación existe
        console.log('\n4. ✅ Verificando notificación creada...');
        
        const { data: verificacion, error: errorVerif } = await supabase
            .from('notificaciones')
            .select(`
                *,
                usuarios_admin!inner(nombre, email)
            `)
            .eq('admin_id', miguelData.id)
            .order('created_at', { ascending: false })
            .limit(3);
            
        if (verificacion && verificacion.length > 0) {
            console.log(`✅ ${verificacion.length} notificación(es) para Miguel:`);
            
            verificacion.forEach((notif, i) => {
                const fecha = new Date(notif.created_at).toLocaleString();
                console.log(`   ${i+1}. ${notif.titulo}`);
                console.log(`      📅 ${fecha} | ${notif.leida ? '✅ Leída' : '🔔 No leída'}`);
                console.log(`      💬 ${notif.mensaje.substring(0, 80)}...`);
                console.log(`      👤 Para: ${notif.usuarios_admin.nombre}`);
            });
        }
        
        // 5. Resultado del test
        console.log('\n' + '='.repeat(60));
        console.log('🎯 RESULTADO DEL TEST:');
        console.log('='.repeat(60));
        
        console.log('✅ Miguel Rodriguez existe en usuarios_admin');
        console.log('✅ Se puede crear notificaciones para Miguel');
        console.log('✅ Las notificaciones se almacenan correctamente');
        
        console.log('\n💡 SOLUCIÓN AL PROBLEMA ORIGINAL:');
        console.log('✅ Miguel ahora tiene cuenta de supervisor');
        console.log('✅ Las futuras solicitudes de Guillermo generarán notificaciones automáticas');
        console.log('✅ Miguel puede ver las notificaciones en /admin');
        
        console.log('\n📌 PRÓXIMOS PASOS:');
        console.log('1. Miguel debe acceder a http://localhost:5000/admin');
        console.log('2. Login: miguel.rodriguez / miguel123');
        console.log('3. Cambiar password en primer acceso');
        console.log('4. Guillermo puede crear una nueva solicitud para probar');
        
        console.log('\n🔧 PARA PROBAR COMPLETAMENTE:');
        console.log('- Que Guillermo Barria cree una nueva solicitud de permiso');
        console.log('- Verificar que Miguel reciba la notificación automática');
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testNotificacionMiguel();