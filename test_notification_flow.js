const db = require('./database/db_config');

async function testNotificationFlow() {
    try {
        console.log('🧪 === PROBANDO FLUJO DE NOTIFICACIONES ===\n');
        
        // 1. Verificar que Guillermo y Miguel existen
        console.log('1. 🔍 Verificando empleados...');
        const guillermo = await db.get('SELECT * FROM empleados WHERE rut = ?', ['18.208.947-8']);
        const miguel = await db.get('SELECT * FROM empleados WHERE nombre = ?', ['Rodriguez Cabrera Miguel Angel']);
        
        console.log(`   ✅ Guillermo David: ${guillermo ? guillermo.nombre : 'NO ENCONTRADO'}`);
        console.log(`   ✅ Miguel Rodriguez: ${miguel ? miguel.nombre : 'NO ENCONTRADO'}`);
        
        if (!guillermo || !miguel) {
            console.log('❌ No se pueden hacer las pruebas sin ambos empleados');
            return;
        }
        
        console.log(`   📋 Supervisor de Visualización de Guillermo: ${guillermo.visualizacion}`);
        console.log(`   📋 Supervisor de Autorización de Guillermo: ${guillermo.autorizacion}\n`);
        
        // 2. Simular notificación usando la nueva función
        console.log('2. 📧 Simulando creación de notificación...');
        
        // Datos de solicitud simulada
        const solicitudSimulada = {
            id: 999,
            empleado_id: guillermo.id,
            empleado_nombre: guillermo.nombre,
            empleado_cargo: guillermo.cargo,
            tipo_nombre: 'Permiso Personal',
            fecha_desde: '2025-01-15',
            motivo: 'Prueba del sistema de notificaciones'
        };
        
        // Crear notificación para supervisor de visualización (Miguel)
        if (guillermo.visualizacion && guillermo.visualizacion.includes('RODRIGUEZ CABRERA MIGUEL ANGEL')) {
            console.log('   📧 Creando notificación para Miguel Rodriguez...');
            
            const notificationResult = await db.run(`
                INSERT INTO notificaciones (
                    empleado_id, tipo, titulo, mensaje, leida, created_at
                ) VALUES (?, 'NUEVA_SOLICITUD', ?, ?, 0, CURRENT_TIMESTAMP)
            `, [
                miguel.id,
                '👁️ Nueva Solicitud de Permiso (Para su conocimiento)',
                `${guillermo.nombre} ha solicitado Permiso Personal para el 15 de enero, 2025. Motivo: Prueba del sistema de notificaciones. (Solo para su conocimiento - no requiere acción)`
            ]);
            
            console.log(`   ✅ Notificación creada con ID: ${notificationResult.lastID || 'Éxito'}`);
        }
        
        // 3. Verificar notificaciones creadas
        console.log('\n3. 🔍 Verificando notificaciones creadas...');
        
        const notificacionesMiguel = await db.query(`
            SELECT * FROM notificaciones 
            WHERE empleado_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [miguel.id]);
        
        console.log(`   📧 Miguel Rodriguez tiene ${notificacionesMiguel.length} notificaciones:`);
        notificacionesMiguel.forEach((notif, index) => {
            console.log(`     ${index + 1}. ${notif.titulo}`);
            console.log(`        ${notif.mensaje.substring(0, 80)}...`);
            console.log(`        Leída: ${notif.leida ? 'Sí' : 'No'} | Fecha: ${notif.created_at}`);
        });
        
        console.log('\n✅ PRUEBA COMPLETADA');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        process.exit(1);
    }
}

testNotificationFlow();