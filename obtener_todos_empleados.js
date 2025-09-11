const { default: fetch } = require('node-fetch');

async function obtenerTodosLosEmpleados() {
    try {
        console.log('🔍 Obteniendo todos los empleados de la BD actual...\n');
        
        const supabaseUrl = 'https://kxdrtufgjrfnksylvtnh.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZHJ0dWZnanJmbmtzeWx2dG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4ODA5NDMsImV4cCI6MjA1MjQ1Njk0M30.5FNaYqHUjrU9TYOzRy4FrDbm6JOFmYoxNV7xRLa4ysI';
        
        const response = await fetch(`${supabaseUrl}/rest/v1/empleados?select=*`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const empleados = await response.json();
        
        console.log('👥 EMPLEADOS ENCONTRADOS EN LA BD ACTUAL:');
        console.log('==========================================');
        
        empleados.forEach((emp, i) => {
            console.log(`${i+1}. ${emp.nombre}`);
            console.log(`   RUT: ${emp.rut || 'N/A'}`);
            console.log(`   Cargo: ${emp.cargo || 'N/A'}`);
            console.log(`   Supervisor: ${emp.supervisor || 'N/A'}`);
            console.log(`   Visualización: ${emp.visualizacion}, Autorización: ${emp.autorizacion}`);
            console.log(`   Activo: ${emp.activo}`);
            console.log('');
        });
        
        console.log(`📊 TOTAL: ${empleados.length} empleados encontrados\n`);
        
        // Generar SQL para insertar todos estos empleados
        console.log('📝 SQL PARA INSERTAR EN LA NUEVA BD:');
        console.log('====================================');
        
        empleados.forEach((emp, i) => {
            const rut = emp.rut || `${12345678 + i}-${i}`;
            const cargo = emp.cargo || 'Empleado';
            const esSupervisor = emp.visualizacion && emp.autorizacion ? 'true' : 'false';
            const esAdmin = emp.autorizacion ? 'true' : 'false';
            
            console.log(`INSERT INTO empleados (rut, nombre, cargo, es_supervisor, es_admin) VALUES`);
            console.log(`('${rut}', '${emp.nombre.replace(/'/g, "''")}', '${cargo}', ${esSupervisor}, ${esAdmin});`);
        });
        
        console.log('\n🔐 GENERAR USUARIOS PARA TODOS:');
        console.log('===============================');
        
        empleados.forEach((emp, i) => {
            const username = emp.nombre.toLowerCase()
                .replace(/\s+/g, '.')
                .replace(/[áàäâ]/g, 'a')
                .replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i')
                .replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u')
                .replace(/[ñ]/g, 'n')
                .replace(/[^a-z0-9.]/g, '');
                
            console.log(`-- ${emp.nombre}`);
            console.log(`INSERT INTO usuarios (empleado_id, username, password_hash) VALUES`);
            console.log(`(${i+1}, '${username}', '$2b$10$placeholder'); -- Password: ${username.split('.')[0]}123`);
            console.log('');
        });
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

obtenerTodosLosEmpleados();