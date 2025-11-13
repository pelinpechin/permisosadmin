const express = require('express');
const { query, get } = require('../database/db_config');
const router = express.Router();

/**
 * POST /api/validar/qr
 * Validar un código QR de permiso
 * No requiere autenticación - es público para validación
 */
router.post('/qr', async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar los datos del QR'
            });
        }

        console.log('🔍 Validando QR:', qrData);

        // Parsear los datos del QR
        const parts = qrData.split('|');
        const tipo = parts[0].split(':')[0]; // EMPLEADO, SUPERVISOR, AUTORIZADOR, RECHAZO

        let resultado = {
            valido: false,
            tipo: tipo,
            datos: {},
            mensaje: ''
        };

        // Extraer ID de solicitud
        const solicitudMatch = qrData.match(/SOLICITUD:(\d+)/);
        if (!solicitudMatch) {
            return res.json({
                success: false,
                valido: false,
                mensaje: 'Formato de QR inválido - no se encontró ID de solicitud'
            });
        }

        const solicitudId = solicitudMatch[1];

        // Obtener información de la solicitud
        const solicitud = await get(`
            SELECT
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.nombre as tipo_nombre,
                tp.codigo as tipo_codigo,
                sup.nombre as supervisor_nombre,
                sup.rut as supervisor_rut,
                aut.nombre as autorizador_nombre,
                aut.rut as autorizador_rut
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            LEFT JOIN empleados sup ON e.visualizacion = sup.nombre
            LEFT JOIN empleados aut ON e.autorizacion = aut.nombre
            WHERE sp.id = ?
        `, [solicitudId]);

        if (!solicitud) {
            return res.json({
                success: true,
                valido: false,
                tipo: tipo,
                mensaje: `Solicitud #${solicitudId} no encontrada en el sistema`
            });
        }

        // Validar según el tipo de QR
        switch (tipo) {
            case 'EMPLEADO':
                // Formato: EMPLEADO:{rut}|{nombre}|SOLICITUD:{id}
                const rutEmpleado = parts[0].split(':')[1];
                const nombreEmpleado = parts[1];

                if (solicitud.empleado_rut === rutEmpleado && solicitud.empleado_nombre === nombreEmpleado) {
                    resultado.valido = true;
                    resultado.mensaje = 'QR de empleado válido';
                    resultado.datos = {
                        solicitudId: solicitud.id,
                        empleado: {
                            nombre: solicitud.empleado_nombre,
                            rut: solicitud.empleado_rut,
                            cargo: solicitud.empleado_cargo
                        },
                        permiso: {
                            tipo: `${solicitud.tipo_codigo} - ${solicitud.tipo_nombre}`,
                            fechaDesde: solicitud.fecha_desde,
                            fechaHasta: solicitud.fecha_hasta,
                            motivo: solicitud.motivo
                        },
                        estado: solicitud.estado,
                        fechaSolicitud: solicitud.fecha_solicitud
                    };
                } else {
                    resultado.mensaje = 'Los datos del QR no coinciden con la solicitud';
                }
                break;

            case 'SUPERVISOR':
                // Formato: SUPERVISOR:{rut}|{nombre}|SOLICITUD:{id}|FECHA:{fecha}
                const rutSupervisor = parts[0].split(':')[1];
                const nombreSupervisor = parts[1];

                if (solicitud.supervisor_rut === rutSupervisor || solicitud.supervisor_nombre === nombreSupervisor) {
                    resultado.valido = true;
                    resultado.mensaje = 'Aprobación de supervisor válida';
                    resultado.datos = {
                        solicitudId: solicitud.id,
                        empleado: {
                            nombre: solicitud.empleado_nombre,
                            rut: solicitud.empleado_rut
                        },
                        supervisor: {
                            nombre: nombreSupervisor,
                            rut: rutSupervisor
                        },
                        permiso: {
                            tipo: `${solicitud.tipo_codigo} - ${solicitud.tipo_nombre}`,
                            fechaDesde: solicitud.fecha_desde,
                            fechaHasta: solicitud.fecha_hasta
                        },
                        estado: solicitud.estado,
                        fechaAprobacion: solicitud.fecha_aprobacion
                    };
                } else {
                    resultado.mensaje = 'El supervisor no coincide con los registros';
                }
                break;

            case 'AUTORIZADOR':
                // Formato: AUTORIZADOR:{rut}|{nombre}|SOLICITUD:{id}|FECHA:{fecha}|ESTADO:APROBADO
                const rutAutorizador = parts[0].split(':')[1];
                const nombreAutorizador = parts[1];
                const estadoQR = parts[4] ? parts[4].split(':')[1] : '';

                if (solicitud.estado === 'APROBADO' && estadoQR === 'APROBADO') {
                    resultado.valido = true;
                    resultado.mensaje = 'Aprobación final válida - Permiso APROBADO';
                    resultado.datos = {
                        solicitudId: solicitud.id,
                        empleado: {
                            nombre: solicitud.empleado_nombre,
                            rut: solicitud.empleado_rut,
                            cargo: solicitud.empleado_cargo
                        },
                        autorizador: {
                            nombre: nombreAutorizador,
                            rut: rutAutorizador
                        },
                        permiso: {
                            tipo: `${solicitud.tipo_codigo} - ${solicitud.tipo_nombre}`,
                            fechaDesde: solicitud.fecha_desde,
                            fechaHasta: solicitud.fecha_hasta,
                            motivo: solicitud.motivo
                        },
                        estado: solicitud.estado,
                        fechaAprobacion: solicitud.fecha_aprobacion
                    };
                } else {
                    resultado.mensaje = `Estado actual: ${solicitud.estado}. No coincide con el QR (esperaba APROBADO)`;
                }
                break;

            case 'RECHAZO':
                // Formato: RECHAZO:{rut}|{nombre}|SOLICITUD:{id}|FECHA:{fecha}|MOTIVO:{motivo}
                const rutRechazador = parts[0].split(':')[1];
                const nombreRechazador = parts[1];

                if (solicitud.estado === 'RECHAZADO') {
                    resultado.valido = true;
                    resultado.mensaje = 'Rechazo válido - Permiso RECHAZADO';
                    resultado.datos = {
                        solicitudId: solicitud.id,
                        empleado: {
                            nombre: solicitud.empleado_nombre,
                            rut: solicitud.empleado_rut,
                            cargo: solicitud.empleado_cargo
                        },
                        rechazadoPor: {
                            nombre: nombreRechazador,
                            rut: rutRechazador
                        },
                        permiso: {
                            tipo: `${solicitud.tipo_codigo} - ${solicitud.tipo_nombre}`,
                            fechaSolicitada: solicitud.fecha_desde,
                            motivo: solicitud.motivo
                        },
                        motivoRechazo: solicitud.rechazado_motivo || 'Sin motivo especificado',
                        estado: solicitud.estado,
                        fechaRechazo: solicitud.fecha_aprobacion
                    };
                } else {
                    resultado.mensaje = `Estado actual: ${solicitud.estado}. No coincide con el QR (esperaba RECHAZADO)`;
                }
                break;

            default:
                resultado.mensaje = 'Tipo de QR no reconocido';
        }

        res.json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('❌ Error validando QR:', error);
        res.status(500).json({
            success: false,
            error: 'Error al validar el QR',
            details: error.message
        });
    }
});

module.exports = router;
