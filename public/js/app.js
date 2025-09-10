// Estado global de la aplicación
const AppState = {
    user: null,
    currentView: 'dashboard',
    notifications: [],
    isLoading: false
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando Sistema de Permisos Administrativos');
    
    // Limpiar completamente la interfaz al inicio
    console.log('🧹 Limpiando interfaz inicial...');
    const content = document.getElementById('main-content');
    if (content) {
        content.innerHTML = '';
        content.style.display = 'none';
    }
    const navbar = document.getElementById('mainNavbar');
    if (navbar) {
        navbar.style.display = 'none';
    }
    
    try {
        // Verificar si hay token guardado
        const token = localStorage.getItem('auth_token');
        console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');
        
        if (token) {
            console.log('🔄 Verificando token con servidor...');
            showLoadingScreen(true);
            
            try {
                // Verificar token con el servidor
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('📡 Respuesta del servidor:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Token válido, usuario:', data.data.user.nombre);
                    AppState.user = data.data.user;
                    await initializeApp();
                    return;
                } else {
                    console.log('❌ Token inválido');
                }
            } catch (error) {
                console.error('❌ Error verificando token:', error);
            }
            
            // Token inválido, limpiar y mostrar login
            localStorage.removeItem('auth_token');
            showLoadingScreen(false);
        } else {
            console.log('📝 No hay token, mostrando login');
            showLoadingScreen(false);
        }
        
        // Solo mostrar modal de login si no hay empleado logueado
        const empleadoToken = localStorage.getItem('empleado_token');
        if (!empleadoToken) {
            console.log('🔓 Mostrando modal de login');
            showLoginModal();
        } else {
            console.log('👨‍💼 Empleado ya logueado, omitiendo modal de admin');
        }
        
    } catch (error) {
        console.error('💥 Error inicializando aplicación:', error);
        showAlert('Error al inicializar la aplicación', 'danger');
        showLoadingScreen(false);
        showLoginModal();
    }
});

// Inicializar la aplicación después del login
async function initializeApp() {
    try {
        console.log('👤 Usuario autenticado:', AppState.user.nombre);
        
        // Limpiar completamente la interfaz anterior
        const content = document.getElementById('main-content');
        if (content) {
            content.innerHTML = '';
            content.style.display = 'none';
        }
        
        // Ocultar modal de login y loading
        hideLoginModal();
        showLoadingScreen(false);
        
        // Mostrar interfaz principal
        showMainInterface();
        
        // Configurar navegación según el rol
        setupNavigation();
        
        // Cargar notificaciones
        await loadNotifications();
        
        // Cargar dashboard inicial
        await loadDashboard();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('Error inicializando aplicación:', error);
        showAlert('Error al inicializar la aplicación', 'danger');
    }
}

// Mostrar/ocultar interfaz principal
function showMainInterface() {
    const navbar = document.getElementById('mainNavbar');
    const content = document.getElementById('main-content');
    
    if (navbar) {
        navbar.style.display = 'block';
    }
    if (content) {
        content.style.display = 'block';
    }
    
    // Actualizar nombre de usuario
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName && AppState.user) {
        userDisplayName.textContent = AppState.user.nombre || AppState.user.username;
    }
}

function hideMainInterface() {
    const navbar = document.getElementById('mainNavbar');
    const content = document.getElementById('main-content');
    
    if (navbar) {
        navbar.style.display = 'none';
        // Limpiar también el navbar
        const navLinks = navbar.querySelector('#navLinks');
        if (navLinks) {
            navLinks.innerHTML = '';
        }
    }
    if (content) {
        content.style.display = 'none';
        // Limpiar completamente el contenido para evitar que se vea en el fondo
        content.innerHTML = '';
    }
    
    // Cerrar cualquier modal que pueda estar abierto
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
    
    // Limpiar alertas
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
}

// Configurar navegación según el rol del usuario
function setupNavigation() {
    const navLinks = document.getElementById('navLinks');
    const userType = AppState.user.type;
    
    let navigationHTML = '';
    
    if (userType === 'admin') {
        navigationHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadDashboard()">
                    <i class="fas fa-tachometer-alt me-1"></i>Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadEmpleadosView()">
                    <i class="fas fa-users me-1"></i>Empleados
                </a>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-calendar-check me-1"></i>Permisos
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="loadPermisosView('pendientes')">
                        <i class="fas fa-clock me-2"></i>Pendientes
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="loadPermisosView('aprobados')">
                        <i class="fas fa-check-circle me-2"></i>Aprobados
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="loadPermisosView('rechazados')">
                        <i class="fas fa-times-circle me-2"></i>Rechazados
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="loadPermisosView('todos')">
                        <i class="fas fa-list me-2"></i>Todos los Permisos
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="loadPermisosOrganizationalView()">
                        <i class="fas fa-users-cog me-2"></i>Permisos por Empleado
                    </a></li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showAlert('Reportes próximamente', 'info')">
                    <i class="fas fa-chart-bar me-1"></i>Reportes
                </a>
            </li>
        `;
    } else if (userType === 'empleado') {
        navigationHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadDashboard()">
                    <i class="fas fa-home me-1"></i>Inicio
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadSolicitarPermisoView()">
                    <i class="fas fa-plus-circle me-1"></i>Solicitar Permiso
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadMisPermisosView()">
                    <i class="fas fa-calendar-alt me-1"></i>Mis Permisos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="loadPerfilView()">
                    <i class="fas fa-user me-1"></i>Mi Perfil
                </a>
            </li>
        `;
    }
    
    navLinks.innerHTML = navigationHTML;
}

