-- Actualizar esquema de Supabase para coincidir con SQLite
-- Ejecutar esto en el SQL Editor de Supabase

-- Primero eliminar las tablas existentes para recrearlas correctamente
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS solicitudes_permisos CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS tipos_permisos CASCADE;
DROP TABLE IF EXISTS usuarios_admin CASCADE;

-- Tabla de usuarios admin (coincide con SQLite)
CREATE TABLE usuarios_admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(20) DEFAULT 'ADMIN',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de permisos (coincide con SQLite)
CREATE TABLE tipos_permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requiere_autorizacion BOOLEAN DEFAULT true,
    afecta_sueldo BOOLEAN DEFAULT false,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de permisos
INSERT INTO tipos_permisos (codigo, nombre, descripcion, requiere_autorizacion, afecta_sueldo, color_hex) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por jornada completa', true, false, '#dc3545'),
('AM', 'Permiso Primera Media Jornada', 'Permiso primera mitad del día (mañana)', true, false, '#28a745'),
('PM', 'Permiso Segunda Media Jornada', 'Permiso segunda mitad del día (tarde)', true, false, '#ffc107'),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de remuneración', true, true, '#6c757d'),
('BL', 'Beneficio Licencia', 'Beneficio por licencia médica', false, false, '#17a2b8'),
('L', 'Licencia Médica', 'Licencia médica regular', false, false, '#007bff'),
('A', 'Atraso', 'Atraso en llegada', false, false, '#fd7e14'),
('AJ', 'Atraso Justificado', 'Atraso con justificación válida', false, false, '#20c997'),
('NM', 'No Marcación', 'Falta de marcación de entrada/salida', false, false, '#e83e8c'),
('C', 'Cumpleaños', 'Permiso por cumpleaños', true, false, '#6f42c1');

-- Tabla de empleados (coincide con SQLite)
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    cargo VARCHAR(255) NOT NULL,
    negociacion_colectiva BOOLEAN DEFAULT false,
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

    -- Campos adicionales para autenticación de empleados
    email VARCHAR(255),
    telefono VARCHAR(20),
    departamento VARCHAR(200),
    fecha_ingreso DATE,
    supervisor VARCHAR(200),
    password_hash TEXT,
    token_verificacion TEXT,
    email_verificado BOOLEAN DEFAULT false,
    primer_login BOOLEAN DEFAULT true,
    fecha_ultimo_login TIMESTAMP,

    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de solicitudes de permisos (coincide con SQLite)
CREATE TABLE solicitudes_permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    tipo_permiso_id INTEGER NOT NULL REFERENCES tipos_permisos(id),
    fecha_solicitud DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    motivo TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_aprobacion TIMESTAMP,
    aprobado_por INTEGER REFERENCES empleados(id),
    rechazado_motivo TEXT,
    fecha_anulacion TIMESTAMP,
    visto_por_supervisor BOOLEAN DEFAULT false,
    fecha_visto_supervisor TIMESTAMP,
    anulado_por_admin INTEGER REFERENCES usuarios_admin(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones (coincide con SQLite)
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    admin_id INTEGER REFERENCES usuarios_admin(id),
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO',
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_empleados_rut ON empleados(rut);
CREATE INDEX idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX idx_empleados_supervisor ON empleados(supervisor);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- IMPORTANTE: Después de migrar los datos, ejecutar scripts/fix_sequences.sql
-- para resetear las secuencias de IDs y evitar errores de duplicados
