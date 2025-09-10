const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();

// Configuración específica para Netlify Functions
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Base de datos SQLite en memoria para Netlify (para demo)
// En producción real, se debería usar un servicio de base de datos externo
let db;

const initializeDatabase = () => {
    // Para Netlify Functions, usamos una base de datos en memoria
    db = new sqlite3.Database(':memory:');
    
    // Crear tablas
    const schema = `
        CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero INTEGER UNIQUE NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            rut VARCHAR(20) UNIQUE NOT NULL,
            fecha_nacimiento DATE,
            cargo VARCHAR(255) NOT NULL,
            negociacion_colectiva BOOLEAN DEFAULT 0,
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
            activo BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tipos_permisos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo VARCHAR(10) UNIQUE NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            requiere_autorizacion BOOLEAN DEFAULT 1,
            afecta_sueldo BOOLEAN DEFAULT 0,
            color_hex VARCHAR(7) DEFAULT '#007bff',
            activo BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS solicitudes_permisos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL,
            tipo_permiso_id INTEGER NOT NULL,
            fecha_solicitud DATE NOT NULL,
            fecha_desde DATE NOT NULL,
            fecha_hasta DATE,
            motivo TEXT,
            observaciones TEXT,
            estado VARCHAR(20) DEFAULT 'PENDIENTE',
            fecha_aprobacion DATETIME,
            aprobado_por INTEGER,
            rechazado_motivo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empleado_id) REFERENCES empleados(id),
            FOREIGN KEY (tipo_permiso_id) REFERENCES tipos_permisos(id)
        );

        CREATE TABLE IF NOT EXISTS usuarios_admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            rol VARCHAR(20) DEFAULT 'ADMIN',
            activo BOOLEAN DEFAULT 1,
            ultimo_acceso DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER,
            admin_id INTEGER,
            titulo VARCHAR(255) NOT NULL,
            mensaje TEXT NOT NULL,
            tipo VARCHAR(50) DEFAULT 'INFO',
            leida BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error inicializando base de datos:', err);
        } else {
            console.log('Base de datos inicializada');
            insertInitialData();
        }
    });
};

const insertInitialData = () => {
    const bcrypt = require('bcryptjs');
    
    // Insertar tipos de permisos
    const tiposPermisos = [
        ['T', 'Permiso Jornada Completa', 'Permiso por jornada completa', 1, 0, '#dc3545'],
        ['AM', 'Permiso Primera Media Jornada', 'Permiso primera mitad del día (mañana)', 1, 0, '#28a745'],
        ['PM', 'Permiso Segunda Media Jornada', 'Permiso segunda mitad del día (tarde)', 1, 0, '#ffc107'],
        ['S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de remuneración', 1, 1, '#6c757d'],
        ['BL', 'Beneficio Licencia', 'Beneficio por licencia médica', 0, 0, '#17a2b8'],
        ['L', 'Licencia Médica', 'Licencia médica regular', 0, 0, '#007bff'],
        ['A', 'Atraso', 'Atraso en llegada', 0, 0, '#fd7e14'],
        ['AJ', 'Atraso Justificado', 'Atraso con justificación válida', 0, 0, '#20c997'],
        ['NM', 'No Marcación', 'Falta de marcación de entrada/salida', 0, 0, '#e83e8c'],
        ['C', 'Cumpleaños', 'Permiso por cumpleaños', 1, 0, '#6f42c1']
    ];
    
    const insertTipoPermiso = db.prepare(`
        INSERT OR IGNORE INTO tipos_permisos (codigo, nombre, descripcion, requiere_autorizacion, afecta_sueldo, color_hex)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    tiposPermisos.forEach(tipo => {
        insertTipoPermiso.run(tipo);
    });
    insertTipoPermiso.finalize();
    
    // Crear usuario admin por defecto
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
        INSERT OR IGNORE INTO usuarios_admin (username, password_hash, nombre, email, rol)
        VALUES (?, ?, ?, ?, ?)
    `, ['admin', adminPassword, 'Administrador Sistema', 'admin@empresa.cl', 'SUPER_ADMIN']);
    
    // Insertar algunos empleados de ejemplo
    const empleadosEjemplo = [
        [1, 'Juan Pérez González', '12345678-9', '1985-05-15', 'Profesor de Aula'],
        [2, 'María García López', '98765432-1', '1990-08-22', 'Secretaria'],
        [3, 'Carlos Rodríguez Silva', '11111111-1', '1988-12-03', 'Auxiliar']
    ];
    
    const insertEmpleado = db.prepare(`
        INSERT OR IGNORE INTO empleados (numero, nombre, rut, fecha_nacimiento, cargo)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    empleadosEjemplo.forEach(empleado => {
        insertEmpleado.run(empleado);
    });
    insertEmpleado.finalize();
};

