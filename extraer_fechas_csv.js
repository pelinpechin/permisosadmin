// Script para extraer fechas específicas de permisos del CSV
const fs = require('fs');
const { query, run } = require('./database/db_config');

// Mapeo de meses
const meses = {
    'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
    'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
};

async function extraerFechasCSV() {
    try {
        console.log('🗓️ Extrayendo fechas específicas de permisos del CSV...');
        
        const csvData = fs.readFileSync('tablas.csv', 'utf8');
        const lines = csvData.split('\n');
        
        // Parsear la línea de cabecera con los meses y días
        const headerLine = lines[3]; // Línea 4 (índice 3)
        const headers = headerLine.split(';');
        
        console.log('🔍 Analizando estructura de fechas...');
        
        // Encontrar las posiciones de los meses y días
        const fechaColumns = [];
        let mesActual = null;
        let añoActual = 2025; // Asumiendo año 2025
        
        headers.forEach((header, index) => {
            if (meses[header]) {
                mesActual = meses[header];
                console.log(`📅 Encontrado mes: ${header} (${mesActual}) en columna ${index}`);
            } else if (mesActual && header && !isNaN(parseInt(header))) {
                const dia = parseInt(header);
                if (dia >= 1 && dia <= 31) {
                    fechaColumns.push({
                        columnIndex: index,
                        año: añoActual,
                        mes: mesActual,
                        dia: dia,
                        fecha: `${añoActual}-${mesActual.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`
                    });
                }
            }
        });
        
        console.log(`📊 Encontradas ${fechaColumns.length} columnas de fechas`);
        
        // Procesar cada empleado
        let permisosCreados = 0;
        
        for (let i = 4; i < lines.length; i++) { // Empezar desde línea 5 (índice 4)
            if (!lines[i].trim()) continue;
            
            const row = lines[i].split(';');
            const rut = row[0];
            
            if (!rut) continue;
            
            console.log(`\n👤 Procesando empleado: ${rut}`);
            
            // Buscar empleado en la base de datos
            const empleados = await query('SELECT id, nombre FROM empleados WHERE rut = ?', [rut]);
            
            if (!empleados || empleados.length === 0) {
                console.log(`   ❌ Empleado no encontrado en BD: ${rut}`);
                continue;
            }
            
            const empleado = empleados[0];
            console.log(`   ✅ Empleado encontrado: ${empleado.nombre} (ID: ${empleado.id})`);
            
            // Revisar cada fecha para este empleado
            for (const fechaCol of fechaColumns) {
                const valor = row[fechaCol.columnIndex];
                
                if (valor && ['T', 'AM', 'PM', 'C'].includes(valor)) {
                    // Mapear el código a tipo de permiso
                    let tipoPermisoId;
                    let motivo;
                    
                    switch (valor) {
                        case 'T':
                            tipoPermisoId = 1; // ID correcto para jornada completa
                            motivo = 'Permiso administrativo jornada completa';
                            break;
                        case 'AM':
                            tipoPermisoId = 2; // ID correcto para primera media jornada
                            motivo = 'Permiso administrativo primera media jornada';
                            break;
                        case 'PM':
                            tipoPermisoId = 3; // ID correcto para segunda media jornada
                            motivo = 'Permiso administrativo segunda media jornada';
                            break;
                        case 'C':
                            tipoPermisoId = 10; // ID correcto para cumpleaños
                            motivo = 'Permiso por cumpleaños';
                            break;
                    }
                    
                    try {
                        // Insertar solicitud de permiso
                        await run(`
                            INSERT INTO solicitudes_permisos 
                            (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, fecha_aprobacion, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, 'APROBADO', 'Permiso importado desde CSV histórico', ?, datetime('now'), datetime('now'))
                        `, [
                            empleado.id,
                            tipoPermisoId,
                            fechaCol.fecha,
                            fechaCol.fecha,
                            motivo,
                            fechaCol.fecha // Fecha de aprobación igual a fecha del permiso
                        ]);
                        
                        console.log(`     ✅ Permiso creado: ${valor} el ${fechaCol.fecha} (${motivo})`);
                        permisosCreados++;
                        
                    } catch (error) {
                        console.log(`     ❌ Error creando permiso: ${error.message}`);
                    }
                }
            }
        }
        
        console.log(`\n🎉 Proceso completado: ${permisosCreados} permisos históricos creados`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    extraerFechasCSV().then(() => process.exit(0));
}

module.exports = { extraerFechasCSV };