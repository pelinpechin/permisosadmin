// Utilidades de debug para el sistema de permisos

// Función para limpiar completamente el cache y localStorage
function clearAllCache() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el cache y datos almacenados? Esto cerrará tu sesión.')) {
        console.log('🧹 Iniciando limpieza completa del cache...');
        
        // Limpiar localStorage
        const localStorageItems = localStorage.length;
        localStorage.clear();
        console.log(`✅ localStorage limpiado (${localStorageItems} elementos)`);
        
        // Limpiar sessionStorage  
        const sessionStorageItems = sessionStorage.length;
        sessionStorage.clear();
        console.log(`✅ sessionStorage limpiado (${sessionStorageItems} elementos)`);
        
        // Limpiar cookies
        const cookies = document.cookie.split(";");
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            }
        });
        console.log(`✅ Cookies limpiadas (${cookies.length} cookies)`);
        
        // Limpiar cache del navegador
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        console.log(`🗑️ Eliminando cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('✅ Cache del navegador limpiado');
                showAlert('Cache limpiado completamente. Recargando página...', 'success');
                
                // Recargar la página después de un breve delay
                setTimeout(() => {
                    window.location.reload(true);
                }, 2000);
            }).catch(function(error) {
                console.error('❌ Error limpiando cache:', error);
            });
        } else {
            console.log('ℹ️ Cache API no disponible');
            showAlert('Cache limpiado. Recargando página...', 'success');
            setTimeout(() => {
                window.location.reload(true);
            }, 2000);
        }
        
        // Limpiar estado de la aplicación
        if (typeof AppState !== 'undefined') {
            AppState.user = null;
            AppState.notifications = [];
        }
        
        // Limpiar API token
        if (typeof api !== 'undefined') {
            api.setToken(null);
        }
    }
}

// Función para diagnosticar el estado actual
function debugCurrentState() {
    console.log('=== DIAGNÓSTICO DEL SISTEMA ===');
    console.log('URL:', window.location.href);
    console.log('AppState.user:', AppState?.user);
    
    console.log('\n--- localStorage ---');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
    }
    
    console.log('\n--- sessionStorage ---');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
    }
    
    console.log('\n--- Cookies ---');
    console.log(document.cookie || 'Sin cookies');
    
    console.log('\n--- Token actual ---');
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            // Decodificar token JWT (solo la parte del payload)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
        } catch (e) {
            console.log('Token no es JWT válido:', token.substring(0, 50) + '...');
        }
    } else {
        console.log('No hay token almacenado');
    }
}

// Función para probar login específico
async function debugTestLogin(rut) {
    try {
        console.log(`🧪 Probando login con RUT: ${rut}`);
        
        const response = await fetch('/api/auth/login/empleado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rut })
        });
        
        const data = await response.json();
        
        console.log('Response:', data);
        
        if (data.success && data.data) {
            console.log('✅ Login exitoso:');
            console.log('Usuario:', data.data.user);
            console.log('Token generado:', data.data.token?.substring(0, 50) + '...');
        } else {
            console.log('❌ Login fallido:', data.message);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error en test login:', error);
        return null;
    }
}

// Agregar funciones al objeto global para acceso desde consola
window.debugUtils = {
    clearAllCache,
    debugCurrentState,
    debugTestLogin,
    
    // Atajos
    clear: clearAllCache,
    diag: debugCurrentState,
    test: debugTestLogin
};

// También hacer las funciones accesibles directamente
window.clearAllCache = clearAllCache;
window.debugCurrentState = debugCurrentState;
window.debugTestLogin = debugTestLogin;

console.log('🛠️ Utilidades de debug cargadas.');
console.log('Usa clearAllCache() para limpiar todo el cache');
console.log('Usa debugCurrentState() para diagnosticar el estado');
console.log('Usa debugTestLogin("12.345.678-9") para probar login');
console.log('También disponible como debugUtils.clear(), debugUtils.diag(), etc.');