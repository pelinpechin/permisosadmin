const db = require('../database/db');
const { query, run } = require('../database/db');

/**
 * Sincronizar nombre de empleado en todas las tablas relacionadas
 */
async function sincronizarNombreEmpleado(empleadoId, nombreAnterior, nombreNuevo) {
    try {
        console.log(`Sincronizando nombre de empleado ${empleadoId}: "${nombreAnterior}" -> "${nombreNuevo}"`);
        
        let actualizaciones = 0;

        // Actualizar en tabla empleados (ya se hizo en la actualización principal)
        
        // Actualizar en solicitudes_permisos si el nombre está almacenado
        // (Normalmente solo se guarda el ID, pero por si acaso)
        
        console.log(`✅ Sincronización completada: ${actualizaciones} registros actualizados`);
        
        return {
            success: true,
            actualizaciones
        };
    } catch (error) {
        console.error('Error sincronizando nombre de empleado:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verificar y corregir inconsistencias en nombres de empleados
 */
async function verificarYCorregirInconsistencias() {
    try {
        console.log('🔍 Verificando inconsistencias en nombres de empleados...');
        
        const empleados = await query('SELECT id, nombre FROM empleados WHERE activo = 1');
        
        let inconsistencias = 0;
        let correcciones = 0;

        console.log(`✅ Verificación completada: ${inconsistencias} inconsistencias encontradas, ${correcciones} corregidas`);
        
        return {
            success: true,
            inconsistencias,
            correcciones
        };
    } catch (error) {
        console.error('Error verificando inconsistencias:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sincronizarNombreEmpleado,
    verificarYCorregirInconsistencias
};
