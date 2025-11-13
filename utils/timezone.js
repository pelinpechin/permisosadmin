const moment = require('moment-timezone');
const { query } = require('../database/db_config');

// Cache para la configuración de zona horaria
let cachedTimezone = null;
let cachedOffset = null;
let lastCacheUpdate = null;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtener la zona horaria configurada del sistema
 */
async function getSystemTimezone() {
    const now = Date.now();
    
    // Usar cache si está disponible y no ha expirado
    if (cachedTimezone && lastCacheUpdate && (now - lastCacheUpdate) < CACHE_TTL) {
        return cachedTimezone;
    }

    try {
        const config = await query(
            "SELECT valor FROM configuraciones_sistema WHERE clave = 'zona_horaria'"
        );
        
        if (config && config.length > 0) {
            cachedTimezone = config[0].valor;
            lastCacheUpdate = now;
            return cachedTimezone;
        }
    } catch (error) {
        console.error('Error obteniendo zona horaria:', error);
    }

    // Fallback a America/Santiago (UTC-3)
    cachedTimezone = 'America/Santiago';
    return cachedTimezone;
}

/**
 * Obtener el offset UTC configurado
 */
async function getSystemOffset() {
    const now = Date.now();
    
    if (cachedOffset !== null && lastCacheUpdate && (now - lastCacheUpdate) < CACHE_TTL) {
        return cachedOffset;
    }

    try {
        const config = await query(
            "SELECT valor FROM configuraciones_sistema WHERE clave = 'utc_offset'"
        );
        
        if (config && config.length > 0) {
            cachedOffset = parseInt(config[0].valor);
            return cachedOffset;
        }
    } catch (error) {
        console.error('Error obteniendo offset UTC:', error);
    }

    // Fallback a -3 (Chile)
    cachedOffset = -3;
    return cachedOffset;
}

/**
 * Convertir fecha UTC a zona horaria del sistema
 */
async function toSystemTimezone(date) {
    const timezone = await getSystemTimezone();
    return moment(date).tz(timezone);
}

/**
 * Obtener fecha/hora actual en zona horaria del sistema
 */
async function now() {
    const timezone = await getSystemTimezone();
    return moment().tz(timezone);
}

/**
 * Formatear fecha en zona horaria del sistema
 */
async function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const timezone = await getSystemTimezone();
    return moment(date).tz(timezone).format(format);
}

/**
 * Obtener inicio del día en zona horaria del sistema
 */
async function startOfDay(date = new Date()) {
    const timezone = await getSystemTimezone();
    return moment(date).tz(timezone).startOf('day').toDate();
}

/**
 * Obtener fin del día en zona horaria del sistema
 */
async function endOfDay(date = new Date()) {
    const timezone = await getSystemTimezone();
    return moment(date).tz(timezone).endOf('day').toDate();
}

/**
 * Crear fecha en zona horaria del sistema
 */
async function createDate(year, month, day, hour = 0, minute = 0, second = 0) {
    const timezone = await getSystemTimezone();
    return moment.tz([year, month, day, hour, minute, second], timezone).toDate();
}

/**
 * Parsear fecha considerando zona horaria del sistema
 */
async function parseDate(dateString) {
    const timezone = await getSystemTimezone();
    return moment.tz(dateString, timezone).toDate();
}

/**
 * Limpiar cache (útil cuando se actualiza la configuración)
 */
function clearCache() {
    cachedTimezone = null;
    cachedOffset = null;
    lastCacheUpdate = null;
}

module.exports = {
    getSystemTimezone,
    getSystemOffset,
    toSystemTimezone,
    now,
    formatDate,
    startOfDay,
    endOfDay,
    createDate,
    parseDate,
    clearCache
};
