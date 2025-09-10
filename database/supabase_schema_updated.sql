-- Esquema actualizado para Supabase (PostgreSQL)
-- Sistema de Permisos Administrativos con roles de supervisor y autorizador

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de empleados (actualizada con campos adicionales del CSV)
CREATE TABLE IF NOT EXISTS empleados (
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

-- Tabla de usuarios administrativos (actualizada con nuevos roles)
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(30) DEFAULT 'ADMIN', -- SUPER_ADMIN, ADMIN, SUPERVISOR, AUTORIZADOR
    permisos JSONB DEFAULT '{}', -- Permisos específicos por rol
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
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

-- Tabla de solicitudes de permisos (actualizada)
CREATE TABLE IF NOT EXISTS solicitudes_permisos (
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

-- Tabla de notificaciones (mejorada)
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT,
    admin_id BIGINT,
    solicitud_id BIGINT, -- Nuevo campo para vincular con solicitudes
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
('C', 'Cumpleaños', 'Permiso por cumpleaños', TRUE, FALSE, '#6f42c1')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar usuarios administrativos por defecto
INSERT INTO usuarios_admin (username, password_hash, nombre, email, rol, permisos) VALUES
-- Super Admin (contraseña: admin123)
('admin', '$2a$10$8RlLKgYOmZkOQWsJEwKTQeMdQp6KoC8LsKb8mUQZLr8GQOnVQeKky', 'Administrador Sistema', 'admin@colegio.cl', 'SUPER_ADMIN', '{"all": true}'),

-- Supervisor (contraseña: supervisor123) - Solo visualiza, no autoriza
('supervisor', '$2a$10$N9qo8uLiAhGJN0oe.Cp.AeVAi92Fh4GTa9ZMFLJsK2e8T9Fk.2AWC', 'Supervisor General', 'supervisor@colegio.cl', 'SUPERVISOR', '{"view_all": true, "approve": false, "notifications": true}'),

-- Autorizador (contraseña: autoriza123) - Puede aprobar permisos
('autorizador', '$2a$10$Vk9OgC.E9xIz0zt0vA2jMe8VYNnVi6PD0kq9nRKgFh8fH7.Gj1aOy', 'Director Autorización', 'autoriza@colegio.cl', 'AUTORIZADOR', '{"view_all": true, "approve": true, "notifications": true}')
ON CONFLICT (username) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solicitudes_updated_at ON solicitudes_permisos;
CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes_permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_admin_updated_at ON usuarios_admin;
CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON usuarios_admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_rut ON empleados(rut);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_empleados_supervisor ON empleados(supervisor);
CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_supervisor_visto ON solicitudes_permisos(visto_por_supervisor);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_rol ON usuarios_admin(rol);

-- Vista para estadísticas de solicitudes
CREATE OR REPLACE VIEW vista_estadisticas_solicitudes AS
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

-- Políticas de seguridad actualizadas
DROP POLICY IF EXISTS "Empleados pueden ver sus propios datos" ON empleados;
DROP POLICY IF EXISTS "Administradores pueden ver todo empleados" ON empleados;
DROP POLICY IF EXISTS "Supervisores pueden ver empleados" ON empleados;

-- Los empleados solo pueden ver sus propios datos
CREATE POLICY "Empleados pueden ver sus propios datos" ON empleados
    FOR SELECT USING (rut = current_setting('app.current_user_rut', true));

-- Administradores, supervisores y autorizadores pueden ver empleados
CREATE POLICY "Staff administrativo puede ver empleados" ON empleados
    FOR SELECT USING (
        current_setting('app.user_role', true) IN ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'AUTORIZADOR')
    );

-- Tipos de permisos son públicos
DROP POLICY IF EXISTS "Tipos permisos lectura pública" ON tipos_permisos;
CREATE POLICY "Tipos permisos lectura pública" ON tipos_permisos
    FOR SELECT USING (TRUE);

-- Políticas para solicitudes
DROP POLICY IF EXISTS "Empleados ven sus solicitudes" ON solicitudes_permisos;
DROP POLICY IF EXISTS "Administradores ven todas las solicitudes" ON solicitudes_permisos;
DROP POLICY IF EXISTS "Staff puede ver solicitudes" ON solicitudes_permisos;

CREATE POLICY "Empleados ven sus solicitudes" ON solicitudes_permisos
    FOR ALL USING (
        empleado_id IN (
            SELECT id FROM empleados 
            WHERE rut = current_setting('app.current_user_rut', true)
        )
    );

CREATE POLICY "Staff puede ver solicitudes" ON solicitudes_permisos
    FOR SELECT USING (
        current_setting('app.user_role', true) IN ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'AUTORIZADOR')
    );

CREATE POLICY "Solo autorizadores pueden aprobar" ON solicitudes_permisos
    FOR UPDATE USING (
        current_setting('app.user_role', true) IN ('SUPER_ADMIN', 'AUTORIZADOR')
        AND (estado != 'PENDIENTE' OR current_setting('app.user_role', true) = 'SUPER_ADMIN')
    );

-- Comentarios en las tablas
COMMENT ON TABLE empleados IS 'Empleados del colegio con información completa del sistema de RRHH';
COMMENT ON TABLE tipos_permisos IS 'Catálogo de tipos de permisos disponibles';
COMMENT ON TABLE solicitudes_permisos IS 'Solicitudes de permisos con flujo de supervisor y autorizador';
COMMENT ON TABLE usuarios_admin IS 'Usuarios del sistema: Super Admin, Admin, Supervisor, Autorizador';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para el flujo de aprobaciones';

COMMENT ON COLUMN usuarios_admin.rol IS 'SUPER_ADMIN: Control total, ADMIN: Administrador, SUPERVISOR: Solo ve notificaciones, AUTORIZADOR: Aprueba permisos';
COMMENT ON COLUMN solicitudes_permisos.visto_por_supervisor IS 'Marca si el supervisor ya revisó la solicitud';
COMMENT ON COLUMN solicitudes_permisos.estado IS 'PENDIENTE: Nueva, APROBADO: Autorizada, RECHAZADO: Denegada, CANCELADO: Cancelada por empleado';