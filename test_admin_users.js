const { query, get, run } = require('./database/db_config');

async function testAdminUsers() {
  console.log('🧪 Probando usuarios admin...');
  
  try {
    // Obtener todos los usuarios admin
    console.log('📋 Usuarios admin en la base de datos:');
    const admins = await query('SELECT * FROM usuarios_admin WHERE activo = 1');
    
    admins.forEach(admin => {
      console.log(`- ID: ${admin.id}, Username: ${admin.username}, Nombre: ${admin.nombre}, Rol: ${admin.rol}`);
    });
    
    if (admins.length === 0) {
      console.log('❌ No hay usuarios admin activos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminUsers();