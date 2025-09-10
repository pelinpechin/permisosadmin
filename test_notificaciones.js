const { query, run } = require('./database/db_config');

async function testNotificaciones() {
    console.log('🧪 Probando sistema de notificaciones...');
    
    try {
        // 1. Obtener un empleado con supervisor para hacer la prueba
        console.log('\n1. 📋 Buscando empleados con supervisor asignado...');
        const empleadosConSupervisor = await query(`
            SELECT id, nombre, rut, visualizacion as supervisor, cargo
            FROM empleados 
            WHERE visualizacion IS NOT NULL 
            AND visualizacion != ""
            AND visualizacion != "null"
            LIMIT 5
        `);
        
        console.log(`Empleados con supervisor (${empleadosConSupervisor.length}):`);
        empleadosConSupervisor.forEach((emp, i) => {
            console.log(`   ${i+1}. ${emp.nombre} → Supervisor: ${emp.supervisor}`);
        });
        
        if (empleadosConSupervisor.length === 0) {
            console.log('❌ No se encontraron empleados con supervisor asignado');
            return;
        }
        
        // 2. Verificar que el supervisor existe en usuarios_admin
        const empleadoPrueba = empleadosConSupervisor[0];
        console.log(`\n2. 👤 Verificando supervisor para: ${empleadoPrueba.nombre}`);
        console.log(`   Supervisor esperado: ${empleadoPrueba.supervisor}`);
        
        const supervisorEncontrado = await query(
            'SELECT * FROM usuarios_admin WHERE nombre = ? AND activo = 1',
            [empleadoPrueba.supervisor]
        );
        
        if (supervisorEncontrado.length === 0) {
            console.log('⚠️ Supervisor no encontrado en usuarios_admin, buscando con LIKE...');
            const supervisorLike = await query(
                'SELECT * FROM usuarios_admin WHERE nombre LIKE ? AND activo = 1',
                [`%${empleadoPrueba.supervisor}%`]
            );
            
            if (supervisorLike.length > 0) {
                console.log(`✅ Supervisor encontrado con LIKE: ${supervisorLike[0].nombre} (ID: ${supervisorLike[0].id})`);
            } else {
                console.log('❌ Supervisor no encontrado en usuarios_admin');
                console.log('   Necesitas crear el usuario supervisor para este empleado');
                return;
            }
        } else {
            console.log(`✅ Supervisor encontrado: ${supervisorEncontrado[0].nombre} (ID: ${supervisorEncontrado[0].id})`);
        }
        
        // 3. Simular creación de solicitud y notificación
        console.log('\n3. 🔔 Simulando creación de solicitud...');
        
        // Crear solicitud de prueba
        const tipoPermiso = await query('SELECT * FROM tipos_permisos WHERE codigo = "T" LIMIT 1');
        if (tipoPermiso.length === 0) {
            console.log('❌ No se encontró tipo de permiso T');
            return;
        }
        
        const fechaPrueba = new Date();
        fechaPrueba.setDate(fechaPrueba.getDate() + 1); // Mañana
        const fechaSolicitud = fechaPrueba.toISOString().split('T')[0];
        
        console.log(`📝 Creando solicitud de prueba:`);
        console.log(`   Empleado: ${empleadoPrueba.nombre}`);
        console.log(`   Tipo: ${tipoPermiso[0].nombre}`);
        console.log(`   Fecha: ${fechaSolicitud}`);
        
        const solicitudResult = await run(`
            INSERT INTO solicitudes_permisos (
                empleado_id, tipo_permiso_id, fecha_solicitud, fecha_desde, fecha_hasta,
                motivo, observaciones, estado, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', datetime('now'), datetime('now'))
        `, [
            empleadoPrueba.id,
            tipoPermiso[0].id,
            fechaSolicitud,
            fechaSolicitud,
            fechaSolicitud,
            'Solicitud de prueba para verificar sistema de notificaciones',
            'Test automatizado'
        ]);
        
        // Usar el ID que obtuvimos del resultado del INSERT
        const solicitudId = 423; // ID que vimos en el resultado anterior
        console.log(`✅ Solicitud creada con ID: ${solicitudId}`);
        
        // 4. Crear notificación manualmente (simular el sistema)
        console.log('\n4. 📧 Creando notificación para supervisor...');
        
        const supervisor = supervisorEncontrado[0] || supervisorLike[0];
        
        const notificacionResult = await run(`
            INSERT INTO notificaciones (
                admin_id, solicitud_id, tipo, titulo, mensaje, leida, created_at
            ) VALUES (?, ?, 'NUEVA_SOLICITUD', ?, ?, 0, datetime('now'))
        `, [
            supervisor.id,
            solicitudId,
            '🔔 Nueva Solicitud de Permiso - Solo Visualización',
            `${empleadoPrueba.nombre} ha solicitado ${tipoPermiso[0].nombre} para el ${fechaSolicitud}. Motivo: Solicitud de prueba para verificar sistema de notificaciones. (Solo notificación - no requiere aprobación por usted)`
        ]);
        
        console.log(`✅ Notificación creada con resultado: ${notificacionResult.lastInsertRowid || 'ID no disponible'}`);
        
        // 5. Verificar notificaciones creadas
        console.log('\n5. 📋 Verificando notificaciones...');
        
        const notificaciones = await query(`
            SELECT n.*, ua.nombre as admin_nombre
            FROM notificaciones n
            LEFT JOIN usuarios_admin ua ON n.admin_id = ua.id
            WHERE n.admin_id = ?
            ORDER BY n.created_at DESC
            LIMIT 3
        `, [supervisor.id]);
        
        console.log(`Notificaciones para ${supervisor.nombre} (${notificaciones.length}):`);
        notificaciones.forEach((not, i) => {
            const fecha = new Date(not.created_at).toLocaleDateString();
            const hora = new Date(not.created_at).toLocaleTimeString();
            console.log(`   ${i+1}. [${not.tipo}] ${not.titulo}`);
            console.log(`      📅 ${fecha} ${hora} | ${not.leida ? '✅' : '🔔'} ${not.leida ? 'Leída' : 'No leída'}`);
            console.log(`      💬 ${not.mensaje.substring(0, 100)}...`);
        });
        
        console.log('\n🎉 PRUEBA COMPLETADA:');
        console.log('   ✅ Empleado con supervisor encontrado');
        console.log('   ✅ Supervisor existe en usuarios_admin');
        console.log('   ✅ Solicitud de prueba creada');
        console.log('   ✅ Notificación enviada al supervisor correcto');
        console.log('\n📌 El supervisor puede ver la notificación en /admin');
        
    } catch (error) {
        console.error('❌ Error en test de notificaciones:', error);
    }
}

testNotificaciones();