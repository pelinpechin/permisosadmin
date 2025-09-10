// Script simplificado para extraer fechas del empleado Miguel Angel (18.282.415-1)
const fs = require('fs');
const { run } = require('./database/db_config');

async function extraerFechasMiguel() {
    try {
        console.log('🗓️ Extrayendo fechas específicas para Miguel Angel Rodriguez...');
        
        const csvData = fs.readFileSync('tablas.csv', 'utf8');
        const lines = csvData.split('\n');
        
        // Buscar la línea del empleado Miguel Angel (18.282.415-1)
        let lineaMiguel = null;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('18.282.415-1') || lines[i].includes('018.282.415-1')) {
                lineaMiguel = lines[i];
                console.log('✅ Encontrada línea del empleado Miguel Angel:');
                console.log(lineaMiguel.substring(0, 200) + '...');
                break;
            }
        }
        
        if (!lineaMiguel) {
            console.log('❌ No se encontró la línea del empleado 18.282.415-1 en el CSV');
            console.log('Revisando algunas líneas:');
            for (let i = 4; i < Math.min(10, lines.length); i++) {
                const rut = lines[i].split(';')[0];
                console.log(`   Línea ${i}: RUT = ${rut}`);
            }
            return;
        }
        
        // Analizar la línea para encontrar los permisos
        const columnas = lineaMiguel.split(';');
        console.log(`📊 Total columnas encontradas: ${columnas.length}`);
        
        // Las primeras columnas son datos básicos, después vienen las fechas
        console.log('📋 Datos básicos:');
        console.log(`   RUT: ${columnas[0]}`);
        console.log(`   Negociación: ${columnas[1]}`);
        console.log(`   Visualización: ${columnas[2]}`);
        console.log(`   Autorización: ${columnas[3]}`);
        console.log(`   Uso 1er Semestre: ${columnas[4]}`);
        console.log(`   Uso 2do Semestre: ${columnas[5]}`);
        
        // Revisar las columnas de fechas manualmente
        console.log('\n🗓️ Buscando permisos en las columnas de fechas...');
        const permisos = [];
        
        // Basándome en el ejemplo del CSV, las fechas empiezan después de las columnas básicas
        // Voy a buscar cualquier valor T, AM, PM, C en las columnas de fechas
        for (let i = 12; i < columnas.length; i++) { // Empezar después de datos básicos
            const valor = columnas[i]?.trim();
            if (valor && ['T', 'AM', 'PM', 'C'].includes(valor)) {
                // Intentar mapear la posición a una fecha aproximada
                let fecha = null;
                let mes = null;
                let dia = null;
                
                // Mapeo aproximado basado en la estructura del CSV
                // Febrero: columnas ~12-16, Marzo: ~17-47, Abril: ~48-77, etc.
                if (i >= 12 && i <= 16) {
                    mes = 2; dia = 24 + (i - 12); // Febrero 24-28
                } else if (i >= 17 && i <= 47) {
                    mes = 3; dia = 1 + (i - 17); // Marzo 1-31
                } else if (i >= 48 && i <= 77) {
                    mes = 4; dia = 1 + (i - 48); // Abril 1-30
                } else if (i >= 78 && i <= 108) {
                    mes = 5; dia = 1 + (i - 78); // Mayo 1-31
                } else if (i >= 109 && i <= 138) {
                    mes = 6; dia = 1 + (i - 109); // Junio 1-30
                } else if (i >= 139 && i <= 169) {
                    mes = 7; dia = 1 + (i - 139); // Julio 1-31
                } else if (i >= 170 && i <= 200) {
                    mes = 8; dia = 1 + (i - 170); // Agosto 1-31
                } else if (i >= 201 && i <= 230) {
                    mes = 9; dia = 1 + (i - 201); // Septiembre 1-30
                } else if (i >= 231 && i <= 261) {
                    mes = 10; dia = 1 + (i - 231); // Octubre 1-31
                } else if (i >= 262 && i <= 291) {
                    mes = 11; dia = 1 + (i - 262); // Noviembre 1-30
                } else if (i >= 292 && i <= 322) {
                    mes = 12; dia = 1 + (i - 292); // Diciembre 1-31
                }
                
                if (mes && dia && dia <= 31) {
                    fecha = `2025-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                    permisos.push({ valor, fecha, columna: i });
                    console.log(`   ✅ Permiso ${valor} encontrado en columna ${i} → ${fecha}`);
                }
            }
        }
        
        if (permisos.length === 0) {
            console.log('❌ No se encontraron permisos para este empleado');
            console.log('Mostrando algunas columnas para debug:');
            for (let i = 12; i < Math.min(50, columnas.length); i++) {
                const valor = columnas[i]?.trim();
                if (valor) {
                    console.log(`   Columna ${i}: "${valor}"`);
                }
            }
            return;
        }
        
        // Crear las solicitudes de permiso
        console.log(`\n📝 Creando ${permisos.length} solicitudes de permiso para Miguel Angel (ID: 72)...`);
        
        for (const permiso of permisos) {
            let tipoPermisoId, motivo;
            
            switch (permiso.valor) {
                case 'T':
                    tipoPermisoId = 1;
                    motivo = 'Permiso administrativo jornada completa (importado del CSV histórico)';
                    break;
                case 'AM':
                    tipoPermisoId = 2;
                    motivo = 'Permiso administrativo primera media jornada (importado del CSV histórico)';
                    break;
                case 'PM':
                    tipoPermisoId = 3;
                    motivo = 'Permiso administrativo segunda media jornada (importado del CSV histórico)';
                    break;
                case 'C':
                    tipoPermisoId = 10;
                    motivo = 'Permiso por cumpleaños (importado del CSV histórico)';
                    break;
            }
            
            try {
                await run(`
                    INSERT INTO solicitudes_permisos 
                    (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'APROBADO', 'Permiso histórico importado desde CSV. Columna original: ${permiso.columna}', datetime('now'), datetime('now'))
                `, [
                    72, // ID de Miguel Angel Rodriguez
                    tipoPermisoId,
                    permiso.fecha,
                    permiso.fecha,
                    motivo
                ]);
                
                console.log(`   ✅ Solicitud creada: ${permiso.valor} el ${permiso.fecha}`);
                
            } catch (error) {
                console.log(`   ❌ Error creando solicitud para ${permiso.fecha}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Proceso completado para Miguel Angel Rodriguez');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    extraerFechasMiguel().then(() => process.exit(0));
}

module.exports = { extraerFechasMiguel };