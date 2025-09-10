const { run, query } = require('./database/db_config');

async function crearSupervisores() {
    console.log('👨‍💼 Creando usuarios supervisores según CSV...');
    
    try {
        // 1. Obtener supervisores únicos del CSV
        const supervisoresData = await query(`
            SELECT DISTINCT visualizacion, 
                   COUNT(*) as empleados_supervisados
            FROM empleados 
            WHERE visualizacion IS NOT NULL AND visualizacion != ""
            GROUP BY visualizacion
            ORDER BY empleados_supervisados DESC
        `);
        
        console.log(`\n📊 Supervisores a crear (${supervisoresData.length}):`);
        supervisoresData.forEach((sup, i) => {
            console.log(`   ${i+1}. ${sup.visualizacion} (${sup.empleados_supervisados} empleados)`);
        });
        
        // 2. Crear usuarios supervisores
        console.log('\n➕ Creando usuarios supervisores...');
        let creados = 0;
        
        for (const supervisor of supervisoresData) {
            try {
                // Generar email y username simplificado
                const nombreParts = supervisor.visualizacion.toLowerCase().split(' ');
                const primerNombre = nombreParts[0] || 'supervisor';
                const primerApellido = nombreParts[2] || nombreParts[1] || 'supervisor';
                
                const username = `${primerNombre}.${primerApellido}`;
                const email = `${username}@colegio.cl`;
                const password = 'supervisor123'; // Password temporal que se debe cambiar
                
                // Verificar si ya existe
                const existente = await query('SELECT * FROM usuarios_admin WHERE email = ?', [email]);
                
                if (existente && existente.length > 0) {
                    console.log(`   ⚠️ Ya existe: ${supervisor.visualizacion}`);
                    continue;
                }
                
                // Crear usuario supervisor
                const result = await run(`
                    INSERT INTO usuarios_admin 
                    (nombre, email, username, password, rol, activo, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'SUPERVISOR', 1, datetime('now'), datetime('now'))
                `, [supervisor.visualizacion, email, username, password]);
                
                creados++;
                console.log(`   ✅ ${supervisor.visualizacion}`);
                console.log(`      📧 Email: ${email}`);
                console.log(`      👤 Username: ${username}`);
                
            } catch (error) {
                console.log(`   ❌ Error creando ${supervisor.visualizacion}: ${error.message}`);
            }
        }
        
        console.log(`\n📊 Resultado:`);
        console.log(`   ✅ Supervisores creados: ${creados}`);
        console.log(`   📋 Total supervisores esperados: ${supervisoresData.length}`);
        
        // 3. Verificar usuarios creados
        console.log('\n👥 Usuarios supervisores finales:');
        const supervisoresFinales = await query('SELECT * FROM usuarios_admin WHERE rol = "SUPERVISOR" ORDER BY nombre');
        
        supervisoresFinales.forEach((sup, i) => {
            console.log(`   ${i+1}. ${sup.nombre}`);
            console.log(`      📧 ${sup.email} | 👤 ${sup.username} | ${sup.activo ? '✅' : '❌'} Activo`);
        });
        
        if (creados > 0) {
            console.log('\n⚠️ IMPORTANTE:');
            console.log('   - Todos los supervisores tienen password temporal: "supervisor123"');
            console.log('   - Deben cambiar su password al primer login');
            console.log('   - Pueden acceder a /admin para ver y aprobar solicitudes');
        }
        
    } catch (error) {
        console.error('❌ Error creando supervisores:', error);
    }
}

crearSupervisores();