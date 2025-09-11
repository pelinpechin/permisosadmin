const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarCredencialesLogin() {
    try {
        console.log('🔍 VERIFICANDO CREDENCIALES PARA LOGIN\n');
        
        // Buscar Andrea y Francisco con sus RUTs
        const { data: empleados } = await supabase
            .from('empleados')
            .select('id, nombre, rut, cargo, supervisor_nombre')
            .or('nombre.ilike.%Andrea%Naguelquin%,nombre.ilike.%Francisco%Mancilla%')
            .order('nombre');
            
        console.log('👥 EMPLEADOS PARA LOGIN:');
        empleados.forEach(emp => {
            console.log(`✅ ${emp.nombre}`);
            console.log(`   RUT: ${emp.rut}`);
            console.log(`   ID: ${emp.id}`);
            console.log(`   Cargo: ${emp.cargo}`);
            console.log(`   Supervisor: ${emp.supervisor_nombre || 'N/A'}\n`);
        });
        
        // Verificar usuarios asociados
        console.log('🔑 USUARIOS ASOCIADOS:');
        const { data: usuarios } = await supabase
            .from('usuarios')
            .select(`
                username, empleado_id, password_hash,
                empleados!inner(nombre, rut)
            `)
            .in('empleado_id', empleados.map(e => e.id));
            
        usuarios.forEach(user => {
            console.log(`✅ Usuario: ${user.username}`);
            console.log(`   Empleado: ${user.empleados.nombre}`);
            console.log(`   RUT: ${user.empleados.rut}`);
            console.log(`   Password hash: ${user.password_hash.substring(0, 20)}...`);
            console.log('');
        });
        
        console.log('🚀 CREDENCIALES PARA EL LOGIN DEL SISTEMA:');
        console.log('==========================================');
        
        const andrea = empleados.find(e => e.nombre.includes('Andrea'));
        const francisco = empleados.find(e => e.nombre.includes('Francisco'));
        
        if (andrea) {
            console.log('👩‍💼 ANDREA NAGUELQUIN (Supervisora):');
            console.log(`   RUT: ${andrea.rut}`);
            console.log('   Contraseña: andrea123');
            console.log(`   Cargo: ${andrea.cargo}`);
            console.log('');
        }
        
        if (francisco) {
            console.log('👨‍💼 FRANCISCO MANCILLA (Empleado):');
            console.log(`   RUT: ${francisco.rut}`);
            console.log('   Contraseña: francisco123');
            console.log(`   Cargo: ${francisco.cargo}`);
            console.log(`   Supervisor: ${francisco.supervisor_nombre}`);
            console.log('');
        }
        
        console.log('📝 INSTRUCCIONES DE LOGIN:');
        console.log('1. Ve a: https://permisosadministrativos.netlify.app');
        console.log('2. En el campo RUT: Usa el RUT mostrado arriba');
        console.log('3. En el campo Contraseña: Usa la contraseña mostrada');
        console.log('4. Click en "Iniciar Sesión"');
        
        // Verificar solicitudes pendientes
        console.log('\n📋 SOLICITUDES PENDIENTES:');
        const { data: solicitudes } = await supabase
            .from('solicitudes_permisos')
            .select('*')
            .eq('estado', 'PENDIENTE');
            
        console.log(`Total solicitudes pendientes: ${solicitudes.length}`);
        for (const sol of solicitudes) {
            const { data: emp } = await supabase
                .from('empleados')
                .select('nombre')
                .eq('id', sol.empleado_id)
                .single();
                
            console.log(`- ${emp.nombre}: ${sol.motivo} (${sol.fecha_desde})`);
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

verificarCredencialesLogin();