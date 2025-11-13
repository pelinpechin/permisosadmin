// Utilidades generales para la aplicación

// Mostrar alertas
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-dismiss después del tiempo especificado
    if (duration > 0) {
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, duration);
    }
}

// Obtener icono para el tipo de alerta
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'primary': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Formatear fechas
function formatDate(dateString, options = {}) {
    if (!dateString) return '-';

    try {
        // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-');

        // Si no tiene formato válido, devolver el string original
        if (!year || !month || !day) {
            return dateString;
        }

        // Formatear manualmente como DD/MM/YYYY (formato chileno)
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return dateString;
    }
}

// Formatear fecha y hora
function formatDateTime(dateString) {
    if (!dateString) return '-';

    try {
        // Extraer fecha y hora del formato ISO
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');

        if (!timePart) {
            // Si no hay hora, solo devolver la fecha
            return `${day}/${month}/${year}`;
        }

        // Extraer hora y minuto
        const [hour, minute] = timePart.split(':');
        return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (error) {
        console.error('Error formateando fecha y hora:', error);
        return formatDate(dateString);
    }
}

// Formatear números como moneda
function formatCurrency(amount, currency = 'CLP') {
    if (amount === null || amount === undefined) return '-';
    
    try {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    } catch (error) {
        console.error('Error formateando moneda:', error);
        return `$${amount}`;
    }
}

// Formatear números
function formatNumber(number, options = {}) {
    if (number === null || number === undefined) return '-';
    
    try {
        return new Intl.NumberFormat('es-CL', options).format(number);
    } catch (error) {
        console.error('Error formateando número:', error);
        return number.toString();
    }
}

// Validar RUT chileno
function validateRUT(rut) {
    if (!rut || typeof rut !== 'string') return false;
    
    // Limpiar RUT
    const cleanRut = rut.replace(/[\.\-\s]/g, '').toUpperCase();
    
    // Validar formato
    if (!/^[0-9]{7,8}[0-9K]$/.test(cleanRut)) return false;
    
    // Separar número y dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const rutDV = cleanRut.slice(-1);
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutNumber.length - 1; i >= 0; i--) {
        sum += parseInt(rutNumber[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
    
    return rutDV === calculatedDV;
}

// Formatear RUT
function formatRUT(rut) {
    if (!rut) return '';
    
    const cleanRut = rut.replace(/[\.\-\s]/g, '');
    
    if (cleanRut.length >= 2) {
        const rutNumber = cleanRut.slice(0, -1);
        const rutDV = cleanRut.slice(-1);
        
        // Formatear con puntos
        const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        return `${formattedNumber}-${rutDV}`;
    }
    
    return cleanRut;
}

// Debounce para optimizar búsquedas
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle para optimizar eventos
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Capitalizar texto
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generar ID único
function generateUniqueId(prefix = '') {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

// Validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Obtener badge HTML para estado
function getStatusBadge(status) {
    const badges = {
        'PENDIENTE': '<span class="badge badge-pendiente">Pendiente</span>',
        'APROBADO': '<span class="badge badge-aprobado">Aprobado</span>',
        'RECHAZADO': '<span class="badge badge-rechazado">Rechazado</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Obtener badge HTML para tipo de permiso
function getTipoPermisoBadge(codigo, nombre, color) {
    return `<span class="badge badge-permiso" style="background-color: ${color};">
        <strong>${codigo}</strong> ${nombre}
    </span>`;
}

// Copiar texto al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Copiado al portapapeles', 'success', 2000);
    } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        showAlert('Error al copiar al portapapeles', 'danger');
    }
}

// Descargar archivo
function downloadFile(data, filename, mimeType = 'application/octet-stream') {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Exportar datos como CSV
function exportToCSV(data, filename) {
    if (!data || !data.length) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header] || '';
            // Escapar comas y comillas en CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
        }).join(','))
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv');
}

// Exportar datos como JSON
function exportToJSON(data, filename) {
    if (!data) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }
    
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
}

// Loader para elementos específicos
function showElementLoader(element, show = true) {
    if (!element) {
        console.error('showElementLoader: element is null or undefined');
        return;
    }
    
    if (show) {
        element.classList.add('loading');
        const loader = element.querySelector('.element-loader');
        if (!loader) {
            const loaderHTML = `
                <div class="element-loader position-absolute top-50 start-50 translate-middle">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            `;
            element.style.position = 'relative';
            element.insertAdjacentHTML('beforeend', loaderHTML);
        }
    } else {
        element.classList.remove('loading');
        const loader = element.querySelector('.element-loader');
        if (loader) {
            loader.remove();
        }
    }
}

// Crear skeleton loader
function createSkeletonLoader(lines = 3) {
    const skeletonHTML = Array.from({ length: lines }, (_, i) => 
        `<div class="skeleton" style="height: 1rem; margin-bottom: 0.5rem; width: ${Math.random() * 40 + 60}%;"></div>`
    ).join('');
    
    return `<div class="skeleton-loader">${skeletonHTML}</div>`;
}

// Manejo de errores de API
function handleApiError(error, defaultMessage = 'Error en la operación') {
    console.error('API Error:', error);
    
    if (error.response) {
        // Error de respuesta del servidor
        if (error.response.status === 401) {
            showAlert('Sesión expirada. Por favor, inicia sesión nuevamente.', 'warning');
            logout();
            return;
        }
        
        if (error.response.data && error.response.data.message) {
            showAlert(error.response.data.message, 'danger');
        } else {
            showAlert(`Error ${error.response.status}: ${defaultMessage}`, 'danger');
        }
    } else if (error.request) {
        // Error de red
        showAlert('Error de conexión. Verifica tu conexión a internet.', 'danger');
    } else {
        // Error general
        showAlert(error.message || defaultMessage, 'danger');
    }
}

// Validación de formularios
function validateForm(formElement) {
    const errors = [];
    const requiredFields = formElement.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            errors.push(`El campo ${field.labels?.[0]?.textContent || field.name || 'requerido'} es obligatorio`);
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
        
        // Validaciones específicas
        if (field.type === 'email' && field.value && !validateEmail(field.value)) {
            errors.push('Formato de email inválido');
            field.classList.add('is-invalid');
        }
        
        if (field.dataset.rut === 'true' && field.value && !validateRUT(field.value)) {
            errors.push('Formato de RUT inválido');
            field.classList.add('is-invalid');
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Scroll suave a elemento
function scrollToElement(element, offset = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
}

// Detectar si está en modo móvil
function isMobile() {
    return window.innerWidth < 768;
}

// Generar colores aleatorios para gráficos
function generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Truncar texto
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Obtener diferencia en días entre fechas
function getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    return Math.round((secondDate - firstDate) / oneDay);
}

// Verificar si una fecha es hoy
function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
}

// Verificar si una fecha es fin de semana
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

// Formatear duración en texto legible
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    } else {
        const days = Math.floor(minutes / 1440);
        const remainingHours = Math.floor((minutes % 1440) / 60);
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
}

// Detectar tema del sistema
function getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Aplicar tema
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('preferred-theme', theme);
}

// Inicializar tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('preferred-theme');
    const preferredTheme = savedTheme || getPreferredTheme();
    applyTheme(preferredTheme);
}

// Llamar la inicialización del tema cuando se carga el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}