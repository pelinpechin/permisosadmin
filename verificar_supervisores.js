const { query } = require('./database/db_config');

async function verificarSupervisores() {
    console.log('👥 Verificando supervisores y sistema de notificaciones...');
    
    try {
        // 1. Obtener todos los supervisores del CSV
        console.log('\n📋 1. Supervisores únicos en CSV (campo VISUALIZACION):');
        const empleados = await query('SELECT DISTINCT visualizacion FROM empleados WHERE visualizacion IS NOT NULL AND visualizacion != ""');
        
        const supervisoresCSV = [...new Set(empleados.map(e => e.visualizacion).filter(v => v))];
        console.log(`   Total supervisores en CSV: ${supervisoresCSV.length}`);
        supervisoresCSV.forEach((sup, i) => console.log(`   ${i+1}. ${sup}`));
        
        // 2. Obtener usuarios admin existentes
        console.log('\n👨‍💼 2. Usuarios admin existentes:');
        const usuariosAdmin = await query('SELECT * FROM usuarios_admin WHERE activo = 1');
        console.log(`   Total usuarios admin: ${usuariosAdmin.length}`);
        usuariosAdmin.forEach((admin, i) => {
            console.log(`   ${i+1}. ${admin.nombre} - ${admin.rol} (${admin.email})`);
        });
        
        // 3. Verificar coincidencias
        console.log('\n🔍 3. Análisis de coincidencias:');
        const adminNombres = usuariosAdmin.map(a => a.nombre.toUpperCase());
        const supervisoresFaltantes = supervisoresCSV.filter(sup => 
            !adminNombres.includes(sup.toUpperCase())
        );
        
        if (supervisoresFaltantes.length > 0) {
            console.log(`⚠️ Supervisores faltantes en usuarios_admin (${supervisoresFaltantes.length}):`);
            supervisoresFaltantes.forEach((sup, i) => console.log(`   ${i+1}. ${sup}`));
        } else {
            console.log('✅ Todos los supervisores CSV tienen cuenta de usuario admin');
        }
        
        // 4. Verificar tabla de notificaciones
        console.log('\n🔔 4. Verificando tabla de notificaciones...');
        try {
            const notificaciones = await query('SELECT * FROM notificaciones LIMIT 3');
            console.log(`✅ Tabla notificaciones existe - ${notificaciones.length} registros de muestra`);
        } catch (error) {
            console.log('❌ Tabla notificaciones no existe - necesita crearse');
            console.log('   Error:', error.message);
        }
        
        // 5. Ejemplo de empleados y sus supervisores
        console.log('\n👤 5. Muestra empleados y sus supervisores:');
        const muestraEmpleados = await query(`
            SELECT nombre, rut, visualizacion as supervisor, autorizacion 
            FROM empleados 
            WHERE visualizacion IS NOT NULL 
            LIMIT 10
        `);
        
        muestraEmpleados.forEach((emp, i) => {
            console.log(`   ${i+1}. ${emp.nombre} → Supervisor: ${emp.supervisor}`);
        });
        
    } catch (error) {
        console.error('❌ Error verificando supervisores:', error);
    }
}

verificarSupervisores();