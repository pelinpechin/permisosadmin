class SolicitudesEmpleado {
    constructor() {
        this.updateTokenAndData();
    }
    
    // Actualizar token y datos del empleado
    updateTokenAndData() {
        this.token = localStorage.getItem('empleado_token');
        this.empleado = JSON.parse(localStorage.getItem('empleado_data') || '{}');
        
        console.log('🔐 SolicitudesEmpleado updated:', {
            hasToken: !!this.token,
            tokenPreview: this.token ? this.token.substring(0, 20) + '...' : 'NO TOKEN',
            empleadoId: this.empleado?.id,
            empleadoNombre: this.empleado?.nombre
        });
        
        return !!this.token;
    }

    // Validar límites de permisos
    async validarLimitePermisos(tipoPermiso, fechaSolicitud) {
        try {
            // Obtener historial del empleado
            const response = await fetch('/api/solicitudes-empleado/historial', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al verificar historial');
            }

            const data = await response.json();
            const permisosAnteriores = data.solicitudes || [];
            
            // Filtrar permisos aprobados para 2025
            const permisosAprobados2025 = permisosAnteriores.filter(p => 
                p.estado === 'APROBADO' && 
                new Date(p.fecha_desde).getFullYear() === 2025
            );

            // Determinar a qué semestre pertenece la nueva fecha
            const fechaNueva = new Date(fechaSolicitud);
            const semestreNuevo = fechaNueva.getMonth() < 6 ? 1 : 2;
            
            // Calcular equivalencias actuales
            let equivalenciaPrimerSemestre = 0;
            let equivalenciaSegundoSemestre = 0;
            
            permisosAprobados2025.forEach(permiso => {
                const fecha = new Date(permiso.fecha_desde);
                const semestre = fecha.getMonth() < 6 ? 1 : 2;
                const valor = (permiso.tipo_permiso_codigo === 'T') ? 1 : 0.5;
                
                if (semestre === 1) {
                    equivalenciaPrimerSemestre += valor;
                } else {
                    equivalenciaSegundoSemestre += valor;
                }
            });

            // Calcular valor del nuevo permiso
            const valorNuevoPermiso = (tipoPermiso === 'T') ? 1 : 0.5;
            
            // Verificar límites según negociación colectiva
            const tieneNegociacion = this.empleado.negociacion_colectiva;
            
            if (tieneNegociacion) {
                // Con negociación: 6 permisos T por año, flexibles
                const totalUsado = equivalenciaPrimerSemestre + equivalenciaSegundoSemestre;
                if (totalUsado + valorNuevoPermiso > 6) {
                    return {
                        valido: false,
                        mensaje: `Has alcanzado el límite anual de 6 permisos T. Actualmente has usado ${totalUsado} permisos T.`
                    };
                }
            } else {
                // Sin negociación: 3 permisos T por semestre
                const equivalenciaActualSemestre = semestreNuevo === 1 ? equivalenciaPrimerSemestre : equivalenciaSegundoSemestre;
                if (equivalenciaActualSemestre + valorNuevoPermiso > 3) {
                    return {
                        valido: false,
                        mensaje: `Has alcanzado el límite de 3 permisos T para el ${semestreNuevo}° semestre. Actualmente has usado ${equivalenciaActualSemestre} permisos T en este semestre.`
                    };
                }
            }

            return { valido: true };

        } catch (error) {
            console.error('Error validando límites:', error);
            // En caso de error, permitir la solicitud (el servidor validará)
            return { valido: true };
        }
    }

    // Mostrar formulario de nueva solicitud
    mostrarFormularioSolicitud() {
        // Actualizar datos y verificar autenticación
        if (!this.updateTokenAndData()) {
            console.error('❌ No hay token válido para solicitudes');
            alert('Error: No hay sesión activa. Por favor, inicie sesión nuevamente.');
            return;
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container-fluid py-4">
                <div class="row">
                    <div class="col-md-8 mx-auto">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-calendar-plus me-2"></i>Nueva Solicitud de Permiso Administrativo</h5>
                            </div>
                            <div class="card-body">
                                <form id="solicitudForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="tipo_permiso" class="form-label">Tipo de Permiso</label>
                                            <select class="form-control" id="tipo_permiso" required>
                                                <option value="">Seleccionar tipo...</option>
                                                <option value="T">Jornada Completa (T)</option>
                                                <option value="AM">Media Jornada Mañana (AM)</option>
                                                <option value="PM">Media Jornada Tarde (PM)</option>
                                                <option value="C">Cumpleaños (C)</option>
                                                <option value="S">Sin Goce de Sueldo (S)</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="fecha_solicitud" class="form-label">Fecha del Permiso</label>
                                            <input type="date" class="form-control" id="fecha_solicitud" required>
                                        </div>
                                    </div>
                                    

                                    <div class="mb-3">
                                        <label for="motivo" class="form-label">Motivo del Permiso</label>
                                        <textarea class="form-control" id="motivo" rows="3" placeholder="Describa el motivo del permiso administrativo..." required></textarea>
                                    </div>

                                    <div class="mb-3">
                                        <label for="observaciones" class="form-label">Observaciones (opcional)</label>
                                        <textarea class="form-control" id="observaciones" rows="2" placeholder="Información adicional..."></textarea>
                                    </div>

                                    <div class="alert alert-info">
                                        <h6><i class="fas fa-info-circle me-2"></i>Información Importante:</h6>
                                        <ul class="mb-0">
                                            <li>Las solicitudes deben realizarse con al menos 24 horas de anticipación</li>
                                            <li>Los permisos están sujetos a aprobación del supervisor directo</li>
                                            <li>Se descontará del tiempo disponible según corresponda</li>
                                        </ul>
                                    </div>

                                    <div class="d-flex justify-content-between">
                                        <button type="button" class="btn btn-secondary" onclick="empleadoSystem.mostrarDashboardEmpleado()">
                                            <i class="fas fa-arrow-left me-2"></i>Volver
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane me-2"></i>Enviar Solicitud
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Configurar fecha mínima (mañana)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('fecha_solicitud').min = tomorrow.toISOString().split('T')[0];

        // Event listener para el formulario
        const form = document.getElementById('solicitudForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Form submit event triggered');
                this.enviarSolicitud();
            });
            console.log('✅ Form event listener attached successfully');
        } else {
            console.error('❌ Form solicitudForm not found');
        }
        
        // Crear botón de test dinámicamente para evitar problemas de cache
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton && submitButton.parentNode) {
            const testButton = document.createElement('button');
            testButton.type = 'button';
            testButton.className = 'btn btn-warning me-2';
            testButton.innerHTML = '<i class="fas fa-bug me-2"></i>Test Debug JS';
            testButton.id = 'dynamicTestButton';
            
            // Insertar antes del botón de enviar
            submitButton.parentNode.insertBefore(testButton, submitButton);
            
            testButton.addEventListener('click', () => {
                console.log('🧪 Dynamic test button clicked');
                this.testSubmit();
            });
            console.log('✅ Dynamic test button created and attached successfully');
        } else {
            console.error('❌ Submit button not found for test button insertion');
        }
    }

    // Enviar solicitud de permiso
    async enviarSolicitud() {
        console.log('🚀 Iniciando envío de solicitud...');
        
        // Verificar token al inicio
        if (!this.token) {
            console.error('❌ No hay token disponible');
            this.showAlert('Error: Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            return;
        }
        
        // Verificar que los elementos existan
        const tipoElement = document.getElementById('tipo_permiso');
        const fechaElement = document.getElementById('fecha_solicitud');
        const motivoElement = document.getElementById('motivo');
        const observacionesElement = document.getElementById('observaciones');
        
        console.log('🔍 Elementos encontrados:', {
            tipoElement: !!tipoElement,
            fechaElement: !!fechaElement,
            motivoElement: !!motivoElement,
            observacionesElement: !!observacionesElement
        });
        
        // Debug detallado de elementos
        if (!tipoElement) console.error('❌ No se encuentra elemento tipo_permiso');
        if (!fechaElement) console.error('❌ No se encuentra elemento fecha_solicitud');  
        if (!motivoElement) console.error('❌ No se encuentra elemento motivo');
        
        // Lista todos los elementos del formulario actuales
        const form = document.getElementById('solicitudForm');
        if (form) {
            console.log('📋 Elementos en el form:', [...form.elements].map(el => ({
                id: el.id,
                name: el.name,
                type: el.type,
                value: el.value
            })));
        }

        if (!tipoElement || !fechaElement || !motivoElement) {
            this.showAlert('Error: Elementos del formulario no encontrados', 'error');
            return;
        }

        const tipoPermiso = tipoElement.value;
        const fechaSolicitud = fechaElement.value;
        const motivo = motivoElement.value.trim();
        const observaciones = observacionesElement ? observacionesElement.value.trim() : '';
        
        // Debug adicional de los valores
        console.log('🔎 Valores exactos obtenidos:', {
            tipoPermiso: `"${tipoPermiso}"`,
            fechaSolicitud: `"${fechaSolicitud}"`,
            motivo: `"${motivo}"`,
            observaciones: `"${observaciones}"`,
            tipos: {
                tipo: typeof tipoPermiso,
                fecha: typeof fechaSolicitud,
                motivo: typeof motivo
            }
        });

        // NUEVA VALIDACIÓN: Verificar límites de permisos
        console.log('🔍 Validando límites de permisos...');
        const validacion = await this.validarLimitePermisos(tipoPermiso, fechaSolicitud);
        
        if (!validacion.valido) {
            console.log('❌ Validación fallida:', validacion.mensaje);
            this.showAlert(validacion.mensaje, 'error');
            return;
        }
        
        console.log('✅ Validación de límites exitosa');

        console.log('📋 Datos del formulario:', {
            tipoPermiso,
            fechaSolicitud,
            motivo,
            observaciones,
            valores_raw: {
                tipo_raw: tipoElement.value,
                fecha_raw: fechaElement.value,
                motivo_raw: motivoElement.value,
                motivo_length: motivoElement.value.length
            }
        });

        if (!tipoPermiso || !fechaSolicitud || !motivo) {
            console.log('❌ Validación falló:', { tipoPermiso: !!tipoPermiso, fechaSolicitud: !!fechaSolicitud, motivo: !!motivo });
            this.showAlert('Por favor complete todos los campos requeridos', 'warning');
            return;
        }

        try {
            const requestBody = {
                tipo_permiso: tipoPermiso,
                fecha_solicitud: fechaSolicitud,
                motivo,
                observaciones: observaciones || null
            };

            console.log('📤 Enviando solicitud:', requestBody);

            // Obtener token fresco del localStorage
            const currentToken = localStorage.getItem('empleado_token');
            if (!currentToken) {
                throw new Error('No hay token de autenticación - por favor inicia sesión');
            }

            const response = await fetch('/api/solicitudes-empleado/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📬 Response status:', response.status);
            console.log('📬 Response headers:', [...response.headers.entries()]);

            const data = await response.json();
            console.log('📬 Response data:', data);

            if (!response.ok) {
                console.error('❌ Request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error,
                    requestBody,
                    token: this.token ? 'Present' : 'Missing'
                });
                throw new Error(data.error || 'Error enviando solicitud');
            }

            this.showAlert('Solicitud enviada exitosamente', 'success');
            
            // Volver al dashboard después de 2 segundos
            setTimeout(() => {
                empleadoSystem.mostrarDashboardEmpleado();
            }, 2000);

        } catch (error) {
            console.error('Error enviando solicitud:', error);
            this.showAlert(error.message, 'error');
        }
    }

    // Mostrar historial de solicitudes
    async mostrarHistorial() {
        try {
            // Obtener token fresco del localStorage
            const currentToken = localStorage.getItem('empleado_token');
            if (!currentToken) {
                throw new Error('No hay token de autenticación - por favor inicia sesión');
            }

            const response = await fetch('/api/solicitudes-empleado/historial', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error cargando historial');
            }

            this.renderizarHistorial(data.solicitudes || []);

        } catch (error) {
            console.error('Error cargando historial:', error);
            this.showAlert(error.message, 'error');
        }
    }

    // Renderizar historial de solicitudes
    renderizarHistorial(solicitudes) {
        const mainContent = document.getElementById('main-content');
        
        let solicitudesHTML = '';
        if (solicitudes.length === 0) {
            solicitudesHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>No hay solicitudes registradas</h5>
                    <p class="text-muted">Aún no has realizado ninguna solicitud de permiso</p>
                    <button class="btn btn-primary" onclick="solicitudesEmpleado.mostrarFormularioSolicitud()">
                        <i class="fas fa-plus me-2"></i>Nueva Solicitud
                    </button>
                </div>
            `;
        } else {
            solicitudesHTML = solicitudes.map(sol => {
                const estadoClass = {
                    'PENDIENTE': 'warning',
                    'APROBADO': 'success', 
                    'RECHAZADO': 'danger',
                    'CANCELADO': 'secondary'
                }[sol.estado] || 'secondary';

                const tipoNombre = sol.tipo_permiso_nombre || {
                    'T': 'Jornada Completa',
                    'AM': 'Media Jornada Mañana',
                    'PM': 'Media Jornada Tarde',
                    'C': 'Cumpleaños',
                    'S': 'Sin Goce de Sueldo'
                }[sol.tipo_permiso_codigo] || sol.tipo_permiso_codigo || 'Tipo no definido';

                return `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title">${tipoNombre}</h6>
                                    <span class="badge bg-${estadoClass}">${sol.estado}</span>
                                </div>
                                <p class="card-text">
                                    <strong>Fecha:</strong> ${this.formatLocalDate(sol.fecha_desde)}<br>
                                    <strong>Motivo:</strong> ${sol.motivo}
                                </p>
                                <small class="text-muted">
                                    Solicitado: ${this.formatLocalDate(sol.created_at)}
                                </small>
                                ${sol.estado === 'PENDIENTE' ? `
                                <div class="mt-2">
                                    <button class="btn btn-sm btn-outline-danger" onclick="solicitudesEmpleado.eliminarSolicitud(${sol.id})">
                                        <i class="fas fa-trash me-1"></i>Eliminar
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        mainContent.innerHTML = `
            <div class="container-fluid py-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="fas fa-history me-2"></i>Historial de Solicitudes</h4>
                    <div>
                        <button class="btn btn-outline-primary me-2" onclick="empleadoSystem.mostrarDashboardEmpleado()">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </button>
                        <button class="btn btn-primary" onclick="solicitudesEmpleado.mostrarFormularioSolicitud()">
                            <i class="fas fa-plus me-2"></i>Nueva Solicitud
                        </button>
                    </div>
                </div>
                <div class="row">
                    ${solicitudesHTML}
                </div>
            </div>
        `;
    }

    // Eliminar solicitud
    async eliminarSolicitud(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
            return;
        }

        try {
            // Obtener token fresco del localStorage
            const currentToken = localStorage.getItem('empleado_token');
            if (!currentToken) {
                throw new Error('No hay token de autenticación - por favor inicia sesión');
            }

            const response = await fetch(`/api/solicitudes-empleado/${id}/eliminar`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error eliminando solicitud');
            }

            this.showAlert('Solicitud eliminada exitosamente', 'success');
            
            // Recargar historial
            this.mostrarHistorial();

        } catch (error) {
            console.error('Error eliminando solicitud:', error);
            this.showAlert(error.message, 'error');
        }
    }

    // Formatear fecha local sin problemas de timezone
    formatLocalDate(dateString) {
        if (!dateString) return '';
        
        // Si es una fecha simple (YYYY-MM-DD), crear fecha local
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return new Date(year, month - 1, day).toLocaleDateString('es-CL');
        }
        
        // Para fechas con tiempo, usar directamente
        return new Date(dateString).toLocaleDateString('es-CL');
    }

    // Mostrar alerta personalizada
    showAlert(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger', 
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 5000);
    }
    
    // Método de test para debugging
    testSubmit() {
        console.log('🧪 TEST: Iniciando test de envío...');
        
        // Test manual con datos fijos
        const testData = {
            tipo_permiso: 'T',
            fecha_solicitud: '2025-08-30',
            motivo: 'Test de solicitud',
            observaciones: 'Prueba de debugging'
        };
        
        console.log('🧪 TEST: Enviando datos:', testData);
        console.log('🧪 TEST: Token being sent:', this.token);
        
        fetch('/api/solicitudes-empleado/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(testData)
        })
        .then(response => {
            console.log('🧪 TEST Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('🧪 TEST Response data:', data);
            this.showAlert('Test completado - revisa la consola', 'info');
        })
        .catch(error => {
            console.error('🧪 TEST Error:', error);
            this.showAlert('Test falló - revisa la consola', 'error');
        });
    }
}

// Instancia global
const solicitudesEmpleado = new SolicitudesEmpleado();