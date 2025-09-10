// Módulo de gestión de permisos

// Cargar vista de solicitar permiso (empleados)
async function loadSolicitarPermisoView() {
    return requireAuth(async () => {
        if (!isEmpleado()) {
            showAlert('Solo los empleados pueden solicitar permisos', 'warning');
            return;
        }

        try {
            const mainContent = document.getElementById('main-content');
            showElementLoader(mainContent, true);

            // Obtener tipos de permisos
            const tiposResponse = await api.getTiposPermisos();
            const tipos = tiposResponse.data;

            const html = `
                <div class="row">
                    <div class="col-12">
                        <h1 class="h3 mb-4">Solicitar Permiso</h1>
                    </div>
                </div>

                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Nueva Solicitud de Permiso</h5>
                            </div>
                            <div class="card-body">
                                <form id="solicitudPermisoForm">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="tipoPermiso" class="form-label">Tipo de Permiso <span class="text-danger">*</span></label>
                                            <select class="form-select" id="tipoPermiso" name="tipo_permiso_id" required>
                                                <option value="">Selecciona un tipo de permiso</option>
                                                ${tipos.map(tipo => `
                                                    <option value="${tipo.id}" 
                                                            data-descripcion="${tipo.descripcion}"
                                                            data-color="${tipo.color_hex}"
                                                            data-requiere-autorizacion="${tipo.requiere_autorizacion}"
                                                            data-afecta-sueldo="${tipo.afecta_sueldo}">
                                                        ${tipo.codigo} - ${tipo.nombre}
                                                    </option>
                                                `).join('')}
                                            </select>
                                            <div class="form-text" id="tipoPermisoHelp">
                                                Selecciona el tipo de permiso que necesitas
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="fechaDesde" class="form-label">Fecha Desde <span class="text-danger">*</span></label>
                                            <input type="date" class="form-control" id="fechaDesde" name="fecha_desde" required min="${new Date().toISOString().split('T')[0]}">
                                            <div class="form-text">Fecha de inicio del permiso</div>
                                        </div>
                                    </div>

                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="fechaHasta" class="form-label">Fecha Hasta</label>
                                            <input type="date" class="form-control" id="fechaHasta" name="fecha_hasta" min="${new Date().toISOString().split('T')[0]}">
                                            <div class="form-text">Déjalo vacío si es solo por un día</div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mt-4">
                                                <div class="alert alert-info" id="permisoInfo" style="display: none;">
                                                    <small>Información del permiso seleccionado aparecerá aquí</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="motivo" class="form-label">Motivo <span class="text-danger">*</span></label>
                                        <textarea class="form-control" id="motivo" name="motivo" rows="3" required placeholder="Describe el motivo de tu solicitud de permiso..."></textarea>
                                        <div class="form-text">Explica brevemente por qué necesitas este permiso</div>
                                    </div>

                                    <div class="mb-4">
                                        <label for="observaciones" class="form-label">Observaciones</label>
                                        <textarea class="form-control" id="observaciones" name="observaciones" rows="2" placeholder="Información adicional (opcional)..."></textarea>
                                        <div class="form-text">Información adicional que consideres relevante</div>
                                    </div>

                                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button type="button" class="btn btn-outline-secondary" onclick="loadDashboard()">
                                            <i class="fas fa-times me-1"></i>Cancelar
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane me-1"></i>Enviar Solicitud
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            mainContent.innerHTML = html;
            showElementLoader(mainContent, false);
            
            setupSolicitudPermisoForm();
            updateActiveNavigation('solicitar');

        } catch (error) {
            console.error('Error cargando formulario:', error);
            showAlert('Error al cargar el formulario de solicitud', 'danger');
        }
    });
}

// Configurar formulario de solicitud
function setupSolicitudPermisoForm() {
    const form = document.getElementById('solicitudPermisoForm');
    const tipoSelect = document.getElementById('tipoPermiso');
    const fechaDesde = document.getElementById('fechaDesde');
    const fechaHasta = document.getElementById('fechaHasta');
    const permisoInfo = document.getElementById('permisoInfo');

    // Actualizar información cuando se selecciona un tipo
    tipoSelect.addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        
        if (option.value) {
            const descripcion = option.dataset.descripcion;
            const requiereAuth = option.dataset.requiereAutorizacion === 'true';
            const afectaSueldo = option.dataset.afectaSueldo === 'true';
            const color = option.dataset.color;
            
            permisoInfo.style.display = 'block';
            permisoInfo.className = afectaSueldo ? 'alert alert-warning' : 'alert alert-info';
            permisoInfo.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <span class="badge me-2" style="background-color: ${color}; color: white;">
                        ${option.text.split(' - ')[0]}
                    </span>
                    <strong>${option.text.split(' - ')[1]}</strong>
                </div>
                <p class="mb-2">${descripcion}</p>
                <div class="small">
                    ${requiereAuth ? '<i class="fas fa-check-circle text-warning me-1"></i>Requiere autorización' : '<i class="fas fa-info-circle text-info me-1"></i>No requiere autorización'}
                    ${afectaSueldo ? '<br><i class="fas fa-exclamation-triangle text-warning me-1"></i>Afecta el sueldo' : '<br><i class="fas fa-dollar-sign text-success me-1"></i>No afecta el sueldo'}
                </div>
            `;
        } else {
            permisoInfo.style.display = 'none';
        }
    });

    // Validar que fecha hasta sea mayor o igual a fecha desde
    fechaDesde.addEventListener('change', function() {
        fechaHasta.min = this.value;
        if (fechaHasta.value && fechaHasta.value < this.value) {
            fechaHasta.value = this.value;
        }
    });

    // Enviar formulario
    form.addEventListener('submit', handleSolicitudSubmit);
}

