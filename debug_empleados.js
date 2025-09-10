const db = require('./database/db_config');

async function debugEmpleados() {
    try {
        console.log('=== DEBUG: Empleados en la base de datos ===');
        
        // Obtener todos los empleados activos
        const empleados = await db.query('SELECT id, numero, nombre, rut, cargo, activo FROM empleados ORDER BY nombre');
        
        console.log(`\n🔍 Total de empleados encontrados: ${empleados.length}\n`);
        
        empleados.forEach((emp, index) => {
            console.log(`${index + 1}. ID: ${emp.id}`);
            console.log(`   Número: ${emp.numero}`);
            console.log(`   Nombre: ${emp.nombre}`);
            console.log(`   RUT: ${emp.rut}`);
            console.log(`   Cargo: ${emp.cargo}`);
            console.log(`   Activo: ${emp.activo ? 'Sí' : 'No'}`);
            console.log('   -------------------');
        });
        
        // Buscar específicamente nombres con Manuel
        const manueles = await db.query("SELECT * FROM empleados WHERE nombre LIKE '%manuel%' OR nombre LIKE '%Manuel%'");
        console.log(`\n🔍 Empleados con 'Manuel' en el nombre: ${manueles.length}`);
        manueles.forEach((emp) => {
            console.log(`   - ${emp.nombre} (${emp.rut})`);
        });
        
        // Buscar específicamente Bahamonde
        const bahamondes = await db.query("SELECT * FROM empleados WHERE nombre LIKE '%bahamonde%' OR nombre LIKE '%Bahamonde%'");
        console.log(`\n🔍 Empleados con 'Bahamonde' en el nombre: ${bahamondes.length}`);
        bahamondes.forEach((emp) => {
            console.log(`   - ${emp.nombre} (${emp.rut})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error consultando empleados:', error);
        process.exit(1);
    }
}

debugEmpleados();