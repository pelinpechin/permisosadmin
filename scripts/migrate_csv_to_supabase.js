const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar cliente Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para convertir CSV a JSON
function csvToJson(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[5].split(';'); // La línea 6 (índice 5) tiene los headers
    
    const employees = [];
    
    for (let i = 6; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.includes(';;;;;;;;')) {
            const values = line.split(';');
            if (values.length >= 9) {
                const employee = {
                    nombre: values[0] || '',
                    rut: values[1] || '',
                    email: values[2] || '',
                    fecha_nacimiento: values[3] ? formatDate(values[3]) : null,
                    fecha_ingreso: values[4] ? formatDate(values[4]) : null,
                    fecha_termino: values[5] ? formatDate(values[5]) : null,
                    horas_semanales: parseFloat(values[6]) || 0,
                    supervisor: values[7] || '',
                    cargo: values[8] || '',
                    numero: i - 5, // Número secuencial basado en posición
                    activo: true
                };
                
                // Solo agregar si tiene datos válidos
                if (employee.nombre && employee.rut) {
                    employees.push(employee);
                }
            }
        }
    }
    
    return employees;
}

// Función para formatear fechas
function formatDate(dateStr) {
    if (!dateStr) return null;
    
    try {
        // Formato esperado: YYYY-MM-DD
        if (dateStr.includes('-') && dateStr.length === 10) {
            return dateStr;
        }
        
        // Otros formatos posibles
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
            // Asumiendo DD/MM/YYYY o DD-MM-YYYY
            if (parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            // Asumiendo YYYY-MM-DD o YYYY/MM/DD
            else if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        return null;
    } catch (error) {
        console.warn(`Fecha inválida: ${dateStr}`);
        return null;
    }
}

// Función principal de migración
async function migrateData() {
    try {
        console.log('🚀 Iniciando migración de datos CSV a Supabase...');
        
        // Leer archivo CSV
        const csvPath = path.join(__dirname, '../base.csv');
        console.log(`📄 Leyendo archivo: ${csvPath}`);
        
        if (!fs.existsSync(csvPath)) {
            throw new Error('Archivo base.csv no encontrado');
        }
        
        const csvData = fs.readFileSync(csvPath, 'utf8');
        
        // Convertir CSV a JSON
        console.log('🔄 Convirtiendo CSV a JSON...');
        const employees = csvToJson(csvData);
        
        console.log(`📊 Empleados encontrados: ${employees.length}`);
        
        // Insertar empleados en lotes
        const batchSize = 10;
        let inserted = 0;
        let errors = 0;
        
        for (let i = 0; i < employees.length; i += batchSize) {
            const batch = employees.slice(i, i + batchSize);
            
            console.log(`📤 Insertando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(employees.length/batchSize)}...`);
            
            const { data, error } = await supabase
                .from('empleados')
                .insert(batch)
                .select();
            
            if (error) {
                console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
                errors += batch.length;
                
                // Intentar insertar uno por uno para identificar problemas
                for (const emp of batch) {
                    const { error: singleError } = await supabase
                        .from('empleados')
                        .insert([emp])
                        .select();
                    
                    if (singleError) {
                        console.error(`❌ Error insertando ${emp.nombre} (${emp.rut}):`, singleError.message);
                    } else {
                        inserted++;
                        console.log(`✅ Insertado: ${emp.nombre}`);
                    }
                }
            } else {
                inserted += data?.length || 0;
                console.log(`✅ Lote insertado correctamente: ${data?.length || 0} empleados`);
            }
        }
        
        console.log('\n📊 Resumen de migración:');
        console.log(`✅ Empleados insertados: ${inserted}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📝 Total procesados: ${employees.length}`);
        
        if (inserted > 0) {
            console.log('\n🎉 Migración completada exitosamente!');
            
            // Verificar datos insertados
            const { data: checkData, error: checkError } = await supabase
                .from('empleados')
                .select('id, nombre, rut, cargo')
                .limit(5);
            
            if (!checkError && checkData) {
                console.log('\n👥 Muestra de empleados insertados:');
                checkData.forEach(emp => {
                    console.log(`- ${emp.nombre} (${emp.rut}) - ${emp.cargo}`);
                });
            }
        }
        
    } catch (error) {
        console.error('💥 Error durante la migración:', error.message);
        process.exit(1);
    }
}

// Ejecutar migración
if (require.main === module) {
    migrateData();
}

module.exports = { migrateData };