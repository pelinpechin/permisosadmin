-- PASO 1: Tabla empleados
CREATE TABLE empleados (
    id BIGSERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rut TEXT UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    cargo TEXT NOT NULL,
    negociacion_colectiva BOOLEAN DEFAULT FALSE,
    visualizacion TEXT,
    autorizacion TEXT,
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