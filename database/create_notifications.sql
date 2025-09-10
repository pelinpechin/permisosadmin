-- Tabla de notificaciones para empleados
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'NUEVA_SOLICITUD', 'SOLICITUD_APROBACION', 'SOLICITUD_RECHAZADA', etc.
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones para administradores
CREATE TABLE IF NOT EXISTS notificaciones_admin (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES usuarios_admin(id) ON DELETE CASCADE,
    solicitud_id INTEGER REFERENCES solicitudes_permisos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'NUEVA_SOLICITUD', 'SOLICITUD_APROBACION', etc.
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin ON notificaciones_admin(admin_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_admin_solicitud ON notificaciones_admin(solicitud_id);

-- RLS (Row Level Security) para notificaciones de empleados
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política: Empleados solo ven sus propias notificaciones
CREATE POLICY notificaciones_empleado_policy ON notificaciones
    FOR ALL USING (empleado_id = current_setting('app.current_user_id')::integer);

-- RLS para notificaciones de administradores
ALTER TABLE notificaciones_admin ENABLE ROW LEVEL SECURITY;

-- Política: Administradores ven todas las notificaciones (por rol)
CREATE POLICY notificaciones_admin_policy ON notificaciones_admin
    FOR ALL USING (true); -- Ajustar según lógica de roles