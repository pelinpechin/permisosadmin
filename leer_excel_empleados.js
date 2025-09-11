const XLSX = require('xlsx');
const path = require('path');

function leerEmpleadosDesdeExcel() {
    try {
        console.log('📊 Leyendo archivo Excel de empleados...\n');
        
        const filePath = path.join(__dirname, '2025-08-28 Nuevo reporte de Maestro de empleados 2025-07-01 - 2025-07-31.xlsx');
        
        // Leer el archivo Excel
        const workbook = XLSX.readFile(filePath);
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const empleados = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📋 EMPLEADOS ENCONTRADOS EN EXCEL: ${empleados.length}\n`);
        console.log('👥 LISTA DE EMPLEADOS:');
        console.log('=====================\n');
        
        empleados.forEach((emp, i) => {
            console.log(`${i + 1}. EMPLEADO:`);
            console.log(`   Columnas disponibles:`, Object.keys(emp));
            console.log(`   Datos:`, emp);
            console.log('');
        });
        
        // Detectar columnas relevantes
        if (empleados.length > 0) {
            const primeraFila = empleados[0];
            const columnas = Object.keys(primeraFila);
            
            console.log('\n🔍 COLUMNAS DETECTADAS:');
            console.log('======================');
            columnas.forEach((col, i) => {
                console.log(`${i + 1}. ${col}`);
            });
            
            // Buscar columnas que podrían ser nombre, rut, cargo, supervisor
            const posiblesNombres = columnas.filter(col => 
                col.toLowerCase().includes('nombre') || 
                col.toLowerCase().includes('empleado') ||
                col.toLowerCase().includes('trabajador')
            );
            
            const posiblesRuts = columnas.filter(col => 
                col.toLowerCase().includes('rut') || 
                col.toLowerCase().includes('run') ||
                col.toLowerCase().includes('cedula')
            );
            
            const posiblesCargos = columnas.filter(col => 
                col.toLowerCase().includes('cargo') || 
                col.toLowerCase().includes('puesto') ||
                col.toLowerCase().includes('funcion')
            );
            
            const posiblesSupervisores = columnas.filter(col => 
                col.toLowerCase().includes('supervisor') || 
                col.toLowerCase().includes('jefe') ||
                col.toLowerCase().includes('superior')
            );
            
            console.log('\n🎯 COLUMNAS RELEVANTES DETECTADAS:');
            console.log('==================================');
            console.log('Posibles NOMBRES:', posiblesNombres);
            console.log('Posibles RUTs:', posiblesRuts);
            console.log('Posibles CARGOS:', posiblesCargos);
            console.log('Posibles SUPERVISORES:', posiblesSupervisores);
        }
        
    } catch (error) {
        console.error('💥 Error leyendo Excel:', error.message);
    }
}

leerEmpleadosDesdeExcel();