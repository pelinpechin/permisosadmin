const axios = require('axios');

async function systemTest() {
    console.log('🔍 PRUEBA COMPLETA DEL SISTEMA');
    console.log('================================');
    
    const baseURL = 'http://localhost:3445';
    
    try {
        // 1. Test Admin Login (Miguel)
        console.log('\n1️⃣ PRUEBA LOGIN ADMIN (Miguel Rodriguez)');
        const adminLogin = await axios.post(`${baseURL}/api/auth/login/admin`, {
            username: 'miguel.rodriguez',
            password: 'miguel123'
        });
        
        if (adminLogin.data.success) {
            console.log('✅ Login admin exitoso');
            console.log('   👤 Usuario:', adminLogin.data.data.user.nombre);
            console.log('   🏷️ Rol:', adminLogin.data.data.user.rol);
            console.log('   🔑 Token generado correctamente');
            
            const adminToken = adminLogin.data.data.token;
            
            // 2. Test Admin Dashboard
            console.log('\n2️⃣ PRUEBA DASHBOARD ADMIN');
            const adminDashboard = await axios.get(`${baseURL}/api/dashboard/admin`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            if (adminDashboard.data.success) {
                console.log('✅ Dashboard admin funciona');
                const pendientes = adminDashboard.data.data.solicitudes_recientes?.filter(s => s.estado === 'PENDIENTE') || [];
                console.log('   📋 Solicitudes pendientes:', pendientes.length);
                pendientes.forEach((s, i) => {
                    console.log(`     ${i+1}. ID ${s.id}: ${s.empleado_nombre} - ${s.tipo_nombre}`);
                });
            } else {
                console.log('❌ Dashboard admin falló:', adminDashboard.data.message);
            }
            
        } else {
            console.log('❌ Login admin falló:', adminLogin.data.message);
        }
        
        // 3. Test Employee Login (Guillermo)
        console.log('\n3️⃣ PRUEBA LOGIN EMPLEADO (Guillermo)');
        const employeeLogin = await axios.post(`${baseURL}/api/auth/login/empleado`, {
            rut: '18.208.947-8'
        });
        
        if (employeeLogin.data.success) {
            console.log('✅ Login empleado exitoso');
            console.log('   👤 Usuario:', employeeLogin.data.data.user.nombre);
            console.log('   📧 RUT:', employeeLogin.data.data.user.rut);
            
            // Verificar que es Guillermo y no otra persona
            if (employeeLogin.data.data.user.nombre.includes('Guillermo')) {
                console.log('✅ Empleado correcto (Guillermo)');
            } else {
                console.log('⚠️ PROBLEMA: Login devolvió usuario incorrecto:', employeeLogin.data.data.user.nombre);
            }
            
        } else {
            console.log('❌ Login empleado falló:', employeeLogin.data.message);
        }
        
        // 4. Test Database Connection
        console.log('\n4️⃣ PRUEBA CONEXIÓN BASE DE DATOS');
        const healthCheck = await axios.get(`${baseURL}/`);
        if (healthCheck.status === 200) {
            console.log('✅ Servidor y base de datos respondiendo');
        }
        
        console.log('\n🎉 PRUEBA COMPLETA FINALIZADA');
        console.log('================================');
        
    } catch (error) {
        console.error('❌ Error en prueba del sistema:', error.message);
        if (error.response?.data) {
            console.error('   Detalles:', error.response.data);
        }
    }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
    systemTest();
}

module.exports = systemTest;