-- Esquema limpio para Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de empleados
CREATE TABLE empleados (
    id BIGSERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    cargo VARCHAR(255) NOT NULL,
    negociacion_colectiva BOOLEAN DEFAULT FALSE,
    visualizacion VARCHAR(255),
    autorizacion VARCHAR(255),
    uso_primer_semestre DECIMAL(3,1) DEFAULT 0,
    uso_segundo_semestre DECIMAL(3,1) DEFAULT 0,
    sin_goce INTEGER DEFAULT 0,
    beneficio_licencia INTEGER DEFAULT 0,
    licencias_total INTEGER DEFAULT 0,
    atrasos INTEGER DEFAULT 0,
    atrasos_justificados INTEGER DEFAULT 0,
    no_marcaciones INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tipos de permisos
CREATE TABLE tipos_permisos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requiere_autorizacion BOOLEAN DEFAULT TRUE,
    afecta_sueldo BOOLEAN DEFAULT FALSE,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de administradores
CREATE TABLE usuarios_admin (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(20) DEFAULT 'ADMIN',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes
CREATE TABLE solicitudes_permisos (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT NOT NULL,
    tipo_permiso_id BIGINT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    motivo TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por BIGINT,
    rechazado_motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT,
    admin_id BIGINT,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO',
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de permisos
INSERT INTO tipos_permisos (codigo, nombre, descripcion, requiere_autorizacion, afecta_sueldo, color_hex) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por jornada completa', TRUE, FALSE, '#dc3545'),
('AM', 'Permiso Primera Media Jornada', 'Permiso primera mitad del día', TRUE, FALSE, '#28a745'),
('PM', 'Permiso Segunda Media Jornada', 'Permiso segunda mitad del día', TRUE, FALSE, '#ffc107'),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de remuneración', TRUE, TRUE, '#6c757d'),
('BL', 'Beneficio Licencia', 'Beneficio por licencia médica', FALSE, FALSE, '#17a2b8'),
('L', 'Licencia Médica', 'Licencia médica regular', FALSE, FALSE, '#007bff'),
('A', 'Atraso', 'Atraso en llegada', FALSE, FALSE, '#fd7e14'),
('AJ', 'Atraso Justificado', 'Atraso con justificación válida', FALSE, FALSE, '#20c997'),
('NM', 'No Marcación', 'Falta de marcación de entrada/salida', FALSE, FALSE, '#e83e8c'),
('C', 'Cumpleaños', 'Permiso por cumpleaños', TRUE, FALSE, '#6f42c1');

-- Insertar usuario admin
INSERT INTO usuarios_admin (username, password_hash, nombre, email, rol) VALUES
('admin', '$2a$10$8RlLKgYOmZkOQWsJEwKTQeMdQp6KoC8LsKb8mUQZLr8GQOnVQeKky', 'Administrador Sistema', 'admin@empresa.cl', 'SUPER_ADMIN');

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes_permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_empleados_rut ON empleados(rut);
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX idx_notificaciones_empleado ON notificaciones(empleado_id);