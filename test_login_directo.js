const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizarRUT(rut) {
    return rut.replace(/\./g, '').replace(/-/g, '');
}

async function testLoginDirecto() {
    try {
        console.log('🔐 PROBANDO LOGIN DIRECTO\n');
        
        // Credenciales a probar
        const credenciales = [
            { nombre: 'Andrea', rut: '15.582.779-3', password: 'andrea123' },
            { nombre: 'Francisco', rut: '17.238.098-0', password: 'francisco123' }
        ];
        
        for (const cred of credenciales) {
            console.log(`👤 PROBANDO: ${cred.nombre}`);
            console.log(`   RUT: ${cred.rut}`);
            console.log(`   Password: ${cred.password}`);
            
            const rutNormalizado = normalizarRUT(cred.rut);
            console.log(`   RUT normalizado: ${rutNormalizado}`);
            
            // 1. Buscar empleado
            const { data: empleados, error: empError } = await supabase
                .from('empleados')
                .select('*')
                .eq('activo', true);
                
            if (empError) {
                console.error('❌ Error consultando empleados:', empError);
                continue;
            }
            
            const empleado = empleados.find(emp => 
                normalizarRUT(emp.rut) === rutNormalizado
            );
            
            if (!empleado) {
                console.log('❌ Empleado no encontrado');
                continue;
            }
            
            console.log(`✅ Empleado encontrado: ${empleado.nombre} (ID: ${empleado.id})`);
            
            // 2. Buscar usuario
            const { data: usuario, error: userError } = await supabase
                .from('usuarios')
                .select('password_hash, username, activo')
                .eq('empleado_id', empleado.id)
                .eq('activo', true)
                .single();
                
            if (userError) {
                console.error('❌ Error buscando usuario:', userError);
                continue;
            }
            
            if (!usuario) {
                console.log('❌ Usuario no encontrado');
                continue;
            }
            
            console.log(`✅ Usuario encontrado: ${usuario.username}`);
            console.log(`   Password hash: ${usuario.password_hash.substring(0, 30)}...`);
            
            // 3. Validar contraseña
            try {
                const passwordValid = await bcrypt.compare(cred.password, usuario.password_hash);
                console.log(`🔍 Contraseña válida: ${passwordValid}`);
                
                if (passwordValid) {
                    console.log('🎉 ¡LOGIN EXITOSO!\n');
                } else {
                    console.log('❌ Contraseña incorrecta\n');
                }
            } catch (bcryptError) {
                console.error('❌ Error bcrypt:', bcryptError);
            }
            
            console.log('------------------------\n');
        }
        
        // Verificar también que bcrypt funcione correctamente
        console.log('🔍 VERIFICANDO BCRYPT:');
        
        const testPassword = 'andrea123';
        const testHash = await bcrypt.hash(testPassword, 10);
        console.log(`Hash generado: ${testHash}`);
        
        const testValid = await bcrypt.compare(testPassword, testHash);
        console.log(`Validación test: ${testValid}`);
        
        // Verificar hash específico de Andrea
        const { data: andreaUser } = await supabase
            .from('usuarios')
            .select('password_hash')
            .eq('empleado_id', 46)
            .single();
            
        if (andreaUser) {
            console.log(`Hash Andrea: ${andreaUser.password_hash}`);
            const andreaValid = await bcrypt.compare('andrea123', andreaUser.password_hash);
            console.log(`Andrea password test: ${andreaValid}`);
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

testLoginDirecto();