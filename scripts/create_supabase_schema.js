require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function crearEsquema() {
    console.log('🚀 Creando esquema en Supabase...\n');

    try {
        // SQL para crear todas las tablas
        const sql = `
-- Tabla de usuarios admin
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion TIMESTAMP
);

-- Tabla de tipos de permisos
CREATE TABLE IF NOT EXISTS tipos_permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    dias_por_año DECIMAL(10, 2) DEFAULT 0,
    acumulable BOOLEAN DEFAULT false,
    requiere_aprobacion BOOLEAN DEFAULT true,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cargo VARCHAR(200),
    departamento VARCHAR(200),
    fecha_ingreso DATE,
    supervisor VARCHAR(200),
    password_hash TEXT,
    token_verificacion TEXT,
    email_verificado BOOLEAN DEFAULT false,
    primer_login BOOLEAN DEFAULT true,
    fecha_ultimo_login TIMESTAMP,
    uso_primer_semestre DECIMAL(10, 2) DEFAULT 0,
    uso_segundo_semestre DECIMAL(10, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de solicitudes de permisos
CREATE TABLE IF NOT EXISTS solicitudes_permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    tipo_permiso_id INTEGER REFERENCES tipos_permisos(id),
    fecha_solicitud DATE NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    dias_solicitados DECIMAL(10, 2),
    motivo TEXT,
    observaciones TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    aprobado_por INTEGER REFERENCES usuarios_admin(id),
    fecha_aprobacion TIMESTAMP,
    rechazado_motivo TEXT,
    fecha_anulacion TIMESTAMP,
    visto_por_supervisor BOOLEAN DEFAULT false,
    fecha_visto_supervisor TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado ON solicitudes_permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_permisos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_permisos(fecha_desde);
CREATE INDEX IF NOT EXISTS idx_empleados_supervisor ON empleados(supervisor);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- Habilitar RLS (Row Level Security) - opcional, puedes deshabilitarlo si quieres
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (permite todo por ahora, ajustarlas después)
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON usuarios_admin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON tipos_permisos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON empleados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON solicitudes_permisos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON configuracion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON notificaciones FOR ALL USING (true) WITH CHECK (true);
`;

        // Ejecutar el SQL
        console.log('📊 Ejecutando creación de tablas...');

        // Dividir en comandos individuales y ejecutar uno por uno
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

        for (const command of commands) {
            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: command.trim()
                });

                if (error && !error.message.includes('already exists')) {
                    console.warn('⚠️', error.message);
                }
            } catch (e) {
                // Intentar crear la función RPC si no existe
                if (e.message && e.message.includes('exec_sql')) {
                    console.log('ℹ️ Necesitas crear la función exec_sql en Supabase');
                    console.log('ℹ️ Ve al SQL Editor en Supabase y ejecuta el archivo create_exec_sql_function.sql');
                    break;
                }
            }
        }

        console.log('\n✅ Esquema creado exitosamente!');
        console.log('\n💡 Nota: Si ves errores de "already exists", es normal.');
        console.log('💡 Significa que las tablas ya estaban creadas.\n');

    } catch (error) {
        console.error('❌ Error creando esquema:', error);
        console.log('\n💡 Tip: Puedes crear las tablas manualmente en el SQL Editor de Supabase');
        console.log('💡 Copia y pega el contenido del archivo scripts/supabase_schema.sql\n');
    }

    process.exit(0);
}

crearEsquema();
