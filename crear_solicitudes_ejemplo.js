// Script para crear solicitudes de ejemplo
const { query } = require('./database/db_config');

async function crearSolicitudesEjemplo() {
    try {
        console.log('📝 Creando solicitudes de ejemplo para empleado ID 72...');
        
        // Obtener tipos de permisos disponibles
        const tipos = await query('SELECT * FROM tipos_permisos WHERE activo = 1');
        console.log('Tipos disponibles:', tipos.map(t => t.codigo + ' - ' + t.nombre));
        
        if (tipos.length === 0) {
            console.log('❌ No hay tipos de permisos disponibles');
            return;
        }
        
        // Buscar tipos de permisos reales (no atrasos)
        const tipoPermiso = tipos.find(t => t.codigo === 'T') || tipos.find(t => t.codigo === 'PM') || tipos.find(t => t.codigo === 'AM') || tipos[0];
        const tipoSalud = tipos.find(t => t.codigo === 'AM') || tipos[0];
        const tipoCumple = tipos.find(t => t.codigo === 'C') || tipos[0];
        
        console.log('Usando tipos:', {
            permiso: tipoPermiso.codigo + ' - ' + tipoPermiso.nombre,
            salud: tipoSalud.codigo + ' - ' + tipoSalud.nombre,
            cumple: tipoCumple.codigo + ' - ' + tipoCumple.nombre
        });
        
        // Crear solicitudes para 2025 con permisos reales
        const solicitudes = [
            {
                empleado_id: 72,
                tipo_permiso_id: tipoPermiso.id,
                fecha_desde: '2025-02-15',
                fecha_hasta: '2025-02-15',
                motivo: 'Trámites personales',
                estado: 'APROBADO',
                observaciones: 'Permiso aprobado',
                fecha_aprobacion: '2025-02-14'
            },
            {
                empleado_id: 72,
                tipo_permiso_id: tipoSalud.id,
                fecha_desde: '2025-03-22',
                fecha_hasta: '2025-03-22',
                motivo: 'Cita médica',
                estado: 'APROBADO',
                observaciones: 'Permiso aprobado',
                fecha_aprobacion: '2025-03-21'
            },
            {
                empleado_id: 72,
                tipo_permiso_id: tipoCumple.id,
                fecha_desde: '2025-05-10',
                fecha_hasta: '2025-05-10',
                motivo: 'Cumpleaños',
                estado: 'APROBADO',
                observaciones: 'Permiso aprobado',
                fecha_aprobacion: '2025-05-09'
            },
            {
                empleado_id: 72,
                tipo_permiso_id: tipoPermiso.id,
                fecha_desde: '2025-07-14',
                fecha_hasta: '2025-07-14',
                motivo: 'Trámites bancarios',
                estado: 'APROBADO',
                observaciones: 'Permiso aprobado',
                fecha_aprobacion: '2025-07-13'
            },
            {
                empleado_id: 72,
                tipo_permiso_id: tipoSalud.id,
                fecha_desde: '2025-08-25',
                fecha_hasta: '2025-08-25',
                motivo: 'Exámenes médicos',
                estado: 'APROBADO',
                observaciones: 'Permiso aprobado',
                fecha_aprobacion: '2025-08-24'
            }
        ];
        
        for (const sol of solicitudes) {
            const insertQuery = `
                INSERT INTO solicitudes_permisos 
                (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado, observaciones, fecha_aprobacion, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `;
            
            await query(insertQuery, [
                sol.empleado_id, sol.tipo_permiso_id, sol.fecha_desde, sol.fecha_hasta,
                sol.motivo, sol.estado, sol.observaciones, sol.fecha_aprobacion
            ]);
            console.log('✅ Solicitud creada:', sol.motivo, '-', sol.fecha_desde);
        }
        
        console.log('🎉 Solicitudes de ejemplo creadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    crearSolicitudesEjemplo().then(() => process.exit(0));
}

module.exports = { crearSolicitudesEjemplo };