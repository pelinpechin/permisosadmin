const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function obtenerRutsCredenciales() {
    try {
        console.log('🔑 OBTENIENDO RUTs PARA LOGIN\n');
        
        // Buscar Andrea específicamente
        const { data: andrea } = await supabase
            .from('empleados')
            .select('id, nombre, rut, cargo')
            .eq('id', 46)
            .single();
            
        // Buscar Francisco específicamente  
        const { data: francisco } = await supabase
            .from('empleados')
            .select('id, nombre, rut, cargo')
            .eq('id', 67)
            .single();
            
        console.log('👥 EMPLEADOS IDENTIFICADOS:');
        
        if (andrea) {
            console.log(`✅ Andrea: ${andrea.nombre}`);
            console.log(`   ID: ${andrea.id}, RUT: ${andrea.rut}`);
            console.log(`   Cargo: ${andrea.cargo}\n`);
        }
        
        if (francisco) {
            console.log(`✅ Francisco: ${francisco.nombre}`);
            console.log(`   ID: ${francisco.id}, RUT: ${francisco.rut}`);
            console.log(`   Cargo: ${francisco.cargo}\n`);
        }
        
        // Verificar usuarios
        console.log('🔑 VERIFICANDO USUARIOS:');
        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('username, empleado_id')
            .in('empleado_id', [46, 67]);
            
        usuarios.forEach(user => {
            console.log(`✅ ${user.username} → Empleado ID: ${user.empleado_id}`);
        });
        
        console.log('\n🚀 CREDENCIALES CORRECTAS PARA LOGIN:');
        console.log('====================================');
        
        if (andrea) {
            console.log('👩‍💼 ANDREA NAGUELQUIN (Supervisora):');
            console.log(`   📋 RUT: ${andrea.rut}`);
            console.log('   🔒 Contraseña: andrea123');
            console.log('   💼 Rol: Puede aprobar solicitudes de Francisco');
            console.log('');
        }
        
        if (francisco) {
            console.log('👨‍💼 FRANCISCO MANCILLA (Empleado):');
            console.log(`   📋 RUT: ${francisco.rut}`);
            console.log('   🔒 Contraseña: francisco123');
            console.log('   💼 Rol: Puede crear solicitudes');
            console.log('');
        }
        
        console.log('🌐 URL: https://permisosadministrativos.netlify.app');
        console.log('');
        console.log('📝 PASOS PARA LOGIN:');
        console.log('1. Abrir la URL del sistema');
        console.log('2. En "RUT": Copiar y pegar el RUT exacto');
        console.log('3. En "Contraseña": Escribir la contraseña');
        console.log('4. Click "Iniciar Sesión"');
        
        // También mostrar otros usuarios disponibles
        console.log('\n👥 OTROS USUARIOS DISPONIBLES:');
        
        const { data: ronny } = await supabase
            .from('empleados')
            .select('nombre, rut')
            .eq('id', 44)
            .single();
            
        const { data: nelson } = await supabase
            .from('empleados')
            .select('nombre, rut')
            .eq('id', 42)
            .single();
            
        if (ronny) {
            console.log(`🔑 Ronny Cisterna (Admin): RUT ${ronny.rut}, Password: ronny123`);
        }
        
        if (nelson) {
            console.log(`🔑 Nelson Bravo (Director): RUT ${nelson.rut}, Password: nelson123`);
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

obtenerRutsCredenciales();