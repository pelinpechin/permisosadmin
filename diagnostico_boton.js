// SCRIPT DE DIAGNÓSTICO PARA EL BOTÓN "NUEVA SOLICITUD"
// Copiar y pegar en la consola del navegador (F12)

console.log('🔍 DIAGNÓSTICO: Botón Nueva Solicitud');

// 1. Verificar que empleadoSystem existe
console.log('1. ¿Existe empleadoSystem?', typeof window.empleadoSystem !== 'undefined' ? '✅' : '❌');

if (typeof window.empleadoSystem !== 'undefined') {
    console.log('   - Tipo:', typeof window.empleadoSystem);
    console.log('   - Tiene función mostrarSolicitudPermiso:', typeof window.empleadoSystem.mostrarSolicitudPermiso === 'function' ? '✅' : '❌');
}

// 2. Verificar botones en el DOM
console.log('\n2. Botones "Nueva Solicitud" encontrados:');
const botones = document.querySelectorAll('button');
let botonesNuevaSolicitud = 0;

botones.forEach((btn, index) => {
    if (btn.textContent.includes('Nueva Solicitud') || btn.innerHTML.includes('Nueva Solicitud')) {
        botonesNuevaSolicitud++;
        console.log(`   Botón ${botonesNuevaSolicitud}:`, {
            index: index,
            text: btn.textContent.trim(),
            onclick: btn.getAttribute('onclick'),
            disabled: btn.disabled,
            style_display: window.getComputedStyle(btn).display,
            style_visibility: window.getComputedStyle(btn).visibility,
            classes: btn.className
        });
        
        // Agregar evento de debug
        btn.addEventListener('click', function(e) {
            console.log('🖱️ CLICK DETECTADO en botón Nueva Solicitud');
            console.log('   - Evento:', e);
            console.log('   - Target:', e.target);
            console.log('   - CurrentTarget:', e.currentTarget);
        });
    }
});

console.log(`Total botones Nueva Solicitud encontrados: ${botonesNuevaSolicitud}`);

// 3. Verificar token de autenticación
console.log('\n3. Token de autenticación:');
const token = localStorage.getItem('empleado_token');
console.log('   - ¿Existe token?', token ? '✅' : '❌');
if (token) {
    console.log('   - Longitud del token:', token.length);
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('   - Token válido:', payload.exp > Date.now()/1000 ? '✅' : '❌ EXPIRADO');
        console.log('   - Empleado:', payload.nombre);
    } catch (err) {
        console.log('   - ❌ Error decodificando token');
    }
}

// 4. Verificar API endpoint
console.log('\n4. Verificando endpoint tipos-permisos...');
if (token) {
    fetch('/api/solicitudes-empleado/tipos-permisos', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('   - Status:', response.status, response.ok ? '✅' : '❌');
        return response.json();
    })
    .then(data => {
        console.log('   - Tipos de permisos disponibles:', data.length);
        data.forEach((tipo, i) => {
            console.log(`     ${i+1}. ${tipo.nombre} (${tipo.codigo})`);
        });
    })
    .catch(error => {
        console.log('   - ❌ Error:', error.message);
    });
} else {
    console.log('   - ❌ No se puede verificar sin token');
}

// 5. Función de prueba manual
console.log('\n5. Función de prueba manual:');
console.log('Ejecuta: probarBotonNuevaSolicitud()');

window.probarBotonNuevaSolicitud = function() {
    console.log('🧪 Probando función mostrarSolicitudPermiso...');
    
    if (typeof window.empleadoSystem !== 'undefined' && typeof window.empleadoSystem.mostrarSolicitudPermiso === 'function') {
        try {
            window.empleadoSystem.mostrarSolicitudPermiso();
            console.log('✅ Función ejecutada sin errores');
        } catch (error) {
            console.error('❌ Error ejecutando función:', error);
        }
    } else {
        console.error('❌ empleadoSystem no disponible');
    }
};

// 6. Verificar errores en consola
console.log('\n6. Revisar la pestaña "Console" para ver si hay errores JavaScript');
console.log('7. Si el botón no responde, verificar si hay overlays o elementos que bloqueen el click');

console.log('\n✅ Diagnóstico completado. Revisa los resultados arriba.');