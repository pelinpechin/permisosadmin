-- Esquema para Supabase (PostgreSQL)
-- Sistema de Permisos Administrativos

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
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
CREATE TABLE IF NOT EXISTS tipos_permisos (
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

-- Insertar tipos de permisos
INSERT INTO tipos_permisos (codigo, nombre, descripcion, requiere_autorizacion, afecta_sueldo, color_hex) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por jornada completa', TRUE, FALSE, '#dc3545'),
('AM', 'Permiso Primera Media Jornada', 'Permiso primera mitad del día (mañana)', TRUE, FALSE, '#28a745'),
('PM', 'Permiso Segunda Media Jornada', 'Permiso segunda mitad del día (tarde)', TRUE, FALSE, '#ffc107'),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de remuneración', TRUE, TRUE, '#6c757d'),
('BL', 'Beneficio Licencia', 'Beneficio por licencia médica', FALSE, FALSE, '#17a2b8'),
('L', 'Licencia Médica', 'Licencia médica regular', FALSE, FALSE, '#007bff'),
('A', 'Atraso', 'Atraso en llegada', FALSE, FALSE, '#fd7e14'),
('AJ', 'Atraso Justificado', 'Atraso con justificación válida', FALSE, FALSE, '#20c997'),
('NM', 'No Marcación', 'Falta de marcación de entrada/salida', FALSE, FALSE, '#e83e8c'),
('C', 'Cumpleaños', 'Permiso por cumpleaños', TRUE, FALSE, '#6f42c1')
ON CONFLICT (codigo) DO NOTHING;

-- Tabla de administradores del sistema (crear antes que solicitudes_permisos)
CREATE TABLE IF NOT EXISTS usuarios_admin (
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

-- Insertar usuario admin por defecto
INSERT INTO usuarios_admin (username, password_hash, nombre, email, rol) VALUES
('admin', '$2a$10$8RlLKgYOmZkOQWsJEwKTQeMdQp6KoC8LsKb8mUQZLr8GQOnVQeKky', 'Administrador Sistema', 'admin@empresa.cl', 'SUPER_ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Tabla de solicitudes de permisos (crear después de usuarios_admin)
CREATE TABLE IF NOT EXISTS solicitudes_permisos (
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_permiso_id) REFERENCES tipos_permisos(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios_admin(id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT,
    admin_id BIGINT,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO',
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES usuarios_admin(id)
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes_permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_rut ON empleados(rut);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- Políticas de Row Level Security (RLS)
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades de seguridad)
-- Los empleados solo pueden ver sus propios datos
CREATE POLICY "Empleados pueden ver sus propios datos" ON empleados
    FOR SELECT USING (rut = current_setting('app.current_user_rut', true));

-- Los administradores pueden ver todo
CREATE POLICY "Administradores pueden ver todo empleados" ON empleados
    FOR ALL USING (current_setting('app.user_role', true) = 'ADMIN');

-- Tipos de permisos son públicos (solo lectura para empleados)
CREATE POLICY "Tipos permisos lectura pública" ON tipos_permisos
    FOR SELECT USING (TRUE);

-- Solicitudes: empleados ven las suyas, admins ven todas
CREATE POLICY "Empleados ven sus solicitudes" ON solicitudes_permisos
    FOR ALL USING (
        empleado_id IN (
            SELECT id FROM empleados 
            WHERE rut = current_setting('app.current_user_rut', true)
        )
    );

CREATE POLICY "Administradores ven todas las solicitudes" ON solicitudes_permisos
    FOR ALL USING (current_setting('app.user_role', true) = 'ADMIN');

-- Comentarios en las tablas
COMMENT ON TABLE empleados IS 'Tabla de empleados del sistema';
COMMENT ON TABLE tipos_permisos IS 'Catálogo de tipos de permisos disponibles';
COMMENT ON TABLE solicitudes_permisos IS 'Solicitudes de permisos realizadas por empleados';
COMMENT ON TABLE usuarios_admin IS 'Usuarios administradores del sistema';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones internas';