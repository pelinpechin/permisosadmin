const { query, run } = require('./database/db_config');

async function testSolicitud() {
    try {
        console.log('🧪 Probando creación de solicitud...');
        
        // 1. Primero probar obtener tipos de permisos
        console.log('\n1. Probando obtener tipos de permisos...');
        try {
            const tipos = await query('SELECT * FROM tipos_permisos WHERE activo = 1 ORDER BY codigo');
            console.log(`✅ Tipos de permisos obtenidos: ${tipos.length}`);
            const tiposEmpleado = tipos.filter(tipo => ['T', 'AM', 'PM', 'S', 'C'].includes(tipo.codigo));
            console.log(`✅ Tipos para empleados: ${tiposEmpleado.length}`);
            tiposEmpleado.forEach(tipo => console.log(`   - ${tipo.codigo}: ${tipo.nombre}`));
        } catch (error) {
            console.log('❌ Error obteniendo tipos:', error.message);
            return;
        }
        
        // 2. Probar obtener datos del empleado Miguel
        console.log('\n2. Probando obtener empleado Miguel (ID 72)...');
        try {
            const empleados = await query('SELECT * FROM empleados WHERE id = 72');
            if (empleados && empleados.length > 0) {
                console.log(`✅ Empleado encontrado: ${empleados[0].nombre}`);
            } else {
                console.log('❌ Empleado ID 72 no encontrado');
            }
        } catch (error) {
            console.log('❌ Error obteniendo empleado:', error.message);
        }
        
        // 3. Probar crear una solicitud de prueba
        console.log('\n3. Probando crear solicitud de prueba...');
        try {
            // Obtener ID del tipo de permiso T
            const tipoPermiso = await query('SELECT id FROM tipos_permisos WHERE codigo = ? AND activo = 1', ['T']);
            
            if (!tipoPermiso || tipoPermiso.length === 0) {
                console.log('❌ No se encontró tipo de permiso T');
                return;
            }
            
            const tipoPermisoId = tipoPermiso[0].id;
            const fechaSolicitud = '2025-12-01'; // Fecha futura
            const motivo = 'Solicitud de prueba para verificar funcionamiento del sistema';
            
            console.log(`Creando solicitud: empleado_id=72, tipo_permiso_id=${tipoPermisoId}, fecha=${fechaSolicitud}`);
            
            const result = await run(`
                INSERT INTO solicitudes_permisos 
                (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'PENDIENTE', 'Solicitud de prueba', datetime('now'), datetime('now'))
            `, [72, tipoPermisoId, fechaSolicitud, fechaSolicitud, motivo]);
            
            console.log(`✅ Solicitud creada exitosamente con resultado:`, result);
            
        } catch (error) {
            console.log('❌ Error creando solicitud:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

testSolicitud();