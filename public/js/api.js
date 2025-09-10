// API Client para el sistema de permisos
class ApiClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('auth_token');
    }

    // Obtener headers por defecto
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Realizar petición HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos HTTP
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Actualizar token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // ===== MÉTODOS DE AUTENTICACIÓN =====
    
    async loginAdmin(username, password) {
        const response = await this.post('auth/login/admin', { username, password });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async loginEmpleado(rut) {
        const response = await this.post('auth/login/empleado', { rut });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async verifyToken() {
        return this.get('auth/verify');
    }

    async changePassword(currentPassword, newPassword) {
        return this.put('auth/change-password', { currentPassword, newPassword });
    }

    async logout() {
        const response = await this.post('auth/logout');
        this.setToken(null);
        return response;
    }

    // ===== MÉTODOS DE EMPLEADOS =====
    
    async getEmpleados(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`empleados?${queryString}`);
    }

    async getEmpleado(id) {
        return this.get(`empleados/${id}`);
    }

    async createEmpleado(empleadoData) {
        return this.post('empleados', empleadoData);
    }

    async updateEmpleado(id, empleadoData) {
        return this.put(`empleados/${id}`, empleadoData);
    }

    async deleteEmpleado(id) {
        return this.delete(`empleados/${id}`);
    }

    async getCargos() {
        return this.get('empleados/data/cargos');
    }

    async getEstadisticasEmpleados() {
        return this.get('empleados/data/estadisticas');
    }

    async getEmpleadosConPermisos() {
        return this.get('empleados/con-permisos');
    }

    async getEmpleadoPermisos(empleadoId) {
        return this.get(`empleados/${empleadoId}/permisos`);
    }

    // ===== MÉTODOS DE PERMISOS =====
    
    async getTiposPermisos() {
        return this.get('permisos/tipos');
    }

    async getSolicitudesPermisos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`permisos?${queryString}`);
    }

    async getSolicitudPermiso(id) {
        return this.get(`permisos/${id}`);
    }

    async createSolicitudPermiso(solicitudData) {
        return this.post('permisos', solicitudData);
    }

    async updateEstadoSolicitud(id, estado, motivoRechazo = null) {
        return this.put(`permisos/${id}/estado`, { estado, motivo_rechazo: motivoRechazo });
    }

    async deleteSolicitudPermiso(id) {
        return this.delete(`permisos/${id}`);
    }

    async getEstadisticasPermisos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`permisos/data/estadisticas?${queryString}`);
    }

    // ===== MÉTODOS DE DASHBOARD =====
    
    async getDashboardAdmin() {
        return this.get('dashboard/admin');
    }

    async getDashboardEmpleado() {
        return this.get('dashboard/empleado');
    }

    async getNotificaciones(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`dashboard/notificaciones?${queryString}`);
    }

    async markNotificationAsRead(id) {
        return this.put(`dashboard/notificaciones/${id}/leida`);
    }

    async getReportePermisos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`dashboard/reportes/permisos?${queryString}`);
    }

    // ===== MÉTODOS AUXILIARES =====

    // Subir archivo (si se implementa)
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al subir archivo');
        }

        return response.json();
    }

    // Descargar archivo
    async downloadFile(endpoint, filename) {
        const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al descargar archivo');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Crear instancia global del API client
const api = new ApiClient();

// Interceptor para manejar errores de autenticación
const originalRequest = api.request;
api.request = async function(endpoint, options = {}) {
    try {
        return await originalRequest.call(this, endpoint, options);
    } catch (error) {
        // Si es error 401 (no autorizado), redirigir al login
        if (error.message.includes('401') || error.message.includes('Token inválido') || error.message.includes('Token de acceso requerido')) {
            console.warn('Token expirado o inválido, redirigiendo al login...');
            
            this.setToken(null);
            
            // Verificar si las funciones globales existen antes de llamarlas
            if (typeof window.AppState !== 'undefined') {
                window.AppState.user = null;
            }
            
            if (typeof showAlert === 'function') {
                showAlert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
            }
            
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
            
            if (typeof hideMainInterface === 'function') {
                hideMainInterface();
            }
        }
        
        throw error;
    }
};

// Exportar para uso global
window.api = api;