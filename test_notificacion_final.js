const { supabase } = require('./database/db_config');

async function testNotificacionCompleta() {
  console.log('🧪 Probando sistema de notificaciones completo...');
  
  try {
    // 1. Obtener datos de Guillermo Barria
    const { data: guillermo, error: errorGuillermo } = await supabase
      .from('empleados')
      .select('*')
      .eq('rut', '18.208.947-8')
      .single();
    
    if (errorGuillermo || !guillermo) {
      console.log('❌ Error obteniendo datos de Guillermo:', errorGuillermo?.message);
      return;
    }
    
    console.log('👤 Empleado:', guillermo.nombre);
    console.log('📊 Supervisor (visualización):', guillermo.visualizacion);
    
    // 2. Verificar que Miguel existe como admin
    const { data: miguel, error: errorMiguel } = await supabase
      .from('usuarios_admin')
      .select('*')
      .eq('nombre', 'RODRIGUEZ CABRERA MIGUEL ANGEL')
      .single();
    
    if (errorMiguel || !miguel) {
      console.log('❌ Error obteniendo Miguel como admin:', errorMiguel?.message);
      return;
    }
    
    console.log('👨‍💼 Admin encontrado:', miguel.nombre, '- Rol:', miguel.rol);
    
    // 3. Obtener tipo de permiso
    const { data: tipoPermiso, error: errorTipo } = await supabase
      .from('tipos_permisos')
      .select('*')
      .eq('codigo', 'T')
      .single();
    
    if (errorTipo || !tipoPermiso) {
      console.log('❌ Error obteniendo tipo de permiso:', errorTipo?.message);
      return;
    }
    
    // 4. Crear solicitud como Guillermo
    const { data: solicitud, error: errorSolicitud } = await supabase
      .from('solicitudes_permisos')
      .insert({
        empleado_id: guillermo.id,
        tipo_permiso_id: tipoPermiso.id,
        fecha_solicitud: '2025-09-08',
        fecha_desde: '2025-09-15',
        fecha_hasta: '2025-09-15',
        motivo: 'Prueba de notificaciones - Asunto personal',
        observaciones: 'Prueba del sistema de notificaciones para Miguel',
        estado: 'PENDIENTE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (errorSolicitud) {
      console.log('❌ Error creando solicitud:', errorSolicitud.message);
      return;
    }
    
    console.log('✅ Solicitud creada con ID:', solicitud.id);
    
    // 5. Crear notificación para Miguel
    const { data: notificacion, error: errorNotif } = await supabase
      .from('notificaciones')
      .insert({
        admin_id: miguel.id,
        solicitud_id: solicitud.id,
        tipo: 'NUEVA_SOLICITUD',
        titulo: '🔔 Nueva Solicitud de Permiso',
        mensaje: `${guillermo.nombre} (${guillermo.rut}) ha solicitado un permiso de ${tipoPermiso.nombre} para el 2025-09-15. Motivo: Prueba de notificaciones - Asunto personal`,
        leida: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (errorNotif) {
      console.log('❌ Error creando notificación:', errorNotif.message);
      return;
    }
    
    console.log('✅ Notificación creada con ID:', notificacion.id);
    
    // 6. Verificar notificaciones de Miguel
    const { data: notificacionesMiguel } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('admin_id', miguel.id)
      .order('created_at', { ascending: false });
    
    console.log('\n📬 RESULTADO FINAL:');
    console.log(`✅ Total notificaciones para Miguel: ${notificacionesMiguel?.length || 0}`);
    
    if (notificacionesMiguel && notificacionesMiguel.length > 0) {
      console.log('\n📋 Últimas notificaciones:');
      notificacionesMiguel.slice(0, 3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.titulo}`);
        console.log(`      Mensaje: ${notif.mensaje}`);
        console.log(`      Fecha: ${notif.created_at}`);
        console.log(`      Leída: ${notif.leida ? 'Sí' : 'No'}`);
      });
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA:');
    console.log('   - Miguel ahora recibirá notificaciones cuando Guillermo solicite permisos');
    console.log('   - Accede a http://localhost:3444/admin con miguel.rodriguez/miguel123');
    console.log('   - Las notificaciones aparecerán en su panel de administración');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testNotificacionCompleta();