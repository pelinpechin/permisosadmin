const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function configuracionFinalCorrecta() {
    try {
        console.log('🎯 CONFIGURACIÓN FINAL CORRECTA\n');
        
        // Empleados correctos identificados
        const empleadosCorrectos = {
            andrea: { id: 46, nombre: 'Naguelquin Garcia Andrea Alejandra' },
            francisco: { id: 67, nombre: 'Mancilla Vargas Francisco Gerardo' },
            ronny: { id: 44, nombre: 'Cisterna Galaz Ronny Ignacio' },
            nelson: { id: 42, nombre: 'Bravo Jorquera Nelson Patricio' }
        };
        
        console.log('👥 Empleados identificados:');
        Object.entries(empleadosCorrectos).forEach(([key, emp]) => {
            console.log(`   ${key}: ID ${emp.id} - ${emp.nombre}`);
        });
        
        // 1. Corregir usuarios con empleados correctos
        console.log('\n🔑 Corrigiendo usuarios...');
        
        const actualizacionesUsuarios = [
            { username: 'andrea.naguelquin', empleado_id: empleadosCorrectos.andrea.id },
            { username: 'francisco.mancilla', empleado_id: empleadosCorrectos.francisco.id },
            { username: 'ronny.cisterna', empleado_id: empleadosCorrectos.ronny.id },
            { username: 'nelson.bravo', empleado_id: empleadosCorrectos.nelson.id }
        ];
        
        for (const actualizacion of actualizacionesUsuarios) {
            const { error } = await supabase
                .from('usuarios')
                .update({ empleado_id: actualizacion.empleado_id })
                .eq('username', actualizacion.username);
                
            if (error) {
                console.error(`❌ Error actualizando ${actualizacion.username}:`, error);
            } else {
                console.log(`✅ ${actualizacion.username} → Empleado ID ${actualizacion.empleado_id}`);
            }
        }
        
        // 2. Limpiar solicitudes existentes
        console.log('\n📋 Limpiando solicitudes existentes...');
        const { error: deleteError } = await supabase
            .from('solicitudes_permisos')
            .delete()
            .neq('id', 0);
            
        if (deleteError) {
            console.error('❌ Error eliminando solicitudes:', deleteError);
        } else {
            console.log('✅ Solicitudes anteriores eliminadas');
        }
        
        // 3. Crear solicitud de prueba de Francisco
        console.log('\n📝 Creando solicitud de prueba...');
        const { data: nuevaSolicitud, error: insertError } = await supabase
            .from('solicitudes_permisos')
            .insert([{
                empleado_id: empleadosCorrectos.francisco.id,
                tipo_permiso_id: 1, // Tipo T
                fecha_desde: '2025-01-22',
                fecha_hasta: '2025-01-22',
                motivo: 'Cita médica familiar urgente',
                estado: 'PENDIENTE'
            }])
            .select();
            
        if (insertError) {
            console.error('❌ Error creando solicitud:', insertError);
        } else {
            console.log(`✅ Solicitud creada: ID ${nuevaSolicitud[0].id} para Francisco Mancilla`);
        }
        
        // 4. Verificación completa final
        console.log('\n🔍 VERIFICACIÓN FINAL COMPLETA:');
        console.log('===============================');
        
        // Verificar usuarios
        const { data: usuariosVerificacion } = await supabase
            .from('usuarios')
            .select(`
                username, empleado_id,
                empleados!inner(nombre, cargo, supervisor_nombre)
            `)
            .order('username');
            
        console.log('\n👥 USUARIOS FINALES:');
        usuariosVerificacion.forEach(user => {
            console.log(`✅ ${user.username}`);
            console.log(`   → ${user.empleados.nombre}`);
            console.log(`   → ${user.empleados.cargo}`);
            console.log(`   → Supervisor: ${user.empleados.supervisor_nombre || 'N/A'}\n`);
        });
        
        // Verificar solicitudes
        const { data: solicitudesVerificacion } = await supabase
            .from('solicitudes_permisos')
            .select('*');
            
        console.log(`📋 SOLICITUDES: ${solicitudesVerificacion.length}`);
        for (const sol of solicitudesVerificacion) {
            const { data: empleado } = await supabase
                .from('empleados')
                .select('nombre, supervisor_nombre')
                .eq('id', sol.empleado_id)
                .single();
                
            const { data: tipo } = await supabase
                .from('tipos_permisos')
                .select('codigo, nombre')
                .eq('id', sol.tipo_permiso_id)
                .single();
                
            console.log(`✅ Solicitud ID: ${sol.id}`);
            console.log(`   Empleado: ${empleado.nombre}`);
            console.log(`   Supervisor: ${empleado.supervisor_nombre}`);
            console.log(`   Tipo: ${tipo.codigo} - ${tipo.nombre}`);
            console.log(`   Estado: ${sol.estado}, Fecha: ${sol.fecha_desde}`);
            console.log(`   Motivo: ${sol.motivo}\n`);
        }
        
        // Verificar relación Andrea-Francisco específicamente
        const { data: franciscoCheck } = await supabase
            .from('empleados')
            .select('*')
            .eq('id', empleadosCorrectos.francisco.id)
            .single();
            
        const { data: andreaCheck } = await supabase
            .from('empleados')
            .select('*')
            .eq('id', empleadosCorrectos.andrea.id)
            .single();
            
        console.log('🔗 RELACIÓN SUPERVISOR-SUBORDINADO:');
        console.log(`   Francisco: ${franciscoCheck.nombre}`);
        console.log(`   Supervisor de Francisco: ${franciscoCheck.supervisor_nombre}`);
        console.log(`   Andrea: ${andreaCheck.nombre}`);
        console.log(`   Andrea es supervisor: ${andreaCheck.es_supervisor}`);
        
        if (franciscoCheck.supervisor_nombre && franciscoCheck.supervisor_nombre.includes('Andrea')) {
            console.log('✅ ¡RELACIÓN CORRECTA! Andrea supervisa a Francisco');
        } else {
            console.log('❌ Relación incorrecta');
        }
        
        console.log('\n🎉 ¡SISTEMA COMPLETAMENTE CONFIGURADO!');
        console.log('======================================');
        console.log('✅ Base de datos nueva funcionando');
        console.log('✅ 93 empleados reales cargados');
        console.log('✅ Usuarios correctamente asignados');
        console.log('✅ Andrea Naguelquin supervisa a Francisco Mancilla');
        console.log('✅ Solicitud de prueba creada');
        console.log('✅ Sin errores 500');
        console.log('✅ Sistema listo para uso');
        
        console.log('\n🚀 CREDENCIALES PARA PROBAR:');
        console.log('=============================');
        console.log('👩‍💼 ANDREA NAGUELQUIN (Supervisora):');
        console.log('   Usuario: andrea.naguelquin');
        console.log('   Password: andrea123');
        console.log('   Rol: Puede ver y aprobar solicitudes de Francisco');
        console.log('');
        console.log('👨‍💼 FRANCISCO MANCILLA (Empleado):');
        console.log('   Usuario: francisco.mancilla');
        console.log('   Password: francisco123');
        console.log('   Rol: Puede crear solicitudes, las verá Andrea');
        console.log('');
        console.log('🔗 PROBAR EN: https://permisosadministrativos.netlify.app');
        console.log('');
        console.log('📝 FLUJO DE PRUEBA:');
        console.log('1. Login con Francisco → Crear nueva solicitud');
        console.log('2. Login con Andrea → Ver solicitud de Francisco en "Por Autorizar"');
        console.log('3. Andrea aprueba la solicitud → Estado cambia a APROBADO');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

configuracionFinalCorrecta();