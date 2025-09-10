// Módulo de autenticación

// Login de empleado
async function loginEmpleado(rut) {
    try {
        // Validar RUT
        if (!rut || rut.trim() === '') {
            showAlert('Por favor, ingresa tu RUT', 'warning');
            return false;
        }

        // Limpiar y validar formato de RUT
        const rutLimpio = rut.replace(/[\.\-\s]/g, '');
        
        if (rutLimpio.length < 8 || rutLimpio.length > 9) {
            showAlert('Formato de RUT inválido', 'warning');
            return false;
        }

        // Mostrar loading
        const submitBtn = document.querySelector('#empleadoLoginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ingresando...';

        try {
            const response = await api.loginEmpleado(rut);
            
            if (response.success) {
                AppState.user = response.data.user;
                showAlert('¡Bienvenido ' + response.data.user.nombre + '!', 'success');
                await initializeApp();
                return true;
            } else {
                showAlert(response.message, 'danger');
                return false;
            }
        } catch (error) {
            console.error('Error en login empleado:', error);
            showAlert('Error al iniciar sesión. Verifica tu RUT.', 'danger');
            return false;
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }

    } catch (error) {
        console.error('Error general en login empleado:', error);
        showAlert('Error inesperado al iniciar sesión', 'danger');
        return false;
    }
}

// Login de administrador
async function loginAdmin(username, password) {
    try {
        // Validaciones
        if (!username || username.trim() === '') {
            showAlert('Por favor, ingresa tu usuario', 'warning');
            return false;
        }

        if (!password || password.trim() === '') {
            showAlert('Por favor, ingresa tu contraseña', 'warning');
            return false;
        }

        // Mostrar loading
        const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ingresando...';

        try {
            const response = await api.loginAdmin(username, password);
            
            if (response.success) {
                AppState.user = response.data.user;
                showAlert('¡Bienvenido ' + response.data.user.nombre + '!', 'success');
                await initializeApp();
                return true;
            } else {
                showAlert(response.message, 'danger');
                return false;
            }
        } catch (error) {
            console.error('Error en login admin:', error);
            showAlert('Credenciales inválidas. Verifica tu usuario y contraseña.', 'danger');
            return false;
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }

    } catch (error) {
        console.error('Error general en login admin:', error);
        showAlert('Error inesperado al iniciar sesión', 'danger');
        return false;
    }
}

// Verificar token almacenado
async function verifyStoredToken() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        return null;
    }

    try {
        const response = await api.verifyToken();
        
        if (response.success) {
            return response.data.user;
        } else {
            // Token inválido, limpiar storage
            localStorage.removeItem('auth_token');
            return null;
        }
    } catch (error) {
        console.error('Error verificando token:', error);
        localStorage.removeItem('auth_token');
        return null;
    }
}

// Logout
async function logout() {
    try {
        // Mostrar confirmación
        const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
        
        if (!confirmLogout) {
            return false;
        }

        // Limpiar estado local primero
        AppState.user = null;
        AppState.notifications = [];
        const token = localStorage.getItem('auth_token');
        
        // Limpiar completamente localStorage y sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        api.setToken(null);
        
        // Cerrar cualquier modal que pueda estar abierto
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        try {
            // Intentar logout en el servidor solo si hay token
            if (token) {
                await api.logout();
            }
        } catch (error) {
            // Aunque falle el logout del servidor, continuamos con el logout local
            console.warn('Error en logout del servidor (no crítico):', error);
        }

        // Ocultar interfaz principal
        hideMainInterface();
        
        // Mostrar modal de login
        showLoginModal();

        showAlert('Sesión cerrada exitosamente', 'success');
        
        return true;

    } catch (error) {
        console.error('Error durante logout:', error);
        // Limpiar estado local aunque haya error
        AppState.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('sessionStorage');
        sessionStorage.clear();
        api.setToken(null);
        hideMainInterface();
        showLoginModal();
        showAlert('Sesión cerrada', 'info');
        return false;
    }
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return AppState.user !== null && localStorage.getItem('auth_token') !== null;
}

// Verificar si el usuario es administrador
function isAdmin() {
    return isAuthenticated() && AppState.user.type === 'admin';
}

