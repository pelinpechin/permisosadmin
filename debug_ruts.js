// Debug RUTs
const { supabase } = require('./database/supabase');
const fs = require('fs');

async function debugRUTs() {
    try {
        console.log('🔍 Comparando RUTs del CSV vs DB...');
        
        // Leer algunos RUTs del CSV
        const csvContent = fs.readFileSync('./tablas.csv', 'utf8');
        const lines = csvContent.split('\n');
        const csvRUTs = lines.slice(4, 14).map(line => line.split(';')[0]).filter(rut => rut);
        
        console.log('\n📄 RUTs del CSV:');
        csvRUTs.forEach(rut => {
            const normalizado = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
            console.log(`   ${rut} -> ${normalizado}`);
        });
        
        // Obtener TODOS los RUTs de la DB
        const { data: empleados, error } = await supabase
            .from('empleados')
            .select('rut, nombre');
            
        if (error) throw error;
        
        console.log('\n🗄️ RUTs de la DB:');
        empleados.forEach(emp => {
            const normalizado = emp.rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
            console.log(`   ${emp.rut} -> ${normalizado}`);
        });
        
        console.log('\n🔍 Buscando coincidencias...');
        let encontrados = 0;
        
        csvRUTs.forEach(csvRUT => {
            const csvNorm = csvRUT.replace(/\./g, '').replace(/-/g, '').toUpperCase();
            const csvSinCeros = csvNorm.replace(/^0+/, '');
            const coincidencia = empleados.find(emp => {
                const empNorm = emp.rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
                const empSinCeros = empNorm.replace(/^0+/, '');
                return empSinCeros === csvSinCeros || empNorm === csvNorm;
            });
            
            if (coincidencia) {
                console.log(`✅ ${csvRUT} = ${coincidencia.rut} (${coincidencia.nombre})`);
                encontrados++;
            } else {
                console.log(`❌ ${csvRUT} no encontrado`);
            }
        });
        
        console.log(`\n📊 Encontrados: ${encontrados}/${csvRUTs.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugRUTs().then(() => process.exit(0));