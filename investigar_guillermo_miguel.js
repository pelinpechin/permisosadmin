const { query } = require('./database/db_config');

async function investigarGuillermoMiguel() {
    console.log('🔍 Investigando notificación Guillermo → Miguel...');
    
    try {
        // 1. Buscar Guillermo en la base de datos
        console.log('\n1. 👤 Buscando información de Guillermo...');
        const guillermo = await query(`
            SELECT id, nombre, rut, visualizacion as supervisor, autorizacion
            FROM empleados 
            WHERE nombre LIKE '%GUILLERMO%' OR nombre LIKE '%Guillermo%'
        `);
        
        if (guillermo.length === 0) {
            console.log('❌ No se encontró ningún empleado llamado Guillermo');
            
            // Mostrar algunos empleados para referencia
            console.log('\n📋 Empleados disponibles (muestra):');
            const muestraEmpleados = await query('SELECT nombre, rut FROM empleados LIMIT 10');
            muestraEmpleados.forEach((emp, i) => {
                console.log(`   ${i+1}. ${emp.nombre} (${emp.rut})`);
            });
            return;
        }
        
        console.log(`✅ Guillermo encontrado:`);
        guillermo.forEach((emp, i) => {
            console.log(`   ${i+1}. ${emp.nombre} (${emp.rut})`);
            console.log(`      Supervisor: ${emp.supervisor || 'No asignado'}`);
            console.log(`      Autorizador: ${emp.autorizacion || 'No asignado'}`);
        });
        
        const guillermoData = guillermo[0];
        
        // 2. Verificar si Miguel es el supervisor de Guillermo
        console.log('\n2. 🔗 Verificando relación supervisor-empleado...');
        const supervisorNombre = guillermoData.supervisor;
        
        if (!supervisorNombre) {
            console.log('❌ Guillermo no tiene supervisor asignado en campo VISUALIZACION');
            return;
        }
        
        console.log(`👨‍💼 Supervisor de Guillermo: ${supervisorNombre}`);
        
        const esMiguelSupervisor = supervisorNombre.toUpperCase().includes('MIGUEL');
        console.log(`¿Miguel es supervisor de Guillermo?: ${esMiguelSupervisor ? '✅ SÍ' : '❌ NO'}`);
        
        if (!esMiguelSupervisor) {
            console.log('⚠️ PROBLEMA IDENTIFICADO: Miguel NO es el supervisor de Guillermo');
            console.log(`   El supervisor correcto es: ${supervisorNombre}`);
            
            // Buscar el supervisor correcto en usuarios_admin
            const supervisorCorrect = await query(
                'SELECT * FROM usuarios_admin WHERE nombre = ? OR nombre LIKE ? AND activo = 1',
                [supervisorNombre, `%${supervisorNombre}%`]
            );
            
            if (supervisorCorrect.length > 0) {
                console.log(`   ✅ Supervisor correcto existe en usuarios_admin: ${supervisorCorrect[0].nombre} (ID: ${supervisorCorrect[0].id})`);
            } else {
                console.log(`   ❌ Supervisor correcto NO existe en usuarios_admin`);
            }
        }
        
        // 3. Buscar Miguel en usuarios_admin
        console.log('\n3. 👤 Verificando Miguel en usuarios_admin...');
        const miguelAdmin = await query(`
            SELECT * FROM usuarios_admin 
            WHERE nombre LIKE '%MIGUEL%' AND activo = 1
        `);
        
        if (miguelAdmin.length > 0) {
            console.log(`✅ Miguel encontrado en usuarios_admin:`);
            miguelAdmin.forEach(admin => {
                console.log(`   - ${admin.nombre} (ID: ${admin.id}) - Rol: ${admin.rol}`);
            });
        } else {
            console.log('❌ Miguel NO encontrado en usuarios_admin');
        }
        
        // 4. Buscar solicitudes recientes de Guillermo
        console.log('\n4. 📋 Buscando solicitudes recientes de Guillermo...');
        const solicitudesGuillermo = await query(`
            SELECT sp.*, tp.nombre as tipo_nombre, tp.codigo
            FROM solicitudes_permisos sp
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.empleado_id = ?
            ORDER BY sp.created_at DESC
            LIMIT 5
        `, [guillermoData.id]);
        
        if (solicitudesGuillermo.length > 0) {
            console.log(`✅ Solicitudes encontradas (${solicitudesGuillermo.length}):`);
            solicitudesGuillermo.forEach((sol, i) => {
                const fecha = new Date(sol.created_at).toLocaleString();
                console.log(`   ${i+1}. ID: ${sol.id} | ${sol.tipo_nombre} | ${sol.estado} | ${fecha}`);
                console.log(`      Fecha permiso: ${sol.fecha_desde} | Motivo: ${sol.motivo?.substring(0, 50)}...`);
            });
            
            // 5. Verificar notificaciones para estas solicitudes
            console.log('\n5. 🔔 Verificando notificaciones generadas...');
            
            for (const solicitud of solicitudesGuillermo.slice(0, 3)) {
                const notificaciones = await query(
                    'SELECT * FROM notificaciones WHERE solicitud_id = ?',
                    [solicitud.id]
                );
                
                console.log(`\n   Solicitud ID ${solicitud.id}:`);
                if (notificaciones.length > 0) {
                    console.log(`   ✅ ${notificaciones.length} notificación(es) generada(s):`);
                    notificaciones.forEach(not => {
                        console.log(`      - Admin ID: ${not.admin_id} | Tipo: ${not.tipo} | Leída: ${not.leida ? 'Sí' : 'No'}`);
                        console.log(`      - Título: ${not.titulo}`);
                    });
                } else {
                    console.log(`   ❌ NO se generaron notificaciones para esta solicitud`);
                    console.log(`   🔧 PROBLEMA: El sistema no creó notificación`);
                }
            }
            
        } else {
            console.log('❌ No se encontraron solicitudes de Guillermo');
        }
        
        // 6. Resumen y diagnóstico
        console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
        console.log('=' .repeat(50));
        
        if (!esMiguelSupervisor) {
            console.log('❌ CAUSA PRINCIPAL: Miguel NO es el supervisor de Guillermo');
            console.log(`   - Supervisor real: ${supervisorNombre}`);
            console.log(`   - Las notificaciones se envían al supervisor correcto, no a Miguel`);
            console.log('\n💡 SOLUCIÓN:');
            console.log('   1. Verificar que el supervisor correcto tenga cuenta en usuarios_admin');
            console.log('   2. O cambiar el supervisor de Guillermo a Miguel en el CSV');
        } else {
            console.log('✅ Miguel SÍ es supervisor de Guillermo');
            console.log('❌ Problema en el sistema de notificaciones');
            console.log('\n💡 INVESTIGAR:');
            console.log('   1. ¿Se ejecutó la función crearNotificacionSupervisor?');
            console.log('   2. ¿Hay errores en los logs del servidor?');
            console.log('   3. ¿Miguel tiene cuenta activa en usuarios_admin?');
        }
        
    } catch (error) {
        console.error('❌ Error en investigación:', error);
    }
}

investigarGuillermoMiguel();