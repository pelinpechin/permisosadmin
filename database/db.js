const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'permisos_admin.db');

// Conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos SQLite');
});

// Función para ejecutar el schema
const initializeDatabase = () => {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ Error inicializando la base de datos:', err.message);
                return;
            }
            console.log('✅ Base de datos inicializada correctamente');
            
            // Crear usuario admin por defecto
            createDefaultAdmin();
        });
    } else {
        console.error('❌ Archivo schema.sql no encontrado');
    }
};

// Crear usuario administrador por defecto
const createDefaultAdmin = () => {
    const bcrypt = require('bcryptjs');
    
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    db.get('SELECT COUNT(*) as count FROM usuarios_admin', (err, row) => {
        if (err) {
            console.error('Error verificando usuarios admin:', err.message);
            return;
        }
        
        if (row.count === 0) {
            db.run(`
                INSERT INTO usuarios_admin (username, password_hash, nombre, email, rol)
                VALUES (?, ?, ?, ?, ?)
            `, ['admin', defaultPassword, 'Administrador Sistema', 'admin@empresa.cl', 'SUPER_ADMIN'], (err) => {
                if (err) {
                    console.error('Error creando admin por defecto:', err.message);
                } else {
                    console.log('✅ Usuario administrador creado - Usuario: admin, Contraseña: admin123');
                }
            });
        }
    });
};

// Función para ejecutar consultas con promesas
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Función para insertar con promesas
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Función para obtener un solo registro
const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Inicializar la base de datos al cargar el módulo
initializeDatabase();

module.exports = {
    db,
    query,
    run,
    get,
    initializeDatabase
};