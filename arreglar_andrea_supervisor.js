// Script para arreglar los permisos de Andrea y la relación con Francisco
const { default: fetch } = require('node-fetch');

async function arreglarRelacion() {
    try {
        console.log('🔧 Arreglando permisos de supervisión...\n');
        
        const supabaseUrl = 'https://kxdrtufgjrfnksylvtnh.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZHJ0dWZnanJmbmtzeWx2dG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODA5NDMsImV4cCI6MjA1MjQ1Njk0M30.5FNaYqHUjrU9TYOzRy4FrDbm6JOFmYoxNV7xRLa4ysI';
        
        // 1. Buscar Andrea Naguelquin
        console.log('🔍 1. Buscando Andrea Naguelquin...');
        const andreaResponse = await fetch(`${supabaseUrl}/rest/v1/empleados?nombre=ilike.*andrea*naguelquin*`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const andreaData = await andreaResponse.json();
        
        if (!andreaData || andreaData.length === 0) {
            console.log('❌ No se encontró Andrea Naguelquin');
            return;
        }
        
        const andrea = andreaData[0];
        console.log(`✅ Andrea encontrada - ID: ${andrea.id}, Nombre: ${andrea.nombre}`);
        console.log(`   Visualización actual: ${andrea.visualizacion}`);
        console.log(`   Autorización actual: ${andrea.autorizacion}\n`);
        
        // 2. Dar permisos de supervisor a Andrea
        console.log('🔧 2. Actualizando permisos de Andrea...');
        const updateAndreaResponse = await fetch(`${supabaseUrl}/rest/v1/empleados?id=eq.${andrea.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                visualizacion: true,
                autorizacion: true
            })
        });
        
        if (updateAndreaResponse.ok) {
            console.log('✅ Permisos de Andrea actualizados correctamente\n');
        } else {
            console.log('❌ Error actualizando permisos de Andrea');
            console.log(await updateAndreaResponse.text());
            return;
        }
        
        // 3. Buscar Francisco Mancilla
        console.log('🔍 3. Buscando Francisco Mancilla...');
        const franciscoResponse = await fetch(`${supabaseUrl}/rest/v1/empleados?nombre=ilike.*francisco*mancilla*`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const franciscoData = await franciscoResponse.json();
        
        if (!franciscoData || franciscoData.length === 0) {
            console.log('❌ No se encontró Francisco Mancilla');
            return;
        }
        
        const francisco = franciscoData[0];
        console.log(`✅ Francisco encontrado - ID: ${francisco.id}, Nombre: ${francisco.nombre}`);
        console.log(`   Supervisor actual: ${francisco.supervisor}\n`);
        
        // 4. Asignar Andrea como supervisor de Francisco
        console.log('🔧 4. Asignando Andrea como supervisor de Francisco...');
        const updateFranciscoResponse = await fetch(`${supabaseUrl}/rest/v1/empleados?id=eq.${francisco.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                supervisor: andrea.id
            })
        });
        
        if (updateFranciscoResponse.ok) {
            console.log('✅ Francisco ahora tiene a Andrea como supervisor\n');
        } else {
            console.log('❌ Error asignando supervisor a Francisco');
            console.log(await updateFranciscoResponse.text());
            return;
        }
        
        // 5. Verificar solicitudes pendientes de Francisco
        console.log('🔍 5. Verificando solicitudes pendientes de Francisco...');
        const solicitudesResponse = await fetch(`${supabaseUrl}/rest/v1/solicitudes_permisos?empleado_id=eq.${francisco.id}&estado=eq.PENDIENTE`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const solicitudesData = await solicitudesResponse.json();
        console.log(`📋 Solicitudes PENDIENTES de Francisco: ${solicitudesData.length}`);
        
        if (solicitudesData.length === 0) {
            console.log('⚠️ Francisco no tiene solicitudes PENDIENTES');
            console.log('   Andrea solo verá solicitudes en estado PENDIENTE');
        } else {
            solicitudesData.forEach((sol, index) => {
                console.log(`   ${index + 1}. ID: ${sol.id}, Estado: ${sol.estado}, Fecha: ${sol.fecha_desde}`);
            });
        }
        
        console.log('\n✅ ¡PROCESO COMPLETADO!');
        console.log('📝 Resumen:');
        console.log(`   - Andrea (ID: ${andrea.id}) ahora tiene permisos de supervisión`);
        console.log(`   - Francisco (ID: ${francisco.id}) tiene a Andrea como supervisor`);
        console.log(`   - Andrea debería ver ${solicitudesData.length} solicitudes pendientes de Francisco`);
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

arreglarRelacion();