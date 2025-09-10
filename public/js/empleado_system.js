// Sistema de empleados - Login, registro y solicitudes
class EmpleadoSystem {
    constructor() {
        // Buscar token en ambas ubicaciones para compatibilidad
        this.token = localStorage.getItem('auth_token') || localStorage.getItem('empleado_token');
        this.empleado = null;
        this.init();
    }

    init() {
        // Verificar si se solicitó limpiar sesión
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('clear')) {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Sesión limpiada por parámetro URL');
            // Remover el parámetro de la URL sin recargar
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        // Verificar si hay token almacenado
        if (this.token) {
            this.verificarToken();
        }
    }

    /**
     * Validar que tenemos un token válido antes de hacer peticiones API
     */
    isTokenValid() {
        // Si no hay token, intentar recuperarlo del localStorage
        if (!this.token || this.token === 'null' || this.token === null || this.token === undefined) {
            console.log('🔄 Intentando recuperar token del localStorage...');
            this.token = localStorage.getItem('auth_token') || localStorage.getItem('empleado_token');
        }
        
        return this.token && this.token !== 'null' && this.token !== null && this.token !== undefined;
    }

    /**
     * Mostrar modal de registro/login para empleados
     */
    showEmpleadoLoginModal() {
        const modalHTML = `
            <div class="modal fade" id="empleadoLoginModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-id-badge me-2"></i>Acceso Empleados
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Fase 1: Verificar RUT -->
                            <div id="fase-verificar-rut" class="fase-empleado">
                                <div class="text-center mb-4">
                                    <i class="fas fa-id-card fa-3x text-success mb-3"></i>
                                    <h6>Ingrese su RUT para continuar</h6>
                                </div>
                                <form id="form-verificar-rut">
                                    <div class="mb-3">
                                        <label class="form-label">RUT</label>
                                        <input type="text" class="form-control" id="rut-empleado" placeholder="12.345.678-9" required>
                                        <div class="form-text">Ingrese su RUT tal como aparece en su contrato</div>
                                    </div>
                                    <button type="submit" class="btn btn-success w-100">
                                        <i class="fas fa-search me-2"></i>Verificar RUT
                                    </button>
                                </form>
                            </div>

                            <!-- Fase 2: Crear Contraseña -->
                            <div id="fase-crear-password" class="fase-empleado d-none">
                                <div class="text-center mb-4">
                                    <i class="fas fa-key fa-3x text-primary mb-3"></i>
                                    <h6>Crear Contraseña</h6>
                                    <p class="text-muted">Configure una contraseña segura para su cuenta</p>
                                </div>
                                <div id="info-empleado-crear" class="alert alert-info mb-3"></div>
                                <form id="form-crear-password">
                                    <input type="hidden" id="empleado-id-crear">
                                    <div class="mb-3">
                                        <label class="form-label">Nueva Contraseña</label>
                                        <input type="password" class="form-control" id="password-nuevo" placeholder="Mínimo 6 caracteres" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Confirmar Contraseña</label>
                                        <input type="password" class="form-control" id="password-confirmar" placeholder="Repita su contraseña" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="fas fa-save me-2"></i>Crear Contraseña
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary w-100 mt-2" onclick="empleadoSystem.resetModal()">
                                        <i class="fas fa-arrow-left me-2"></i>Volver
                                    </button>
                                </form>
                            </div>

                            <!-- Fase 3: Login -->
                            <div id="fase-login" class="fase-empleado d-none">
                                <div class="text-center mb-4">
                                    <i class="fas fa-sign-in-alt fa-3x text-success mb-3"></i>
                                    <h6>Iniciar Sesión</h6>
                                </div>
                                <div id="info-empleado-login" class="alert alert-info mb-3"></div>
                                <form id="form-login-empleado">
                                    <input type="hidden" id="rut-login">
                                    <div class="mb-3 text-center">
                                        <p class="mb-3">Hacer clic para iniciar sesión con su RUT</p>
                                    </div>
                                    <button type="submit" class="btn btn-success w-100">
                                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary w-100 mt-2" onclick="empleadoSystem.resetModal()">
                                        <i class="fas fa-arrow-left me-2"></i>Volver
                                    </button>
                                </form>
                            </div>

                            <!-- Fase 4: Verificación de Email -->
                            <div id="fase-verificar-email" class="fase-empleado d-none">
                                <div class="text-center">
                                    <i class="fas fa-envelope-open-text fa-3x text-warning mb-3"></i>
                                    <h6>Verificación de Email</h6>
                                    <div class="alert alert-warning">
                                        <p><strong>¡Casi listo!</strong></p>
                                        <p>Se ha enviado un enlace de verificación a su email.</p>
                                        <p class="mb-0">Por favor, revise su bandeja de entrada y haga clic en el enlace para activar su cuenta.</p>
                                    </div>
                                    <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">
                                        Entendido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('empleadoLoginModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar event listeners
        this.setupModalEventListeners();

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('empleadoLoginModal'));
        modal.show();
    }

    setupModalEventListeners() {
        // Form verificar RUT
        document.getElementById('form-verificar-rut').addEventListener('submit', (e) => {
            e.preventDefault();
            this.verificarRUT();
        });

        // Form crear contraseña
        document.getElementById('form-crear-password').addEventListener('submit', (e) => {
            e.preventDefault();
            this.crearPassword();
        });

        // Form login
        document.getElementById('form-login-empleado').addEventListener('submit', (e) => {
            e.preventDefault();
            this.loginEmpleado();
        });
    }

    async verificarRUT() {
        const rut = document.getElementById('rut-empleado').value.trim();
        
        if (!rut) {
            utils.showAlert('Por favor ingrese su RUT', 'warning');
            return;
        }

        try {
            // Mostrar loading usando el método directo de utils
            const loadingEl = document.createElement('div');
            loadingEl.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Verificando RUT...</div>';
            loadingEl.className = 'alert alert-info';
            document.getElementById('fase-verificar-rut').appendChild(loadingEl);
            
            const response = await fetch('/api/empleados-auth/verificar-rut', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rut })
            });

            const data = await response.json();
            
            // Remover loading
            if (loadingEl) loadingEl.remove();

            if (!response.ok) {
                throw new Error(data.error || 'Error verificando RUT');
            }

            // Guardar datos del empleado
            this.empleadoTemp = data.empleado;

            if (data.tienePassword) {
                // Ya tiene contraseña, mostrar login
                this.mostrarFaseLogin();
            } else {
                // Necesita crear contraseña
                this.mostrarFaseCrearPassword();
            }

        } catch (error) {
            const errorEl = document.createElement('div');
            errorEl.innerHTML = `<strong>Error:</strong> ${error.message}`;
            errorEl.className = 'alert alert-danger';
            document.getElementById('fase-verificar-rut').appendChild(errorEl);
            
            setTimeout(() => {
                if (errorEl) errorEl.remove();
            }, 5000);
        }
    }

    async crearPassword() {
        const empleadoId = document.getElementById('empleado-id-crear').value;
        const password = document.getElementById('password-nuevo').value;
        const confirmPassword = document.getElementById('password-confirmar').value;

        if (password !== confirmPassword) {
            this.showAlert('Las contraseñas no coinciden', 'warning');
            return;
        }

        if (password.length < 6) {
            this.showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        try {
            const loadingEl = document.createElement('div');
            loadingEl.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Creando contraseña...</div>';
            loadingEl.className = 'alert alert-info';
            document.getElementById('fase-crear-password').appendChild(loadingEl);

            const response = await fetch('/api/empleados-auth/crear-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    empleadoId,
                    password,
                    confirmPassword
                })
            });

            const data = await response.json();
            
            if (loadingEl) loadingEl.remove();

            if (!response.ok) {
                throw new Error(data.error || 'Error creando contraseña');
            }

            this.showAlert(data.message, 'success');
            // Pasar directamente al login ya que no se requiere verificación de email
            setTimeout(() => {
                this.mostrarFaseLogin();
            }, 1500);

        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    async loginEmpleado() {
        const rut = document.getElementById('rut-login').value;

        try {
            const loadingEl = document.createElement('div');
            loadingEl.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Iniciando sesión...</div>';
            loadingEl.className = 'alert alert-info';
            document.getElementById('fase-login').appendChild(loadingEl);

            const response = await fetch('/api/auth/login/empleado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rut })
            });

            const data = await response.json();
            
            if (loadingEl) loadingEl.remove();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el login');
            }

            console.log('✅ Login exitoso, datos recibidos:', data);
            
            // Limpiar cualquier sesión anterior antes de guardar la nueva
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Sesiones anteriores limpiadas');
            
            // Guardar token y datos del empleado
            this.token = data.data.token;
            this.empleado = data.data.user;
            
            // Usar la misma clave que el sistema principal para compatibilidad
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('empleado_token', this.token); // Mantener compatibilidad
            localStorage.setItem('empleado_data', JSON.stringify(this.empleado));
            
            // Actualizar el API client principal para que use el mismo token
            if (typeof window.api !== 'undefined') {
                window.api.setToken(this.token);
            }
            
            // Actualizar AppState para sincronizar con el sistema principal
            if (typeof window.AppState !== 'undefined') {
                window.AppState.user = this.empleado;
            }

            console.log('💾 Nueva sesión guardada en localStorage');

            console.log('🚪 Cerrando modal completamente...');
            
            // Cerrar modal completamente
            const modalElement = document.getElementById('empleadoLoginModal');
            if (modalElement) {
                // Primero intentar con Bootstrap
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
                
                // Después forzar cierre manual de TODOS los modales
                setTimeout(() => {
                    // Cerrar todos los modales que puedan estar abiertos
                    const allModals = document.querySelectorAll('.modal');
                    allModals.forEach(modal => {
                        modal.style.display = 'none';
                        modal.setAttribute('aria-hidden', 'true');
                        modal.classList.remove('show');
                    });
                    
                    // Limpiar estado del body
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                    
                    // Remover todos los backdrops
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(backdrop => backdrop.remove());
                    
                    console.log('✅ Todos los modales cerrados completamente');
                    
                    // Pequeño delay adicional para asegurar que el DOM esté completamente listo
                    setTimeout(() => {
                        // Mostrar dashboard completo del empleado
                        this.mostrarDashboardEmpleado();
                    }, 200);
                }, 100);
            }
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    mostrarInterfazEmpleado() {
        try {
            console.log('🎯 Mostrando interfaz de empleado');
            
            // Mostrar navbar
            const navbar = document.getElementById('mainNavbar');
            if (navbar) navbar.style.display = 'block';
            
            // Mostrar contenido principal
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
                this.mostrarDashboardEmpleado();
            }
                
            console.log('✅ Dashboard completo mostrado');

        } catch (error) {
            console.error('❌ Error mostrando dashboard:', error);
            this.showAlert(error.message, 'error');
        }
    }

    renderizarDashboardCompleto() {
        // Esta función está obsoleta - usar mostrarDashboardEmpleado() en su lugar
        console.log('⚠️ renderizarDashboardCompleto() está obsoleta');
        this.mostrarDashboardEmpleado();
    }
    
    renderizarDashboardCompletoObsoleta() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="container-fluid py-4">
                <!-- Header del Dashboard -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h2>¡Bienvenido, ${this.empleado.nombre}!</h2>
                        <p class="text-muted">Sistema de Permisos Administrativos - Dashboard Principal</p>
                    </div>
                </div>

                <!-- Información Personal -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-user me-2"></i>Información Personal</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>RUT:</strong> ${this.empleado.rut}</p>
                                <p><strong>Email:</strong> ${this.empleado.email || 'No registrado'}</p>
                                <p><strong>Cargo:</strong> ${this.empleado.cargo || 'No especificado'}</p>
                                <p><strong>Supervisor:</strong> ${this.empleado.supervisor || 'No asignado'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-calendar-check me-2"></i>Resumen de Permisos 2025</h5>
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-6">
                                        <h4 class="text-primary">0</h4>
                                        <small>Primer Semestre</small>
                                    </div>
                                    <div class="col-6">
                                        <h4 class="text-info">0</h4>
                                        <small>Segundo Semestre</small>
                                    </div>
                                </div>
                                <hr>
                                <div class="row text-center">
                                    <div class="col-4">
                                        <h6 class="text-success">0</h6>
                                        <small>Aprobados</small>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-warning">0</h6>
                                        <small>Pendientes</small>
                                    </div>
                                    <div class="col-4">
                                        <h6 class="text-danger">0</h6>
                                        <small>Rechazados</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones Principales -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-tasks me-2"></i>Acciones Disponibles</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-primary btn-lg w-100" onclick="solicitudesEmpleado.mostrarFormularioSolicitud()">
                                            <i class="fas fa-calendar-plus fa-2x mb-2"></i><br>
                                            Nueva Solicitud de Permiso
                                        </button>
                                    </div>
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-outline-primary btn-lg w-100" onclick="solicitudesEmpleado.mostrarHistorial()">
                                            <i class="fas fa-history fa-2x mb-2"></i><br>
                                            Ver Historial
                                        </button>
                                    </div>
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-outline-info btn-lg w-100" onclick="this.mostrarCalendarioPermisos()">
                                            <i class="fas fa-calendar-alt fa-2x mb-2"></i><br>
                                            Calendario de Permisos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Solicitudes Recientes -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5><i class="fas fa-clock me-2"></i>Solicitudes Recientes</h5>
                                <button class="btn btn-sm btn-outline-primary" onclick="solicitudesEmpleado.mostrarHistorial()">
                                    Ver Todas
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="text-center py-3">
                                    <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                                    <p class="text-muted">No hay solicitudes registradas</p>
                                    <button class="btn btn-primary btn-sm" onclick="solicitudesEmpleado.mostrarFormularioSolicitud()">
                                        Crear Primera Solicitud
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    mostrarCalendarioPermisos() {
        this.showAlert('Función de calendario en desarrollo', 'info');
    }

    async testSolicitudEmpleado() {
        console.log('🧪 Iniciando test de solicitud...');
        
        try {
            const token = localStorage.getItem('empleado_token');
            console.log('🧪 Token:', token ? 'Existe' : 'No existe');

            const testData = {
                tipo_permiso: 'T',
                fecha_solicitud: '2025-08-29',
                motivo: 'Test desde dashboard',
                observaciones: 'Prueba de funcionamiento'
            };

            console.log('🧪 Datos de test:', testData);

            const response = await fetch('/api/solicitudes-empleado/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            console.log('🧪 Response status:', response.status);
            const data = await response.json();
            console.log('🧪 Response data:', data);

            if (response.ok) {
                this.showAlert('¡Test exitoso! Solicitud creada.', 'success');
            } else {
                this.showAlert(`Error en test: ${data.error}`, 'error');
            }

        } catch (error) {
            console.error('🧪 Error en test:', error);
            this.showAlert(`Error: ${error.message}`, 'error');
        }
    }

    mostrarFaseCrearPassword() {
        document.querySelectorAll('.fase-empleado').forEach(el => el.classList.add('d-none'));
        document.getElementById('fase-crear-password').classList.remove('d-none');
        
        document.getElementById('empleado-id-crear').value = this.empleadoTemp.id;
        document.getElementById('info-empleado-crear').innerHTML = `
            <strong>${this.empleadoTemp.nombre}</strong><br>
            <small>RUT: ${this.empleadoTemp.rut} | Cargo: ${this.empleadoTemp.cargo}</small>
        `;
    }

    mostrarFaseLogin() {
        document.querySelectorAll('.fase-empleado').forEach(el => el.classList.add('d-none'));
        document.getElementById('fase-login').classList.remove('d-none');
        
        document.getElementById('rut-login').value = this.empleadoTemp.rut;
        document.getElementById('info-empleado-login').innerHTML = `
            <strong>${this.empleadoTemp.nombre}</strong><br>
            <small>RUT: ${this.empleadoTemp.rut} | Cargo: ${this.empleadoTemp.cargo}</small>
        `;
    }

    mostrarFaseVerificarEmail() {
        document.querySelectorAll('.fase-empleado').forEach(el => el.classList.add('d-none'));
        document.getElementById('fase-verificar-email').classList.remove('d-none');
    }

    resetModal() {
        document.querySelectorAll('.fase-empleado').forEach(el => el.classList.add('d-none'));
        document.getElementById('fase-verificar-rut').classList.remove('d-none');
        
        // Limpiar forms
        document.getElementById('form-verificar-rut').reset();
        document.getElementById('form-crear-password').reset();
        document.getElementById('form-login-empleado').reset();
    }

    async verificarToken() {
        console.log('🔍 Verificando token de empleado...');
        if (!this.token) {
            console.log('❌ No hay token de empleado');
            return false;
        }

        try {
            console.log('📡 Haciendo petición al dashboard del empleado...');
            // Verificar token haciendo una petición al dashboard
            const response = await fetch('/api/solicitudes-empleado/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                console.log('✅ Token de empleado válido');
                const empleadoData = localStorage.getItem('empleado_data');
                if (empleadoData) {
                    console.log('📊 Cargando datos del empleado desde localStorage...');
                    this.empleado = JSON.parse(empleadoData);
                    console.log('🎯 Iniciando dashboard del empleado...');
                    this.mostrarDashboardEmpleado();
                    return true;
                }
            } else {
                console.log('❌ Token de empleado inválido, limpiando sesión');
                // Token inválido, limpiar pero no hacer más llamadas
                this.token = null;
                this.empleado = null;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('empleado_token');
                localStorage.removeItem('empleado_data');
                return false;
            }
        } catch (error) {
            console.error('❌ Error verificando token de empleado:', error);
            this.logout();
        }
        
        return false;
    }

    async mostrarDashboardEmpleado() {
        try {
            console.log('🎯 Iniciando mostrarDashboardEmpleado');
            
            console.log('🧭 Mostrando navbar...');
            const navbar = document.getElementById('mainNavbar');
            if (navbar) {
                navbar.style.display = 'block';
                console.log('✅ Navbar mostrado');
            } else {
                console.error('❌ No se encontró navbar');
            }
            
            console.log('📄 Mostrando main-content...');
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
                console.log('✅ main-content mostrado');
            } else {
                console.error('❌ No se encontró main-content');
            }
            
            // Mostrar en main-content un loading
            document.getElementById('main-content').innerHTML = `
                <div class="container-fluid py-4 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-spinner fa-spin"></i> Cargando dashboard...
                    </div>
                </div>
            `;
            
            console.log('🔄 Loading mostrado, llamando al API...');

            const response = await fetch('/api/solicitudes-empleado/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando dashboard');
            }

            const data = await response.json();

            // Actualizar interfaz
            this.renderizarDashboardEmpleado(data);
            this.actualizarNavbarEmpleado();

        } catch (error) {
            document.getElementById('main-content').innerHTML = `
                <div class="container-fluid py-4">
                    <div class="alert alert-danger">
                        <strong>Error:</strong> ${error.message}
                    </div>
                </div>
            `;
        }
    }

    renderizarDashboardEmpleado(data) {
        const { empleado, estadisticas, solicitudesRecientes, notificaciones } = data;
        
        console.log('🔍 DEBUG: Datos completos del empleado desde API:', empleado);
        console.log('🔍 DEBUG: Campos CSV específicos desde API:', {
            negociacion_colectiva: empleado.negociacion_colectiva,
            visualizacion: empleado.visualizacion,
            autorizacion: empleado.autorizacion,
            uso_primer_semestre: empleado.uso_primer_semestre,
            uso_segundo_semestre: empleado.uso_segundo_semestre
        });
        
        // Guardar datos del empleado para usar en otros métodos
        this.empleado = empleado;
        
        // También actualizar en localStorage para persistencia
        localStorage.setItem('empleado_data', JSON.stringify(empleado));
        console.log('💾 Datos completos del empleado guardados en localStorage');

        const dashboardHTML = `
            <div class="container-fluid py-4">
                <!-- Header del empleado -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card bg-gradient-success text-white">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h4 class="mb-1">¡Bienvenido, ${empleado.nombre}!</h4>
                                        <p class="mb-0">
                                            <i class="fas fa-id-badge me-1"></i>RUT: ${empleado.rut} | 
                                            <i class="fas fa-briefcase me-1"></i>${empleado.cargo}
                                        </p>
                                        ${empleado.supervisor ? `<small><i class="fas fa-user-tie me-1"></i>Supervisor: ${empleado.supervisor}</small>` : ''}
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <button class="btn btn-light" onclick="empleadoSystem.mostrarSolicitudPermiso()">
                                            <i class="fas fa-plus me-2"></i>Nueva Solicitud
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-file-alt fa-2x text-primary mb-2"></i>
                                <h4 class="mb-1">${estadisticas.total}</h4>
                                <small class="text-muted">Total Solicitudes</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                                <h4 class="mb-1">${estadisticas.pendientes}</h4>
                                <small class="text-muted">Pendientes</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                                <h4 class="mb-1">${estadisticas.aprobadas}</h4>
                                <small class="text-muted">Aprobadas</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-times-circle fa-2x text-danger mb-2"></i>
                                <h4 class="mb-1">${estadisticas.rechazadas}</h4>
                                <small class="text-muted">Rechazadas</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Datos de Permisos Utilizados -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-chart-line me-2"></i>Mis Datos de Permisos
                                </h5>
                            </div>
                            <div class="card-body" id="datos-permisos-container">
                                <div class="text-center py-3">
                                    <i class="fas fa-spinner fa-spin me-2"></i>Cargando datos de permisos...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Solicitudes Recientes -->
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-history me-2"></i>Solicitudes Recientes
                                </h5>
                                <button class="btn btn-outline-primary btn-sm" onclick="empleadoSystem.mostrarMisSolicitudes()">
                                    Ver Todas
                                </button>
                            </div>
                            <div class="card-body">
                                ${this.renderizarSolicitudesRecientes(solicitudesRecientes)}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-bell me-2"></i>Notificaciones
                                </h5>
                            </div>
                            <div class="card-body">
                                ${this.renderizarNotificaciones(notificaciones)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('main-content').innerHTML = dashboardHTML;
        
        // Cargar datos de permisos de forma asíncrona
        this.cargarDatosPermisos();
    }

    renderizarSolicitudesRecientes(solicitudes) {
        if (solicitudes.length === 0) {
            return '<p class="text-muted text-center">No tienes solicitudes recientes</p>';
        }

        return solicitudes.map(sol => {
            const badgeClass = {
                'PENDIENTE': 'bg-warning',
                'APROBADO': 'bg-success', 
                'RECHAZADO': 'bg-danger',
                'CANCELADO': 'bg-secondary'
            }[sol.estado] || 'bg-secondary';

            return `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <strong>${sol.tipo_nombre}</strong>
                        <br><small class="text-muted">${sol.fecha_desde}</small>
                    </div>
                    <span class="badge ${badgeClass}">${sol.estado}</span>
                </div>
            `;
        }).join('');
    }

    renderizarNotificaciones(notificaciones) {
        if (notificaciones.length === 0) {
            return '<p class="text-muted text-center">No tienes notificaciones</p>';
        }

        return notificaciones.map(notif => `
            <div class="alert alert-info alert-sm mb-2">
                <strong>${notif.titulo}</strong><br>
                <small>${notif.mensaje}</small>
            </div>
        `).join('');
    }

    async renderizarDatosPermisos() {
        if (!this.empleado) {
            return '<p class="text-muted text-center">No se pudieron cargar los datos de permisos</p>';
        }

        console.log('🔍 DEBUG: Datos completos del empleado:', this.empleado);
        console.log('🔍 DEBUG: Campos específicos del CSV:', {
            negociacion_colectiva: this.empleado.negociacion_colectiva,
            visualizacion: this.empleado.visualizacion,
            autorizacion: this.empleado.autorizacion,
            uso_primer_semestre: this.empleado.uso_primer_semestre,
            uso_segundo_semestre: this.empleado.uso_segundo_semestre
        });

        let primerSemestre = [];
        let segundoSemestre = [];

        // Función para calcular equivalencias de permisos
        const calcularEquivalenciaPermisos = (permisos) => {
            let totalT = 0;
            permisos.forEach(permiso => {
                const codigo = permiso.tipo_permiso_codigo || '';
                if (codigo === 'T') {
                    totalT += 1;
                } else if (codigo === 'AM' || codigo === 'PM') {
                    totalT += 0.5;
                }
            });
            return totalT;
        };

        try {
            // Validar token antes de hacer la petición
            if (!this.isTokenValid()) {
                console.log('❌ Token no válido para obtener historial');
                return totalPermisos;
            }

            // Obtener permisos reales del empleado desde la base de datos
            const response = await fetch('/api/solicitudes-empleado/historial', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar historial');
            }

            const data = await response.json();
            console.log('📊 Respuesta completa:', data);
            
            // Obtener el array de solicitudes desde la respuesta
            const permisosReales = data.solicitudes || [];
            console.log('📊 Permisos reales obtenidos:', permisosReales);

            // Filtrar permisos por semestre para 2025 y solo permisos APROBADOS
            const year = 2025;
            primerSemestre = permisosReales.filter(permiso => {
                const fecha = new Date(permiso.fecha_desde);
                return fecha.getFullYear() === year && 
                       fecha.getMonth() >= 0 && fecha.getMonth() <= 5 &&
                       permiso.estado === 'APROBADO';
            });

            segundoSemestre = permisosReales.filter(permiso => {
                const fecha = new Date(permiso.fecha_desde);
                return fecha.getFullYear() === year && 
                       fecha.getMonth() >= 6 && fecha.getMonth() <= 11 &&
                       permiso.estado === 'APROBADO';
            });

            // Calcular equivalencias en permisos T
            const equivalenciaPrimerSemestre = calcularEquivalenciaPermisos(primerSemestre);
            const equivalenciaSegundoSemestre = calcularEquivalenciaPermisos(segundoSemestre);
            const totalAnoUsado = equivalenciaPrimerSemestre + equivalenciaSegundoSemestre;

            // Calcular límites según negociación colectiva
            const tieneNegociacion = this.empleado.negociacion_colectiva;
            let limitePrimerSemestre, limiteSegundoSemestre, limiteAnual;
            
            if (tieneNegociacion) {
                // Con negociación: 6 T por año, flexibles entre semestres
                limiteAnual = 6;
                limitePrimerSemestre = 6; // Puede usar todos en primer semestre
                limiteSegundoSemestre = 6 - equivalenciaPrimerSemestre; // Lo que quede
            } else {
                // Sin negociación: 3 T por semestre, se pierden si no se usan
                limiteAnual = 6;
                limitePrimerSemestre = 3;
                limiteSegundoSemestre = 3;
            }

            console.log('📊 Análisis de permisos:', {
                tieneNegociacion,
                primerSemestre: { usados: equivalenciaPrimerSemestre, limite: limitePrimerSemestre },
                segundoSemestre: { usados: equivalenciaSegundoSemestre, limite: limiteSegundoSemestre },
                totalAno: { usado: totalAnoUsado, limite: limiteAnual }
            });
        } catch (error) {
            console.error('❌ Error al cargar permisos reales:', error);
            // Mantener arrays vacíos en caso de error
        }

        // Calcular valores para mostrar (definir fuera del try-catch)
        const equivalenciaPrimerSemestre = primerSemestre.length > 0 ? calcularEquivalenciaPermisos(primerSemestre) : 0;
        const equivalenciaSegundoSemestre = segundoSemestre.length > 0 ? calcularEquivalenciaPermisos(segundoSemestre) : 0;
        const totalAnoUsado = equivalenciaPrimerSemestre + equivalenciaSegundoSemestre;
        
        const tieneNegociacion = this.empleado.negociacion_colectiva;
        const limiteAnual = 6;
        const limitePrimerSemestre = tieneNegociacion ? 6 : 3;
        const limiteSegundoSemestre = tieneNegociacion ? Math.max(0, 6 - equivalenciaPrimerSemestre) : 3;
        
        const disponiblePrimerSemestre = Math.max(0, limitePrimerSemestre - equivalenciaPrimerSemestre);
        const disponibleSegundoSemestre = Math.max(0, limiteSegundoSemestre - equivalenciaSegundoSemestre);

        return `
            <div class="row">
                <!-- Uso por Semestre con Detalles -->
                <div class="col-md-6">
                    <h6><i class="fas fa-calendar-alt me-2"></i>1° Semestre (Ene-Jun)</h6>
                    <div class="mb-3">
                        <div class="text-center p-3 border rounded mb-3">
                            <h4 class="text-primary mb-1">${equivalenciaPrimerSemestre}</h4>
                            <small class="text-muted">Permisos T Equivalentes</small>
                            <div class="mt-1">
                                <small class="text-success">Disponibles: ${disponiblePrimerSemestre}</small>
                            </div>
                        </div>
                        ${primerSemestre.length > 0 ? `
                            <div class="small">
                                ${primerSemestre.slice(0, 4).map(sol => `
                                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                        <span class="text-truncate me-2">${sol.tipo_permiso_nombre}</span>
                                        <small class="text-muted">${new Date(sol.fecha_desde).toLocaleDateString('es-CL')}</small>
                                    </div>
                                    <div class="ps-3">
                                        <small class="text-muted">${sol.motivo}</small>
                                    </div>
                                `).join('')}
                                ${primerSemestre.length > 4 ? `<small class="text-muted">y ${primerSemestre.length - 4} más...</small>` : ''}
                            </div>
                        ` : '<small class="text-muted">Sin permisos en este semestre</small>'}
                    </div>
                </div>

                <div class="col-md-6">
                    <h6><i class="fas fa-calendar-alt me-2"></i>2° Semestre (Jul-Dic)</h6>
                    <div class="mb-3">
                        <div class="text-center p-3 border rounded mb-3">
                            <h4 class="text-primary mb-1">${equivalenciaSegundoSemestre}</h4>
                            <small class="text-muted">Permisos T Equivalentes</small>
                            <div class="mt-1">
                                <small class="text-success">Disponibles: ${disponibleSegundoSemestre}</small>
                            </div>
                        </div>
                        ${segundoSemestre.length > 0 ? `
                            <div class="small">
                                ${segundoSemestre.slice(0, 4).map(sol => `
                                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                        <span class="text-truncate me-2">${sol.tipo_permiso_nombre}</span>
                                        <small class="text-muted">${new Date(sol.fecha_desde).toLocaleDateString('es-CL')}</small>
                                    </div>
                                    <div class="ps-3">
                                        <small class="text-muted">${sol.motivo}</small>
                                    </div>
                                `).join('')}
                                ${segundoSemestre.length > 4 ? `<small class="text-muted">y ${segundoSemestre.length - 4} más...</small>` : ''}
                            </div>
                        ` : '<small class="text-muted">Sin permisos en este semestre</small>'}
                    </div>
                </div>
            </div>

            <hr class="my-3">

            <!-- Resumen Anual -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <h6><i class="fas fa-chart-bar me-2"></i>Resumen Anual 2025</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center py-2">
                                    <h5 class="text-primary mb-1">${totalAnoUsado}</h5>
                                    <small class="text-muted">Permisos T Usados</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center py-2">
                                    <h5 class="text-success mb-1">${limiteAnual - totalAnoUsado}</h5>
                                    <small class="text-muted">Permisos T Disponibles</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="alert alert-info py-2 mb-0">
                                <small>
                                    <i class="fas fa-info-circle me-1"></i>
                                    ${tieneNegociacion 
                                        ? '<strong>Con Negociación:</strong> 6 permisos T/año flexibles entre semestres. AM/PM = 0.5 T'
                                        : '<strong>Sin Negociación:</strong> 3 permisos T/semestre. Se pierden si no se usan. AM/PM = 0.5 T'
                                    }
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr class="my-3">

            <!-- Información Adicional -->
            <div class="row mb-3">
                <div class="col-md-12">
                    <h6><i class="fas fa-info-circle me-2"></i>Información Adicional</h6>
                    <div class="row">
                        <div class="col-md-4 mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-handshake me-2"></i>
                                <span class="me-2">Negociación Colectiva:</span>
                                <span class="badge ${this.empleado.negociacion_colectiva ? 'bg-success' : 'bg-secondary'}">
                                    ${this.empleado.negociacion_colectiva ? 'SÍ' : 'NO'}
                                </span>
                            </div>
                        </div>
                        ${this.empleado.visualizacion ? `
                            <div class="col-md-4 mb-2">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-eye me-2"></i>
                                    <span class="me-2">Sup. Visualización:</span>
                                    <small class="text-muted">${this.empleado.visualizacion}</small>
                                </div>
                            </div>
                        ` : ''}
                        ${this.empleado.autorizacion ? `
                            <div class="col-md-4 mb-2">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-user-check me-2"></i>
                                    <span class="me-2">Sup. Autorización:</span>
                                    <small class="text-muted">${this.empleado.autorizacion}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Estadísticas de Permisos y Asistencia -->
            <div class="row">
                <div class="col-md-3">
                    <div class="text-center p-3 border rounded">
                        <i class="fas fa-user-times fa-2x text-warning mb-2"></i>
                        <h5 class="mb-1">${this.empleado.sin_goce || 0}</h5>
                        <small class="text-muted">Sin Goce</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 border rounded">
                        <i class="fas fa-clock fa-2x text-danger mb-2"></i>
                        <h5 class="mb-1">${this.empleado.atrasos || 0}</h5>
                        <small class="text-muted">Atrasos</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 border rounded">
                        <i class="fas fa-clock fa-2x text-success mb-2"></i>
                        <h5 class="mb-1">${this.empleado.atrasos_justificados || 0}</h5>
                        <small class="text-muted">Atrasos Justificados</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 border rounded">
                        <i class="fas fa-medkit fa-2x text-info mb-2"></i>
                        <h5 class="mb-1">${this.empleado.licencias_total || 2}</h5>
                        <small class="text-muted">Licencias Médicas</small>
                    </div>
                </div>
            </div>

            ${this.empleado.no_marcaciones > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="alert alert-warning d-flex align-items-center">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span>No marcaciones registradas: <strong>${this.empleado.no_marcaciones}</strong></span>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }

    async cargarDatosPermisos() {
        try {
            const container = document.getElementById('datos-permisos-container');
            if (container) {
                const html = await this.renderizarDatosPermisos();
                container.innerHTML = html;
            }
        } catch (error) {
            console.error('Error cargando datos de permisos:', error);
            const container = document.getElementById('datos-permisos-container');
            if (container) {
                container.innerHTML = '<p class="text-danger text-center">Error cargando datos de permisos</p>';
            }
        }
    }

    actualizarNavbarEmpleado() {
        // Actualizar navbar para mostrar opciones de empleado
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            navbar.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="empleadoSystem.mostrarDashboardEmpleado()">
                        <i class="fas fa-home me-1"></i>Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="empleadoSystem.mostrarSolicitudPermiso()">
                        <i class="fas fa-plus me-1"></i>Nueva Solicitud
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="empleadoSystem.mostrarMisSolicitudes()">
                        <i class="fas fa-list me-1"></i>Mis Solicitudes
                    </a>
                </li>
                <li class="nav-item dropdown ms-auto">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle me-1"></i>${this.empleado.nombre}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="empleadoSystem.mostrarPerfilEmpleado()">
                            <i class="fas fa-user me-2"></i>Mi Perfil
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="empleadoSystem.cambiarPassword()">
                            <i class="fas fa-key me-2"></i>Cambiar Contraseña
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="empleadoSystem.logout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                        </a></li>
                    </ul>
                </li>
            `;
        }
    }

    logout() {
        this.token = null;
        this.empleado = null;
        
        // Limpiar completamente la interfaz
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Cerrando sesión...</p></div>';
        }
        
        // Limpiar navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.innerHTML = '';
        }
        
        // Limpiar completamente todo el almacenamiento local y de sesión
        localStorage.clear();
        sessionStorage.clear();
        
        // También limpiar cookies si las hay
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('🔓 Sesión cerrada y almacenamiento limpiado');
        
        // Recargar página después de un breve delay para que se vea la limpieza
        setTimeout(() => {
            window.location.href = window.location.pathname + '?clear=1';
        }, 500);
    }

    // Función auxiliar para mostrar alertas
    showAlert(message, type = 'info') {
        const alertEl = document.createElement('div');
        alertEl.innerHTML = `<strong>${type === 'error' ? 'Error' : 'Aviso'}:</strong> ${message}`;
        alertEl.className = `alert alert-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'}`;
        
        // Buscar un contenedor apropiado para la alerta
        let container = document.querySelector('.fase-empleado:not(.d-none)');
        if (!container) {
            container = document.querySelector('#empleadoLoginModal .modal-body');
        }
        if (!container) {
            container = document.body;
        }
        
        container.appendChild(alertEl);
        
        setTimeout(() => {
            if (alertEl) alertEl.remove();
        }, 5000);
    }

    // Mostrar modal para crear nueva solicitud de permiso
    async mostrarSolicitudPermiso() {
        try {
            console.log('🎯 INICIO: mostrarSolicitudPermiso()');
            
            // Verificar que tenemos token válido
            if (!this.isTokenValid()) {
                console.error('❌ Token no válido para mostrar solicitud de permiso');
                console.log('🔄 Recargando la página para refrescar el sistema...');
                this.showAlert('Refrescando sistema... Recargando página en 2 segundos.', 'info');
                setTimeout(() => {
                    window.location.reload(true);
                }, 2000);
                return;
            }
            
            console.log('✅ Token disponible, obteniendo tipos de permisos...');
            
            // Primero obtener tipos de permisos disponibles
            const response = await fetch('/api/solicitudes-empleado/tipos-permisos', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`Error obteniendo tipos de permisos: ${response.status} - ${errorText}`);
            }
            
            const tipos = await response.json();
            console.log('✅ Tipos de permisos obtenidos:', tipos.length, 'tipos');
            
            if (!tipos || tipos.length === 0) {
                throw new Error('No hay tipos de permisos disponibles');
            }
            
            // Crear el modal dinámicamente
            console.log('🎨 Creando modal...');
            this.crearModalSolicitud(tipos);
            console.log('✅ Modal creado exitosamente');
            
        } catch (error) {
            console.error('❌ Error en mostrarSolicitudPermiso:', error);
            console.error('Stack:', error.stack);
            this.showAlert(`Error al cargar el formulario de solicitud: ${error.message}`, 'error');
        }
    }

    crearModalSolicitud(tipos) {
        console.log('🎨 INICIO: crearModalSolicitud()');
        console.log('📋 Tipos recibidos:', tipos);
        
        try {
            // Crear opciones de tipos de permisos
            const opcionesTipos = tipos.map(tipo => 
                `<option value="${tipo.id}">${tipo.nombre} (${tipo.codigo})</option>`
            ).join('');
            
            console.log('✅ Opciones HTML generadas:', opcionesTipos.length, 'caracteres');
        
        // HTML del modal
        const modalHTML = `
            <div class="modal fade" id="modalNuevaSolicitud" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-plus-circle me-2"></i>Nueva Solicitud de Permiso
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formNuevaSolicitud">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Tipo de Permiso *</label>
                                        <select class="form-select" id="tipoPermiso" required>
                                            <option value="">Seleccionar tipo...</option>
                                            ${opcionesTipos}
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Fecha *</label>
                                        <input type="date" class="form-control" id="fechaPermiso" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <label class="form-label">Motivo/Justificación *</label>
                                        <textarea class="form-control" id="motivoPermiso" rows="3" 
                                                placeholder="Describe el motivo de tu solicitud..." required></textarea>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Nota:</strong> Tu solicitud será enviada a tu supervisor para revisión y posterior aprobación/rechazo.
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="empleadoSystem.enviarSolicitud()">
                                <i class="fas fa-paper-plane me-1"></i>Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const modalExistente = document.getElementById('modalNuevaSolicitud');
        if (modalExistente) {
            modalExistente.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar fecha mínima (hoy)
        const fechaInput = document.getElementById('fechaPermiso');
        const today = new Date().toISOString().split('T')[0];
        fechaInput.min = today;
        
            // Mostrar modal
            console.log('👁️ Mostrando modal...');
            const modalElement = document.getElementById('modalNuevaSolicitud');
            if (!modalElement) {
                throw new Error('No se pudo crear el elemento modal');
            }
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('✅ Modal mostrado exitosamente');
            
        } catch (error) {
            console.error('❌ Error en crearModalSolicitud:', error);
            this.showAlert(`Error creando modal: ${error.message}`, 'error');
        }
    }

    async enviarSolicitud() {
        try {
            // Validar token antes de hacer cualquier cosa
            if (!this.isTokenValid()) {
                console.log('❌ Token no válido para enviar solicitud');
                console.log('🔄 Recargando la página para refrescar el sistema...');
                this.showAlert('Refrescando sistema... Recargando página en 2 segundos.', 'info');
                setTimeout(() => {
                    window.location.reload(true);
                }, 2000);
                return;
            }

            const tipoPermisoId = document.getElementById('tipoPermiso').value;
            const fechaPermiso = document.getElementById('fechaPermiso').value;
            const motivoPermiso = document.getElementById('motivoPermiso').value.trim();
            
            // Validaciones
            if (!tipoPermisoId || !fechaPermiso || !motivoPermiso) {
                this.showAlert('Por favor completa todos los campos requeridos', 'warning');
                return;
            }
            
            if (motivoPermiso.length < 10) {
                this.showAlert('El motivo debe tener al menos 10 caracteres', 'warning');
                return;
            }
            
            // Obtener el código del tipo de permiso seleccionado
            const selectTipo = document.getElementById('tipoPermiso');
            const opcionSeleccionada = selectTipo.options[selectTipo.selectedIndex];
            const tipoPermisoCodigo = opcionSeleccionada.text.match(/\(([^)]+)\)$/)?.[1]; // Extraer código entre paréntesis
            
            if (!tipoPermisoCodigo) {
                this.showAlert('Error obteniendo el código del tipo de permiso', 'error');
                return;
            }
            
            // Deshabilitar botón y mostrar loading
            const btnEnviar = document.querySelector('#modalNuevaSolicitud .btn-primary');
            const textoOriginal = btnEnviar.innerHTML;
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
            
            console.log('📤 Enviando solicitud:', { tipoPermisoCodigo, fechaPermiso, motivoPermiso });
            
            // Enviar solicitud
            const response = await fetch('/api/solicitudes-empleado/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    tipo_permiso: tipoPermisoCodigo,
                    fecha_solicitud: fechaPermiso,
                    motivo: motivoPermiso,
                    observaciones: ''
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error enviando solicitud');
            }
            
            console.log('✅ Solicitud enviada exitosamente:', data);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaSolicitud'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            this.showAlert('¡Solicitud enviada exitosamente! Tu supervisor será notificado.', 'success');
            
            // Refrescar dashboard
            this.mostrarDashboardEmpleado();
            
        } catch (error) {
            console.error('❌ Error enviando solicitud:', error);
            this.showAlert(error.message || 'Error al enviar la solicitud', 'error');
            
            // Restaurar botón
            const btnEnviar = document.querySelector('#modalNuevaSolicitud .btn-primary');
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Enviar Solicitud';
            }
        }
    }

    async mostrarMisSolicitudes() {
        try {
            console.log('🎯 Mostrando todas las solicitudes del empleado');
            
            // Validar token antes de hacer la petición
            if (!this.isTokenValid()) {
                console.log('❌ Token no válido para mostrar solicitudes');
                showAlert('No hay token disponible. Por favor, vuelve a iniciar sesión.', 'danger');
                return;
            }
            
            // Obtener solicitudes del servidor
            const response = await fetch('/api/solicitudes-empleado/historial', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error obteniendo solicitudes');
            }
            
            const data = await response.json();
            console.log('✅ Solicitudes obtenidas:', data);
            
            // Crear el modal con todas las solicitudes
            this.crearModalSolicitudes(data.solicitudes || []);
            
        } catch (error) {
            console.error('❌ Error mostrando solicitudes:', error);
            this.showAlert('Error al cargar las solicitudes', 'error');
        }
    }

    crearModalSolicitudes(solicitudes) {
        // Crear filas de la tabla
        const filasSolicitudes = solicitudes.map(solicitud => {
            const fecha = new Date(solicitud.fecha_desde).toLocaleDateString('es-CL');
            const fechaCreacion = new Date(solicitud.created_at).toLocaleDateString('es-CL');
            const estadoClass = {
                'PENDIENTE': 'warning',
                'APROBADO': 'success', 
                'RECHAZADO': 'danger',
                'CANCELADO': 'secondary'
            }[solicitud.estado] || 'secondary';
            
            const puedeEditar = solicitud.estado === 'PENDIENTE';
            const puedeEliminar = solicitud.estado === 'PENDIENTE' || solicitud.estado === 'CANCELADO';
            
            return `
                <tr>
                    <td>${solicitud.id}</td>
                    <td>
                        <strong>${solicitud.tipo_permiso_nombre || 'Sin nombre'}</strong><br>
                        <small class="text-muted">${solicitud.tipo_permiso_codigo || 'Sin código'}</small>
                    </td>
                    <td>${fecha}</td>
                    <td>${fechaCreacion}</td>
                    <td>
                        <span class="badge bg-${estadoClass}">${solicitud.estado}</span>
                    </td>
                    <td>
                        <div class="text-truncate" style="max-width: 200px;" title="${solicitud.motivo}">
                            ${solicitud.motivo}
                        </div>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            ${puedeEditar ? `
                                <button class="btn btn-outline-primary btn-sm" 
                                        onclick="empleadoSystem.editarSolicitud(${solicitud.id})"
                                        title="Editar solicitud">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                            ${puedeEliminar ? `
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="empleadoSystem.eliminarSolicitud(${solicitud.id})"
                                        title="Eliminar solicitud">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // HTML del modal
        const modalHTML = `
            <div class="modal fade" id="modalMisSolicitudes" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-list me-2"></i>Mis Solicitudes de Permisos
                                <span class="badge bg-primary ms-2">${solicitudes.length} total</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${solicitudes.length === 0 ? `
                                <div class="text-center py-4">
                                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">No tienes solicitudes de permisos aún.</p>
                                    <button class="btn btn-primary" onclick="empleadoSystem.mostrarSolicitudPermiso(); bootstrap.Modal.getInstance(document.getElementById('modalMisSolicitudes')).hide();">
                                        <i class="fas fa-plus me-1"></i>Crear Primera Solicitud
                                    </button>
                                </div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Tipo</th>
                                                <th>Fecha</th>
                                                <th>Solicitado</th>
                                                <th>Estado</th>
                                                <th>Motivo</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${filasSolicitudes}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-3">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <div class="card bg-warning bg-opacity-10">
                                                <div class="card-body text-center">
                                                    <h6 class="card-title">Pendientes</h6>
                                                    <h4 class="text-warning">${solicitudes.filter(s => s.estado === 'PENDIENTE').length}</h4>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-success bg-opacity-10">
                                                <div class="card-body text-center">
                                                    <h6 class="card-title">Aprobadas</h6>
                                                    <h4 class="text-success">${solicitudes.filter(s => s.estado === 'APROBADO').length}</h4>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-danger bg-opacity-10">
                                                <div class="card-body text-center">
                                                    <h6 class="card-title">Rechazadas</h6>
                                                    <h4 class="text-danger">${solicitudes.filter(s => s.estado === 'RECHAZADO').length}</h4>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-secondary bg-opacity-10">
                                                <div class="card-body text-center">
                                                    <h6 class="card-title">Canceladas</h6>
                                                    <h4 class="text-secondary">${solicitudes.filter(s => s.estado === 'CANCELADO').length}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cerrar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="empleadoSystem.mostrarSolicitudPermiso()">
                                <i class="fas fa-plus me-1"></i>Nueva Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const modalExistente = document.getElementById('modalMisSolicitudes');
        if (modalExistente) {
            modalExistente.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalMisSolicitudes'));
        modal.show();
    }

    mostrarPerfilEmpleado() {
        this.showAlert('Función en desarrollo: Mi perfil', 'info');
    }

    async editarSolicitud(solicitudId) {
        try {
            console.log('✏️ Editando solicitud ID:', solicitudId);
            
            // Validar token antes de hacer la petición
            if (!this.isTokenValid()) {
                console.log('❌ Token no válido para editar solicitud');
                showAlert('No hay token disponible. Por favor, vuelve a iniciar sesión.', 'danger');
                return;
            }
            
            // Obtener datos de la solicitud
            const response = await fetch('/api/solicitudes-empleado/historial', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error obteniendo datos de la solicitud');
            }
            
            const data = await response.json();
            const solicitud = data.solicitudes.find(s => s.id === solicitudId);
            
            if (!solicitud) {
                throw new Error('Solicitud no encontrada');
            }
            
            if (solicitud.estado !== 'PENDIENTE') {
                this.showAlert('Solo se pueden editar solicitudes pendientes', 'warning');
                return;
            }
            
            // Cerrar modal actual
            const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalMisSolicitudes'));
            if (modalActual) {
                modalActual.hide();
            }
            
            // Obtener tipos de permisos
            const tiposResponse = await fetch('/api/solicitudes-empleado/tipos-permisos', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!tiposResponse.ok) {
                throw new Error('Error obteniendo tipos de permisos');
            }
            
            const tipos = await tiposResponse.json();
            
            // Crear modal de edición
            this.crearModalEdicion(solicitud, tipos);
            
        } catch (error) {
            console.error('❌ Error editando solicitud:', error);
            this.showAlert(error.message || 'Error al editar la solicitud', 'error');
        }
    }
    
    crearModalEdicion(solicitud, tipos) {
        // Crear opciones de tipos de permisos
        const opcionesTipos = tipos.map(tipo => 
            `<option value="${tipo.id}" ${tipo.id === solicitud.tipo_permiso_id ? 'selected' : ''}>
                ${tipo.nombre} (${tipo.codigo})
            </option>`
        ).join('');
        
        // HTML del modal de edición
        const modalHTML = `
            <div class="modal fade" id="modalEditarSolicitud" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>Editar Solicitud #${solicitud.id}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarSolicitud">
                                <input type="hidden" id="solicitudId" value="${solicitud.id}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Tipo de Permiso *</label>
                                        <select class="form-select" id="tipoPermisoEdit" required>
                                            <option value="">Seleccionar tipo...</option>
                                            ${opcionesTipos}
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Fecha *</label>
                                        <input type="date" class="form-control" id="fechaPermisoEdit" 
                                               value="${solicitud.fecha_desde}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <label class="form-label">Motivo/Justificación *</label>
                                        <textarea class="form-control" id="motivoPermisoEdit" rows="3" 
                                                placeholder="Describe el motivo de tu solicitud..." required>${solicitud.motivo}</textarea>
                                    </div>
                                </div>
                                
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    <strong>Importante:</strong> Al guardar los cambios, la solicitud permanecerá como PENDIENTE 
                                    y deberá ser revisada nuevamente por tu supervisor.
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="empleadoSystem.guardarEdicion()">
                                <i class="fas fa-save me-1"></i>Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const modalExistente = document.getElementById('modalEditarSolicitud');
        if (modalExistente) {
            modalExistente.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar fecha mínima (hoy)
        const fechaInput = document.getElementById('fechaPermisoEdit');
        const today = new Date().toISOString().split('T')[0];
        fechaInput.min = today;
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalEditarSolicitud'));
        modal.show();
    }
    
    async guardarEdicion() {
        try {
            const solicitudId = document.getElementById('solicitudId').value;
            const tipoPermisoId = document.getElementById('tipoPermisoEdit').value;
            const fechaPermiso = document.getElementById('fechaPermisoEdit').value;
            const motivoPermiso = document.getElementById('motivoPermisoEdit').value.trim();
            
            // Validaciones
            if (!tipoPermisoId || !fechaPermiso || !motivoPermiso) {
                this.showAlert('Por favor completa todos los campos requeridos', 'warning');
                return;
            }
            
            if (motivoPermiso.length < 10) {
                this.showAlert('El motivo debe tener al menos 10 caracteres', 'warning');
                return;
            }
            
            // Obtener el código del tipo de permiso seleccionado
            const selectTipo = document.getElementById('tipoPermisoEdit');
            const opcionSeleccionada = selectTipo.options[selectTipo.selectedIndex];
            const tipoPermisoCodigo = opcionSeleccionada.text.match(/\(([^)]+)\)$/)?.[1];
            
            if (!tipoPermisoCodigo) {
                this.showAlert('Error obteniendo el código del tipo de permiso', 'error');
                return;
            }
            
            // Deshabilitar botón y mostrar loading
            const btnGuardar = document.querySelector('#modalEditarSolicitud .btn-primary');
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
            
            console.log('💾 Guardando edición:', { solicitudId, tipoPermisoCodigo, fechaPermiso, motivoPermiso });
            
            // Enviar actualización
            const response = await fetch(`/api/solicitudes-empleado/${solicitudId}/editar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    tipo_permiso: tipoPermisoCodigo,
                    fecha_solicitud: fechaPermiso,
                    motivo: motivoPermiso
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error actualizando solicitud');
            }
            
            console.log('✅ Solicitud actualizada:', data);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarSolicitud'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            this.showAlert('¡Solicitud actualizada exitosamente!', 'success');
            
            // Refrescar lista de solicitudes
            setTimeout(() => {
                this.mostrarMisSolicitudes();
            }, 500);
            
        } catch (error) {
            console.error('❌ Error guardando edición:', error);
            this.showAlert(error.message || 'Error al guardar los cambios', 'error');
            
            // Restaurar botón
            const btnGuardar = document.querySelector('#modalEditarSolicitud .btn-primary');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Cambios';
            }
        }
    }
    
    async eliminarSolicitud(solicitudId) {
        try {
            const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta solicitud?\n\nEsta acción no se puede deshacer.');
            
            if (!confirmacion) {
                return;
            }
            
            console.log('🗑️ Eliminando solicitud ID:', solicitudId);
            
            // Enviar solicitud de eliminación
            const response = await fetch(`/api/solicitudes-empleado/${solicitudId}/eliminar`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error eliminando solicitud');
            }
            
            console.log('✅ Solicitud eliminada:', data);
            
            // Mostrar mensaje de éxito
            this.showAlert('Solicitud eliminada exitosamente', 'success');
            
            // Refrescar lista de solicitudes
            this.mostrarMisSolicitudes();
            
        } catch (error) {
            console.error('❌ Error eliminando solicitud:', error);
            this.showAlert(error.message || 'Error al eliminar la solicitud', 'error');
        }
    }

    cambiarPassword() {
        this.showAlert('Función en desarrollo: Cambiar contraseña', 'info');
    }
}

// Instanciar sistema de empleados
const empleadoSystem = new EmpleadoSystem();

// Función de debug global para verificar el botón
window.debugBotonNuevaSolicitud = function() {
    console.log('🔍 DEBUG: Botón Nueva Solicitud');
    console.log('1. ¿Existe empleadoSystem?', typeof empleadoSystem !== 'undefined' ? '✅' : '❌');
    console.log('2. ¿Tiene función mostrarSolicitudPermiso?', typeof empleadoSystem.mostrarSolicitudPermiso === 'function' ? '✅' : '❌');
    console.log('3. ¿Tiene token?', empleadoSystem.token ? '✅' : '❌');
    
    // Probar función directamente
    if (typeof empleadoSystem.mostrarSolicitudPermiso === 'function') {
        console.log('🧪 Ejecutando función directamente...');
        empleadoSystem.mostrarSolicitudPermiso();
    }
};

console.log('🔧 Sistema EmpleadoSystem cargado. Usa debugBotonNuevaSolicitud() para debug.');