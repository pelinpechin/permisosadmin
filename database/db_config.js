require('dotenv').config();

// Configuración de base de datos
const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' o 'supabase'

console.log(`🗄️ Usando base de datos: ${DB_TYPE.toUpperCase()}`);

let dbModule;

if (DB_TYPE === 'supabase') {
    // Usar Supabase
    dbModule = require('./supabase');
    console.log('📡 Configuración: Supabase (PostgreSQL)');
} else {
    // Usar SQLite por defecto
    dbModule = require('./db');
    console.log('💾 Configuración: SQLite local');
}

// Exportar las funciones de base de datos
module.exports = {
    ...dbModule,
    DB_TYPE
};