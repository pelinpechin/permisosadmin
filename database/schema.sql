-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    cargo VARCHAR(255) NOT NULL,
    negociacion_colectiva BOOLEAN DEFAULT 0,
    visualizacion VARCHAR(255),
    autorizacion VARCHAR(255),
    permisos_primer_semestre INTEGER DEFAULT 3,
    permisos_segundo_semestre INTEGER DEFAULT 3,
    uso_primer_semestre DECIMAL(3,1) DEFAULT 0,
    uso_segundo_semestre DECIMAL(3,1) DEFAULT 0,
    sin_goce INTEGER DEFAULT 0,
    beneficio_licencia INTEGER DEFAULT 0,
    licencias_total INTEGER DEFAULT 0,
    atrasos INTEGER DEFAULT 0,
    atrasos_justificados INTEGER DEFAULT 0,
    no_marcaciones INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de permisos
CREATE TABLE IF NOT EXISTS tipos_permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requiere_autorizacion BOOLEAN DEFAULT 1,
    afecta_sueldo BOOLEAN DEFAULT 0,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de permisos basados en el CSV
INSERT OR IGNORE INTO tipos_permisos (codigo, nombre, descripcion, requiere_autorizacion, afecta_sueldo, color_hex) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por jornada completa', 1, 0, '#dc3545'),
('AM', 'Permiso Primera Media Jornada', 'Permiso primera mitad del día (mañana)', 1, 0, '#28a745'),
('PM', 'Permiso Segunda Media Jornada', 'Permiso segunda mitad del día (tarde)', 1, 0, '#ffc107'),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de remuneración', 1, 1, '#6c757d'),
('BL', 'Beneficio Licencia', 'Beneficio por licencia médica', 0, 0, '#17a2b8'),
('L', 'Licencia Médica', 'Licencia médica regular', 0, 0, '#007bff'),
('A', 'Atraso', 'Atraso en llegada', 0, 0, '#fd7e14'),
('AJ', 'Atraso Justificado', 'Atraso con justificación válida', 0, 0, '#20c997'),
('NM', 'No Marcación', 'Falta de marcación de entrada/salida', 0, 0, '#e83e8c'),
('C', 'Cumpleaños', 'Permiso por cumpleaños', 1, 0, '#6f42c1');

-- Tabla de solicitudes de permisos
CREATE TABLE IF NOT EXISTS solicitudes_permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    tipo_permiso_id INTEGER NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    motivo TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_aprobacion DATETIME,
    aprobado_por INTEGER,
    rechazado_motivo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (tipo_permiso_id) REFERENCES tipos_permisos(id),
    FOREIGN KEY (aprobado_por) REFERENCES empleados(id)
);

-- Tabla de administradores del sistema
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(20) DEFAULT 'ADMIN',
    activo BOOLEAN DEFAULT 1,
    ultimo_acceso DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER,
    admin_id INTEGER,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO',
    leida BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
    FOREIGN KEY (admin_id) REFERENCES usuarios_admin(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_rut ON empleados(rut);
CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);