// Manejar envío de solicitud
async function handleSolicitudSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validaciones
    if (!data.tipo_permiso_id || !data.fecha_desde || !data.motivo) {
        showAlert('Por favor, completa todos los campos obligatorios', 'warning');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';

        const response = await api.createSolicitudPermiso(data);
        
        if (response.success) {
            showAlert('Solicitud enviada exitosamente', 'success');
            form.reset();
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
                loadDashboard();
            }, 2000);
        } else {
            showAlert(response.message, 'danger');
        }
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        showAlert('Error al enviar la solicitud', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Cargar mis permisos (empleado)
async function loadMisPermisosView() {
    return requireAuth(async () => {
        if (!isEmpleado()) {
            showAlert('Solo los empleados pueden ver sus permisos', 'warning');
            return;
        }

        try {
            const mainContent = document.getElementById('main-content');
            showElementLoader(mainContent, true);

            const response = await api.getSolicitudesPermisos({
                empleado_id: AppState.user.id,
                page: 1,
                limit: 20
            });

            const solicitudes = response.data.solicitudes;
            const pagination = response.data.pagination;

            const html = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h1 class="h3 mb-0">Mis Permisos</h1>
                        <p class="text-muted">Historial de todas tus solicitudes de permisos</p>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="search-filters">
                    <div class="row">
                        <div class="col-md-3">
                            <select class="form-select" id="estadoFilter">
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="APROBADO">Aprobados</option>
                                <option value="RECHAZADO">Rechazados</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <input type="date" class="form-control" id="fechaDesdeFilter" placeholder="Desde">
                        </div>
                        <div class="col-md-3">
                            <input type="date" class="form-control" id="fechaHastaFilter" placeholder="Hasta">
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-outline-primary w-100" onclick="filterMisPermisos()">
                                <i class="fas fa-search me-1"></i>Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabla de permisos -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Mis Solicitudes</h5>
                        <button class="btn btn-primary" onclick="loadSolicitarPermisoView()">
                            <i class="fas fa-plus me-1"></i>Nueva Solicitud
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Fechas</th>
                                        <th>Motivo</th>
                                        <th>Estado</th>
                                        <th>Solicitud</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderSolicitudesTable(solicitudes)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                ${renderPagination(pagination)}
            `;

            mainContent.innerHTML = html;
            showElementLoader(mainContent, false);
            updateActiveNavigation('mis-permisos');

        } catch (error) {
            console.error('Error cargando permisos:', error);
            showAlert('Error al cargar tus permisos', 'danger');
        }
    });
}

// Cargar vista de permisos para administradores
async function loadPermisosView(filter = 'todos') {
    return requireAdmin(async () => {
        try {
            const mainContent = document.getElementById('main-content');
            showElementLoader(mainContent, true);

            const params = { page: 1, limit: 20 };
            if (filter !== 'todos') {
                params.estado = filter.toUpperCase();
            }

            const response = await api.getSolicitudesPermisos(params);
            const solicitudes = response.data.solicitudes;
            const pagination = response.data.pagination;

            const html = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h1 class="h3 mb-0">Gestión de Permisos</h1>
                        <p class="text-muted">Administrar solicitudes de permisos de empleados</p>
                    </div>
                </div>

                <!-- Pestañas de filtros rápidos -->
                <div class="mb-4">
                    <ul class="nav nav-pills">
                        <li class="nav-item">
                            <a class="nav-link ${filter === 'todos' ? 'active' : ''}" href="#" onclick="loadPermisosView('todos')">
                                Todos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${filter === 'pendientes' ? 'active' : ''}" href="#" onclick="loadPermisosView('pendientes')">
                                Pendientes
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${filter === 'aprobados' ? 'active' : ''}" href="#" onclick="loadPermisosView('aprobados')">
                                Aprobados
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${filter === 'rechazados' ? 'active' : ''}" href="#" onclick="loadPermisosView('rechazados')">
                                Rechazados
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Filtros avanzados -->
                <div class="search-filters">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="search-input-group">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" class="form-control" id="searchEmpleado" placeholder="Buscar empleado...">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" id="fechaDesdeFilter" placeholder="Desde">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" id="fechaHastaFilter" placeholder="Hasta">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="tipoPermisoFilter">
                                <option value="">Todos los tipos</option>
                                <!-- Se llenarán dinámicamente -->
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-primary w-100" onclick="filterPermisos()">
                                <i class="fas fa-search me-1"></i>Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabla de permisos -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Solicitudes de Permisos</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Tipo</th>
                                        <th>Fechas</th>
                                        <th>Estado</th>
                                        <th>Solicitud</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderSolicitudesAdminTable(solicitudes)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                ${renderPagination(pagination)}
            `;

            mainContent.innerHTML = html;
            showElementLoader(mainContent, false);
            updateActiveNavigation('permisos');

            // Cargar tipos de permisos para el filtro
            // loadTiposPermisoFilter(); // TODO: Implementar función

        } catch (error) {
            console.error('Error cargando permisos admin:', error);
            showAlert('Error al cargar los permisos', 'danger');
        }
    });
}

// Renderizar tabla de solicitudes (empleado)
function renderSolicitudesTable(solicitudes) {
    if (!solicitudes || solicitudes.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                    <p>No tienes solicitudes de permisos aún</p>
                    <button class="btn btn-primary" onclick="loadSolicitarPermisoView()">
                        <i class="fas fa-plus me-1"></i>Crear Primera Solicitud
                    </button>
                </td>
            </tr>
        `;
    }

    return solicitudes.map(solicitud => `
        <tr>
            <td>
                <span class="badge badge-permiso" style="background-color: ${solicitud.tipo_permiso_color};">
                    ${solicitud.tipo_permiso_codigo}
                </span>
                <div class="small text-muted">${solicitud.tipo_permiso_nombre}</div>
            </td>
            <td>
                <strong>${formatDate(solicitud.fecha_desde)}</strong>
                ${solicitud.fecha_hasta && solicitud.fecha_hasta !== solicitud.fecha_desde ? 
                    `<br><small class="text-muted">hasta ${formatDate(solicitud.fecha_hasta)}</small>` : ''}
            </td>
            <td>
                <span class="small">${truncateText(solicitud.motivo, 50)}</span>
            </td>
            <td>${getStatusBadge(solicitud.estado)}</td>
            <td>
                <small class="text-muted">${formatDateTime(solicitud.created_at)}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showRequestDetails(${solicitud.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${solicitud.estado === 'PENDIENTE' ? `
                        <button class="btn btn-outline-danger" onclick="cancelRequest(${solicitud.id})" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar tabla de solicitudes (admin)
function renderSolicitudesAdminTable(solicitudes) {
    if (!solicitudes || solicitudes.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                    <p>No hay solicitudes de permisos</p>
                </td>
            </tr>
        `;
    }

    return solicitudes.map(solicitud => `
        <tr>
            <td>
                <div class="fw-bold">${solicitud.empleado_nombre}</div>
                <small class="text-muted">${solicitud.empleado_rut} - ${solicitud.empleado_cargo}</small>
            </td>
            <td>
                <span class="badge badge-permiso" style="background-color: ${solicitud.tipo_permiso_color};">
                    ${solicitud.tipo_permiso_codigo}
                </span>
                <div class="small text-muted">${solicitud.tipo_permiso_nombre}</div>
            </td>
            <td>
                <strong>${formatDate(solicitud.fecha_desde)}</strong>
                ${solicitud.fecha_hasta && solicitud.fecha_hasta !== solicitud.fecha_desde ? 
                    `<br><small class="text-muted">hasta ${formatDate(solicitud.fecha_hasta)}</small>` : ''}
            </td>
            <td>${getStatusBadge(solicitud.estado)}</td>
            <td>
                <small class="text-muted">${formatDateTime(solicitud.created_at)}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showRequestDetails(${solicitud.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${solicitud.estado === 'PENDIENTE' ? `
                        <button class="btn btn-outline-success" onclick="approveRequest(${solicitud.id})" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="rejectRequest(${solicitud.id})" title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Mostrar detalles de solicitud
async function showRequestDetails(requestId) {
    try {
        const response = await api.getSolicitudPermiso(requestId);
        const solicitud = response.data;

        const modalHTML = `
            <div class="modal fade" id="requestDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-info-circle me-2"></i>Detalles de Solicitud
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6>Empleado</h6>
                                    <p class="mb-1"><strong>${solicitud.empleado_nombre}</strong></p>
                                    <p class="text-muted small">${solicitud.empleado_rut} - ${solicitud.empleado_cargo}</p>
                                </div>
                                <div class="col-md-6 text-end">
                                    <h6>Estado</h6>
                                    ${getStatusBadge(solicitud.estado)}
                                    <p class="text-muted small mt-1">Solicitud: ${formatDateTime(solicitud.created_at)}</p>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6>Tipo de Permiso</h6>
                                    <span class="badge badge-permiso" style="background-color: ${solicitud.tipo_permiso_color};">
                                        ${solicitud.tipo_permiso_codigo} - ${solicitud.tipo_permiso_nombre}
                                    </span>
                                    <p class="text-muted small mt-2">${solicitud.tipo_permiso_descripcion}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Fechas</h6>
                                    <p><strong>Desde:</strong> ${formatDate(solicitud.fecha_desde)}</p>
                                    ${solicitud.fecha_hasta && solicitud.fecha_hasta !== solicitud.fecha_desde ? 
                                        `<p><strong>Hasta:</strong> ${formatDate(solicitud.fecha_hasta)}</p>` : 
                                        '<p class="text-muted small">Solo por un día</p>'}
                                </div>
                            </div>

                            <div class="mb-3">
                                <h6>Motivo</h6>
                                <p class="bg-light p-3 rounded">${solicitud.motivo}</p>
                            </div>

                            ${solicitud.observaciones ? `
                                <div class="mb-3">
                                    <h6>Observaciones</h6>
                                    <p class="bg-light p-3 rounded">${solicitud.observaciones}</p>
                                </div>
                            ` : ''}

                            ${solicitud.estado !== 'PENDIENTE' ? `
                                <div class="mb-3">
                                    <h6>Información de Procesamiento</h6>
                                    <p><strong>Procesado por:</strong> ${solicitud.aprobado_por_nombre || 'Sistema'}</p>
                                    <p><strong>Fecha:</strong> ${formatDateTime(solicitud.fecha_aprobacion)}</p>
                                    ${solicitud.rechazado_motivo ? `
                                        <div class="alert alert-warning">
                                            <strong>Motivo de rechazo:</strong><br>
                                            ${solicitud.rechazado_motivo}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            ${solicitud.estado === 'PENDIENTE' && isAdmin() ? `
                                <button type="button" class="btn btn-success" onclick="approveRequestFromModal(${solicitud.id})">
                                    <i class="fas fa-check me-1"></i>Aprobar
                                </button>
                                <button type="button" class="btn btn-danger" onclick="rejectRequestFromModal(${solicitud.id})">
                                    <i class="fas fa-times me-1"></i>Rechazar
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        const existingModal = document.getElementById('requestDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
        modal.show();

    } catch (error) {
        console.error('Error cargando detalles:', error);
        showAlert('Error al cargar los detalles de la solicitud', 'danger');
    }
}

// Aprobar solicitud
async function approveRequest(requestId) {
    return requireAdmin(async () => {
        try {
            if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud?')) {
                return;
            }

            const response = await api.updateEstadoSolicitud(requestId, 'APROBADO');
            
            if (response.success) {
                showAlert('Solicitud aprobada exitosamente', 'success');
                // Recargar vista actual
                if (typeof loadPermisosView === 'function') {
                    loadPermisosView();
                }
            } else {
                showAlert(response.message, 'danger');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            showAlert('Error al aprobar la solicitud', 'danger');
        }
    });
}

// Rechazar solicitud
async function rejectRequest(requestId) {
    return requireAdmin(async () => {
        try {
            const motivo = prompt('Ingresa el motivo del rechazo:');
            
            if (!motivo || motivo.trim() === '') {
                showAlert('El motivo de rechazo es obligatorio', 'warning');
                return;
            }

            const response = await api.updateEstadoSolicitud(requestId, 'RECHAZADO', motivo.trim());
            
            if (response.success) {
                showAlert('Solicitud rechazada', 'success');
                // Recargar vista actual
                if (typeof loadPermisosView === 'function') {
                    loadPermisosView();
                }
            } else {
                showAlert(response.message, 'danger');
            }
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            showAlert('Error al rechazar la solicitud', 'danger');
        }
    });
}

// Cancelar solicitud (empleado)
async function cancelRequest(requestId) {
    return requireAuth(async () => {
        try {
            if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud? Esta acción no se puede deshacer.')) {
                return;
            }

            const response = await api.deleteSolicitudPermiso(requestId);
            
            if (response.success) {
                showAlert('Solicitud cancelada exitosamente', 'success');
                // Recargar vista actual
                loadMisPermisosView();
            } else {
                showAlert(response.message, 'danger');
            }
        } catch (error) {
            console.error('Error cancelando solicitud:', error);
            showAlert('Error al cancelar la solicitud', 'danger');
        }
    });
}

// Renderizar paginación
function renderPagination(pagination) {
    if (!pagination || pagination.pages <= 1) {
        return '';
    }

    let paginationHTML = '<nav class="mt-4"><ul class="pagination justify-content-center">';
    
    // Botón anterior
    if (pagination.page > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${pagination.page - 1})">Anterior</a></li>`;
    }
    
    // Páginas
    for (let i = 1; i <= Math.min(pagination.pages, 10); i++) {
        paginationHTML += `<li class="page-item ${i === pagination.page ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    
    // Botón siguiente
    if (pagination.page < pagination.pages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${pagination.page + 1})">Siguiente</a></li>`;
    }
    
    paginationHTML += '</ul></nav>';
    return paginationHTML;
}

// Aprobar solicitud desde modal
async function approveRequestFromModal(requestId) {
    return requireAdmin(async () => {
        try {
            if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud?')) {
                return;
            }
            const response = await api.updateEstadoSolicitud(requestId, 'APROBADO');
            
            if (response.success) {
                showAlert('Solicitud aprobada exitosamente', 'success');
                
                // Cerrar modal
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                }
                
                loadPermisosView();
            } else {
                showAlert(response.message, 'danger');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            showAlert('Error al aprobar la solicitud', 'danger');
        }
    });
}

// Rechazar solicitud desde modal
async function rejectRequestFromModal(requestId) {
    return requireAdmin(async () => {
        try {
            const motivo = prompt('Ingresa el motivo del rechazo:');
            if (!motivo) {
                return;
            }
            
            const response = await api.updateEstadoSolicitud(requestId, 'RECHAZADO', motivo);
            
            if (response.success) {
                showAlert('Solicitud rechazada exitosamente', 'success');
                
                // Cerrar modal
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                }
                
                loadPermisosView();
            } else {
                showAlert(response.message, 'danger');
            }
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            showAlert('Error al rechazar la solicitud', 'danger');
        }
    });
}

// Vista organizacional de permisos por empleado (solo admins)
async function loadPermisosOrganizationalView() {
    return requireAdmin(async () => {
        try {
            const mainContent = document.getElementById('main-content');
            showElementLoader(mainContent, true);

            // Obtener empleados con sus permisos
            const response = await api.getEmpleadosConPermisos();
            const empleados = response.data;

            const html = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h1 class="h3 mb-0">Permisos por Empleado</h1>
                        <p class="text-muted">Vista organizacional de permisos y supervisores</p>
                    </div>
                </div>

                <!-- Filtros y búsqueda -->
                <div class="search-filters">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="search-input-group">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" class="form-control" id="searchEmpleadoPermisos" placeholder="Buscar empleado...">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="cargoFilterPermisos">
                                <option value="">Todos los cargos</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="supervisorFilter">
                                <option value="">Todos los supervisores</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-primary w-100" onclick="filterEmpleadosPermisos()">
                                <i class="fas fa-search me-1"></i>Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Lista de empleados con sus permisos -->
                <div class="row" id="empleadosPermisosContainer">
                    ${renderEmpleadosConPermisos(empleados)}
                </div>
            `;

            mainContent.innerHTML = html;
            showElementLoader(mainContent, false);
            updateActiveNavigation('permisos');

            // Cargar filtros
            loadFiltrosOrganizacional(empleados);
            setupEmpleadosPermisosSearch();

        } catch (error) {
            console.error('Error cargando vista organizacional:', error);
            showAlert('Error al cargar la vista organizacional de permisos', 'danger');
        }
    });
}

// Renderizar empleados con sus permisos
function renderEmpleadosConPermisos(empleados) {
    if (!empleados || empleados.length === 0) {
        return `
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center text-muted py-5">
                        <i class="fas fa-users fa-4x mb-3 opacity-25"></i>
                        <h5>No hay empleados con permisos</h5>
                        <p>Los empleados aparecerán aquí cuando soliciten permisos</p>
                    </div>
                </div>
            </div>
        `;
    }

    return empleados.map(empleado => `
        <div class="col-lg-6 col-xl-4 mb-4 empleado-permiso-card" data-empleado-nombre="${empleado.nombre.toLowerCase()}" data-empleado-cargo="${empleado.cargo.toLowerCase()}">
            <div class="card h-100 shadow-sm">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1 text-primary">${empleado.nombre}</h6>
                            <small class="text-muted">${empleado.rut} - ${empleado.cargo}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-info">${empleado.total_permisos || 0} permisos</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-body p-3">
                    <!-- Información de supervisores -->
                    <div class="mb-3">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted d-block">Supervisor Visualización</small>
                                <strong class="small text-success">${empleado.visualizacion || 'Sin asignar'}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Supervisor Autorización</small>
                                <strong class="small text-warning">${empleado.autorizacion || 'Sin asignar'}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Estadísticas rápidas -->
                    <div class="row mb-3">
                        <div class="col-4 text-center">
                            <div class="small">
                                <div class="fw-bold text-warning">${empleado.pendientes || 0}</div>
                                <small class="text-muted">Pendientes</small>
                            </div>
                        </div>
                        <div class="col-4 text-center">
                            <div class="small">
                                <div class="fw-bold text-success">${empleado.aprobados || 0}</div>
                                <small class="text-muted">Aprobados</small>
                            </div>
                        </div>
                        <div class="col-4 text-center">
                            <div class="small">
                                <div class="fw-bold text-danger">${empleado.rechazados || 0}</div>
                                <small class="text-muted">Rechazados</small>
                            </div>
                        </div>
                    </div>

                    <!-- Permisos recientes -->
                    <div class="mb-3">
                        <small class="text-muted d-block mb-2">Permisos Recientes:</small>
                        <div class="permisos-recientes">
                            ${renderPermisosRecientesEmpleado(empleado.permisos_recientes || [])}
                        </div>
                    </div>
                </div>

                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100 btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="showEmpleadoPermisosDetails(${empleado.id})" title="Ver todos los permisos">
                            <i class="fas fa-eye me-1"></i>Ver Todos
                        </button>
                        <button class="btn btn-outline-info" onclick="showEmpleadoDetails(${empleado.id})" title="Ver perfil">
                            <i class="fas fa-user me-1"></i>Perfil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar permisos recientes de un empleado
function renderPermisosRecientesEmpleado(permisos) {
    if (!permisos || permisos.length === 0) {
        return '<small class="text-muted">Sin permisos recientes</small>';
    }

    return permisos.slice(0, 3).map(permiso => `
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
            <div class="small">
                <span class="badge badge-permiso me-1" style="background-color: ${permiso.color_hex}; font-size: 0.7em;">
                    ${permiso.codigo}
                </span>
                <span class="text-truncate" style="max-width: 120px;">${permiso.tipo_permiso}</span>
            </div>
            <div class="text-end">
                <small class="d-block">${formatDate(permiso.fecha_desde)}</small>
                ${getStatusBadge(permiso.estado)}
            </div>
        </div>
    `).join('');
}

// Cargar filtros para vista organizacional
function loadFiltrosOrganizacional(empleados) {
    // Cargar cargos únicos
    const cargosUnicos = [...new Set(empleados.map(emp => emp.cargo))].sort();
    const cargoSelect = document.getElementById('cargoFilterPermisos');
    if (cargoSelect) {
        cargosUnicos.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo;
            option.textContent = cargo;
            cargoSelect.appendChild(option);
        });
    }

    // Cargar supervisores únicos
    const supervisoresUnicos = [...new Set(empleados.flatMap(emp => [emp.visualizacion, emp.autorizacion]).filter(Boolean))].sort();
    const supervisorSelect = document.getElementById('supervisorFilter');
    if (supervisorSelect) {
        supervisoresUnicos.forEach(supervisor => {
            const option = document.createElement('option');
            option.value = supervisor;
            option.textContent = supervisor;
            supervisorSelect.appendChild(option);
        });
    }
}

// Configurar búsqueda de empleados con permisos
function setupEmpleadosPermisosSearch() {
    const searchInput = document.getElementById('searchEmpleadoPermisos');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            filterEmpleadosPermisos();
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
}

// Filtrar empleados con permisos
function filterEmpleadosPermisos() {
    const search = document.getElementById('searchEmpleadoPermisos').value.toLowerCase();
    const cargo = document.getElementById('cargoFilterPermisos').value.toLowerCase();
    const supervisor = document.getElementById('supervisorFilter').value.toLowerCase();
    
    const cards = document.querySelectorAll('.empleado-permiso-card');
    
    cards.forEach(card => {
        const nombre = card.dataset.empleadoNombre;
        const cardCargo = card.dataset.empleadoCargo;
        const cardSupervisores = card.textContent.toLowerCase();
        
        const matchesSearch = !search || nombre.includes(search);
        const matchesCargo = !cargo || cardCargo.includes(cargo);
        const matchesSupervisor = !supervisor || cardSupervisores.includes(supervisor);
        
        if (matchesSearch && matchesCargo && matchesSupervisor) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Mostrar detalles de permisos de un empleado específico
async function showEmpleadoPermisosDetails(empleadoId) {
    try {
        const response = await api.getEmpleadoPermisos(empleadoId);
        const data = response.data;
        
        const modalHTML = `
            <div class="modal fade" id="empleadoPermisosModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-alt me-2"></i>Permisos de ${data.empleado.nombre}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Información del empleado -->
                            <div class="row mb-4">
                                <div class="col-md-8">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <p><strong>Nombre:</strong> ${data.empleado.nombre}</p>
                                                    <p><strong>RUT:</strong> ${data.empleado.rut}</p>
                                                    <p><strong>Cargo:</strong> ${data.empleado.cargo}</p>
                                                </div>
                                                <div class="col-md-6">
                                                    <p><strong>Supervisor Visualización:</strong><br>
                                                       <span class="text-success">${data.empleado.visualizacion || 'Sin asignar'}</span></p>
                                                    <p><strong>Supervisor Autorización:</strong><br>
                                                       <span class="text-warning">${data.empleado.autorizacion || 'Sin asignar'}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card text-center">
                                        <div class="card-body">
                                            <h4 class="text-primary">${data.estadisticas.total || 0}</h4>
                                            <p class="mb-1">Total Permisos</p>
                                            <small class="text-muted">
                                                Pendientes: ${data.estadisticas.pendientes || 0} | 
                                                Aprobados: ${data.estadisticas.aprobados || 0}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Lista de permisos -->
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Fechas</th>
                                            <th>Motivo</th>
                                            <th>Estado</th>
                                            <th>Solicitado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${renderSolicitudesAdminTable(data.permisos || [])}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('empleadoPermisosModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('empleadoPermisosModal'));
        modal.show();

    } catch (error) {
        console.error('Error cargando permisos del empleado:', error);
        showAlert('Error al cargar los permisos del empleado', 'danger');
    }
}

// Exportar funciones principales
window.loadSolicitarPermisoView = loadSolicitarPermisoView;
window.loadMisPermisosView = loadMisPermisosView;
window.loadPermisosView = loadPermisosView;
window.loadPermisosOrganizationalView = loadPermisosOrganizationalView;
window.showEmpleadoPermisosDetails = showEmpleadoPermisosDetails;
window.showRequestDetails = showRequestDetails;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.cancelRequest = cancelRequest;
window.approveRequestFromModal = approveRequestFromModal;
window.rejectRequestFromModal = rejectRequestFromModal;