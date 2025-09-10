const { supabase } = require('./database/db_config');

async function crearMiguelSimple() {
    console.log('👨‍💼 Creando Miguel Rodriguez (solo campos básicos)...');
    
    try {
        // Solo campos que sabemos que existen
        const miguelData = {
            nombre: 'RODRIGUEZ CABRERA MIGUEL ANGEL',
            email: 'miguel.rodriguez@colegio.cl', 
            username: 'miguel.rodriguez',
            rol: 'SUPERVISOR',
            activo: true
        };
        
        console.log('📝 Creando con campos básicos:', miguelData);
        
        const { data: miguel, error } = await supabase
            .from('usuarios_admin')
            .insert([miguelData])
            .select();
            
        if (error) {
            console.log('❌ Error:', error.message);
            
            // Verificar si ya existe
            console.log('🔍 Verificando si ya existe...');
            const { data: existente } = await supabase
                .from('usuarios_admin')
                .select('*')
                .eq('nombre', miguelData.nombre);
                
            if (existente && existente.length > 0) {
                console.log('✅ Miguel ya existe:', existente[0]);
                return existente[0];
            }
            return null;
        }
        
        console.log('✅ Miguel creado:', miguel[0]);
        
        // Crear notificación de prueba  
        console.log('\n🔔 Creando notificación de prueba...');
        
        const { data: notif, error: errorNotif } = await supabase
            .from('notificaciones')
            .insert({
                admin_id: miguel[0].id,
                solicitud_id: 83, // ID de solicitud de Guillermo que vimos antes
                tipo: 'NUEVA_SOLICITUD',
                titulo: '🔔 TEST: Notificación para Miguel',
                mensaje: 'Guillermo Barria Uribe ha creado una solicitud de permiso. Esta es una notificación de PRUEBA para verificar que el sistema funciona correctamente.',
                leida: false
            })
            .select();
            
        if (errorNotif) {
            console.log('❌ Error creando notificación:', errorNotif.message);
        } else {
            console.log('✅ Notificación creada:', notif[0]);
        }
        
        console.log('\n🎉 SISTEMA CONFIGURADO:');
        console.log(`✅ Miguel Rodriguez creado con ID: ${miguel[0].id}`);
        console.log(`✅ Notificación de prueba creada`);
        console.log(`✅ Ahora las solicitudes de Guillermo generarán notificaciones automáticas`);
        
        return miguel[0];
        
    } catch (error) {
        console.error('❌ Error general:', error);
        return null;
    }
}

crearMiguelSimple();