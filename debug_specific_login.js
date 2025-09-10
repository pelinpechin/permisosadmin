const db = require('./database/db_config');

async function testSpecificLogin() {
    try {
        console.log('=== DEBUG: Prueba de login específico ===');
        
        // Simular el login con un RUT específico diferente a Manuel Bahamonde
        const testRut = "18.208.947-8"; // Guillermo David Barria Uribe
        
        console.log(`\n🔍 Probando login con RUT: ${testRut}`);
        
        // Intentar primero búsqueda directa por RUT
        console.log('🔍 Buscando empleado con RUT directo...');
        let empleado = await db.get(
            'SELECT * FROM empleados WHERE rut = ? AND activo = 1',
            [testRut]
        );
        
        if (!empleado) {
            console.log('🔍 No encontrado con RUT directo, intentando normalización...');
            const rutLimpio = testRut.replace(/[\.-]/g, '');
            empleado = await db.get(
                'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
                [rutLimpio]
            );
        }
        
        if (empleado) {
            console.log('✅ Empleado encontrado:');
            console.log(`   ID: ${empleado.id}`);
            console.log(`   Nombre: ${empleado.nombre}`);
            console.log(`   RUT: ${empleado.rut}`);
            console.log(`   Cargo: ${empleado.cargo}`);
            
            // Simular creación del token como en auth.js
            const tokenData = {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo,
                type: 'empleado'
            };
            
            console.log('\n📋 Datos que se pondrían en el token:');
            console.log(JSON.stringify(tokenData, null, 2));
            
        } else {
            console.log('❌ No se encontró el empleado');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error en test de login:', error);
        process.exit(1);
    }
}

testSpecificLogin();