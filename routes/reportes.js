const express = require('express');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { query } = require('../database/db_config');

const router = express.Router();

// Middleware para verificar token de admin
function verificarTokenAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025');

        // Verificar que sea admin
        if (decoded.type !== 'admin') {
            return res.status(403).json({ error: 'Acceso solo para administradores' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Error verificando token admin:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * GET /api/reportes/solicitudes/pdf
 * Generar reporte de solicitudes en PDF
 */
router.get('/solicitudes/pdf', verificarTokenAdmin, async (req, res) => {
    try {
        const { fechaInicio, fechaFin, estado, busqueda, tipo, orden, reporteRapido } = req.query;

        console.log('📊 Generando reporte PDF con parámetros:', {
            fechaInicio,
            fechaFin,
            estado,
            busqueda,
            tipo,
            orden,
            reporteRapido
        });

        // Construir query SQL
        let sql = `
            SELECT
                sp.*,
                e.nombre as empleado_nombre,
                e.rut as empleado_rut,
                e.cargo as empleado_cargo,
                tp.nombre as tipo_nombre,
                tp.codigo as tipo_codigo
            FROM solicitudes_permisos sp
            LEFT JOIN empleados e ON sp.empleado_id = e.id
            LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id
            WHERE 1=1
        `;

        const params = [];

        // Reportes rápidos predefinidos
        if (reporteRapido) {
            const hoy = new Date();
            if (reporteRapido === 'semanal') {
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                sql += ' AND sp.created_at >= ?';
                params.push(inicioSemana.toISOString().split('T')[0]);
            } else if (reporteRapido === 'mensual') {
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                sql += ' AND sp.created_at >= ?';
                params.push(inicioMes.toISOString().split('T')[0]);
            } else if (reporteRapido === 'pendientes') {
                sql += ' AND sp.estado = ?';
                params.push('PENDIENTE');
            }
        }

        // Filtros personalizados
        if (fechaInicio) {
            sql += ' AND sp.fecha_desde >= ?';
            params.push(fechaInicio);
        }

        if (fechaFin) {
            sql += ' AND sp.fecha_desde <= ?';
            params.push(fechaFin);
        }

        if (estado) {
            sql += ' AND sp.estado = ?';
            params.push(estado);
        }

        if (busqueda) {
            sql += ' AND (e.nombre LIKE ? OR e.rut LIKE ?)';
            params.push(`%${busqueda}%`, `%${busqueda}%`);
        }

        // Ordenar
        if (orden === 'fecha_desc') {
            sql += ' ORDER BY sp.created_at DESC';
        } else if (orden === 'fecha_asc') {
            sql += ' ORDER BY sp.created_at ASC';
        } else if (orden === 'empleado') {
            sql += ' ORDER BY e.nombre ASC';
        } else if (orden === 'estado') {
            sql += ' ORDER BY sp.estado ASC';
        } else {
            sql += ' ORDER BY sp.created_at DESC';
        }

        console.log('🔍 Ejecutando consulta SQL:', sql);
        const solicitudes = await query(sql, params);

        console.log(`✅ Se encontraron ${solicitudes.length} solicitudes`);

        // Crear PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);

        // Pipe PDF al response
        doc.pipe(res);

        // Título del reporte
        doc.fontSize(20).text('Reporte de Solicitudes de Permisos', { align: 'center' });
        doc.moveDown();

        // Información del reporte
        doc.fontSize(10);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-CL')}`, { align: 'right' });
        doc.text(`Total de solicitudes: ${solicitudes.length}`, { align: 'right' });

        if (fechaInicio || fechaFin) {
            doc.text(`Período: ${fechaInicio || 'Inicio'} - ${fechaFin || 'Fin'}`, { align: 'right' });
        }

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // Estadísticas generales (si es reporte con estadísticas)
        if (tipo === 'estadisticas' || tipo === 'resumen') {
            const estadisticas = {
                total: solicitudes.length,
                pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
                aprobadas: solicitudes.filter(s => s.estado === 'APROBADO').length,
                rechazadas: solicitudes.filter(s => s.estado === 'RECHAZADO').length
            };

            doc.fontSize(14).text('Estadísticas Generales', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Total de solicitudes: ${estadisticas.total}`);
            doc.text(`Solicitudes pendientes: ${estadisticas.pendientes}`);
            doc.text(`Solicitudes aprobadas: ${estadisticas.aprobadas}`);
            doc.text(`Solicitudes rechazadas: ${estadisticas.rechazadas}`);
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown();
        }

        // Tabla de solicitudes (si es detallado)
        if (tipo === 'detallado' || !tipo) {
            doc.fontSize(14).text('Detalle de Solicitudes', { underline: true });
            doc.moveDown();

            solicitudes.forEach((solicitud, index) => {
                // Verificar si hay espacio, si no, agregar nueva página
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(10);
                doc.font('Helvetica-Bold').text(`${index + 1}. Solicitud #${solicitud.id}`, { continued: false });
                doc.font('Helvetica');

                doc.text(`   Empleado: ${solicitud.empleado_nombre || 'N/A'}`);
                doc.text(`   RUT: ${solicitud.empleado_rut || 'N/A'}`);
                doc.text(`   Cargo: ${solicitud.empleado_cargo || 'N/A'}`);
                doc.text(`   Tipo de permiso: ${solicitud.tipo_nombre || solicitud.tipo_codigo || 'N/A'}`);
                doc.text(`   Fecha: ${solicitud.fecha_desde ? new Date(solicitud.fecha_desde).toLocaleDateString('es-CL') : 'N/A'}`);
                doc.text(`   Estado: ${solicitud.estado || 'N/A'}`);
                doc.text(`   Motivo: ${solicitud.motivo || 'Sin motivo'}`);

                if (solicitud.observaciones) {
                    doc.text(`   Observaciones: ${solicitud.observaciones}`);
                }

                doc.moveDown(0.5);
                doc.moveTo(60, doc.y).lineTo(545, doc.y).stroke('gray');
                doc.moveDown(0.5);
            });
        }

        // Si es reporte resumen, mostrar solo estadísticas por empleado
        if (tipo === 'resumen') {
            doc.fontSize(14).text('Resumen por Empleado', { underline: true });
            doc.moveDown();

            // Agrupar por empleado
            const porEmpleado = {};
            solicitudes.forEach(sol => {
                const empleado = sol.empleado_nombre || 'Sin nombre';
                if (!porEmpleado[empleado]) {
                    porEmpleado[empleado] = {
                        total: 0,
                        pendientes: 0,
                        aprobadas: 0,
                        rechazadas: 0,
                        rut: sol.empleado_rut
                    };
                }
                porEmpleado[empleado].total++;
                if (sol.estado === 'PENDIENTE') porEmpleado[empleado].pendientes++;
                if (sol.estado === 'APROBADO') porEmpleado[empleado].aprobadas++;
                if (sol.estado === 'RECHAZADO') porEmpleado[empleado].rechazadas++;
            });

            doc.fontSize(10);
            Object.keys(porEmpleado).sort().forEach((empleado, index) => {
                if (doc.y > 700) {
                    doc.addPage();
                }

                const stats = porEmpleado[empleado];
                doc.font('Helvetica-Bold').text(`${index + 1}. ${empleado}`, { continued: false });
                doc.font('Helvetica');
                doc.text(`   RUT: ${stats.rut || 'N/A'}`);
                doc.text(`   Total solicitudes: ${stats.total}`);
                doc.text(`   Pendientes: ${stats.pendientes} | Aprobadas: ${stats.aprobadas} | Rechazadas: ${stats.rechazadas}`);
                doc.moveDown(0.5);
            });
        }

        // Footer
        doc.fontSize(8).text(
            `Generado por Sistema de Permisos Administrativos - Página ${doc.bufferedPageRange().count}`,
            50,
            750,
            { align: 'center' }
        );

        // Finalizar PDF
        doc.end();

        console.log('✅ Reporte PDF generado exitosamente');

    } catch (error) {
        console.error('❌ Error generando reporte PDF:', error);

        // Si ya se envió el header, no podemos enviar JSON
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generando reporte PDF', details: error.message });
        }
    }
});

module.exports = router;
