const fs = require('fs');
const path = require('path');

// Archivo de log de errores
const errorLogPath = path.join(__dirname, '..', 'logs', 'errors.log');
const dbLogPath = path.join(__dirname, '..', 'logs', 'database.log');

// Asegurarse de que el directorio de logs existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logger de errores
function logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${context}\nError: ${error.message}\nStack: ${error.stack}\n\n`;

    fs.appendFileSync(errorLogPath, logEntry);
    console.error(`❌ Error registrado: ${context}`, error.message);
}

// Logger de operaciones de base de datos
function logDatabaseOperation(operation, details) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${operation}: ${JSON.stringify(details)}\n`;

    fs.appendFileSync(dbLogPath, logEntry);
    console.log(`✅ DB Operation: ${operation}`);
}

// Middleware de manejo de errores global
const errorHandler = (err, req, res, next) => {
    // Registrar el error
    logError(err, `${req.method} ${req.path}`);

    // Intentar recuperación automática según el tipo de error
    if (err.code === 'SQLITE_BUSY') {
        return res.status(503).json({
            success: false,
            message: 'Base de datos ocupada. Reintentando...',
            retry: true
        });
    }

    if (err.code === 'SQLITE_CORRUPT') {
        logError(new Error('Base de datos corrupta detectada'), 'CRITICAL');
        return res.status(500).json({
            success: false,
            message: 'Error crítico en base de datos. Contacte al administrador.',
            critical: true
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Wrapper para operaciones de base de datos con reintentos
async function withRetry(operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();
            logDatabaseOperation('SUCCESS', { attempt, operation: operation.name });
            return result;
        } catch (error) {
            lastError = error;
            logError(error, `Attempt ${attempt}/${maxRetries} - ${operation.name}`);

            if (attempt < maxRetries && error.code === 'SQLITE_BUSY') {
                await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

// Verificador de integridad de base de datos
async function verifyDatabaseIntegrity(db) {
    try {
        // Verificar que las tablas principales existan
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const requiredTables = ['empleados', 'usuarios_admin', 'tipos_permisos', 'solicitudes_permisos'];
        const existingTables = tables.map(t => t.name);

        const missingTables = requiredTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            const error = new Error(`Tablas faltantes: ${missingTables.join(', ')}`);
            logError(error, 'DATABASE INTEGRITY CHECK');
            return false;
        }

        logDatabaseOperation('INTEGRITY_CHECK', { status: 'OK', tables: existingTables.length });
        return true;
    } catch (error) {
        logError(error, 'DATABASE INTEGRITY CHECK FAILED');
        return false;
    }
}

// Monitor de operaciones de guardado
class SaveMonitor {
    constructor() {
        this.operations = new Map();
    }

    startOperation(id, type, data) {
        this.operations.set(id, {
            type,
            data,
            startTime: Date.now(),
            status: 'in_progress'
        });

        logDatabaseOperation('START', { id, type });
    }

    completeOperation(id, success = true) {
        const operation = this.operations.get(id);
        if (operation) {
            operation.status = success ? 'completed' : 'failed';
            operation.endTime = Date.now();
            operation.duration = operation.endTime - operation.startTime;

            logDatabaseOperation(success ? 'COMPLETE' : 'FAILED', {
                id,
                type: operation.type,
                duration: operation.duration
            });

            // Eliminar operaciones completadas después de 1 minuto
            setTimeout(() => this.operations.delete(id), 60000);
        }
    }

    getStatus() {
        const inProgress = Array.from(this.operations.values()).filter(op => op.status === 'in_progress');
        const failed = Array.from(this.operations.values()).filter(op => op.status === 'failed');

        return {
            total: this.operations.size,
            inProgress: inProgress.length,
            failed: failed.length
        };
    }
}

const saveMonitor = new SaveMonitor();

module.exports = {
    errorHandler,
    logError,
    logDatabaseOperation,
    withRetry,
    verifyDatabaseIntegrity,
    saveMonitor
};
