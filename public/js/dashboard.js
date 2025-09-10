// Módulo de Dashboard

// Cargar dashboard según el tipo de usuario
async function loadDashboard() {
    try {
        if (!isAuthenticated()) {
            showLoginModal();
            return;
        }

        const mainContent = document.getElementById('main-content');
        showElementLoader(mainContent, true);

        let dashboardHTML = '';
        
        if (isAdmin()) {
            dashboardHTML = await loadAdminDashboard();
        } else if (isEmpleado()) {
            dashboardHTML = await loadEmpleadoDashboard();
        }

        mainContent.innerHTML = dashboardHTML;
        showElementLoader(mainContent, false);

        // Actualizar navegación activa
        updateActiveNavigation('dashboard');

    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showAlert('Error cargando el dashboard', 'danger');
    }
}

// Dashboard de administrador
async function loadAdminDashboard() {
    try {
        const dashboardData = await api.getDashboardAdmin();
        const stats = dashboardData.data;

        return `
            <div class="row mb-4">
                <div class="col-12">
                    <h1 class="h3 mb-0">Dashboard Administrativo</h1>
                    <p class="text-muted">Panel de control del sistema de permisos</p>
                </div>
            </div>

            <!-- Estadísticas principales -->
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card success">
                        <div class="stats-number">${stats.estadisticas_generales.total_empleados || 0}</div>
                        <div class="stats-label">Empleados Activos</div>
                        <i class="fas fa-users fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card warning">
                        <div class="stats-number">${stats.estadisticas_generales.solicitudes_pendientes || 0}</div>
                        <div class="stats-label">Solicitudes Pendientes</div>
                        <i class="fas fa-clock fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card info">
                        <div class="stats-number">${stats.estadisticas_generales.solicitudes_hoy || 0}</div>
                        <div class="stats-label">Solicitudes Hoy</div>
                        <i class="fas fa-calendar-day fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card">
                        <div class="stats-number">${stats.estadisticas_generales.aprobadas_mes_actual || 0}</div>
                        <div class="stats-label">Aprobadas este Mes</div>
                        <i class="fas fa-check-circle fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Solicitudes por estado -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Solicitudes por Estado</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="estadoChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tipos de permisos más solicitados -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Tipos de Permisos Populares</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="tiposChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Solicitudes recientes -->
                <div class="col-lg-8 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-list me-2"></i>Solicitudes Recientes</h5>
                            <a href="#" class="btn btn-outline-primary btn-sm" onclick="loadPermisosView('todos')">
                                Ver todas
                            </a>
                        </div>
                        <div class="card-body p-0">
                            ${renderRecentRequests(stats.solicitudes_recientes || [])}
                        </div>
                    </div>
                </div>

                <!-- Empleados activos -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-users me-2"></i>Top Empleados</h5>
                        </div>
                        <div class="card-body">
                            ${renderTopEmployees(stats.empleados_activos || [])}
                        </div>
                    </div>
                </div>
            </div>

            <script>
                // Inicializar gráficos después de que el HTML esté cargado
                setTimeout(() => {
                    initializeAdminCharts(${JSON.stringify(stats)});
                }, 100);
            </script>
        `;

    } catch (error) {
        console.error('Error cargando dashboard admin:', error);
        return `
            <div class="alert alert-danger">
                <h4>Error al cargar el dashboard</h4>
                <p>No se pudo cargar la información del dashboard. ${error.message}</p>
                <button class="btn btn-danger" onclick="loadDashboard()">Reintentar</button>
            </div>
        `;
    }
}

