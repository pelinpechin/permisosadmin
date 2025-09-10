// COPIA Y PEGA ESTE CÓDIGO EN LA CONSOLA DEL NAVEGADOR

console.log('🔍 === DEBUGGING COMPLETO DEL SISTEMA ===');

// 1. Verificar token
const token = localStorage.getItem('empleado_token');
console.log('✅ Token existe:', !!token);
if (token) {
    console.log('🔑 Token preview:', token.substring(0, 50) + '...');
}

// 2. Verificar datos del empleado
const empleadoData = localStorage.getItem('empleado_data');
console.log('👤 Datos empleado:', empleadoData ? JSON.parse(empleadoData) : 'NO ENCONTRADO');

// 3. Test de petición directa
if (token) {
    console.log('🚀 Enviando petición de prueba...');
    
    const testData = {
        tipo_permiso: 'T',
        fecha_solicitud: '2025-08-30',
        motivo: 'Test desde consola - debug completo',
        observaciones: 'Verificando comunicación servidor'
    };
    
    console.log('📤 Datos a enviar:', testData);
    
    fetch('/api/solicitudes-empleado/crear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
    })
    .then(async response => {
        console.log('📬 Response status:', response.status);
        console.log('📬 Response ok:', response.ok);
        console.log('📬 Response headers:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
        
        const data = await response.json();
        console.log('📬 Response data:', data);
        
        if (response.ok) {
            console.log('🎉 ¡ÉXITO! La solicitud fue creada correctamente');
        } else {
            console.log('❌ Error en la solicitud:', data.error);
        }
        
        return data;
    })
    .catch(error => {
        console.error('💥 Error de red o JavaScript:', error);
    });
} else {
    console.error('❌ No hay token disponible. El usuario no está autenticado.');
}

console.log('🔍 === FIN DEL DEBUG ===');