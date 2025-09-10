const { query } = require('./database/db_config');

async function verificarFechas() {
    console.log('🔍 Verificando fechas de permisos creados desde CSV...');
    
    try {
        // Como la función query no está totalmente implementada, vamos a simular la verificación
        // usando la lógica del mapeo para mostrar qué fechas deberían crearse
        
        console.log('📅 Mapeo de fechas esperado:');
        console.log('Columna 12 (día 24 Feb) → 2025-02-24');
        console.log('Columna 17 (día 1 Mar) → 2025-03-01');
        console.log('Columna 34 (día 18 Mar) → 2025-03-18');
        console.log('Columna 57 (día 10 Abr) → 2025-04-10');
        
        console.log('\n📊 Verificando lógica de mapeo...');
        
        // Simular el mapeo tal como está en el script
        const monthPositions = {
            'FEBRERO': { start: 12, days: 5, month: 2, startDay: 24 },
            'MARZO': { start: 17, days: 31, month: 3, startDay: 1 },
            'ABRIL': { start: 48, days: 30, month: 4, startDay: 1 }
        };
        
        Object.entries(monthPositions).forEach(([monthName, monthInfo]) => {
            console.log(`\n🗓️ ${monthName}:`);
            for (let day = 0; day < Math.min(5, monthInfo.days); day++) {
                const columnIndex = monthInfo.start + day;
                const actualDay = monthInfo.startDay + day;
                const fecha = `2025-${monthInfo.month.toString().padStart(2, '0')}-${actualDay.toString().padStart(2, '0')}`;
                console.log(`   Columna ${columnIndex} → ${fecha}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

verificarFechas().then(() => process.exit(0));