// Script para verificar si los datos del CSV están en Supabase
const { query } = require('./database/db_config');

async function verificarDatosCSV() {
    try {
        console.log('🔍 Verificando datos del CSV en la base de datos...');
        
        // Primero, buscar empleados que contengan "18.282" para ver si existe
        console.log('Buscando empleados que contengan "18.282"...');
        const empleadosConRUT = await query(
            'SELECT id, rut, nombre FROM empleados WHERE rut LIKE ?',
            ['%18.282%']
        );
        
        console.log('Empleados encontrados con "18.282":');
        empleadosConRUT.forEach(emp => {
            console.log(`   - ID: ${emp.id}, RUT: ${emp.rut}, Nombre: ${emp.nombre}`);
        });
        
        if (empleadosConRUT.length === 0) {
            console.log('❌ No se encontró ningún empleado con RUT que contenga "18.282"');
            console.log('\nMostrando 10 empleados de ejemplo:');
            const ejemplos = await query('SELECT id, rut, nombre FROM empleados LIMIT 10');
            ejemplos.forEach(emp => {
                console.log(`   - ID: ${emp.id}, RUT: ${emp.rut}, Nombre: ${emp.nombre}`);
            });
            return;
        }
        
        // Verificar el empleado específico (RUT: 18.282.415-1)
        console.log('\nBuscando empleado exacto con RUT: 18.282.415-1');
        let empleado = await query(
            'SELECT * FROM empleados WHERE rut = ?',
            ['18.282.415-1']
        );
        
        if (!empleado || empleado.length === 0) {
            console.log('❌ Empleado no encontrado con RUT exacto. Buscando variaciones...');
            
            // Buscar con variaciones del RUT
            const variaciones = [
                '18282415-1',
                '18.282.415-1',
                '182824151'
            ];
            
            for (const rut of variaciones) {
                empleado = await query(
                    'SELECT * FROM empleados WHERE rut = ? OR REPLACE(REPLACE(rut, ".", ""), "-", "") = ?',
                    [rut, rut.replace(/[\.\-]/g, '')]
                );
                
                if (empleado && empleado.length > 0) {
                    console.log(`✅ Empleado encontrado con variación: ${rut}`);
                    break;
                }
            }
            
            if (!empleado || empleado.length === 0) {
                console.log('❌ Empleado no encontrado con ninguna variación. Listando algunos empleados...');
                const algunos = await query('SELECT id, rut, nombre FROM empleados LIMIT 5');
                console.log('Empleados en la base de datos:');
                algunos.forEach(emp => {
                    console.log(`   - ID: ${emp.id}, RUT: ${emp.rut}, Nombre: ${emp.nombre}`);
                });
                return;
            }
        }
        
        if (empleado && empleado.length > 0) {
            const emp = empleado[0];
            console.log('📊 Datos del empleado encontrado:');
            console.log('   - ID:', emp.id);
            console.log('   - Nombre:', emp.nombre);
            console.log('   - RUT:', emp.rut);
            console.log('   - Cargo:', emp.cargo);
            console.log('');
            console.log('📋 Datos del CSV:');
            console.log('   - Negociación Colectiva:', emp.negociacion_colectiva);
            console.log('   - Supervisor Visualización:', emp.visualizacion);
            console.log('   - Supervisor Autorización:', emp.autorizacion);
            console.log('   - Uso 1er Semestre:', emp.uso_primer_semestre);
            console.log('   - Uso 2do Semestre:', emp.uso_segundo_semestre);
            console.log('   - Sin Goce:', emp.sin_goce);
            console.log('   - Atrasos:', emp.atrasos);
            console.log('   - Licencias Total:', emp.licencias_total);
            console.log('   - No Marcaciones:', emp.no_marcaciones);
            
            // Verificar si los campos del CSV existen
            const camposCSV = [
                'negociacion_colectiva', 'visualizacion', 'autorizacion',
                'uso_primer_semestre', 'uso_segundo_semestre', 'sin_goce',
                'atrasos', 'licencias_total', 'no_marcaciones'
            ];
            
            const camposFaltantes = camposCSV.filter(campo => emp[campo] === undefined);
            
            if (camposFaltantes.length > 0) {
                console.log('❌ Campos faltantes:', camposFaltantes);
            } else {
                console.log('✅ Todos los campos del CSV están presentes');
            }
            
        } else {
            console.log('❌ Empleado no encontrado con RUT: 18.282.415-1');
        }
        
        // Verificar la estructura de la tabla
        console.log('\n🗃️ Verificando estructura de la tabla empleados...');
        const columnas = await query("PRAGMA table_info(empleados)");
        console.log('Columnas encontradas:');
        columnas.forEach(col => {
            console.log(`   - ${col.name} (${col.type})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    verificarDatosCSV().then(() => process.exit(0));
}

module.exports = { verificarDatosCSV };