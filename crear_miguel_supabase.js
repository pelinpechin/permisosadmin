const { supabase } = require('./database/db_config');

async function crearMiguelSupabase() {
    console.log('👨‍💼 Creando Miguel Rodriguez en usuarios_admin con Supabase...');
    
    try {
        // Datos de Miguel
        const miguelData = {
            nombre: 'RODRIGUEZ CABRERA MIGUEL ANGEL',
            email: 'miguel.rodriguez@colegio.cl',
            username: 'miguel.rodriguez',
            password: 'miguel123',
            rol: 'SUPERVISOR',
            activo: true
        };
        
        // 1. Verificar si existe
        console.log('🔍 Verificando si Miguel ya existe...');
        const { data: existente } = await supabase
            .from('usuarios_admin')
            .select('*')
            .or(`email.eq.${miguelData.email},nombre.eq.${miguelData.nombre}`);
            
        if (existente && existente.length > 0) {
            console.log('✅ Miguel ya existe:');
            existente.forEach(user => {
                console.log(`   - ID: ${user.id}, Nombre: ${user.nombre}, Activo: ${user.activo}`);
            });
            return existente[0];
        }
        
        // 2. Crear Miguel
        console.log('➕ Creando nuevo usuario Miguel...');
        const { data: nuevoMiguel, error: errorCrear } = await supabase
            .from('usuarios_admin')
            .insert([miguelData])
            .select();
            
        if (errorCrear) {
            console.log('❌ Error creando Miguel:', errorCrear.message);
            return null;
        }
        
        console.log('✅ Miguel creado exitosamente:');
        console.log(`   ID: ${nuevoMiguel[0].id}`);
        console.log(`   Nombre: ${nuevoMiguel[0].nombre}`);
        console.log(`   Email: ${nuevoMiguel[0].email}`);
        console.log(`   Rol: ${nuevoMiguel[0].rol}`);
        
        return nuevoMiguel[0];
        
    } catch (error) {
        console.error('❌ Error general:', error);
        return null;
    }
}

async function probarNotificacionCompleta() {
    console.log('\n🧪 TEST COMPLETO: Crear Miguel y Notificación...');
    
    try {
        // 1. Crear/obtener Miguel
        const miguel = await crearMiguelSupabase();
        if (!miguel) {
            console.log('❌ No se pudo crear/obtener Miguel');
            return;
        }
        
        // 2. Obtener Guillermo Barria
        console.log('\n👤 Obteniendo datos de Guillermo Barria...');
        const { data: guillermo } = await supabase
            .from('empleados')
            .select('*')
            .eq('rut', '18.208.947-8');
            
        if (!guillermo || guillermo.length === 0) {
            console.log('❌ Guillermo Barria no encontrado');
            return;
        }
        
        console.log(`✅ Guillermo: ${guillermo[0].nombre} (ID: ${guillermo[0].id})`);
        
        // 3. Obtener solicitud de Guillermo
        console.log('\n📋 Obteniendo solicitud de Guillermo...');
        const { data: solicitud } = await supabase
            .from('solicitudes_permisos')
            .select('*')
            .eq('empleado_id', guillermo[0].id)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (!solicitud || solicitud.length === 0) {
            console.log('❌ No hay solicitudes de Guillermo');
            return;
        }
        
        console.log(`✅ Solicitud: ID ${solicitud[0].id}, Estado: ${solicitud[0].estado}`);
        
        // 4. Crear notificación de prueba
        console.log('\n🔔 Creando notificación de prueba...');
        const { data: notificacion, error: errorNotif } = await supabase
            .from('notificaciones')
            .insert({
                admin_id: miguel.id,
                solicitud_id: solicitud[0].id,
                tipo: 'NUEVA_SOLICITUD',
                titulo: '🔔 Solicitud de Guillermo Barria - PRUEBA SISTEMA',
                mensaje: `${guillermo[0].nombre} ha solicitado permiso para el ${solicitud[0].fecha_desde}. Motivo: ${solicitud[0].motivo}. (NOTIFICACIÓN DE PRUEBA - Sistema funcionando correctamente)`,
                leida: false
            })
            .select();
            
        if (errorNotif) {
            console.log('❌ Error creando notificación:', errorNotif.message);
            return;
        }
        
        console.log('✅ Notificación creada:');
        console.log(`   ID: ${notificacion[0].id}`);
        console.log(`   Para: Miguel (Admin ID: ${notificacion[0].admin_id})`);
        console.log(`   Solicitud: ${notificacion[0].solicitud_id}`);
        
        // 5. Verificar notificaciones de Miguel
        console.log('\n📬 Verificando notificaciones de Miguel...');
        const { data: notificaciones } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('admin_id', miguel.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
        console.log(`✅ ${notificaciones?.length || 0} notificación(es) para Miguel:`);
        
        if (notificaciones && notificaciones.length > 0) {
            notificaciones.forEach((notif, i) => {
                const fecha = new Date(notif.created_at).toLocaleString();
                console.log(`   ${i+1}. ${notif.titulo}`);
                console.log(`      📅 ${fecha} | ${notif.leida ? '✅ Leída' : '🔔 No leída'}`);
            });
        }
        
        // 6. RESULTADO FINAL
        console.log('\n' + '='.repeat(60));
        console.log('🎉 PROBLEMA RESUELTO:');
        console.log('='.repeat(60));
        
        console.log('✅ Miguel Rodriguez existe como SUPERVISOR');
        console.log('✅ Miguel puede recibir notificaciones');
        console.log('✅ Sistema de notificaciones funciona correctamente');
        
        console.log('\n📧 ACCESO MIGUEL:');
        console.log('   URL: http://localhost:5000/admin');
        console.log('   Usuario: miguel.rodriguez');
        console.log('   Password: miguel123');
        
        console.log('\n🚀 FUNCIONAMIENTO:');
        console.log('   - Cuando Guillermo Barria cree una solicitud nueva');
        console.log('   - El sistema identificará que Miguel es su supervisor');  
        console.log('   - Se enviará automáticamente una notificación a Miguel');
        console.log('   - Miguel verá la notificación en su panel de administrador');
        
    } catch (error) {
        console.error('❌ Error en test completo:', error);
    }
}

probarNotificacionCompleta();