const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const supabaseUrl = 'https://kxdrtufgjrfnksylvtnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZHJ0dWZnanJmbmtzeWx2dG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODA5NDMsImV4cCI6MjA1MjQ1Njk0M30.5FNaYqHUjrU9TYOzRy4FrDbm6JOFmYoxNV7xRLa4ysI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarRelacion() {
    try {
        console.log('🔍 Verificando relación supervisor-subordinado...\n');
        
        // 1. Buscar Francisco Mancilla
        const { data: francisco, error: franciscoError } = await supabase
            .from('empleados')
            .select('*')
            .ilike('nombre', '%francisco%mancilla%')
            .single();
            
        if (franciscoError) {
            console.log('❌ Error buscando Francisco:', franciscoError);
            return;
        }
        
        console.log('👤 Francisco Mancilla encontrado:');
        console.log(`   ID: ${francisco.id}`);
        console.log(`   Nombre: ${francisco.nombre}`);
        console.log(`   Supervisor ID: ${francisco.supervisor}`);
        console.log(`   Visualización: ${francisco.visualizacion}`);
        console.log(`   Autorización: ${francisco.autorizacion}\n`);
        
        // 2. Buscar Andrea Naguelquin
        const { data: andrea, error: andreaError } = await supabase
            .from('empleados')
            .select('*')
            .ilike('nombre', '%andrea%naguelquin%')
            .single();
            
        if (andreaError) {
            console.log('❌ Error buscando Andrea:', andreaError);
            return;
        }
        
        console.log('👤 Andrea Naguelquin encontrada:');
        console.log(`   ID: ${andrea.id}`);
        console.log(`   Nombre: ${andrea.nombre}`);
        console.log(`   Supervisor ID: ${andrea.supervisor}`);
        console.log(`   Visualización: ${andrea.visualizacion}`);
        console.log(`   Autorización: ${andrea.autorizacion}\n`);
        
        // 3. Verificar la relación
        if (francisco.supervisor === andrea.id) {
            console.log('✅ Relación CORRECTA: Francisco tiene a Andrea como supervisor');
        } else {
            console.log('❌ Relación INCORRECTA:');
            console.log(`   Francisco supervisor ID: ${francisco.supervisor}`);
            console.log(`   Andrea ID: ${andrea.id}`);
            console.log('\n🔧 ARREGLANDO relación...');
            
            // Actualizar la relación
            const { error: updateError } = await supabase
                .from('empleados')
                .update({ supervisor: andrea.id })
                .eq('id', francisco.id);
                
            if (updateError) {
                console.log('❌ Error actualizando:', updateError);
            } else {
                console.log('✅ Relación actualizada correctamente');
            }
        }
        
        // 4. Buscar solicitudes de Francisco
        const { data: solicitudes, error: solicitudesError } = await supabase
            .from('solicitudes_permisos')
            .select('*')
            .eq('empleado_id', francisco.id)
            .eq('estado', 'PENDIENTE');
            
        console.log(`\n📋 Solicitudes PENDIENTES de Francisco: ${solicitudes ? solicitudes.length : 0}`);
        if (solicitudes && solicitudes.length > 0) {
            solicitudes.forEach((sol, index) => {
                console.log(`   ${index + 1}. ID: ${sol.id}, Fecha: ${sol.fecha_desde}, Motivo: ${sol.motivo}`);
            });
        }
        
    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

verificarRelacion();