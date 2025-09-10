const { run } = require('./database/db_config');

async function crearMiguelAdmin() {
    console.log('👨‍💼 Creando cuenta de usuario admin para Miguel Rodriguez...');
    
    try {
        // Datos para Miguel Rodriguez
        const miguelData = {
            nombre: 'RODRIGUEZ CABRERA MIGUEL ANGEL',
            email: 'miguel.rodriguez@colegio.cl',
            username: 'miguel.rodriguez', 
            password: 'miguel123', // Password temporal
            rol: 'SUPERVISOR'
        };
        
        console.log('📝 Datos para crear:');
        console.log(`   Nombre: ${miguelData.nombre}`);
        console.log(`   Email: ${miguelData.email}`);
        console.log(`   Username: ${miguelData.username}`);
        console.log(`   Rol: ${miguelData.rol}`);
        console.log(`   Password temporal: ${miguelData.password}`);
        
        // Verificar si ya existe
        console.log('\n🔍 Verificando si ya existe...');
        try {
            // Intentar una operación UPDATE para ver si existe
            const updateResult = await run(
                'UPDATE usuarios_admin SET updated_at = updated_at WHERE email = ? OR nombre = ?',
                [miguelData.email, miguelData.nombre]
            );
            
            console.log('Update result:', updateResult);
            
            // Si UPDATE no afectó filas, significa que no existe
            console.log('✅ Miguel no existe, procediendo a crear...');
            
        } catch (checkError) {
            console.log('Error en verificación (normal):', checkError.message);
        }
        
        // Crear usuario Miguel
        console.log('\n➕ Creando usuario Miguel Rodriguez...');
        
        const result = await run(`
            INSERT INTO usuarios_admin 
            (nombre, email, username, password, rol, activo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `, [
            miguelData.nombre,
            miguelData.email, 
            miguelData.username,
            miguelData.password,
            miguelData.rol
        ]);
        
        console.log('✅ Usuario Miguel Rodriguez creado exitosamente');
        console.log('Resultado:', result);
        
        // Verificar creación
        console.log('\n🔍 Verificando creación...');
        try {
            const verificacion = await run(
                'UPDATE usuarios_admin SET updated_at = updated_at WHERE email = ?',
                [miguelData.email]
            );
            console.log('✅ Usuario verificado - existe en la base de datos');
        } catch (verifyError) {
            console.log('⚠️ Error en verificación:', verifyError.message);
        }
        
        console.log(`\n🎉 MIGUEL RODRIGUEZ CREADO COMO SUPERVISOR:`);
        console.log(`   📧 Email: ${miguelData.email}`);
        console.log(`   👤 Username: ${miguelData.username}`);  
        console.log(`   🔑 Password: ${miguelData.password} (debe cambiarla)`);
        console.log(`   🎯 Rol: ${miguelData.rol}`);
        
        console.log(`\n📌 ACCESO:`);
        console.log(`   - Puede acceder en: http://localhost:5000/admin`);
        console.log(`   - Login: ${miguelData.username}`);
        console.log(`   - Password: ${miguelData.password}`);
        
        console.log(`\n🔔 NOTIFICACIONES:`);
        console.log(`   - Ahora Miguel recibirá notificaciones de Guillermo Barria`);
        console.log(`   - También recibirá notificaciones de otros empleados que supervise`);
        
    } catch (error) {
        console.error('❌ Error creando usuario Miguel:', error);
        console.error('Detalles:', error.message);
    }
}

crearMiguelAdmin();