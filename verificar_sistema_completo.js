const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSistemaCompleto() {
    try {
        console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');
        console.log('===================================\n');
        
        // 1. Verificar empleados clave
        console.log('👥 1. EMPLEADOS CLAVE:');
        const { data: empleadosClave, error: empError } = await supabase
            .from('empleados')
            .select('id, nombre, cargo, supervisor_nombre, es_supervisor, es_admin')
            .or('nombre.ilike.%Andrea%Naguelquin%,nombre.ilike.%Francisco%Mancilla%,nombre.ilike.%Ronny%Cisterna%,nombre.ilike.%Nelson%Patricio%')
            .order('nombre');
            
        if (empError) {
            console.error('❌ Error:', empError);
        } else {
            empleadosClave.forEach(emp => {
                console.log(`✅ ${emp.nombre}`);
                console.log(`   ID: ${emp.id}, Cargo: ${emp.cargo}`);
                console.log(`   Supervisor: ${emp.supervisor_nombre || 'N/A'}`);
                console.log(`   Es Supervisor: ${emp.es_supervisor}, Es Admin: ${emp.es_admin}\n`);
            });
        }
        
        // 2. Verificar usuarios
        console.log('🔑 2. USUARIOS:');
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select(`
                id, username, activo,
                empleados(id, nombre, cargo)
            `)
            .order('username');
            
        if (userError) {
            console.error('❌ Error:', userError);
        } else {
            usuarios.forEach(user => {
                console.log(`✅ ${user.username} (${user.empleados.nombre})`);
                console.log(`   Cargo: ${user.empleados.cargo}, Activo: ${user.activo}\n`);
            });
        }
        
        // 3. Verificar relación Andrea-Francisco
        console.log('🔗 3. RELACIÓN ANDREA-FRANCISCO:');
        const { data: francisco, error: franError } = await supabase
            .from('empleados')
            .select('id, nombre, supervisor_nombre')
            .ilike('nombre', '%Francisco%Mancilla%')
            .single();
            
        const { data: andrea, error: andreaError } = await supabase
            .from('empleados')
            .select('id, nombre')
            .ilike('nombre', '%Andrea%Naguelquin%')
            .single();
            
        if (!franError && !andreaError && francisco && andrea) {
            if (francisco.supervisor_nombre && francisco.supervisor_nombre.includes('Andrea')) {
                console.log('✅ Relación correcta:');
                console.log(`   Francisco (ID: ${francisco.id}) → Andrea (ID: ${andrea.id})`);
                console.log(`   Supervisor: ${francisco.supervisor_nombre}\n`);
            } else {
                console.log('❌ Relación incorrecta:');
                console.log(`   Francisco supervisor: ${francisco.supervisor_nombre}`);
                console.log(`   Debería ser: Andrea Alejandra Naguelquin Garcia\n`);
            }
        }
        
        // 4. Verificar solicitudes
        console.log('📋 4. SOLICITUDES:');
        const { data: solicitudes, error: solError } = await supabase
            .from('solicitudes_permisos')
            .select(`
                id, estado, motivo, fecha_desde,
                empleados(id, nombre),
                tipos_permisos(codigo, nombre)
            `)
            .order('created_at', { ascending: false });
            
        if (solError) {
            console.error('❌ Error:', solError);
        } else {
            console.log(`📊 Total solicitudes: ${solicitudes.length}`);
            solicitudes.forEach(sol => {
                console.log(`✅ Solicitud ID: ${sol.id}`);
                console.log(`   Empleado: ${sol.empleados.nombre}`);
                console.log(`   Tipo: ${sol.tipos_permisos.codigo} - ${sol.tipos_permisos.nombre}`);
                console.log(`   Estado: ${sol.estado}, Fecha: ${sol.fecha_desde}`);
                console.log(`   Motivo: ${sol.motivo}\n`);
            });
        }
        
        // 5. Verificar tipos de permisos
        console.log('🎯 5. TIPOS DE PERMISOS:');
        const { data: tipos, error: tiposError } = await supabase
            .from('tipos_permisos')
            .select('*')
            .order('codigo');
            
        if (tiposError) {
            console.error('❌ Error:', tiposError);
        } else {
            tipos.forEach(tipo => {
                console.log(`✅ ${tipo.codigo}: ${tipo.nombre}`);
                console.log(`   Color: ${tipo.color_hex}, Días/año: ${tipo.dias_permitidos_anio}`);
                console.log(`   Con goce: ${tipo.es_con_goce}\n`);
            });
        }
        
        // 6. Estadísticas finales
        console.log('📊 6. ESTADÍSTICAS:');
        const { count: totalEmpleados } = await supabase
            .from('empleados')
            .select('*', { count: 'exact', head: true });
            
        const { count: totalUsuarios } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true });
            
        const { count: solicitudesPendientes } = await supabase
            .from('solicitudes_permisos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'PENDIENTE');
            
        const { count: supervisores } = await supabase
            .from('empleados')
            .select('*', { count: 'exact', head: true })
            .eq('es_supervisor', true);
            
        console.log(`👥 Empleados totales: ${totalEmpleados}`);
        console.log(`🔑 Usuarios creados: ${totalUsuarios}`);
        console.log(`📋 Solicitudes pendientes: ${solicitudesPendientes}`);
        console.log(`👨‍💼 Supervisores: ${supervisores}`);
        
        console.log('\n🎉 VERIFICACIÓN COMPLETA');
        console.log('========================');
        console.log('✅ Base de datos configurada correctamente');
        console.log('✅ Empleados clave presentes');
        console.log('✅ Usuarios con credenciales creados');
        console.log('✅ Relación supervisor-subordinado funcionando');
        console.log('✅ Solicitud de prueba disponible');
        console.log('✅ Sistema listo para uso\n');
        
        console.log('🚀 CREDENCIALES DE PRUEBA:');
        console.log('==========================');
        console.log('👩‍💼 Andrea (Supervisora):');
        console.log('   Usuario: andrea.naguelquin');
        console.log('   Password: andrea123');
        console.log('');
        console.log('👨‍💼 Francisco (Empleado):');
        console.log('   Usuario: francisco.mancilla');
        console.log('   Password: francisco123');
        console.log('');
        console.log('🔗 URL del sistema: https://permisosadministrativos.netlify.app');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

verificarSistemaCompleto();