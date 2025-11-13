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

// Función para obtener datos de SQLite
function queryAll(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrarDatos() {
    try {
        console.log('\n🚀 Iniciando migración de SQLite a Supabase...\n');

        // 1. Migrar usuarios_admin
        console.log('📊 Migrando usuarios_admin...');
        const admins = await queryAll('SELECT * FROM usuarios_admin WHERE activo = 1');
        if (admins.length > 0) {
            const { data, error } = await supabase
                .from('usuarios_admin')
                .upsert(admins, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando admins:', error);
            } else {
                console.log(`✅ Migrados ${admins.length} administradores`);
            }
        }

        // 2. Tipos_permisos ya fueron insertados en el esquema de Supabase, saltamos
        console.log('⏭️ Tipos_permisos ya insertados en Supabase');

        // 3. Migrar empleados
        console.log('📊 Migrando empleados...');
        const empleados = await queryAll('SELECT * FROM empleados WHERE activo = 1');
        if (empleados.length > 0) {
            // Convertir campos boolean de SQLite (0/1) a boolean de PostgreSQL (true/false)
            const empleadosFormateados = empleados.map(emp => ({
                ...emp,
                activo: emp.activo === 1,
                email_verificado: emp.email_verificado === 1,
                primer_login: emp.primer_login === 1
            }));

            const { data, error } = await supabase
                .from('empleados')
                .upsert(empleadosFormateados, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando empleados:', error);
            } else {
                console.log(`✅ Migrados ${empleados.length} empleados`);
            }
        }

        // 4. Migrar solicitudes_permisos
        console.log('📊 Migrando solicitudes_permisos...');
        const solicitudes = await queryAll('SELECT * FROM solicitudes_permisos');
        if (solicitudes.length > 0) {
            // Convertir campos boolean
            const solicitudesFormateadas = solicitudes.map(sol => ({
                ...sol,
                visto_por_supervisor: sol.visto_por_supervisor === 1
            }));

            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .upsert(solicitudesFormateadas, { onConflict: 'id' });

            if (error) {
                console.error('❌ Error migrando solicitudes:', error);
            } else {
                console.log(`✅ Migradas ${solicitudes.length} solicitudes`);
            }
        }

        // 5. Configuracion no existe en SQLite, saltamos

        // 6. Migrar notificaciones (si existe la tabla)
        console.log('📊 Migrando notificaciones...');
        try {
            const notificaciones = await queryAll('SELECT * FROM notificaciones');
            if (notificaciones.length > 0) {
                const notificacionesFormateadas = notificaciones.map(not => ({
                    ...not,
                    leida: not.leida === 1
                }));

                const { data, error } = await supabase
                    .from('notificaciones')
                    .upsert(notificacionesFormateadas, { onConflict: 'id' });

                if (error) {
                    console.error('❌ Error migrando notificaciones:', error);
                } else {
                    console.log(`✅ Migradas ${notificaciones.length} notificaciones`);
                }
            }
        } catch (err) {
            console.log('⚠️ Tabla notificaciones no existe o está vacía');
        }

        console.log('\n✅ ¡Migración completada exitosamente!\n');

        // Cerrar conexión SQLite
        db.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error en la migración:', error);
        db.close();
        process.exit(1);
    }
}

// Ejecutar migración
migrarDatos();
