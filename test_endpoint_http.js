const fetch = require('node-fetch').default;

async function testEndpointHTTP() {
    try {
        console.log('🌐 PROBANDO ENDPOINT HTTP DIRECTO\n');
        
        const baseUrl = 'https://permisosadministrativos.netlify.app';
        const endpoint = `${baseUrl}/api/empleados-auth/login`;
        
        console.log(`📡 URL: ${endpoint}`);
        
        const credenciales = [
            { nombre: 'Andrea', rut: '15.582.779-3', password: 'andrea123' },
            { nombre: 'Francisco', rut: '17.238.098-0', password: 'francisco123' }
        ];
        
        for (const cred of credenciales) {
            console.log(`\n👤 PROBANDO LOGIN HTTP: ${cred.nombre}`);
            console.log(`   RUT: ${cred.rut}`);
            console.log(`   Password: ${cred.password}`);
            
            const requestBody = {
                rut: cred.rut,
                password: cred.password
            };
            
            console.log(`📤 Request body:`, requestBody);
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log(`📥 Response status: ${response.status}`);
                console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));
                
                const responseText = await response.text();
                console.log(`📥 Response body: ${responseText}`);
                
                if (response.status === 200) {
                    console.log('✅ LOGIN EXITOSO via HTTP');
                } else {
                    console.log(`❌ LOGIN FALLÓ via HTTP (${response.status})`);
                }
                
            } catch (fetchError) {
                console.error('❌ Error en petición HTTP:', fetchError);
            }
            
            console.log('------------------------');
        }
        
        // También probar endpoint de health check
        console.log('\n🏥 PROBANDO HEALTH CHECK:');
        try {
            const healthResponse = await fetch(`${baseUrl}/api/health`);
            console.log(`Health status: ${healthResponse.status}`);
            const healthText = await healthResponse.text();
            console.log(`Health response: ${healthText}`);
        } catch (error) {
            console.error('❌ Error health check:', error);
        }
        
    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

testEndpointHTTP();