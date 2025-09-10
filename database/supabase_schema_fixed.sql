-- Esquema corregido para Supabase (PostgreSQL)
-- Sistema de Permisos Administrativos con roles de supervisor y autorizador

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas si existen (para recrear)
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS solicitudes_permisos CASCADE;
DROP TABLE IF EXISTS usuarios_admin CASCADE;
DROP TABLE IF EXISTS tipos_permisos CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;

-- Tabla de empleados (con campos del CSV)
CREATE TABLE empleados (
    id BIGSERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    fecha_nacimiento DATE,
    fecha_ingreso DATE,
    fecha_termino DATE,
    horas_semanales DECIMAL(4,1) DEFAULT 0,
    supervisor VARCHAR(255),
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

-- Tabla de usuarios administrativos (sin columna permisos por ahora)
CREATE TABLE usuarios_admin (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(30) DEFAULT 'ADMIN', -- SUPER_ADMIN, ADMIN, SUPERVISOR, AUTORIZADOR
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
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

-- Tabla de solicitudes de permisos
CREATE TABLE solicitudes_permisos (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT NOT NULL,
    tipo_permiso_id BIGINT NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    motivo TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO, CANCELADO
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por BIGINT, -- Referencia a usuarios_admin
    rechazado_motivo TEXT,
    visto_por_supervisor BOOLEAN DEFAULT FALSE, -- Nuevo campo
    fecha_visto_supervisor TIMESTAMPTZ,
    supervisor_comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_permiso_id) REFERENCES tipos_permisos(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios_admin(id)
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT,
    admin_id BIGINT,
    solicitud_id BIGINT, -- Vincular con solicitudes
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ERROR
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES usuarios_admin(id),
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_permisos(id) ON DELETE CASCADE
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
('C', 'Cumpleaños', 'Permiso por cumpleaños', TRUE, FALSE, '#6f42c1');

-- Insertar usuarios administrativos por defecto (sin columna permisos)
INSERT INTO usuarios_admin (username, password_hash, nombre, email, rol) VALUES
-- Super Admin (contraseña: admin123)
('admin', '$2a$10$8RlLKgYOmZkOQWsJEwKTQeMdQp6KoC8LsKb8mUQZLr8GQOnVQeKky', 'Administrador Sistema', 'admin@colegio.cl', 'SUPER_ADMIN'),

-- Supervisor (contraseña: supervisor123) - Solo visualiza, no autoriza
('supervisor', '$2a$10$N9qo8uLiAhGJN0oe.Cp.AeVAi92Fh4GTa9ZMFLJsK2e8T9Fk.2AWC', 'Supervisor General', 'supervisor@colegio.cl', 'SUPERVISOR'),

-- Autorizador (contraseña: autoriza123) - Puede aprobar permisos
('autorizador', '$2a$10$Vk9OgC.E9xIz0zt0vA2jMe8VYNnVi6PD0kq9nRKgFh8fH7.Gj1aOy', 'Director Autorización', 'autoriza@colegio.cl', 'AUTORIZADOR');

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

CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON usuarios_admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_empleados_rut ON empleados(rut);
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_empleados_supervisor ON empleados(supervisor);
CREATE INDEX idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX idx_solicitudes_supervisor_visto ON solicitudes_permisos(visto_por_supervisor);
CREATE INDEX idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_usuarios_admin_rol ON usuarios_admin(rol);

-- Vista para estadísticas de solicitudes
CREATE VIEW vista_estadisticas_solicitudes AS
SELECT 
    e.supervisor,
    COUNT(*) as total_solicitudes,
    COUNT(CASE WHEN sp.estado = 'PENDIENTE' THEN 1 END) as pendientes,
    COUNT(CASE WHEN sp.estado = 'APROBADO' THEN 1 END) as aprobadas,
    COUNT(CASE WHEN sp.estado = 'RECHAZADO' THEN 1 END) as rechazadas,
    COUNT(CASE WHEN sp.visto_por_supervisor = FALSE THEN 1 END) as no_vistas
FROM solicitudes_permisos sp
JOIN empleados e ON sp.empleado_id = e.id
WHERE e.activo = TRUE
GROUP BY e.supervisor;

-- Habilitar Row Level Security (RLS)
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas (permisivas para desarrollo)
CREATE POLICY "Empleados pueden ver sus propios datos" ON empleados
    FOR SELECT USING (TRUE);

CREATE POLICY "Staff administrativo puede ver empleados" ON empleados
    FOR ALL USING (TRUE);

-- Tipos de permisos son públicos
CREATE POLICY "Tipos permisos lectura pública" ON tipos_permisos
    FOR ALL USING (TRUE);

-- Políticas para solicitudes (permisivas para desarrollo)
CREATE POLICY "Todos pueden ver solicitudes" ON solicitudes_permisos
    FOR ALL USING (TRUE);

-- Políticas para usuarios admin
CREATE POLICY "Admin puede ver usuarios" ON usuarios_admin
    FOR ALL USING (TRUE);

-- Políticas para notificaciones
CREATE POLICY "Todos pueden ver notificaciones" ON notificaciones
    FOR ALL USING (TRUE);

-- Comentarios en las tablas
COMMENT ON TABLE empleados IS 'Empleados del colegio con información completa del sistema de RRHH';
COMMENT ON TABLE tipos_permisos IS 'Catálogo de tipos de permisos disponibles';
COMMENT ON TABLE solicitudes_permisos IS 'Solicitudes de permisos con flujo de supervisor y autorizador';
COMMENT ON TABLE usuarios_admin IS 'Usuarios del sistema: Super Admin, Admin, Supervisor, Autorizador';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para el flujo de aprobaciones';

COMMENT ON COLUMN usuarios_admin.rol IS 'SUPER_ADMIN: Control total, ADMIN: Administrador, SUPERVISOR: Solo ve notificaciones, AUTORIZADOR: Aprueba permisos';
COMMENT ON COLUMN solicitudes_permisos.visto_por_supervisor IS 'Marca si el supervisor ya revisó la solicitud';
COMMENT ON COLUMN solicitudes_permisos.estado IS 'PENDIENTE: Nueva, APROBADO: Autorizada, RECHAZADO: Denegada, CANCELADO: Cancelada por empleado';