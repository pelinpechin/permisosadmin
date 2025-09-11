-- ============================================
-- NUEVA BASE DE DATOS PARA SISTEMA DE PERMISOS
-- ============================================

-- 1. TABLA DE TIPOS DE PERMISOS
CREATE TABLE tipos_permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE, -- T, AM, PM, S
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    dias_permitidos_anio INTEGER DEFAULT 0, -- días permitidos por año
    es_con_goce BOOLEAN DEFAULT true, -- true = con goce, false = sin goce
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE EMPLEADOS
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    supervisor_id INTEGER REFERENCES empleados(id), -- FK a otro empleado
    es_supervisor BOOLEAN DEFAULT false,
    es_admin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE USUARIOS/CREDENCIALES
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    ultimo_login TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE SOLICITUDES DE PERMISOS
CREATE TABLE solicitudes_permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    tipo_permiso_id INTEGER NOT NULL REFERENCES tipos_permisos(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    motivo TEXT NOT NULL,
    observaciones TEXT,
    
    -- Estados: PENDIENTE, APROBADO, RECHAZADO
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    
    -- Aprobación por supervisor
    aprobado_por_supervisor_id INTEGER REFERENCES empleados(id),
    fecha_aprobacion_supervisor TIMESTAMP WITH TIME ZONE,
    comentario_supervisor TEXT,
    
    -- Rechazo
    rechazado_por_id INTEGER REFERENCES empleados(id),
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERTAR TIPOS DE PERMISOS BÁSICOS
INSERT INTO tipos_permisos (codigo, nombre, descripcion, color_hex, dias_permitidos_anio, es_con_goce) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por día completo con goce de sueldo', '#28a745', 15, true),
('AM', 'Permiso Primera Media Jornada', 'Permiso de medio día en la mañana', '#ffc107', 30, true),
('PM', 'Permiso Segunda Media Jornada', 'Permiso de medio día en la tarde', '#fd7e14', 30, true),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de sueldo', '#6c757d', 0, false);

-- 6. INSERTAR TODOS LOS EMPLEADOS DEL PROYECTO
INSERT INTO empleados (rut, nombre, cargo, es_supervisor, es_admin) VALUES
-- SUPERVISORES Y ADMINISTRADORES
('11111111-1', 'Ronny Cisterna', 'Gerente General', true, true),
('22222222-2', 'Patricio Bravo', 'Jefe de RRHH', true, true),
('12345678-9', 'Andrea Naguelquin', 'Supervisora', true, false),

-- EMPLEADOS REGULARES
('98765432-1', 'Francisco Mancilla Vargas', 'Empleado', false, false),
('87654321-2', 'Miguel González López', 'Empleado', false, false),
('76543210-3', 'Carmen Silva Rojas', 'Secretaria', false, false),
('65432109-4', 'Pedro Hernández Muñoz', 'Técnico', false, false),
('54321098-5', 'Ana Martínez Torres', 'Contadora', false, false),
('43210987-6', 'Luis Morales Vega', 'Operario', false, false),
('32109876-7', 'Elena Vargas Soto', 'Asistente', false, false),
('21098765-8', 'Diego Fuentes Ramos', 'Chofer', false, false),
('10987654-9', 'Patricia Núñez Contreras', 'Recepcionista', false, false),
('09876543-0', 'Ricardo Peña Sandoval', 'Guardia', false, false),
('19876543-1', 'Mónica Castillo Díaz', 'Supervisora Turno', true, false),
('29876543-2', 'Javier Espinoza Herrera', 'Jefe de Mantención', true, false),
('39876543-3', 'Claudia Moreno Pizarro', 'Coordinadora', true, false),
('49876543-4', 'Sergio Aguirre Mendoza', 'Operario Senior', false, false),
('59876543-5', 'Francisca Delgado Ruiz', 'Analista', false, false);

-- 7. ESTABLECER RELACIONES SUPERVISOR-SUBORDINADO
-- Andrea Naguelquin supervisa a Francisco Mancilla
UPDATE empleados SET supervisor_id = 3 WHERE nombre LIKE '%Francisco Mancilla%';

-- Ronny Cisterna supervisa a Miguel González
UPDATE empleados SET supervisor_id = 1 WHERE nombre LIKE '%Miguel González%';

-- Mónica Castillo supervisa a algunos empleados
UPDATE empleados SET supervisor_id = 11 WHERE nombre IN ('Carmen Silva Rojas', 'Ana Martínez Torres', 'Elena Vargas Soto');

-- Javier Espinoza supervisa a técnicos y operarios
UPDATE empleados SET supervisor_id = 12 WHERE nombre IN ('Pedro Hernández Muñoz', 'Luis Morales Vega', 'Sergio Aguirre Mendoza');

-- Claudia Moreno supervisa a personal administrativo
UPDATE empleados SET supervisor_id = 13 WHERE nombre IN ('Patricia Núñez Contreras', 'Francisca Delgado Ruiz');

-- 8. CREAR USUARIOS PARA TODOS LOS EMPLEADOS
INSERT INTO usuarios (empleado_id, username, password_hash) VALUES
(1, 'ronny.cisterna', '$2b$10$placeholder1'),
(2, 'patricio.bravo', '$2b$10$placeholder2'), 
(3, 'andrea.naguelquin', '$2b$10$placeholder3'),
(4, 'francisco.mancilla', '$2b$10$placeholder4'),
(5, 'miguel.gonzalez', '$2b$10$placeholder5'),
(6, 'carmen.silva', '$2b$10$placeholder6'),
(7, 'pedro.hernandez', '$2b$10$placeholder7'),
(8, 'ana.martinez', '$2b$10$placeholder8'),
(9, 'luis.morales', '$2b$10$placeholder9'),
(10, 'elena.vargas', '$2b$10$placeholder10'),
(11, 'diego.fuentes', '$2b$10$placeholder11'),
(12, 'patricia.nunez', '$2b$10$placeholder12'),
(13, 'ricardo.pena', '$2b$10$placeholder13'),
(14, 'monica.castillo', '$2b$10$placeholder14'),
(15, 'javier.espinoza', '$2b$10$placeholder15'),
(16, 'claudia.moreno', '$2b$10$placeholder16'),
(17, 'sergio.aguirre', '$2b$10$placeholder17'),
(18, 'francisca.delgado', '$2b$10$placeholder18');

-- 9. INSERTAR SOLICITUD DE PRUEBA
INSERT INTO solicitudes_permisos (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado) VALUES
(2, 1, '2025-01-20', '2025-01-20', 'Cita médica familiar', 'PENDIENTE');

-- 10. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX idx_empleados_supervisor ON empleados(supervisor_id);
CREATE INDEX idx_empleados_rut ON empleados(rut);

-- 11. FUNCIÓN PARA ACTUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. TRIGGERS PARA AUTO-UPDATE DE TIMESTAMPS
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON solicitudes_permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_permisos_updated_at BEFORE UPDATE ON tipos_permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. CONFIGURAR ROW LEVEL SECURITY (RLS)
ALTER TABLE solicitudes_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los empleados pueden ver sus propias solicitudes y las de sus subordinados
CREATE POLICY "Empleados pueden ver sus solicitudes" ON solicitudes_permisos
    FOR SELECT USING (
        empleado_id = current_setting('app.current_user_id')::INTEGER OR
        empleado_id IN (
            SELECT id FROM empleados 
            WHERE supervisor_id = current_setting('app.current_user_id')::INTEGER
        )
    );

-- Política: Los empleados pueden crear sus propias solicitudes
CREATE POLICY "Empleados pueden crear solicitudes" ON solicitudes_permisos
    FOR INSERT WITH CHECK (empleado_id = current_setting('app.current_user_id')::INTEGER);

-- Política: Solo supervisores pueden aprobar/rechazar
CREATE POLICY "Supervisores pueden aprobar" ON solicitudes_permisos
    FOR UPDATE USING (
        empleado_id IN (
            SELECT id FROM empleados 
            WHERE supervisor_id = current_setting('app.current_user_id')::INTEGER
        ) OR
        current_setting('app.user_is_admin')::BOOLEAN = true
    );

-- ============================================
-- COMENTARIOS FINALES
-- ============================================

/* 
ESQUEMA LIMPIO Y FUNCIONAL:

1. TIPOS DE PERMISOS: T, AM, PM, S con colores y configuraciones
2. EMPLEADOS: Con jerarquía supervisor-subordinado clara
3. USUARIOS: Credenciales separadas para auth
4. SOLICITUDES: Estados simples PENDIENTE/APROBADO/RECHAZADO
5. ÍNDICES: Para rendimiento óptimo
6. RLS: Seguridad a nivel de fila
7. TRIGGERS: Timestamps automáticos

DATOS DE PRUEBA INCLUIDOS:
- Andrea Naguelquin (Supervisora)
- Francisco Mancilla (Subordinado de Andrea)
- Ronny Cisterna (Admin)
- Patricio Bravo (Admin)
- 1 Solicitud pendiente de Francisco

PRÓXIMO PASO: 
1. Crear nuevo proyecto en Supabase
2. Ejecutar este SQL en el editor SQL
3. Actualizar las credenciales en el código
*/