// Script para extraer TODOS los permisos históricos del CSV para todos los empleados
const fs = require('fs');
const { query, run } = require('./database/db_config');

function normalizarRUT(rut) {
    // Limpiar RUT y quitar ceros iniciales
    return rut.replace(/[\.\-\s]/g, '').replace(/^0+/, '');
}

async function extraerTodosPermisosCSV() {
    try {
        console.log('🗓️ Extrayendo TODOS los permisos históricos del CSV para todos los empleados...');
        
        const csvData = fs.readFileSync('tablas.csv', 'utf8');
        const lines = csvData.split('\n');
        
        // Parsear la línea de cabecera para mapear las fechas
        console.log('🔍 Analizando estructura de fechas...');
        
        // Mapeo de posiciones conocidas basado en la estructura del CSV
        const monthPositions = {
            'FEBRERO': { start: 12, days: 5, month: 2, startDay: 24 }, // Del 24 al 28 de febrero
            'MARZO': { start: 17, days: 31, month: 3, startDay: 1 },   // Del 1 al 31 de marzo
            'ABRIL': { start: 48, days: 30, month: 4, startDay: 1 },   // Del 1 al 30 de abril
            'MAYO': { start: 78, days: 31, month: 5, startDay: 1 },    // Del 1 al 31 de mayo
            'JUNIO': { start: 109, days: 30, month: 6, startDay: 1 },  // Del 1 al 30 de junio
            'JULIO': { start: 139, days: 31, month: 7, startDay: 1 },  // Del 1 al 31 de julio
            'AGOSTO': { start: 170, days: 31, month: 8, startDay: 1 }, // Del 1 al 31 de agosto
            'SEPTIEMBRE': { start: 201, days: 30, month: 9, startDay: 1 }, // Del 1 al 30 de septiembre
            'OCTUBRE': { start: 231, days: 31, month: 10, startDay: 1 }, // Del 1 al 31 de octubre
            'NOVIEMBRE': { start: 262, days: 30, month: 11, startDay: 1 }, // Del 1 al 30 de noviembre
            'DICIEMBRE': { start: 292, days: 31, month: 12, startDay: 1 }  // Del 1 al 31 de diciembre
        };
        
        // Construir el mapeo de fechas
        const fechaColumns = [];
        Object.entries(monthPositions).forEach(([monthName, monthInfo]) => {
            for (let day = 0; day < monthInfo.days; day++) {
                const columnIndex = monthInfo.start + day;
                const actualDay = monthInfo.startDay + day;
                
                fechaColumns.push({
                    columnIndex: columnIndex,
                    año: 2025,
                    mes: monthInfo.month,
                    dia: actualDay,
                    // Crear fecha con zona horaria chilena para evitar problemas de UTC
                    fecha: `2025-${monthInfo.month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}T12:00:00-03:00`,
                    fechaSimple: `2025-${monthInfo.month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}`,
                    monthName: monthName
                });
            }
        });
        
        console.log(`📊 Mapeo creado para ${fechaColumns.length} fechas`);
        
        // Obtener todos los empleados de la base de datos
        console.log('👥 Obteniendo empleados de la base de datos...');
        const todosEmpleados = await query('SELECT id, nombre, rut FROM empleados WHERE activo = 1');
        console.log(`✅ Encontrados ${todosEmpleados.length} empleados en BD`);
        
        // Crear mapeo de RUTs normalizados a empleados
        const empleadosPorRUT = {};
        todosEmpleados.forEach(emp => {
            const rutNormalizado = normalizarRUT(emp.rut);
            empleadosPorRUT[rutNormalizado] = emp;
        });
        
        // Procesar cada empleado del CSV
        let permisosCreados = 0;
        let empleadosEncontrados = 0;
        let empleadosNEncontrados = 0;
        
        console.log('\n📄 Procesando empleados del CSV...');
        
        for (let i = 4; i < lines.length; i++) { // Empezar desde línea 5 (índice 4)
            if (!lines[i].trim()) continue;
            
            const row = lines[i].split(';');
            const rutCSV = row[0];
            
            if (!rutCSV) continue;
            
            const rutNormalizado = normalizarRUT(rutCSV);
            const empleado = empleadosPorRUT[rutNormalizado];
            
            if (!empleado) {
                empleadosNEncontrados++;
                console.log(`❌ No encontrado: ${rutCSV} (normalizado: ${rutNormalizado})`);
                continue;
            }
            
            empleadosEncontrados++;
            console.log(`👤 Procesando: ${empleado.nombre} (${empleado.rut})`);
            
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
                        `, [empleado.id, fechaCol.fechaSimple, tipoPermisoId]);
                        
                        if (existePermiso && existePermiso.length > 0) {
                            console.log(`     ⚠️ Ya existe: ${valor} el ${fechaCol.fechaSimple}`);
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
                            fechaCol.fechaSimple,
                            fechaCol.fechaSimple,
                            motivo,
                            `Permiso histórico importado desde CSV. Columna: ${fechaCol.columnIndex}, Mes: ${fechaCol.monthName}, RUT original CSV: ${rutCSV}`
                        ]);
                        
                        permisosCreados++;
                        permisosEmpleado++;
                        
                    } catch (error) {
                        console.log(`     ❌ Error creando permiso para ${fechaCol.fechaSimple}: ${error.message}`);
                    }
                }
            }
            
            if (permisosEmpleado > 0) {
                console.log(`   ✅ Creados ${permisosEmpleado} permisos para ${empleado.nombre}`);
            } else {
                console.log(`   ℹ️ Sin permisos para ${empleado.nombre}`);
            }
        }
        
        console.log(`\n🎉 Proceso completado:`);
        console.log(`   👥 Empleados encontrados en BD: ${empleadosEncontrados}`);
        console.log(`   ❌ Empleados NO encontrados: ${empleadosNEncontrados}`);
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
        if (resumen && resumen.length > 0) {
            resumen.forEach(row => {
                console.log(`   ${row.tipo_permiso}: ${row.cantidad} permisos`);
            });
        } else {
            console.log('   (Resumen no disponible - función query no implementada completamente)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    extraerTodosPermisosCSV().then(() => process.exit(0));
}

module.exports = { extraerTodosPermisosCSV };