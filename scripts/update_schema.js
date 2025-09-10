const db = require('../database/db_config');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function updateSchema() {
    console.log('📊 Actualizando schema de base de datos...\n');
    
    try {
        // Para Supabase necesitamos crear las tablas una por una
        console.log('🔄 Creando tabla solicitudes_permisos...');
        
        await db.run(`
            CREATE TABLE IF NOT EXISTS solicitudes_permisos (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL,
                tipo_permiso VARCHAR(10) NOT NULL,
                fecha_solicitud DATE NOT NULL,
                hora_inicio TIME,
                hora_fin TIME,
                motivo TEXT NOT NULL,
                observaciones TEXT,
                estado VARCHAR(20) DEFAULT 'PENDIENTE',
                aprobado_por INTEGER,
                fecha_aprobacion TIMESTAMP,
                comentarios_aprobacion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla solicitudes_permisos creada');

        console.log('🔄 Creando tabla notificaciones...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS notificaciones (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER,
                usuario_admin_id INTEGER,
                tipo VARCHAR(50) NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                leida BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla notificaciones creada');

        console.log('🔄 Creando tabla tipos_permisos...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS tipos_permisos (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(10) UNIQUE NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                color_hex VARCHAR(7) DEFAULT '#007bff',
                activo BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla tipos_permisos creada');

        console.log('🔄 Creando tabla permisos_detalle...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS permisos_detalle (
                id SERIAL PRIMARY KEY,
                empleado_id INTEGER NOT NULL,
                fecha DATE NOT NULL,
                tipo_permiso VARCHAR(10) NOT NULL,
                descripcion VARCHAR(100),
                solicitud_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabla permisos_detalle creada');

        // Insertar tipos de permisos básicos
        console.log('🔄 Insertando tipos de permisos...');
        
        const tiposPermisos = [
            ['T', 'Jornada Completa', 'Permiso administrativo por jornada completa', '#dc3545'],
            ['AM', 'Media Jornada Mañana', 'Permiso administrativo por media jornada en la mañana', '#fd7e14'],
            ['PM', 'Media Jornada Tarde', 'Permiso administrativo por media jornada en la tarde', '#6f42c1'],
            ['C', 'Cumpleaños', 'Permiso por cumpleaños', '#20c997'],
            ['S', 'Sin Goce', 'Permiso sin goce de sueldo', '#6c757d'],
            ['L', 'Licencia', 'Licencia médica u otro tipo', '#0dcaf0'],
            ['NM', 'No Marcación', 'Día sin marcación de entrada/salida', '#ffc107']
        ];

        for (const [codigo, nombre, descripcion, color] of tiposPermisos) {
            try {
                // Verificar si ya existe
                const existe = await db.query('SELECT id FROM tipos_permisos WHERE codigo = ?', [codigo]);
                
                if (existe.length === 0) {
                    await db.run(`
                        INSERT INTO tipos_permisos (codigo, nombre, descripcion, color_hex) 
                        VALUES (?, ?, ?, ?)
                    `, [codigo, nombre, descripcion, color]);
                    console.log(`   ✅ Insertado tipo: ${codigo} - ${nombre}`);
                } else {
                    console.log(`   ⚠️  Ya existe tipo: ${codigo}`);
                }
            } catch (error) {
                console.log(`   ⚠️  Error insertando ${codigo}:`, error.message);
            }
        }

        console.log('\\n✅ Schema actualizado exitosamente!');
        console.log('\\n📋 Tablas disponibles:');
        console.log('   - solicitudes_permisos: Para gestionar solicitudes de empleados');
        console.log('   - notificaciones: Para notificar a supervisores y empleados');
        console.log('   - tipos_permisos: Catálogo de tipos disponibles');
        console.log('   - permisos_detalle: Tracking detallado por fecha');
        
    } catch (error) {
        console.error('❌ Error actualizando schema:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    updateSchema();
}

module.exports = { updateSchema };