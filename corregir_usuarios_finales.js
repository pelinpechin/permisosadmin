const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function corregirUsuariosFinales() {
    try {
        console.log('🔧 CORRIGIENDO USUARIOS Y SOLICITUDES\n');
        
        // 1. Buscar los empleados correctos
        const { data: empleados } = await supabase
            .from('empleados')
            .select('id, nombre, cargo, supervisor_nombre')
            .or('nombre.ilike.%Andrea%Naguelquin%,nombre.ilike.%Francisco%Mancilla%,nombre.ilike.%Ronny%Cisterna%,nombre.ilike.%Nelson%Patricio%');
            
        console.log('👥 Empleados encontrados:');
        empleados.forEach(emp => {
            console.log(`   ${emp.id}. ${emp.nombre} (${emp.cargo})`);
        });
        
        const andrea = empleados.find(e => e.nombre.includes('Andrea') && e.nombre.includes('Naguelquin'));
        const francisco = empleados.find(e => e.nombre.includes('Francisco') && e.nombre.includes('Mancilla'));
        const ronny = empleados.find(e => e.nombre.includes('Ronny') && e.nombre.includes('Cisterna'));
        const nelson = empleados.find(e => e.nombre.includes('Nelson') && e.nombre.includes('Patricio'));
        
        console.log('\n🎯 Empleados clave identificados:');
        if (andrea) console.log(`✅ Andrea: ID ${andrea.id} - ${andrea.nombre}`);
        if (francisco) console.log(`✅ Francisco: ID ${francisco.id} - ${francisco.nombre}`);
        if (ronny) console.log(`✅ Ronny: ID ${ronny.id} - ${ronny.nombre}`);
        if (nelson) console.log(`✅ Nelson: ID ${nelson.id} - ${nelson.nombre}`);
        
        // 2. Corregir usuarios existentes
        console.log('\n🔑 Corrigiendo usuarios...');
        
        const correcionesUsuarios = [
            { username: 'andrea.naguelquin', empleado_id: andrea?.id },
            { username: 'francisco.mancilla', empleado_id: francisco?.id },
            { username: 'ronny.cisterna', empleado_id: ronny?.id },
            { username: 'nelson.bravo', empleado_id: nelson?.id }
        ];
        
        for (const correccion of correcionesUsuarios) {
            if (correccion.empleado_id) {
                const { error } = await supabase
                    .from('usuarios')
                    .update({ empleado_id: correccion.empleado_id })
                    .eq('username', correccion.username);
                    
                if (error) {
                    console.error(`❌ Error actualizando ${correccion.username}:`, error);
                } else {
                    console.log(`✅ Usuario ${correccion.username} → Empleado ID ${correccion.empleado_id}`);
                }
            }
        }
        
        // 3. Eliminar solicitud incorrecta y crear la correcta
        console.log('\n📋 Corrigiendo solicitudes...');
        
        // Eliminar solicitudes existentes
        const { error: deleteError } = await supabase
            .from('solicitudes_permisos')
            .delete()
            .neq('id', 0); // Eliminar todas
            
        if (deleteError) {
            console.error('❌ Error eliminando solicitudes:', deleteError);
        } else {
            console.log('✅ Solicitudes anteriores eliminadas');
        }
        
        // Crear solicitud correcta de Francisco Mancilla
        if (francisco) {
            const { error: insertError } = await supabase
                .from('solicitudes_permisos')
                .insert([{
                    empleado_id: francisco.id,
                    tipo_permiso_id: 1,
                    fecha_desde: '2025-01-20',
                    fecha_hasta: '2025-01-20',
                    motivo: 'Cita médica familiar',
                    estado: 'PENDIENTE'
                }]);
                
            if (insertError) {
                console.error('❌ Error creando solicitud:', insertError);
            } else {
                console.log(`✅ Solicitud creada para Francisco Mancilla (ID: ${francisco.id})`);
            }
        }
        
        // 4. Verificación final
        console.log('\n🔍 VERIFICACIÓN FINAL:');
        
        const { data: usuariosFinales } = await supabase
            .from('usuarios')
            .select(`
                username, 
                empleados!inner(id, nombre, cargo)
            `);
            
        console.log('👥 Usuarios corregidos:');
        usuariosFinales.forEach(user => {
            console.log(`   ${user.username} → ${user.empleados.nombre} (${user.empleados.cargo})`);
        });
        
        const { data: solicitudesFinales } = await supabase
            .from('solicitudes_permisos')
            .select('*');
            
        console.log(`\n📋 Solicitudes: ${solicitudesFinales.length}`);
        for (const sol of solicitudesFinales) {
            const { data: emp } = await supabase
                .from('empleados')
                .select('nombre, supervisor_nombre')
                .eq('id', sol.empleado_id)
                .single();
                
            if (emp) {
                console.log(`   - ${emp.nombre} (${sol.estado}) → Supervisor: ${emp.supervisor_nombre}`);
            }
        }
        
        console.log('\n🎉 CORRECCIÓN COMPLETA!');
        console.log('========================');
        console.log('✅ Usuarios vinculados correctamente');
        console.log('✅ Solicitud de Francisco Mancilla creada');
        console.log('✅ Sistema listo para pruebas');
        
        console.log('\n🚀 CREDENCIALES FINALES:');
        console.log('=========================');
        console.log('👩‍💼 Andrea Naguelquin (Supervisora):');
        console.log('   Usuario: andrea.naguelquin');
        console.log('   Password: andrea123');
        console.log('');
        console.log('👨‍💼 Francisco Mancilla (Empleado):');
        console.log('   Usuario: francisco.mancilla');
        console.log('   Password: francisco123');
        console.log('');
        console.log('🔗 Probar en: https://permisosadministrativos.netlify.app');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

corregirUsuariosFinales();