// Script para verificar exactamente qué permisos debería tener Miguel Rodriguez según el CSV
const fs = require('fs');

function verificarMiguelCSV() {
    console.log('🔍 Verificando permisos de Miguel Rodriguez en CSV...');
    
    const csvData = fs.readFileSync('tablas.csv', 'utf8');
    const lines = csvData.split('\n');
    
    // Buscar línea de Miguel Rodriguez
    let lineaMiguel = null;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('018.282.415-1')) {
            lineaMiguel = lines[i];
            console.log('✅ Encontrada línea de Miguel Rodriguez');
            break;
        }
    }
    
    if (!lineaMiguel) {
        console.log('❌ No se encontró la línea de Miguel Rodriguez');
        return;
    }
    
    const columnas = lineaMiguel.split(';');
    console.log(`📊 Total columnas: ${columnas.length}`);
    
    // Mapeo de posiciones a fechas (basado en nuestro script anterior)
    const monthPositions = {
        'FEBRERO': { start: 12, days: 5, month: 2, startDay: 24 },
        'MARZO': { start: 17, days: 31, month: 3, startDay: 1 },
        'ABRIL': { start: 48, days: 30, month: 4, startDay: 1 },
        'MAYO': { start: 78, days: 31, month: 5, startDay: 1 },
        'JUNIO': { start: 109, days: 30, month: 6, startDay: 1 },
        'JULIO': { start: 139, days: 31, month: 7, startDay: 1 },
        'AGOSTO': { start: 170, days: 31, month: 8, startDay: 1 },
        'SEPTIEMBRE': { start: 201, days: 30, month: 9, startDay: 1 },
        'OCTUBRE': { start: 231, days: 31, month: 10, startDay: 1 },
        'NOVIEMBRE': { start: 262, days: 30, month: 11, startDay: 1 },
        'DICIEMBRE': { start: 292, days: 31, month: 12, startDay: 1 }
    };
    
    const permisos = [];
    
    Object.entries(monthPositions).forEach(([monthName, monthInfo]) => {
        for (let day = 0; day < monthInfo.days; day++) {
            const columnIndex = monthInfo.start + day;
            const actualDay = monthInfo.startDay + day;
            
            if (columnIndex < columnas.length) {
                const valor = columnas[columnIndex]?.trim();
                if (valor && ['T', 'AM', 'PM', 'C', 'BL', 'S', 'L', 'NM'].includes(valor)) {
                    const fecha = `2025-${monthInfo.month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}`;
                    permisos.push({
                        columna: columnIndex,
                        fecha: fecha,
                        tipo: valor,
                        mes: monthName,
                        dia: actualDay
                    });
                }
            }
        }
    });
    
    console.log(`\n📅 Permisos encontrados para Miguel Rodriguez:`);
    console.log('=' .repeat(60));
    
    permisos.forEach((permiso, index) => {
        console.log(`${index + 1}. Fecha: ${permiso.fecha} | Tipo: ${permiso.tipo} | Mes: ${permiso.mes} | Día: ${permiso.dia} | Columna: ${permiso.columna}`);
    });
    
    console.log('=' .repeat(60));
    console.log(`Total permisos en CSV: ${permisos.length}`);
    
    // Filtrar solo los que deberían convertirse en solicitudes (T, AM, PM, C)
    const permisosAdministrativos = permisos.filter(p => ['T', 'AM', 'PM', 'C'].includes(p.tipo));
    
    console.log(`\n🎯 Permisos administrativos que deberían estar en BD:`);
    permisosAdministrativos.forEach((permiso, index) => {
        const descripcion = {
            'T': 'Jornada completa',
            'AM': 'Primera media jornada',
            'PM': 'Segunda media jornada', 
            'C': 'Cumpleaños'
        }[permiso.tipo];
        console.log(`${index + 1}. ${permiso.fecha} - ${permiso.tipo} (${descripcion})`);
    });
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Total permisos en CSV: ${permisos.length}`);
    console.log(`   - Permisos administrativos (T/AM/PM/C): ${permisosAdministrativos.length}`);
    console.log(`   - Otros códigos (BL/S/L/NM): ${permisos.length - permisosAdministrativos.length}`);
    
    // Agrupar por tipo
    const agrupadosPorTipo = {};
    permisosAdministrativos.forEach(p => {
        if (!agrupadosPorTipo[p.tipo]) agrupadosPorTipo[p.tipo] = [];
        agrupadosPorTipo[p.tipo].push(p.fecha);
    });
    
    console.log(`\n📈 Por tipo de permiso:`);
    Object.entries(agrupadosPorTipo).forEach(([tipo, fechas]) => {
        console.log(`   - ${tipo}: ${fechas.length} permisos`);
        fechas.forEach(fecha => console.log(`     * ${fecha}`));
    });
}

verificarMiguelCSV();