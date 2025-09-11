const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function buscarEmpleadosExactos() {
    try {
        console.log('🔍 BUSCANDO EMPLEADOS EXACTOS\n');
        
        // Buscar todos los empleados que contienen nombres clave
        const { data: todosEmpleados } = await supabase
            .from('empleados')
            .select('id, nombre, cargo, supervisor_nombre')
            .order('nombre');
            
        console.log(`📊 Total empleados: ${todosEmpleados.length}\n`);
        
        // Buscar Andrea
        console.log('👩‍💼 BUSCANDO ANDREA:');
        const andreas = todosEmpleados.filter(e => 
            e.nombre.toLowerCase().includes('andrea') && 
            e.nombre.toLowerCase().includes('naguelquin')
        );
        
        if (andreas.length === 0) {
            console.log('❌ No se encontró Andrea Naguelquin');
            // Buscar solo Andrea
            const soloAndreas = todosEmpleados.filter(e => 
                e.nombre.toLowerCase().includes('andrea')
            );
            console.log('📋 Empleados con "Andrea":');
            soloAndreas.forEach(emp => {
                console.log(`   ${emp.id}. ${emp.nombre} (${emp.cargo})`);
            });
        } else {
            andreas.forEach(emp => {
                console.log(`✅ ${emp.id}. ${emp.nombre} (${emp.cargo})`);
                console.log(`   Supervisor: ${emp.supervisor_nombre}`);
            });
        }
        
        // Buscar Francisco
        console.log('\n👨‍💼 BUSCANDO FRANCISCO:');
        const franciscos = todosEmpleados.filter(e => 
            e.nombre.toLowerCase().includes('francisco') && 
            e.nombre.toLowerCase().includes('mancilla')
        );
        
        if (franciscos.length === 0) {
            console.log('❌ No se encontró Francisco Mancilla');
            // Buscar solo Francisco
            const soloFranciscos = todosEmpleados.filter(e => 
                e.nombre.toLowerCase().includes('francisco')
            );
            console.log('📋 Empleados con "Francisco":');
            soloFranciscos.forEach(emp => {
                console.log(`   ${emp.id}. ${emp.nombre} (${emp.cargo})`);
            });
        } else {
            franciscos.forEach(emp => {
                console.log(`✅ ${emp.id}. ${emp.nombre} (${emp.cargo})`);
                console.log(`   Supervisor: ${emp.supervisor_nombre}`);
            });
        }
        
        // Buscar Ronny
        console.log('\n👨‍💼 BUSCANDO RONNY:');
        const ronnys = todosEmpleados.filter(e => 
            e.nombre.toLowerCase().includes('ronny')
        );
        
        ronnys.forEach(emp => {
            console.log(`✅ ${emp.id}. ${emp.nombre} (${emp.cargo})`);
        });
        
        // Buscar Nelson
        console.log('\n👨‍💼 BUSCANDO NELSON:');
        const nelsons = todosEmpleados.filter(e => 
            e.nombre.toLowerCase().includes('nelson')
        );
        
        nelsons.forEach(emp => {
            console.log(`✅ ${emp.id}. ${emp.nombre} (${emp.cargo})`);
        });
        
        // Mostrar primeros 10 empleados para verificar estructura
        console.log('\n📋 PRIMEROS 10 EMPLEADOS:');
        todosEmpleados.slice(0, 10).forEach(emp => {
            console.log(`   ${emp.id}. ${emp.nombre} (${emp.cargo})`);
            if (emp.supervisor_nombre) {
                console.log(`      → Supervisor: ${emp.supervisor_nombre}`);
            }
        });
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

buscarEmpleadosExactos();