// Verificar si el usuario es empleado
function isEmpleado() {
    return isAuthenticated() && AppState.user.type === 'empleado';
}

// Middleware para verificar autenticación antes de ejecutar funciones
function requireAuth(callback) {
    if (!isAuthenticated()) {
        showAlert('Debes iniciar sesión para continuar', 'warning');
        showLoginModal();
        return false;
    }
    
    if (typeof callback === 'function') {
        return callback();
    }
    
    return true;
}

// Middleware para verificar que sea administrador
function requireAdmin(callback) {
    if (!isAuthenticated()) {
        showAlert('Debes iniciar sesión para continuar', 'warning');
        showLoginModal();
        return false;
    }
    
    if (!isAdmin()) {
        showAlert('No tienes permisos para realizar esta acción', 'danger');
        return false;
    }
    
    if (typeof callback === 'function') {
        return callback();
    }
    
    return true;
}

// Auto-logout por inactividad (30 minutos)
let inactivityTimer;
const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos en millisegundos

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    if (isAuthenticated()) {
        inactivityTimer = setTimeout(() => {
            showAlert('Tu sesión ha expirado por inactividad', 'warning');
            logout();
        }, INACTIVITY_TIME);
    }
}

// Eventos para detectar actividad del usuario
function setupActivityDetection() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
}

// Configurar detección de actividad cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupActivityDetection);

// Manejo de cambio de visibilidad de la página
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && isAuthenticated()) {
        // Verificar token cuando la página vuelve a ser visible
        verifyStoredToken().then(user => {
            if (!user) {
                showAlert('Tu sesión ha expirado', 'warning');
                logout();
            }
        }).catch(error => {
            console.error('Error verificando token al volver a la página:', error);
        });
    }
});

// Renovar token automáticamente (cada 30 minutos)
function setupTokenRenewal() {
    setInterval(async () => {
        if (isAuthenticated()) {
            try {
                await api.verifyToken();
                console.log('Token renovado exitosamente');
            } catch (error) {
                console.warn('Error renovando token:', error);
                showAlert('Tu sesión ha expirado', 'warning');
                logout();
            }
        }
    }, 30 * 60 * 1000); // 30 minutos
}

// Inicializar renovación de token
document.addEventListener('DOMContentLoaded', setupTokenRenewal);

// Funciones para manejar el estado de autenticación en la UI
function updateAuthUI() {
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (isAuthenticated() && userDisplayName) {
        userDisplayName.textContent = AppState.user.nombre || AppState.user.username;
        
        // Actualizar menú según el rol
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            setupNavigation();
        }
    }
}

// Validación de formulario de login
function setupLoginFormValidation() {
    // Validación en tiempo real para RUT
    const rutInput = document.getElementById('rutEmpleado');
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\dkK]/g, '');
            
            if (value.length > 1) {
                const rutNumber = value.slice(0, -1);
                const rutDV = value.slice(-1);
                value = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + rutDV;
            }
            
            e.target.value = value;
            
            // Remover clases de validación previas
            e.target.classList.remove('is-valid', 'is-invalid');
            
            if (value.length >= 11) { // Formato completo: XX.XXX.XXX-X
                if (validateRUT(value)) {
                    e.target.classList.add('is-valid');
                } else {
                    e.target.classList.add('is-invalid');
                }
            }
        });
    }

    // Permitir envío con Enter
    const loginForms = document.querySelectorAll('#empleadoLoginForm, #adminLoginForm');
    loginForms.forEach(form => {
        form.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        });
    });
}

// Configurar validación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupLoginFormValidation);

// Manejo de errores de conexión
window.addEventListener('online', function() {
    if (isAuthenticated()) {
        showAlert('Conexión reestablecida', 'success', 3000);
    }
});

window.addEventListener('offline', function() {
    if (isAuthenticated()) {
        showAlert('Sin conexión a internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
    }
});

// Exportar funciones principales
window.loginEmpleado = loginEmpleado;
window.loginAdmin = loginAdmin;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.isAdmin = isAdmin;
window.isEmpleado = isEmpleado;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.updateAuthUI = updateAuthUI;