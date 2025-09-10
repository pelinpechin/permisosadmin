const db = require('../database/db_config');
require('dotenv').config();

async function testEmpleadoRUT() {
    console.log('🧪 Probando búsqueda de empleados por RUT...\n');

    // Ejemplos de RUTs para probar
    const rutsTest = [
        '18208947-8',  // Con guión y puntos
        '182089478',   // Sin guión ni puntos
        '18.208.947-8', // Con puntos y guión
        '15382085-6',
        '153820856'
    ];

    try {
        // Primero, obtener algunos empleados para ver el formato de RUT en la BD
        console.log('📋 Primeros 5 empleados en la base de datos:');
        const empleados = await db.query('SELECT id, nombre, rut FROM empleados LIMIT 5');
        
        empleados.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.nombre} - RUT: "${emp.rut}"`);
        });

        console.log('\n🔍 Probando búsquedas por RUT...\n');

        for (const rut of rutsTest) {
            console.log(`Buscando RUT: "${rut}"`);
            
            // Normalizar RUT (eliminar puntos y guiones)
            const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
            console.log(`RUT normalizado: "${rutNormalizado}"`);
            
            // Buscar con query normalizada
            const resultado = await db.query(
                'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
                [rutNormalizado]
            );

            if (resultado.length > 0) {
                const emp = resultado[0];
                console.log(`✅ ENCONTRADO: ${emp.nombre} (ID: ${emp.id}, RUT BD: "${emp.rut}")`);
            } else {
                console.log('❌ NO ENCONTRADO');
            }
            console.log('---');
        }

        // Probar también búsqueda directa por RUT exacto
        console.log('\n🎯 Prueba búsqueda directa por RUT exacto:');
        const rutExacto = '18.208.947-8';
        const resultadoExacto = await db.query(
            'SELECT * FROM empleados WHERE rut = ? AND activo = 1',
            [rutExacto]
        );
        
        if (resultadoExacto.length > 0) {
            console.log(`✅ Búsqueda exacta exitosa: ${resultadoExacto[0].nombre}`);
        } else {
            console.log('❌ Búsqueda exacta falló');
        }

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testEmpleadoRUT();
}

module.exports = { testEmpleadoRUT };