// Gestión del loading screen
function showLoadingScreen(show = true) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (show) {
        loadingScreen.style.display = 'flex';
    } else {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                loadingScreen.style.opacity = '1';
            }, 300);
        }, 100);
    }
}

// Gestión de modals de login
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
        backdrop: 'static',
        keyboard: false
    });
    loginModal.show();
}

function hideLoginModal() {
    const loginModalEl = document.getElementById('loginModal');
    const loginModal = bootstrap.Modal.getInstance(loginModalEl);
    if (loginModal) {
        loginModal.hide();
    }
}

// Cargar notificaciones
async function loadNotifications() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/dashboard/notificaciones?leida=false&limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            AppState.notifications = data.data;
            updateNotificationUI();
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}

// Actualizar UI de notificaciones
function updateNotificationUI() {
    const badge = document.getElementById('notificationBadge');
    const dropdown = document.getElementById('notificationDropdown');
    const noNotifications = document.getElementById('noNotifications');
    
    if (AppState.notifications.length > 0) {
        badge.textContent = AppState.notifications.length;
        badge.style.display = 'inline-block';
        noNotifications.style.display = 'none';
        
        // Agregar notificaciones al dropdown
        const notificationsHTML = AppState.notifications.map(notification => `
            <li>
                <div class="dropdown-item notification-item" onclick="markNotificationAsRead(${notification.id})">
                    <div class="fw-bold">${notification.titulo}</div>
                    <div class="small text-muted">${notification.mensaje}</div>
                    <div class="small text-muted">${formatDate(notification.created_at)}</div>
                </div>
            </li>
        `).join('');
        
        dropdown.innerHTML = `
            <li><h6 class="dropdown-header">Notificaciones</h6></li>
            <li><hr class="dropdown-divider"></li>
            ${notificationsHTML}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-center" href="#" onclick="loadNotificationsView()">
                Ver todas las notificaciones
            </a></li>
        `;
    } else {
        badge.style.display = 'none';
        noNotifications.style.display = 'block';
    }
}

// Marcar notificación como leída
async function markNotificationAsRead(notificationId) {
    try {
        const token = localStorage.getItem('auth_token');
        await fetch(`/api/dashboard/notificaciones/${notificationId}/leida`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Recargar notificaciones
        await loadNotifications();
    } catch (error) {
        console.error('Error marcando notificación:', error);
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar localStorage
        localStorage.removeItem('auth_token');
        localStorage.clear();
        
        // Limpiar sessionStorage
        sessionStorage.clear();
        
        // Limpiar estado de la aplicación
        AppState.user = null;
        AppState.notifications = [];
        AppState.currentView = 'dashboard';
        AppState.isLoading = false;
        
        // Limpiar caché del navegador si está disponible
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            }).catch(function(error) {
                console.log('Error limpiando caché:', error);
            });
        }
        
        hideMainInterface();
        showLoginModal();
        
        showAlert('Sesión cerrada exitosamente', 'success');
        
        // Forzar recarga después de un breve delay para asegurar limpieza completa
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }
}

// Mostrar modal de cambio de contraseña
function showChangePasswordModal() {
    if (AppState.user.type !== 'admin') {
        showAlert('Solo los administradores pueden cambiar su contraseña', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

// Cambiar contraseña
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Todos los campos son obligatorios', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert(data.message, 'success');
            
            // Cerrar modal y limpiar formulario
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
            document.getElementById('changePasswordForm').reset();
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showAlert('Error al cambiar la contraseña', 'danger');
    }
}

// Manejo de errores globales
window.addEventListener('error', function(event) {
    console.error('Error global:', event.error);
    showAlert('Ha ocurrido un error inesperado', 'danger');
});

// Prevenir navegación accidental
window.addEventListener('beforeunload', function(event) {
    if (AppState.user && document.querySelector('form:not([data-allow-unload])')) {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
});

// Configurar listener para formularios de login
document.addEventListener('DOMContentLoaded', function() {
    // Form login empleado
    const empleadoForm = document.getElementById('empleadoLoginForm');
    if (empleadoForm) {
        empleadoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const rut = document.getElementById('rutEmpleado').value;
            await loginEmpleado(rut);
        });
    }
    
    // Form login admin
    const adminForm = document.getElementById('adminLoginForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await loginAdmin(username, password);
        });
    }
    
    // Form cambio de contraseña
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
});

// Exportar funciones globales para uso en otros archivos
window.AppState = AppState;
window.showLoadingScreen = showLoadingScreen;
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;