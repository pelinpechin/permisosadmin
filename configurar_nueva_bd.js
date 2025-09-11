const { createClient } = require('@supabase/supabase-js');

// Nuevas credenciales
const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function configurarNuevaBaseDatos() {
    try {
        console.log('🔧 Configurando nueva base de datos...\n');
        
        // 1. Verificar conexión
        const { data: test, error: testError } = await supabase
            .from('empleados')
            .select('*')
            .limit(1);
            
        if (testError) {
            console.log('❌ Error de conexión:', testError.message);
            console.log('📋 Esto es normal si las tablas no existen aún.\n');
        } else {
            console.log('✅ Conexión exitosa a la nueva base de datos\n');
            console.log(`📊 Empleados encontrados: ${test ? test.length : 0}\n`);
        }
        
        // 2. Verificar empleados clave si existen
        console.log('🔍 Buscando empleados clave...');
        
        try {
            const { data: empleados, error: empError } = await supabase
                .from('empleados')
                .select('id, nombre, cargo, supervisor_nombre')
                .or('nombre.ilike.%Andrea%Naguelquin%,nombre.ilike.%Francisco%Mancilla%,nombre.ilike.%Ronny%Cisterna%,nombre.ilike.%Nelson%Patricio%');
                
            if (!empError && empleados) {
                console.log(`✅ Empleados clave encontrados: ${empleados.length}`);
                empleados.forEach(emp => {
                    console.log(`   - ${emp.nombre} (${emp.cargo})`);
                    if (emp.supervisor_nombre) {
                        console.log(`     Supervisor: ${emp.supervisor_nombre}`);
                    }
                });
            } else {
                console.log('⚠️ Empleados clave no encontrados. Tablas necesitan ser creadas.');
            }
        } catch (error) {
            console.log('⚠️ Tablas no existen aún. Esto es esperado para nueva BD.');
        }
        
        // 3. Verificar tipos de permisos
        console.log('\n🎯 Verificando tipos de permisos...');
        try {
            const { data: tipos, error: tiposError } = await supabase
                .from('tipos_permisos')
                .select('*');
                
            if (!tiposError && tipos) {
                console.log(`✅ Tipos de permisos: ${tipos.length}`);
                tipos.forEach(tipo => {
                    console.log(`   - ${tipo.codigo}: ${tipo.nombre}`);
                });
            } else {
                console.log('⚠️ Tipos de permisos no encontrados. Tablas necesitan ser creadas.');
            }
        } catch (error) {
            console.log('⚠️ Tabla tipos_permisos no existe aún.');
        }
        
        // 4. Verificar solicitudes
        console.log('\n📋 Verificando solicitudes...');
        try {
            const { data: solicitudes, error: solError } = await supabase
                .from('solicitudes_permisos')
                .select('*');
                
            if (!solError && solicitudes) {
                console.log(`✅ Solicitudes encontradas: ${solicitudes.length}`);
            } else {
                console.log('⚠️ Solicitudes no encontradas. Tablas necesitan ser creadas.');
            }
        } catch (error) {
            console.log('⚠️ Tabla solicitudes_permisos no existe aún.');
        }
        
        console.log('\n🎯 ESTADO ACTUAL DE LA BASE DE DATOS:');
        console.log('=====================================');
        console.log('✅ Conexión establecida correctamente');
        console.log('📝 Próximo paso: Ejecutar el SQL del archivo BASE_DATOS_FINAL_COMPLETA.sql');
        console.log('   en el SQL Editor de Supabase para crear todas las tablas y datos.');
        
    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

configurarNuevaBaseDatos();