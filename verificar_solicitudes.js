const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSolicitudes() {
    try {
        console.log('📋 VERIFICANDO SOLICITUDES Y RELACIONES\n');
        
        // 1. Ver todas las solicitudes
        const { data: solicitudes, error: solError } = await supabase
            .from('solicitudes_permisos')
            .select('*');
            
        if (solError) {
            console.error('❌ Error solicitudes:', solError);
            return;
        }
        
        console.log(`📊 Total solicitudes: ${solicitudes.length}\n`);
        
        // 2. Para cada solicitud, obtener datos del empleado
        for (const sol of solicitudes) {
            console.log(`📋 Solicitud ID: ${sol.id}`);
            console.log(`   Estado: ${sol.estado}`);
            console.log(`   Fecha: ${sol.fecha_desde}`);
            console.log(`   Motivo: ${sol.motivo}`);
            
            // Buscar empleado
            const { data: empleado } = await supabase
                .from('empleados')
                .select('id, nombre, cargo, supervisor_nombre')
                .eq('id', sol.empleado_id)
                .single();
                
            if (empleado) {
                console.log(`   Empleado: ${empleado.nombre} (${empleado.cargo})`);
                console.log(`   Supervisor: ${empleado.supervisor_nombre}`);
            }
            
            // Buscar tipo de permiso
            const { data: tipo } = await supabase
                .from('tipos_permisos')
                .select('codigo, nombre')
                .eq('id', sol.tipo_permiso_id)
                .single();
                
            if (tipo) {
                console.log(`   Tipo: ${tipo.codigo} - ${tipo.nombre}`);
            }
            
            console.log('');
        }
        
        // 3. Verificar específicamente Francisco y Andrea
        console.log('🔍 VERIFICACIÓN FRANCISCO-ANDREA:\n');
        
        const { data: francisco } = await supabase
            .from('empleados')
            .select('*')
            .ilike('nombre', '%Francisco%Mancilla%')
            .single();
            
        const { data: andrea } = await supabase
            .from('empleados')
            .select('*')
            .ilike('nombre', '%Andrea%Naguelquin%')
            .single();
            
        if (francisco && andrea) {
            console.log(`👨‍💼 Francisco: ID ${francisco.id} - ${francisco.nombre}`);
            console.log(`   Cargo: ${francisco.cargo}`);
            console.log(`   Supervisor: ${francisco.supervisor_nombre}`);
            console.log('');
            
            console.log(`👩‍💼 Andrea: ID ${andrea.id} - ${andrea.nombre}`);
            console.log(`   Cargo: ${andrea.cargo}`);
            console.log(`   Es supervisor: ${andrea.es_supervisor}`);
            console.log('');
            
            // Verificar solicitudes de Francisco
            const { data: solicitudesFrancisco } = await supabase
                .from('solicitudes_permisos')
                .select('*')
                .eq('empleado_id', francisco.id);
                
            console.log(`📋 Solicitudes de Francisco: ${solicitudesFrancisco ? solicitudesFrancisco.length : 0}`);
            if (solicitudesFrancisco && solicitudesFrancisco.length > 0) {
                solicitudesFrancisco.forEach(sol => {
                    console.log(`   - ID: ${sol.id}, Estado: ${sol.estado}, Fecha: ${sol.fecha_desde}`);
                });
            }
            
            // Verificar usuarios
            console.log('\n🔑 USUARIOS:');
            const { data: userFrancisco } = await supabase
                .from('usuarios')
                .select('*')
                .eq('empleado_id', francisco.id)
                .single();
                
            const { data: userAndrea } = await supabase
                .from('usuarios')
                .select('*')
                .eq('empleado_id', andrea.id)
                .single();
                
            if (userFrancisco) {
                console.log(`✅ Francisco: ${userFrancisco.username} (activo: ${userFrancisco.activo})`);
            } else {
                console.log('❌ Usuario de Francisco no encontrado');
            }
            
            if (userAndrea) {
                console.log(`✅ Andrea: ${userAndrea.username} (activo: ${userAndrea.activo})`);
            } else {
                console.log('❌ Usuario de Andrea no encontrado');
            }
        }
        
        console.log('\n🎯 SISTEMA LISTO PARA PRUEBAS:');
        console.log('==============================');
        console.log('1. Ve a: https://permisosadministrativos.netlify.app');
        console.log('2. Prueba login con Francisco: francisco.mancilla / francisco123');
        console.log('3. Prueba login con Andrea: andrea.naguelquin / andrea123');
        console.log('4. Verifica que Andrea puede ver y aprobar solicitudes de Francisco');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

verificarSolicitudes();