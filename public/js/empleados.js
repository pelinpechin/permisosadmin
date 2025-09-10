// Módulo de gestión de empleados (solo administradores)

// Cargar vista de empleados
async function loadEmpleadosView() {
    return requireAdmin(async () => {
        try {
            const mainContent = document.getElementById('main-content');
            showElementLoader(mainContent, true);

            const response = await api.getEmpleados({ page: 1, limit: 50 });
            const empleados = response.data.empleados;
            const pagination = response.data.pagination;

            const html = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h1 class="h3 mb-0">Gestión de Empleados</h1>
                        <p class="text-muted">Administrar empleados del sistema</p>
                    </div>
                </div>

                <!-- Filtros y búsqueda -->
                <div class="search-filters">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="search-input-group">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" class="form-control" id="searchEmpleados" placeholder="Buscar empleado...">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="cargoFilter">
                                <option value="">Todos los cargos</option>
                                <!-- Se llenarán dinámicamente -->
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="activoFilter">
                                <option value="">Todos</option>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary" onclick="filterEmpleados()">
                                    <i class="fas fa-search me-1"></i>Filtrar
                                </button>
                                <button class="btn btn-primary" onclick="showCreateEmpleadoModal()">
                                    <i class="fas fa-plus me-1"></i>Nuevo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de empleados -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Lista de Empleados</h5>
                        <span class="badge bg-secondary">${pagination.total} empleados</span>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Nº</th>
                                        <th>Nombre</th>
                                        <th>RUT</th>
                                        <th>Cargo</th>
                                        <th>Estado</th>
                                        <th>Permisos Usados</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderEmpleadosTable(empleados)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                ${renderPagination(pagination)}
            `;

            mainContent.innerHTML = html;
            showElementLoader(mainContent, false);
            updateActiveNavigation('empleados');

            // Cargar filtros
            loadCargosFilter();
            setupEmpleadosSearch();

        } catch (error) {
            console.error('Error cargando empleados:', error);
            showAlert('Error al cargar la lista de empleados', 'danger');
        }
    });
}

// Renderizar tabla de empleados
function renderEmpleadosTable(empleados) {
    if (!empleados || empleados.length === 0) {
        return `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-users fa-3x mb-3 opacity-25"></i>
                    <p>No hay empleados registrados</p>
                    <button class="btn btn-primary" onclick="showCreateEmpleadoModal()">
                        <i class="fas fa-plus me-1"></i>Agregar Primer Empleado
                    </button>
                </td>
            </tr>
        `;
    }

    return empleados.map(empleado => `
        <tr class="${!empleado.activo ? 'table-secondary' : ''}">
            <td><strong>${empleado.numero}</strong></td>
            <td>
                <div class="fw-bold">${empleado.nombre}</div>
                ${empleado.fecha_nacimiento ? `<small class="text-muted">${formatDate(empleado.fecha_nacimiento)}</small>` : ''}
            </td>
            <td><code>${empleado.rut}</code></td>
            <td>
                <span class="badge bg-info">${empleado.cargo}</span>
                ${empleado.negociacion_colectiva ? '<br><small class="text-success">✓ Neg. Colectiva</small>' : ''}
            </td>
            <td>
                <span class="badge ${empleado.activo ? 'bg-success' : 'bg-secondary'}">
                    ${empleado.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="small">
                    <strong>${(empleado.uso_primer_semestre || 0) + (empleado.uso_segundo_semestre || 0)}</strong> días
                    <br>
                    <span class="text-muted">
                        1°S: ${empleado.uso_primer_semestre || 0} | 2°S: ${empleado.uso_segundo_semestre || 0}
                    </span>
                </div>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showEmpleadoDetails(${empleado.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="showEditEmpleadoModal(${empleado.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="showEmpleadoPermisos(${empleado.id})" title="Ver permisos">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                    <button class="btn btn-outline-${empleado.activo ? 'warning' : 'success'}" 
                            onclick="toggleEmpleadoStatus(${empleado.id}, ${empleado.activo})" 
                            title="${empleado.activo ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-${empleado.activo ? 'user-slash' : 'user-check'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Mostrar modal para crear empleado
function showCreateEmpleadoModal() {
    const modalHTML = `
        <div class="modal fade" id="empleadoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>Nuevo Empleado
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="empleadoForm">
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="numero" class="form-label">Número <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control" id="numero" name="numero" required min="1">
                                    <div class="form-text">Número único del empleado</div>
                                </div>
                                <div class="col-md-6">
                                    <label for="rut" class="form-label">RUT <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="rut" name="rut" required data-rut="true" placeholder="12.345.678-9">
                                    <div class="form-text">RUT con formato completo</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="nombre" class="form-label">Nombre Completo <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="nombre" name="nombre" required placeholder="Nombre completo del empleado">
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="cargo" class="form-label">Cargo <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="cargo" name="cargo" required placeholder="Cargo o función">
                                </div>
                                <div class="col-md-6">
                                    <label for="fecha_nacimiento" class="form-label">Fecha de Nacimiento</label>
                                    <input type="date" class="form-control" id="fecha_nacimiento" name="fecha_nacimiento">
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="visualizacion" class="form-label">Supervisor de Visualización</label>
                                    <input type="text" class="form-control" id="visualizacion" name="visualizacion" placeholder="Nombre del supervisor">
                                </div>
                                <div class="col-md-6">
                                    <label for="autorizacion" class="form-label">Supervisor de Autorización</label>
                                    <input type="text" class="form-control" id="autorizacion" name="autorizacion" placeholder="Nombre del autorizador">
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="negociacion_colectiva" name="negociacion_colectiva">
                                    <label class="form-check-label" for="negociacion_colectiva">
                                        Negociación Colectiva
                                    </label>
                                    <div class="form-text">Marca si el empleado está bajo negociación colectiva</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-1"></i>Guardar Empleado
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    showModal(modalHTML, () => {
        setupEmpleadoForm();
        setupRutValidation();
    });
}

// Mostrar modal para editar empleado
async function showEditEmpleadoModal(empleadoId) {
    try {
        const response = await api.getEmpleado(empleadoId);
        const empleado = response.data;

        const modalHTML = `
            <div class="modal fade" id="empleadoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-edit me-2"></i>Editar Empleado
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="empleadoForm" data-empleado-id="${empleado.id}">
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="numero" class="form-label">Número <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" id="numero" name="numero" required min="1" value="${empleado.numero}">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="rut" class="form-label">RUT <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="rut" name="rut" required data-rut="true" value="${empleado.rut}">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="nombre" class="form-label">Nombre Completo <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="nombre" name="nombre" required value="${empleado.nombre}">
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="cargo" class="form-label">Cargo <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="cargo" name="cargo" required value="${empleado.cargo}">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="fecha_nacimiento" class="form-label">Fecha de Nacimiento</label>
                                        <input type="date" class="form-control" id="fecha_nacimiento" name="fecha_nacimiento" value="${empleado.fecha_nacimiento || ''}">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="visualizacion" class="form-label">Supervisor de Visualización</label>
                                        <input type="text" class="form-control" id="visualizacion" name="visualizacion" value="${empleado.visualizacion || ''}">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="autorizacion" class="form-label">Supervisor de Autorización</label>
                                        <input type="text" class="form-control" id="autorizacion" name="autorizacion" value="${empleado.autorizacion || ''}">
                                    </div>
                                </div>

                                <!-- Estadísticas de uso -->
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="uso_primer_semestre" class="form-label">Uso 1er Semestre</label>
                                        <input type="number" class="form-control" id="uso_primer_semestre" name="uso_primer_semestre" step="0.1" min="0" value="${empleado.uso_primer_semestre || 0}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="uso_segundo_semestre" class="form-label">Uso 2do Semestre</label>
                                        <input type="number" class="form-control" id="uso_segundo_semestre" name="uso_segundo_semestre" step="0.1" min="0" value="${empleado.uso_segundo_semestre || 0}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="sin_goce" class="form-label">Sin Goce</label>
                                        <input type="number" class="form-control" id="sin_goce" name="sin_goce" min="0" value="${empleado.sin_goce || 0}">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="atrasos" class="form-label">Atrasos</label>
                                        <input type="number" class="form-control" id="atrasos" name="atrasos" min="0" value="${empleado.atrasos || 0}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="atrasos_justificados" class="form-label">Atrasos Justificados</label>
                                        <input type="number" class="form-control" id="atrasos_justificados" name="atrasos_justificados" min="0" value="${empleado.atrasos_justificados || 0}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="no_marcaciones" class="form-label">No Marcaciones</label>
                                        <input type="number" class="form-control" id="no_marcaciones" name="no_marcaciones" min="0" value="${empleado.no_marcaciones || 0}">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="negociacion_colectiva" name="negociacion_colectiva" ${empleado.negociacion_colectiva ? 'checked' : ''}>
                                            <label class="form-check-label" for="negociacion_colectiva">
                                                Negociación Colectiva
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="activo" name="activo" ${empleado.activo ? 'checked' : ''}>
                                            <label class="form-check-label" for="activo">
                                                Empleado Activo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Actualizar Empleado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        showModal(modalHTML, () => {
            setupEmpleadoForm(true);
            setupRutValidation();
        });

    } catch (error) {
        console.error('Error cargando empleado:', error);
        showAlert('Error al cargar los datos del empleado', 'danger');
    }
}

// Configurar formulario de empleado
function setupEmpleadoForm(isEdit = false) {
    const form = document.getElementById('empleadoForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convertir checkboxes
        data.negociacion_colectiva = formData.has('negociacion_colectiva');
        data.activo = isEdit ? formData.has('activo') : true;
        
        // Validar formulario
        const validation = validateForm(form);
        if (!validation.isValid) {
            showAlert(validation.errors.join('<br>'), 'warning');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';

            let response;
            if (isEdit) {
                const empleadoId = form.dataset.empleadoId;
                response = await api.updateEmpleado(empleadoId, data);
            } else {
                response = await api.createEmpleado(data);
            }
            
            if (response.success) {
                showAlert(`Empleado ${isEdit ? 'actualizado' : 'creado'} exitosamente`, 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('empleadoModal'));
                modal.hide();
                
                // Recargar lista
                loadEmpleadosView();
            } else {
                showAlert(response.message, 'danger');
            }
            
        } catch (error) {
            console.error('Error guardando empleado:', error);
            showAlert('Error al guardar el empleado', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Configurar validación de RUT
function setupRutValidation() {
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\dkK]/g, '');
            
            if (value.length > 1) {
                const rutNumber = value.slice(0, -1);
                const rutDV = value.slice(-1);
                value = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + rutDV;
            }
            
            e.target.value = value;
            
            // Validar RUT
            e.target.classList.remove('is-valid', 'is-invalid');
            if (value.length >= 11) {
                if (validateRUT(value)) {
                    e.target.classList.add('is-valid');
                } else {
                    e.target.classList.add('is-invalid');
                }
            }
        });
    }
}

// Mostrar detalles del empleado
async function showEmpleadoDetails(empleadoId) {
    try {
        const response = await api.getEmpleado(empleadoId);
        const empleado = response.data;

        const modalHTML = `
            <div class="modal fade" id="empleadoDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>Detalles del Empleado
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-8">
                                    <h4>${empleado.nombre}</h4>
                                    <p class="text-muted mb-1">
                                        <strong>RUT:</strong> ${empleado.rut} | 
                                        <strong>Número:</strong> ${empleado.numero}
                                    </p>
                                    <p class="text-muted">
                                        <strong>Cargo:</strong> ${empleado.cargo}
                                        ${empleado.fecha_nacimiento ? ` | <strong>F. Nacimiento:</strong> ${formatDate(empleado.fecha_nacimiento)}` : ''}
                                    </p>
                                </div>
                                <div class="col-md-4 text-end">
                                    <span class="badge ${empleado.activo ? 'bg-success' : 'bg-secondary'} fs-6">
                                        ${empleado.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    ${empleado.negociacion_colectiva ? '<br><span class="badge bg-info mt-2">Negociación Colectiva</span>' : ''}
                                </div>
                            </div>

                            <!-- Supervisores -->
                            ${empleado.visualizacion || empleado.autorizacion ? `
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <h6>Supervisores</h6>
                                    </div>
                                    ${empleado.visualizacion ? `
                                        <div class="col-md-6">
                                            <strong>Visualización:</strong> ${empleado.visualizacion}
                                        </div>
                                    ` : ''}
                                    ${empleado.autorizacion ? `
                                        <div class="col-md-6">
                                            <strong>Autorización:</strong> ${empleado.autorizacion}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}

                            <!-- Estadísticas de permisos -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6>Estadísticas de Permisos</h6>
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h4 class="text-primary">${(empleado.uso_primer_semestre || 0) + (empleado.uso_segundo_semestre || 0)}</h4>
                                            <p class="mb-0">Total Días Usados</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="small">
                                        <p><strong>1er Semestre:</strong> ${empleado.uso_primer_semestre || 0} días</p>
                                        <p><strong>2do Semestre:</strong> ${empleado.uso_segundo_semestre || 0} días</p>
                                        <p><strong>Sin Goce:</strong> ${empleado.sin_goce || 0} días</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Estadísticas de asistencia -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6>Estadísticas de Asistencia</h6>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="card bg-warning bg-opacity-10">
                                        <div class="card-body">
                                            <h5 class="text-warning">${empleado.atrasos || 0}</h5>
                                            <p class="mb-0 small">Atrasos</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="card bg-success bg-opacity-10">
                                        <div class="card-body">
                                            <h5 class="text-success">${empleado.atrasos_justificados || 0}</h5>
                                            <p class="mb-0 small">Justificados</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="card bg-danger bg-opacity-10">
                                        <div class="card-body">
                                            <h5 class="text-danger">${empleado.no_marcaciones || 0}</h5>
                                            <p class="mb-0 small">No Marcaciones</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Información de registro -->
                            <div class="row">
                                <div class="col-12">
                                    <h6>Información del Sistema</h6>
                                    <p class="small text-muted">
                                        <strong>Creado:</strong> ${formatDateTime(empleado.created_at)}<br>
                                        ${empleado.updated_at !== empleado.created_at ? `<strong>Última actualización:</strong> ${formatDateTime(empleado.updated_at)}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="showEmpleadoPermisos(${empleado.id})" data-bs-dismiss="modal">
                                <i class="fas fa-calendar-alt me-1"></i>Ver Permisos
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="showEditEmpleadoModal(${empleado.id})" data-bs-dismiss="modal">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        showModal(modalHTML);

    } catch (error) {
        console.error('Error cargando detalles del empleado:', error);
        showAlert('Error al cargar los detalles del empleado', 'danger');
    }
}

// Ver permisos de un empleado
function showEmpleadoPermisos(empleadoId) {
    // Esta función cargará la vista de permisos filtrada por empleado
    loadPermisosView('todos');
    // TODO: Implementar filtro automático por empleado
}

// Alternar estado del empleado
async function toggleEmpleadoStatus(empleadoId, currentStatus) {
    const action = currentStatus ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Estás seguro de que quieres ${action} este empleado?`)) {
        return;
    }

    try {
        const response = await api.updateEmpleado(empleadoId, { activo: !currentStatus });
        
        if (response.success) {
            showAlert(`Empleado ${currentStatus ? 'desactivado' : 'activado'} exitosamente`, 'success');
            loadEmpleadosView();
        } else {
            showAlert(response.message, 'danger');
        }
    } catch (error) {
        console.error('Error cambiando estado:', error);
        showAlert('Error al cambiar el estado del empleado', 'danger');
    }
}

// Cargar filtro de cargos
async function loadCargosFilter() {
    try {
        const response = await api.getCargos();
        const cargos = response.data;
        
        const select = document.getElementById('cargoFilter');
        if (select && cargos) {
            cargos.forEach(cargo => {
                const option = document.createElement('option');
                option.value = cargo;
                option.textContent = cargo;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cargos:', error);
    }
}

// Configurar búsqueda de empleados
function setupEmpleadosSearch() {
    const searchInput = document.getElementById('searchEmpleados');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            filterEmpleados();
        }, 500);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
}

// Filtrar empleados
async function filterEmpleados() {
    const search = document.getElementById('searchEmpleados').value;
    const cargo = document.getElementById('cargoFilter').value;
    const activo = document.getElementById('activoFilter').value;
    
    try {
        const params = { page: 1, limit: 50 };
        if (search) params.search = search;
        if (cargo) params.cargo = cargo;
        if (activo) params.activo = activo;
        
        const response = await api.getEmpleados(params);
        const empleados = response.data.empleados;
        
        // Actualizar solo la tabla
        const tbody = document.querySelector('#empleadosTable tbody');
        if (tbody) {
            tbody.innerHTML = renderEmpleadosTable(empleados);
        }
        
    } catch (error) {
        console.error('Error filtrando empleados:', error);
        showAlert('Error al filtrar empleados', 'danger');
    }
}

// Utilidad para mostrar modales
function showModal(modalHTML, callback = null) {
    // Remover modal existente
    const existingModal = document.getElementById('empleadoModal') || document.getElementById('empleadoDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modalElement = document.querySelector('.modal:last-child');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Ejecutar callback si existe
    if (callback) {
        setTimeout(callback, 100);
    }
}

// Exportar funciones principales
window.loadEmpleadosView = loadEmpleadosView;
window.showCreateEmpleadoModal = showCreateEmpleadoModal;
window.showEditEmpleadoModal = showEditEmpleadoModal;
window.showEmpleadoDetails = showEmpleadoDetails;
window.showEmpleadoPermisos = showEmpleadoPermisos;
window.toggleEmpleadoStatus = toggleEmpleadoStatus;
window.filterEmpleados = filterEmpleados;