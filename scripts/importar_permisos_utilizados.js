// Script para importar datos de permisos utilizados desde tablas.csv
const fs = require('fs');
const path = require('path');
const { supabase } = require('../database/supabase');

async function importarPermisosUtilizados() {
    try {
        console.log('📊 Iniciando importación de permisos utilizados...');
        
        // Leer el archivo CSV
        const csvPath = path.join(__dirname, '..', 'tablas.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n');
        
        console.log(`📄 Archivo leído: ${lines.length} líneas`);
        
        // Encontrar la línea de encabezados (línea 4, índice 3)
        const headerLine = lines[3];
        const headers = headerLine.split(';');
        
        console.log('📋 Encabezados encontrados:');
        console.log('   - RUT:', headers[0]);
        console.log('   - Negociación Colectiva:', headers[1]);
        console.log('   - Visualización:', headers[2]);
        console.log('   - Autorización:', headers[3]);
        console.log('   - Uso 1° Semestre:', headers[4]);
        console.log('   - Uso 2° Semestre:', headers[5]);
        console.log('   - Sin Goce:', headers[6]);
        console.log('   - Beneficio Licencia:', headers[7]);
        console.log('   - Licencias Total:', headers[8]);
        console.log('   - Atrasos:', headers[9]);
        console.log('   - Atrasos Justificados:', headers[10]);
        console.log('   - No Marcaciones:', headers[11]);
        
        let actualizados = 0;
        let errores = 0;
        
        // Procesar cada línea de datos (desde línea 5)
        for (let i = 4; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(';');
            
            // Extraer datos básicos
            const rutOriginal = columns[0];
            const negociacionColectiva = columns[1] === 'SI';
            const visualizacion = columns[2] || null;
            const autorizacion = columns[3] || null;
            const usoPrimerSemestre = parseFloat(columns[4]) || 0;
            const usoSegundoSemestre = parseFloat(columns[5]) || 0;
            const sinGoce = parseInt(columns[6]) || 0;
            const beneficioLicencia = parseInt(columns[7]) || 0;
            const licenciasTotal = parseInt(columns[8]) || 0;
            const atrasos = parseInt(columns[9]) || 0;
            const atrasosJustificados = parseInt(columns[10]) || 0;
            const noMarcaciones = parseInt(columns[11]) || 0;
            
            if (!rutOriginal) continue;
            
            try {
                console.log(`\n👤 Procesando: ${rutOriginal}`);
                
                // Normalizar RUT CSV (quitar puntos y guiones)
                const rutCSVNormalizado = rutOriginal.replace(/\./g, '').replace(/-/g, '').toUpperCase();
                
                // Obtener todos los empleados y buscar por RUT normalizado
                const { data: todosEmpleados, error: searchError } = await supabase
                    .from('empleados')
                    .select('id, rut, nombre');
                    
                if (searchError) {
                    console.error(`❌ Error obteniendo empleados:`, searchError);
                    errores++;
                    continue;
                }
                
                // Buscar empleado comparando RUTs normalizados (sin ceros iniciales)
                const rutCSVSinCeros = rutCSVNormalizado.replace(/^0+/, ''); // Quitar ceros iniciales
                const empleados = todosEmpleados.filter(emp => {
                    const rutDBNormalizado = emp.rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
                    const rutDBSinCeros = rutDBNormalizado.replace(/^0+/, ''); // Quitar ceros iniciales
                    return rutDBSinCeros === rutCSVSinCeros || rutDBNormalizado === rutCSVNormalizado;
                });
                
                if (!empleados || empleados.length === 0) {
                    console.log(`⚠️ Empleado no encontrado: ${rutOriginal}`);
                    errores++;
                    continue;
                }
                
                const empleado = empleados[0];
                console.log(`✅ Empleado encontrado: ${empleado.nombre} (ID: ${empleado.id})`);
                
                // Actualizar datos del empleado
                const updateData = {
                    negociacion_colectiva: negociacionColectiva,
                    visualizacion: visualizacion,
                    autorizacion: autorizacion,
                    uso_primer_semestre: usoPrimerSemestre,
                    uso_segundo_semestre: usoSegundoSemestre,
                    sin_goce: sinGoce,
                    beneficio_licencia: beneficioLicencia,
                    licencias_total: licenciasTotal,
                    atrasos: atrasos,
                    atrasos_justificados: atrasosJustificados,
                    no_marcaciones: noMarcaciones
                };
                
                const { error: updateError } = await supabase
                    .from('empleados')
                    .update(updateData)
                    .eq('id', empleado.id);
                
                if (updateError) {
                    console.error(`❌ Error actualizando empleado ${empleado.nombre}:`, updateError);
                    errores++;
                } else {
                    console.log(`✅ Empleado actualizado: ${empleado.nombre}`);
                    console.log(`   - Uso 1° Sem: ${usoPrimerSemestre}, 2° Sem: ${usoSegundoSemestre}`);
                    console.log(`   - Sin goce: ${sinGoce}, Atrasos: ${atrasos}, Licencias: ${licenciasTotal}`);
                    actualizados++;
                }
                
            } catch (err) {
                console.error(`❌ Error procesando ${rutOriginal}:`, err);
                errores++;
            }
        }
        
        console.log('\n🎉 Importación completada:');
        console.log(`   ✅ Empleados actualizados: ${actualizados}`);
        console.log(`   ❌ Errores: ${errores}`);
        
        return { actualizados, errores };
        
    } catch (error) {
        console.error('❌ Error en importación:', error);
        throw error;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    importarPermisosUtilizados()
        .then((result) => {
            console.log('\n✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

module.exports = { importarPermisosUtilizados };