// Script para probar el empleado específico
const { query } = require('./database/db_config');

async function testSpecificEmployee() {
    try {
        console.log('🔍 Probando consulta específica del empleado...');
        
        // Consulta por ID específico
        console.log('\n1. Consulta por ID: 72');
        const porId = await query('SELECT * FROM empleados WHERE id = ?', [72]);
        console.log('Resultado por ID:', porId?.[0] || 'No encontrado');
        
        // Consulta por RUT con comparación exacta
        console.log('\n2. Consulta por RUT exacto: "18.282.415-1"');
        const porRUT = await query("SELECT * FROM empleados WHERE rut = '18.282.415-1'");
        console.log('Resultado por RUT:', porRUT?.[0] || 'No encontrado');
        
        // Consulta por RUT con LIKE
        console.log('\n3. Consulta con LIKE: "%18.282.415-1%"');
        const porLike = await query("SELECT * FROM empleados WHERE rut LIKE '%18.282.415-1%'");
        console.log('Resultado con LIKE:', porLike?.[0] || 'No encontrado');
        
        // Lista todos los empleados con nombre Miguel
        console.log('\n4. Consulta por nombre: "Miguel Angel"');
        const porNombre = await query("SELECT * FROM empleados WHERE nombre LIKE '%Miguel Angel%'");
        console.log('Resultados por nombre:');
        porNombre.forEach(emp => {
            console.log(`   - ID: ${emp.id}, RUT: ${emp.rut}, Nombre: ${emp.nombre}`);
            if (emp.rut === '18.282.415-1') {
                console.log('   *** ESTE ES EL EMPLEADO CORRECTO ***');
                console.log('   Datos del CSV:');
                console.log(`     - Negociación Colectiva: ${emp.negociacion_colectiva}`);
                console.log(`     - Visualización: ${emp.visualizacion}`);
                console.log(`     - Autorización: ${emp.autorizacion}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    testSpecificEmployee().then(() => process.exit(0));
}