const { createClient } = require('@supabase/supabase-js');

// Configuración de la base de datos actual
const supabaseUrl = 'https://kxdrtufgjrfnksylvtnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZHJ0dWZnanJmbmtzeWx2dG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODA5NDMsImV4cCI6MjA1MjQ1Njk0M30.5FNaYqHUjrU9TYOzRy4FrDbm6JOFmYoxNV7xRLa4ysI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function extraerEmpleadosReales() {
    try {
        console.log('🔍 Extrayendo empleados reales de la base de datos actual...\n');
        
        const { data: empleados, error } = await supabase
            .from('empleados')
            .select('*')
            .order('nombre');
            
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        console.log('👥 EMPLEADOS REALES ENCONTRADOS:');
        console.log('================================\n');
        
        empleados.forEach((emp, i) => {
            console.log(`${i + 1}. ${emp.nombre}`);
            console.log(`   RUT: ${emp.rut || 'N/A'}`);
            console.log(`   Cargo: ${emp.cargo || 'N/A'}`);
            console.log(`   Supervisor: ${emp.supervisor || 'N/A'}`);
            console.log(`   Visualización: ${emp.visualizacion}, Autorización: ${emp.autorizacion}`);
            console.log(`   Activo: ${emp.activo}`);
            console.log('');
        });
        
        console.log(`\n📊 TOTAL: ${empleados.length} empleados reales\n`);
        
        // Generar SQL para la nueva base de datos
        console.log('📝 SQL PARA INSERTAR EN LA NUEVA BASE DE DATOS:');
        console.log('===============================================\n');
        
        empleados.forEach((emp, i) => {
            const rut = emp.rut || `temp-${i + 1}`;
            const cargo = emp.cargo || 'Empleado';
            const esSupervisor = (emp.visualizacion && emp.autorizacion) ? 'true' : 'false';
            const esAdmin = emp.autorizacion ? 'true' : 'false';
            
            console.log(`('${rut}', '${emp.nombre.replace(/'/g, "''")}', '${cargo}', ${esSupervisor}, ${esAdmin}),`);
        });
        
        console.log('\n🔐 USUARIOS PARA TODOS:');
        console.log('======================\n');
        
        empleados.forEach((emp, i) => {
            const username = emp.nombre.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
                .replace(/\s+/g, '.')
                .replace(/[^a-z0-9.]/g, '');
                
            const password = username.split('.')[0] + '123';
            
            console.log(`(${i + 1}, '${username}', '$2b$10$placeholder'), -- ${emp.nombre} - Password: ${password}`);
        });
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

extraerEmpleadosReales();