// Funciones de utilidad para base de datos
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Middleware para verificar token JWT
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        req.user = decoded;
        next();
    });
};

// Rutas de autenticación
app.post('/api/auth/login/admin', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña requeridos'
            });
        }
        
        const admin = await get(
            'SELECT * FROM usuarios_admin WHERE username = ? AND activo = 1',
            [username]
        );
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                nombre: admin.nombre,
                rol: admin.rol,
                type: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    nombre: admin.nombre,
                    email: admin.email,
                    rol: admin.rol
                }
            }
        });
        
    } catch (error) {
        console.error('Error en login admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.post('/api/auth/login/empleado', async (req, res) => {
    try {
        const { rut } = req.body;
        
        if (!rut) {
            return res.status(400).json({
                success: false,
                message: 'RUT requerido'
            });
        }
        
        const rutLimpio = rut.replace(/[\.-]/g, '');
        
        const empleado = await get(
            'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
            [rutLimpio]
        );
        
        if (!empleado) {
            return res.status(401).json({
                success: false,
                message: 'RUT no encontrado en el sistema'
            });
        }
        
        const token = jwt.sign(
            {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo,
                type: 'empleado'
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: empleado.id,
                    rut: empleado.rut,
                    nombre: empleado.nombre,
                    cargo: empleado.cargo,
                    numero: empleado.numero
                }
            }
        });
        
    } catch (error) {
        console.error('Error en login empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// Rutas básicas para empleados
app.get('/api/empleados/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.type === 'empleado' && req.user.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes acceder a tu propia información'
            });
        }
        
        const empleado = await get(
            'SELECT * FROM empleados WHERE id = ? AND activo = 1',
            [id]
        );
        
        if (!empleado) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: empleado
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Rutas básicas para permisos
app.get('/api/permisos/tipos', verifyToken, async (req, res) => {
    try {
        const tipos = await query(
            'SELECT * FROM tipos_permisos WHERE activo = 1 ORDER BY nombre'
        );
        
        res.json({
            success: true,
            data: tipos
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Dashboard básico
app.get('/api/dashboard/empleado', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'empleado') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        
        const empleadoId = req.user.id;
        
        const infoEmpleado = await get(`
            SELECT nombre, rut, cargo, fecha_nacimiento
            FROM empleados WHERE id = ? AND activo = 1
        `, [empleadoId]);
        
        const estadisticasSolicitudes = await get(`
            SELECT 
                COUNT(*) as total_solicitudes,
                COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN estado = 'RECHAZADO' THEN 1 END) as rechazadas
            FROM solicitudes_permisos WHERE empleado_id = ?
        `, [empleadoId]);
        
        res.json({
            success: true,
            data: {
                info_empleado: infoEmpleado,
                estadisticas_solicitudes: estadisticasSolicitudes,
                notificaciones: []
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Inicializar base de datos al cargar
initializeDatabase();

// Exportar como función serverless para Netlify
module.exports.handler = serverless(app);