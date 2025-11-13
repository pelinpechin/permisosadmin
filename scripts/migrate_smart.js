require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Conectar a SQLite
const db = new sqlite3.Database('./database/permisos_admin.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a SQLite:', err);
        process.exit(1);
    }
    console.log('✅ Conectado a SQLite');
});

function queryAll(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Mapeo de columnas compatibles
const COLUMN_MAPPING = {
    empleados: [
        'id', 'numero', 'nombre', 'rut', 'fecha_nacimiento', 'cargo',
        'negociacion_colectiva', 'visualizacion', 'autorizacion',
        'permisos_primer_semestre', 'permisos_segundo_semestre',
        'uso_primer_semestre', 'uso_segundo_semestre',
        'sin_goce', 'beneficio_licencia', 'licencias_total',
        'atrasos', 'atrasos_justificados', 'no_marcaciones',
        'email', 'telefono', 'departamento', 'fecha_ingreso', 'supervisor',
        'password_hash', 'token_verificacion', 'email_verificado',
        'primer_login', 'fecha_ultimo_login', 'activo', 'created_at', 'updated_at'
    ],
    solicitudes_permisos: [
        'id', 'empleado_id', 'tipo_permiso_id', 'fecha_solicitud',
        'fecha_desde', 'fecha_hasta', 'motivo', 'observaciones',
        'estado', 'fecha_aprobacion', 'aprobado_por', 'rechazado_motivo',
        'created_at', 'updated_at', 'fecha_anulacion',
        'visto_por_supervisor', 'fecha_visto_supervisor'
    ],
    notificaciones: [
        'id', 'empleado_id', 'admin_id', 'titulo', 'mensaje',
        'tipo', 'leida', 'created_at'
    ],
    usuarios_admin: [
        'id', 'username', 'password_hash', 'nombre', 'email',
        'rol', 'activo', 'created_at'
    ]
};

function filterColumns(obj, allowedColumns) {
    const filtered = {};
    allowedColumns.forEach(col => {
        if (obj.hasOwnProperty(col)) {
            // Convertir valores booleanos de SQLite (0/1) a PostgreSQL (true/false)
            if (typeof obj[col] === 'number' && (col.includes('activo') || col.includes('verificado') ||
                col.includes('login') || col === 'leida' || col.includes('colectiva') ||
                col === 'visto_por_supervisor')) {
                filtered[col] = obj[col] === 1;
            } else {
                filtered[col] = obj[col];
            }
        }
    });
    return filtered;
}

async function migrarDatos() {
    try {
        console.log('\n🚀 Iniciando migración inteligente de SQLite a Supabase...\n');

        // 1. Migrar usuarios_admin
        console.log('📊 Migrando usuarios_admin...');
        const admins = await queryAll('SELECT * FROM usuarios_admin WHERE activo = 1');
        if (admins.length > 0) {
            const adminsLimpios = admins.map(a => filterColumns(a, COLUMN_MAPPING.usuarios_admin));
            const { data, error } = await supabase
                .from('usuarios_admin')
                .upsert(adminsLimpios, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando admins:', error);
            } else {
                console.log(`✅ Migrados ${admins.length} administradores`);
            }
        }

        // 2. Tipos_permisos ya insertados
        console.log('⏭️ Tipos_permisos ya insertados en Supabase');

        // 3. Migrar empleados (TODOS, activos e inactivos, para mantener referencias)
        console.log('📊 Migrando empleados...');
        const empleados = await queryAll('SELECT * FROM empleados');
        if (empleados.length > 0) {
            const empleadosLimpios = empleados.map(e => filterColumns(e, COLUMN_MAPPING.empleados));

            const { data, error } = await supabase
                .from('empleados')
                .upsert(empleadosLimpios, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando empleados:', error);
            } else {
                console.log(`✅ Migrados ${empleados.length} empleados`);
            }
        }

        // 4. Migrar solicitudes_permisos (solo las que tengan empleados válidos)
        console.log('📊 Migrando solicitudes_permisos...');
        const solicitudes = await queryAll(`
            SELECT sp.* FROM solicitudes_permisos sp
            WHERE EXISTS (SELECT 1 FROM empleados e WHERE e.id = sp.empleado_id)
        `);
        if (solicitudes.length > 0) {
            const solicitudesLimpias = solicitudes.map(s => filterColumns(s, COLUMN_MAPPING.solicitudes_permisos));

            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .upsert(solicitudesLimpias, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando solicitudes:', error);
            } else {
                console.log(`✅ Migradas ${solicitudes.length} solicitudes`);
            }
        } else {
            console.log('⏭️ No hay solicitudes para migrar');
        }

        // 5. Migrar notificaciones (solo las que tengan referencias válidas)
        console.log('📊 Migrando notificaciones...');
        try {
            const notificaciones = await queryAll(`
                SELECT n.* FROM notificaciones n
                WHERE (n.empleado_id IS NULL OR EXISTS (SELECT 1 FROM empleados e WHERE e.id = n.empleado_id))
                  AND (n.admin_id IS NULL OR EXISTS (SELECT 1 FROM usuarios_admin a WHERE a.id = n.admin_id))
            `);
            if (notificaciones.length > 0) {
                const notificacionesLimpias = notificaciones.map(n => filterColumns(n, COLUMN_MAPPING.notificaciones));

                const { data, error} = await supabase
                    .from('notificaciones')
                    .upsert(notificacionesLimpias, { onConflict: 'id' });

                if (error) {
                    console.error('❌ Error migrando notificaciones:', error);
                } else {
                    console.log(`✅ Migradas ${notificaciones.length} notificaciones`);
                }
            } else {
                console.log('⏭️ No hay notificaciones para migrar');
            }
        } catch (err) {
            console.log('⚠️ Tabla notificaciones no existe o está vacía');
        }

        console.log('\n✅ ¡Migración completada exitosamente!\n');

        db.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error en la migración:', error);
        db.close();
        process.exit(1);
    }
}

migrarDatos();
