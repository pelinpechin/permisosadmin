-- Tabla para solicitudes de permisos
CREATE TABLE IF NOT EXISTS solicitudes_permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    tipo_permiso VARCHAR(10) NOT NULL, -- 'T', 'AM', 'PM', 'C', 'S'
    fecha_solicitud DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    motivo TEXT NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO'
    aprobado_por INTEGER REFERENCES usuarios_admin(id),
    fecha_aprobacion TIMESTAMP,
    comentarios_aprobacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    usuario_admin_id INTEGER REFERENCES usuarios_admin(id),
    tipo VARCHAR(50) NOT NULL, -- 'SOLICITUD_PERMISO', 'PERMISO_APROBADO', 'PERMISO_RECHAZADO'
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para tracking detallado de permisos por fecha
CREATE TABLE IF NOT EXISTS permisos_detalle (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    fecha DATE NOT NULL,
    tipo_permiso VARCHAR(10) NOT NULL, -- 'T', 'AM', 'PM', 'C', 'S', 'L', 'NM'
    descripcion VARCHAR(100),
    solicitud_id INTEGER REFERENCES solicitudes_permisos(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, fecha, tipo_permiso)
);

-- Tabla para tipos de permisos disponibles
CREATE TABLE IF NOT EXISTS tipos_permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de permisos básicos
INSERT INTO tipos_permisos (codigo, nombre, descripcion, color_hex) VALUES 
('T', 'Jornada Completa', 'Permiso administrativo por jornada completa', '#dc3545'),
('AM', 'Media Jornada Mañana', 'Permiso administrativo por media jornada en la mañana', '#fd7e14'),
('PM', 'Media Jornada Tarde', 'Permiso administrativo por media jornada en la tarde', '#6f42c1'),
('C', 'Cumpleaños', 'Permiso por cumpleaños', '#20c997'),
('S', 'Sin Goce', 'Permiso sin goce de sueldo', '#6c757d'),
('L', 'Licencia', 'Licencia médica u otro tipo', '#0dcaf0'),
('NM', 'No Marcación', 'Día sin marcación de entrada/salida', '#ffc107')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    color_hex = EXCLUDED.color_hex;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_permisos(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX IF NOT EXISTS idx_permisos_detalle_empleado_fecha ON permisos_detalle(empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin ON notificaciones(usuario_admin_id);