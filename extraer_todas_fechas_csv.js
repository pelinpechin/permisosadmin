// Script completo para extraer todas las fechas de permisos del CSV
const fs = require('fs');
const { query, run } = require('./database/db_config');

async function extraerTodasFechasCSV() {
    try {
        console.log('🗓️ Extrayendo todas las fechas de permisos del CSV...');
        
        const csvData = fs.readFileSync('tablas.csv', 'utf8');
        const lines = csvData.split('\n');
        
        // Parsear la línea de cabecera para mapear las fechas
        const headerLine = lines[3]; // Línea 4 (índice 3) contiene los días
        const headers = headerLine.split(';');
        
        console.log('🔍 Analizando estructura de fechas...');
        
        // Crear mapeo de columnas a fechas basado en la estructura del CSV
        const fechaColumns = [];
        let currentMonth = null;
        let currentDay = 1;
        
        // Identificar las posiciones de los meses en la línea 3
        const monthLine = lines[2]; // Línea 3 contiene los meses
        const monthHeaders = monthLine.split(';');
        
        // Mapeo de posiciones conocidas basado en la estructura del CSV
        const monthPositions = {
            'FEBRERO': { start: 12, days: 5 }, // Del 24 al 28 de febrero (índices 12-16)
            'MARZO': { start: 17, days: 31 },   // Del 1 al 31 de marzo (índices 17-47) 
            'ABRIL': { start: 48, days: 30 },   // Del 1 al 30 de abril (índices 48-77)
            'MAYO': { start: 78, days: 31 },    // Del 1 al 31 de mayo (índices 78-108)
            'JUNIO': { start: 109, days: 30 },  // Del 1 al 30 de junio (índices 109-138)
            'JULIO': { start: 139, days: 31 },  // Del 1 al 31 de julio (índices 139-169)
            'AGOSTO': { start: 170, days: 31 }, // Del 1 al 31 de agosto (índices 170-200)
            'SEPTIEMBRE': { start: 201, days: 30 }, // Del 1 al 30 de septiembre (índices 201-230)
            'OCTUBRE': { start: 231, days: 31 }, // Del 1 al 31 de octubre (índices 231-261)
            'NOVIEMBRE': { start: 262, days: 30 }, // Del 1 al 30 de noviembre (índices 262-291)
            'DICIEMBRE': { start: 292, days: 31 }  // Del 1 al 31 de diciembre (índices 292-322)
        };
        
        // Construir el mapeo de fechas
        Object.entries(monthPositions).forEach(([monthName, monthInfo]) => {
            const monthNum = {
                'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
                'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
            }[monthName];
            
            for (let day = 1; day <= monthInfo.days; day++) {
                const columnIndex = monthInfo.start + (day - 1);
                const dayToUse = monthName === 'FEBRERO' ? (23 + day) : day; // Febrero empieza del 24
                
                fechaColumns.push({
                    columnIndex: columnIndex,
                    año: 2025,
                    mes: monthNum,
                    dia: dayToUse,
                    fecha: `2025-${monthNum.toString().padStart(2, '0')}-${dayToUse.toString().padStart(2, '0')}`,
                    monthName: monthName
                });
            }
        });
        
        console.log(`📊 Mapeo creado para ${fechaColumns.length} fechas`);
        console.log(`📅 Rango de fechas: ${fechaColumns[0].fecha} - ${fechaColumns[fechaColumns.length-1].fecha}`);
        
        // Procesar cada empleado
        let permisosCreados = 0;
        let empleadosProcesados = 0;
        
        for (let i = 4; i < lines.length; i++) { // Empezar desde línea 5 (índice 4)
            if (!lines[i].trim()) continue;
            
            const row = lines[i].split(';');
            const rut = row[0];
            
            if (!rut) continue;
            
            console.log(`\n👤 Procesando empleado: ${rut}`);
            empleadosProcesados++;
            
            // Buscar empleado en la base de datos
            const empleados = await query('SELECT id, nombre FROM empleados WHERE rut = ? OR REPLACE(REPLACE(rut, ".", ""), "-", "") = ?', 
                                        [rut, rut.replace(/[\.-]/g, '')]);
            
            if (!empleados || empleados.length === 0) {
                console.log(`   ❌ Empleado no encontrado en BD: ${rut}`);
                continue;
            }
            
            const empleado = empleados[0];
            console.log(`   ✅ Empleado encontrado: ${empleado.nombre} (ID: ${empleado.id})`);
            
            let permisosEmpleado = 0;
            
            // Revisar cada fecha para este empleado
            for (const fechaCol of fechaColumns) {
                if (fechaCol.columnIndex >= row.length) continue;
                
                const valor = row[fechaCol.columnIndex]?.trim();
                
                if (valor && ['T', 'AM', 'PM', 'C'].includes(valor)) {
                    // Mapear el código a tipo de permiso
                    let tipoPermisoId;
                    let motivo;
                    
                    switch (valor) {
                        case 'T':
                            tipoPermisoId = 1; // Jornada completa
                            motivo = 'Permiso administrativo jornada completa (importado del CSV histórico)';
                            break;
                        case 'AM':
                            tipoPermisoId = 2; // Primera media jornada
                            motivo = 'Permiso administrativo primera media jornada (importado del CSV histórico)';
                            break;
                        case 'PM':
                            tipoPermisoId = 3; // Segunda media jornada
                            motivo = 'Permiso administrativo segunda media jornada (importado del CSV histórico)';
                            break;
                        case 'C':
                            tipoPermisoId = 10; // Cumpleaños
                            motivo = 'Permiso por cumpleaños (importado del CSV histórico)';
                            break;
                    }
                    
                    try {
                        // Verificar si ya existe este permiso
                        const existePermiso = await query(`
                            SELECT id FROM solicitudes_permisos 
                            WHERE empleado_id = ? AND fecha_desde = ? AND tipo_permiso_id = ?
                        `, [empleado.id, fechaCol.fecha, tipoPermisoId]);
                        
                        if (existePermiso && existePermiso.length > 0) {
                            console.log(`     ⚠️ Permiso ya existe: ${valor} el ${fechaCol.fecha}`);
                            continue;
                        }
                        
                        // Insertar solicitud de permiso
                        await run(`
                            INSERT INTO solicitudes_permisos 
                            (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, 'APROBADO', ?, datetime('now'), datetime('now'))
                        `, [
                            empleado.id,
                            tipoPermisoId,
                            fechaCol.fecha,
                            fechaCol.fecha,
                            motivo,
                            `Permiso histórico importado desde CSV. Columna: ${fechaCol.columnIndex}, Mes: ${fechaCol.monthName}`
                        ]);
                        
                        console.log(`     ✅ Permiso creado: ${valor} el ${fechaCol.fecha} (${fechaCol.monthName})`);
                        permisosCreados++;
                        permisosEmpleado++;
                        
                    } catch (error) {
                        console.log(`     ❌ Error creando permiso para ${fechaCol.fecha}: ${error.message}`);
                    }
                }
            }
            
            console.log(`   📊 Total permisos creados para ${empleado.nombre}: ${permisosEmpleado}`);
        }
        
        console.log(`\n🎉 Proceso completado:`);
        console.log(`   👥 Empleados procesados: ${empleadosProcesados}`);
        console.log(`   📅 Permisos históricos creados: ${permisosCreados}`);
        
        // Mostrar resumen por tipo de permiso
        const resumen = await query(`
            SELECT 
                tp.nombre as tipo_permiso,
                COUNT(*) as cantidad
            FROM solicitudes_permisos sp
            JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE sp.observaciones LIKE '%CSV%'
            GROUP BY tp.nombre
            ORDER BY cantidad DESC
        `);
        
        console.log('\n📊 Resumen por tipo de permiso:');
        resumen.forEach(row => {
            console.log(`   ${row.tipo_permiso}: ${row.cantidad} permisos`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    extraerTodasFechasCSV().then(() => process.exit(0));
}

module.exports = { extraerTodasFechasCSV };