// Dashboard de empleado
async function loadEmpleadoDashboard() {
    try {
        const dashboardData = await api.getDashboardEmpleado();
        const data = dashboardData.data;

        return `
            <div class="row mb-4">
                <div class="col-12">
                    <h1 class="h3 mb-0">Mi Dashboard</h1>
                    <p class="text-muted">Bienvenido/a, ${data.info_empleado.nombre}</p>
                </div>
            </div>

            <!-- Información del empleado -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-id-card me-2"></i>Mi Información</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Nombre:</strong> ${data.info_empleado.nombre}</p>
                                    <p><strong>RUT:</strong> ${data.info_empleado.rut}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Cargo:</strong> ${data.info_empleado.cargo}</p>
                                    <p><strong>Fecha Nacimiento:</strong> ${formatDate(data.info_empleado.fecha_nacimiento)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center dashboard-widget">
                        <div class="card-body">
                            <h3>Acciones Rápidas</h3>
                            <button class="btn btn-light btn-lg w-100 mb-2" onclick="loadSolicitarPermisoView()">
                                <i class="fas fa-plus-circle me-2"></i>Solicitar Permiso
                            </button>
                            <button class="btn btn-outline-light w-100" onclick="loadMisPermisosView()">
                                <i class="fas fa-calendar-alt me-2"></i>Ver Mis Permisos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estadísticas de solicitudes -->
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card">
                        <div class="stats-number">${data.estadisticas_solicitudes.total_solicitudes || 0}</div>
                        <div class="stats-label">Total Solicitudes</div>
                        <i class="fas fa-list fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card warning">
                        <div class="stats-number">${data.estadisticas_solicitudes.pendientes || 0}</div>
                        <div class="stats-label">Pendientes</div>
                        <i class="fas fa-clock fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card success">
                        <div class="stats-number">${data.estadisticas_solicitudes.aprobadas || 0}</div>
                        <div class="stats-label">Aprobadas</div>
                        <i class="fas fa-check-circle fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stats-card danger">
                        <div class="stats-number">${data.estadisticas_solicitudes.rechazadas || 0}</div>
                        <div class="stats-label">Rechazadas</div>
                        <i class="fas fa-times-circle fa-2x opacity-50 position-absolute" style="right: 1rem; top: 1rem;"></i>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Próximos permisos -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Próximos Permisos</h5>
                        </div>
                        <div class="card-body">
                            ${renderUpcomingPermissions(data.proximos_permisos || [])}
                        </div>
                    </div>
                </div>

                <!-- Mis solicitudes recientes -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-history me-2"></i>Solicitudes Recientes</h5>
                            <a href="#" class="btn btn-outline-primary btn-sm" onclick="loadMisPermisosView()">
                                Ver todas
                            </a>
                        </div>
                        <div class="card-body p-0">
                            ${renderRecentRequests(data.solicitudes_recientes || [])}
                        </div>
                    </div>
                </div>

                <!-- Notificaciones -->
                ${data.notificaciones && data.notificaciones.length > 0 ? `
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-bell me-2"></i>Notificaciones</h5>
                        </div>
                        <div class="card-body">
                            ${renderNotifications(data.notificaciones)}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <script>
                // Inicializar componentes específicos del empleado
                setTimeout(() => {
                    initializeEmployeeDashboard(${JSON.stringify(data)});
                }, 100);
            </script>
        `;

    } catch (error) {
        console.error('Error cargando dashboard empleado:', error);
        return `
            <div class="alert alert-danger">
                <h4>Error al cargar el dashboard</h4>
                <p>No se pudo cargar tu información personal. ${error.message}</p>
                <button class="btn btn-danger" onclick="loadDashboard()">Reintentar</button>
            </div>
        `;
    }
}

// Renderizar solicitudes recientes
function renderRecentRequests(requests) {
    if (!requests || requests.length === 0) {
        return `
            <div class="text-center text-muted p-4">
                <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                <p>No hay solicitudes recientes</p>
            </div>
        `;
    }

    return `
        <div class="list-group list-group-flush">
            ${requests.map(request => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${request.empleado_nombre || 'Sin nombre'}</h6>
                            <p class="mb-1 small">${request.tipo_permiso || 'Tipo desconocido'} - ${formatDate(request.fecha_desde)}</p>
                            <small class="text-muted">${formatDateTime(request.created_at)}</small>
                        </div>
                        <div class="text-end">
                            ${getStatusBadge(request.estado)}
                            ${isAdmin() ? `
                                <button class="btn btn-outline-primary btn-sm ms-2" onclick="viewRequestDetails(${request.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Renderizar próximos permisos
function renderUpcomingPermissions(permissions) {
    if (!permissions || permissions.length === 0) {
        return `
            <div class="text-center text-muted">
                <i class="fas fa-calendar fa-3x mb-3 opacity-25"></i>
                <p>No tienes permisos programados</p>
            </div>
        `;
    }

    return `
        <div class="list-group list-group-flush">
            ${permissions.map(permission => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge badge-permiso" style="background-color: ${permission.color_hex};">
                                ${permission.codigo}
                            </span>
                            <span class="ms-2">${permission.tipo_permiso}</span>
                        </div>
                        <div class="text-end">
                            <strong>${formatDate(permission.fecha_desde)}</strong>
                            ${permission.fecha_hasta && permission.fecha_hasta !== permission.fecha_desde ? 
                                ` - ${formatDate(permission.fecha_hasta)}` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Renderizar top empleados
function renderTopEmployees(employees) {
    if (!employees || employees.length === 0) {
        return '<p class="text-muted">No hay datos disponibles</p>';
    }

    return employees.slice(0, 5).map((emp, index) => `
        <div class="d-flex align-items-center mb-3">
            <div class="badge bg-primary rounded-pill me-3">${index + 1}</div>
            <div class="flex-grow-1">
                <div class="fw-bold">${emp.nombre}</div>
                <small class="text-muted">${emp.cargo}</small>
            </div>
            <div class="text-end">
                <div class="fw-bold text-primary">${emp.total_solicitudes || 0}</div>
                <small class="text-muted">solicitudes</small>
            </div>
        </div>
    `).join('');
}

// Renderizar notificaciones
function renderNotifications(notifications) {
    return notifications.map(notif => `
        <div class="alert alert-${notif.tipo.toLowerCase()} alert-dismissible">
            <h6 class="alert-heading">${notif.titulo}</h6>
            <p class="mb-1">${notif.mensaje}</p>
            <hr>
            <small class="mb-0">${formatDateTime(notif.created_at)}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert" 
                    onclick="markNotificationAsRead(${notif.id})"></button>
        </div>
    `).join('');
}

// Inicializar gráficos del dashboard admin
function initializeAdminCharts(data) {
    // Gráfico de estados
    if (data.solicitudes_por_estado && data.solicitudes_por_estado.length > 0) {
        const estadoCtx = document.getElementById('estadoChart');
        if (estadoCtx) {
            new Chart(estadoCtx, {
                type: 'doughnut',
                data: {
                    labels: data.solicitudes_por_estado.map(item => item.estado),
                    datasets: [{
                        data: data.solicitudes_por_estado.map(item => item.cantidad),
                        backgroundColor: ['#ffc107', '#28a745', '#dc3545', '#6c757d'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // Gráfico de tipos de permisos
    if (data.tipos_permisos_populares && data.tipos_permisos_populares.length > 0) {
        const tiposCtx = document.getElementById('tiposChart');
        if (tiposCtx) {
            new Chart(tiposCtx, {
                type: 'bar',
                data: {
                    labels: data.tipos_permisos_populares.map(item => item.codigo),
                    datasets: [{
                        label: 'Solicitudes',
                        data: data.tipos_permisos_populares.map(item => item.cantidad),
                        backgroundColor: data.tipos_permisos_populares.map(item => item.color_hex),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
}

// Inicializar dashboard de empleado
function initializeEmployeeDashboard(data) {
    // Aquí se pueden agregar inicializaciones específicas para empleados
    console.log('Dashboard de empleado inicializado', data);
}

// Ver detalles de una solicitud
function viewRequestDetails(requestId) {
    // Esta función se implementará en permisos.js
    if (typeof showRequestDetails === 'function') {
        showRequestDetails(requestId);
    } else {
        showAlert('Funcionalidad no disponible aún', 'info');
    }
}

// Actualizar navegación activa
function updateActiveNavigation(currentPage) {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Marcar el enlace activo según la página actual
    const activeLink = document.querySelector(`[onclick*="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Exportar funciones
window.loadDashboard = loadDashboard;
window.loadAdminDashboard = loadAdminDashboard;
window.loadEmpleadoDashboard = loadEmpleadoDashboard;