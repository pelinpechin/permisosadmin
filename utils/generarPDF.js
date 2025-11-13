const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Formatea una fecha al formato DD/MM/YYYY (sin conversión de zona horaria)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '';

    try {
        // Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria
        const dateOnly = fecha.toString().split('T')[0];
        const [anio, mes, dia] = dateOnly.split('-');

        // Si no tiene formato válido, devolver vacío
        if (!anio || !mes || !dia) {
            return '';
        }

        // Formatear manualmente como DD/MM/YYYY (formato chileno)
        return `${dia}/${mes}/${anio}`;
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return '';
    }
}

/**
 * Formatea una fecha y hora al formato DD/MM/YYYY HH:MM
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
function formatearFechaHora(fecha) {
    // Para fechas con hora, usar toLocaleString con zona horaria local
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;

    // Convertir a zona horaria local
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
}

/**
 * Genera un PDF de permiso aprobado con códigos QR
 * @param {Object} solicitud - Datos de la solicitud aprobada
 * @param {Object} empleado - Datos del empleado solicitante
 * @param {Object} tipoPermiso - Datos del tipo de permiso
 * @param {Object} aprobaciones - Información de aprobaciones
 * @returns {Promise<string>} - Ruta del PDF generado
 */
async function generarPDFPermiso(solicitud, empleado, tipoPermiso, aprobaciones) {
    return new Promise(async (resolve, reject) => {
        try {
            // Crear carpeta de PDFs si no existe
            const pdfDir = path.join(__dirname, '..', 'pdfs_permisos');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Nombre del archivo: PERMISO_RUT_FECHA_ID.pdf
            const fecha = new Date().toISOString().split('T')[0];
            const rutLimpio = empleado.rut.replace(/[.-]/g, '');
            const nombreArchivo = `PERMISO_${rutLimpio}_${fecha}_${solicitud.id}.pdf`;
            const rutaArchivo = path.join(pdfDir, nombreArchivo);

            // Crear documento PDF
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // === LOGO Y NOMBRE DE LA INSTITUCIÓN ===
            const logoPath = path.join(__dirname, '..', 'logo.jpg.jfif');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 30, { width: 60 });
            }
            doc.fillColor('#06A77D').fontSize(14).font('Helvetica-Bold')
               .text('LICEO EXPERIMENTAL', 120, 45, { width: 442 });
            doc.fillColor('black').fontSize(10).font('Helvetica')
               .text('Sistema de Permisos Administrativos', 120, 62, { width: 442 });

            // === ENCABEZADO CON ESTILO ===
            // Caja de encabezado verde
            doc.rect(50, 100, 512, 70).fillAndStroke('#06A77D', '#06A77D');

            doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
               .text('COMPROBANTE DE PERMISO', 50, 115, { align: 'center', width: 512 });
            doc.fontSize(20).text('APROBADO ✓', 50, 140, { align: 'center', width: 512 });

            // Folio en caja blanca
            doc.rect(50, 180, 512, 30).fillAndStroke('white', '#06A77D');
            doc.fillColor('#06A77D').fontSize(12).font('Helvetica-Bold')
               .text(`Folio N° ${solicitud.id.toString().padStart(6, '0')}`, 50, 190, { align: 'center', width: 512 });

            doc.fillColor('black');
            doc.y = 230;
            doc.moveDown(1);

            // === DATOS DEL EMPLEADO ===
            const yEmpleado = doc.y;

            // Caja de sección
            doc.rect(50, yEmpleado, 512, 110).fillAndStroke('#F0F8FF', '#2E86AB');
            doc.fillColor('#2E86AB').fontSize(14).font('Helvetica-Bold')
               .text('DATOS DEL SOLICITANTE', 60, yEmpleado + 10);

            doc.fillColor('black').fontSize(10);

            // Columna izquierda - Datos con mejor formato
            const yDatos = yEmpleado + 35;
            doc.font('Helvetica-Bold').text('Nombre:', 60, yDatos);
            doc.font('Helvetica').text(empleado.nombre, 120, yDatos, { width: 280 });

            doc.font('Helvetica-Bold').text('RUT:', 60, yDatos + 22);
            doc.font('Helvetica').text(empleado.rut, 120, yDatos + 22);

            doc.font('Helvetica-Bold').text('Cargo:', 60, yDatos + 44);
            doc.font('Helvetica').text(empleado.cargo || 'Sin cargo', 120, yDatos + 44, { width: 280 });

            // Generar QR del empleado
            const qrEmpleado = await QRCode.toDataURL(`EMPLEADO:${empleado.rut}|${empleado.nombre}|SOLICITUD:${solicitud.id}`);
            doc.image(qrEmpleado, 420, yEmpleado + 20, { width: 70, height: 70 });
            doc.fontSize(8).fillColor('#666666').text('Código QR', 420, yEmpleado + 93, { width: 70, align: 'center' });

            doc.fillColor('black');
            doc.y = yEmpleado + 120;
            doc.moveDown(1.5);

            // === DATOS DEL PERMISO ===
            const yPermiso = doc.y;

            // Caja de detalle del permiso
            doc.rect(50, yPermiso, 512, 100).fillAndStroke('#FFF8E7', '#F77F00');
            doc.fillColor('#F77F00').fontSize(14).font('Helvetica-Bold')
               .text('DETALLE DEL PERMISO', 60, yPermiso + 10);

            doc.fillColor('black').fontSize(10);

            const yDetalles = yPermiso + 35;

            doc.font('Helvetica-Bold').text('Tipo de Permiso:', 60, yDetalles);
            doc.font('Helvetica').text(`${tipoPermiso.codigo} - ${tipoPermiso.nombre}`, 170, yDetalles, { width: 380 });

            doc.font('Helvetica-Bold').text('Fecha del Permiso:', 60, yDetalles + 22);
            const fechaDesde = formatearFecha(solicitud.fecha_desde);
            const fechaHasta = formatearFecha(solicitud.fecha_hasta);
            const rangoFechas = fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde} al ${fechaHasta}`;
            doc.font('Helvetica').text(rangoFechas, 170, yDetalles + 22);

            doc.font('Helvetica-Bold').text('Motivo:', 60, yDetalles + 44);
            doc.font('Helvetica').text(solicitud.motivo || 'Sin especificar', 170, yDetalles + 44, { width: 380 });

            doc.y = yPermiso + 110;
            doc.moveDown(1.5);

            // === LÍNEA DE TIEMPO DE APROBACIONES ===
            const yAprobaciones = doc.y;

            // Caja de historial
            const alturaHistorial = aprobaciones.supervisor ? 260 : 170;
            doc.rect(50, yAprobaciones, 512, alturaHistorial).fillAndStroke('#F0FFF4', '#06A77D');
            doc.fillColor('#06A77D').fontSize(14).font('Helvetica-Bold')
               .text('HISTORIAL DE APROBACIONES', 60, yAprobaciones + 10);

            doc.fillColor('black').fontSize(10);
            let yActual = yAprobaciones + 40;

            // 1. Solicitud
            doc.rect(60, yActual, 330, 60).fillAndStroke('#E0F7FA', '#2E86AB');
            doc.fillColor('#2E86AB').font('Helvetica-Bold').text('1. SOLICITUD', 70, yActual + 8);
            doc.fillColor('black').font('Helvetica');
            const fechaSolicitud = formatearFechaHora(solicitud.fecha_solicitud);
            doc.fontSize(9).text(`Fecha: ${fechaSolicitud}`, 70, yActual + 28);
            doc.text(`Solicitante: ${empleado.nombre}`, 70, yActual + 42);

            yActual += 70;

            // 2. Aprobación supervisor (si existe)
            if (aprobaciones.supervisor) {
                doc.rect(60, yActual, 330, 60).fillAndStroke('#FFF3E0', '#F77F00');
                doc.fillColor('#F77F00').fontSize(10).font('Helvetica-Bold').text('2. APROBACIÓN SUPERVISOR', 70, yActual + 8);
                doc.fillColor('black').font('Helvetica');
                const fechaSupervisor = formatearFecha(solicitud.fecha_desde);
                doc.fontSize(9).text(`Fecha Autorizada: ${fechaSupervisor}`, 70, yActual + 28);
                doc.text(`Aprobado por: ${aprobaciones.supervisor.nombre}`, 70, yActual + 42);

                // QR del supervisor
                const qrSupervisor = await QRCode.toDataURL(
                    `SUPERVISOR:${aprobaciones.supervisor.rut || 'N/A'}|${aprobaciones.supervisor.nombre}|SOLICITUD:${solicitud.id}|FECHA:${fechaSupervisor}`
                );
                doc.image(qrSupervisor, 420, yActual + 5, { width: 50, height: 50 });
                doc.fontSize(7).fillColor('#666666').text('QR Supervisor', 420, yActual + 57, { width: 50, align: 'center' });

                yActual += 70;
            }

            // 3. Aprobación final
            const numeroFinal = aprobaciones.supervisor ? '3' : '2';
            doc.rect(60, yActual, 330, 60).fillAndStroke('#E8F5E9', '#06A77D');
            doc.fillColor('#06A77D').fontSize(10).font('Helvetica-Bold').text(`${numeroFinal}. APROBACIÓN FINAL ✓`, 70, yActual + 8);
            doc.fillColor('black').font('Helvetica');
            const fechaFinal = formatearFecha(solicitud.fecha_desde);
            doc.fontSize(9).text(`Fecha Autorizada: ${fechaFinal}`, 70, yActual + 28);
            doc.text(`Aprobado por: ${aprobaciones.final.nombre}`, 70, yActual + 42);

            // QR del autorizador final
            const qrFinal = await QRCode.toDataURL(
                `AUTORIZADOR:${aprobaciones.final.rut || 'N/A'}|${aprobaciones.final.nombre}|SOLICITUD:${solicitud.id}|FECHA:${fechaFinal}|ESTADO:APROBADO`
            );
            doc.image(qrFinal, 420, yActual + 5, { width: 50, height: 50 });
            doc.fontSize(7).fillColor('#666666').text('QR Aprobación', 420, yActual + 57, { width: 50, align: 'center' });

            doc.fillColor('black');
            doc.y = yAprobaciones + alturaHistorial + 10;
            doc.moveDown(2);

            // === PIE DE PÁGINA ===
            doc.fontSize(8).fillColor('#666666');
            doc.text('─'.repeat(90), { align: 'center' });
            doc.moveDown(0.3);
            doc.text('Este documento es un comprobante oficial del permiso aprobado.', { align: 'center' });
            doc.text('Los códigos QR contienen información verificable del proceso de aprobación.', { align: 'center' });
            doc.text(`Generado: ${formatearFechaHora(new Date())}`, { align: 'center' });

            // Finalizar PDF
            doc.end();

            stream.on('finish', () => {
                console.log(`✅ PDF generado: ${nombreArchivo}`);
                resolve(rutaArchivo);
            });

            stream.on('error', (error) => {
                console.error('❌ Error generando PDF:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Error en generarPDFPermiso:', error);
            reject(error);
        }
    });
}

/**
 * Genera un PDF de permiso rechazado
 * @param {Object} solicitud - Datos de la solicitud rechazada
 * @param {Object} empleado - Datos del empleado solicitante
 * @param {Object} tipoPermiso - Datos del tipo de permiso
 * @param {Object} rechazo - Información del rechazo (quien rechazó, motivo)
 * @returns {Promise<string>} - Ruta del PDF generado
 */
async function generarPDFPermisoRechazado(solicitud, empleado, tipoPermiso, rechazo) {
    return new Promise(async (resolve, reject) => {
        try {
            // Crear carpeta de PDFs si no existe
            const pdfDir = path.join(__dirname, '..', 'pdfs_permisos');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Nombre del archivo: PERMISO_RECHAZADO_RUT_FECHA_ID.pdf
            const fecha = new Date().toISOString().split('T')[0];
            const rutLimpio = empleado.rut.replace(/[.-]/g, '');
            const nombreArchivo = `PERMISO_RECHAZADO_${rutLimpio}_${fecha}_${solicitud.id}.pdf`;
            const rutaArchivo = path.join(pdfDir, nombreArchivo);

            // Crear documento PDF
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // === LOGO Y NOMBRE DE LA INSTITUCIÓN ===
            const logoPath = path.join(__dirname, '..', 'logo.jpg.jfif');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 30, { width: 60 });
            }
            doc.fillColor('#dc3545').fontSize(14).font('Helvetica-Bold')
               .text('LICEO EXPERIMENTAL', 120, 45, { width: 442 });
            doc.fillColor('black').fontSize(10).font('Helvetica')
               .text('Sistema de Permisos Administrativos', 120, 62, { width: 442 });

            // === ENCABEZADO CON ESTILO ROJO ===
            // Caja de encabezado roja
            doc.rect(50, 100, 512, 70).fillAndStroke('#dc3545', '#dc3545');

            doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
               .text('NOTIFICACIÓN DE', 50, 115, { align: 'center', width: 512 });
            doc.fontSize(20).text('PERMISO RECHAZADO', 50, 140, { align: 'center', width: 512 });

            // Folio en caja blanca
            doc.rect(50, 180, 512, 30).fillAndStroke('white', '#dc3545');
            doc.fillColor('#dc3545').fontSize(12).font('Helvetica-Bold')
               .text(`Folio N° ${solicitud.id.toString().padStart(6, '0')}`, 50, 190, { align: 'center', width: 512 });

            doc.fillColor('black');
            doc.y = 230;
            doc.moveDown(1);

            // === DATOS DEL EMPLEADO ===
            const yEmpleado = doc.y;

            // Caja de sección
            doc.rect(50, yEmpleado, 512, 110).fillAndStroke('#F0F8FF', '#2E86AB');
            doc.fillColor('#2E86AB').fontSize(14).font('Helvetica-Bold')
               .text('DATOS DEL SOLICITANTE', 60, yEmpleado + 10);

            doc.fillColor('black').fontSize(10);

            // Columna izquierda - Datos con mejor formato
            const yDatos = yEmpleado + 35;
            doc.font('Helvetica-Bold').text('Nombre:', 60, yDatos);
            doc.font('Helvetica').text(empleado.nombre, 120, yDatos, { width: 280 });

            doc.font('Helvetica-Bold').text('RUT:', 60, yDatos + 22);
            doc.font('Helvetica').text(empleado.rut, 120, yDatos + 22);

            doc.font('Helvetica-Bold').text('Cargo:', 60, yDatos + 44);
            doc.font('Helvetica').text(empleado.cargo || 'Sin cargo', 120, yDatos + 44, { width: 280 });

            // Generar QR del empleado
            const qrEmpleado = await QRCode.toDataURL(`EMPLEADO:${empleado.rut}|${empleado.nombre}|SOLICITUD:${solicitud.id}|ESTADO:RECHAZADO`);
            doc.image(qrEmpleado, 420, yEmpleado + 20, { width: 70, height: 70 });
            doc.fontSize(8).fillColor('#666666').text('Código QR', 420, yEmpleado + 93, { width: 70, align: 'center' });

            doc.fillColor('black');
            doc.y = yEmpleado + 120;
            doc.moveDown(1.5);

            // === DATOS DEL PERMISO ===
            const yPermiso = doc.y;

            // Caja de detalle del permiso
            doc.rect(50, yPermiso, 512, 100).fillAndStroke('#FFF8E7', '#F77F00');
            doc.fillColor('#F77F00').fontSize(14).font('Helvetica-Bold')
               .text('DETALLE DEL PERMISO SOLICITADO', 60, yPermiso + 10);

            doc.fillColor('black').fontSize(10);

            const yDetalles = yPermiso + 35;

            doc.font('Helvetica-Bold').text('Tipo de Permiso:', 60, yDetalles);
            doc.font('Helvetica').text(`${tipoPermiso.codigo} - ${tipoPermiso.nombre}`, 170, yDetalles, { width: 380 });

            doc.font('Helvetica-Bold').text('Fecha Solicitada:', 60, yDetalles + 22);
            const fechaDesde = formatearFecha(solicitud.fecha_desde);
            const fechaHasta = formatearFecha(solicitud.fecha_hasta);
            const rangoFechas = fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde} al ${fechaHasta}`;
            doc.font('Helvetica').text(rangoFechas, 170, yDetalles + 22);

            doc.font('Helvetica-Bold').text('Motivo:', 60, yDetalles + 44);
            doc.font('Helvetica').text(solicitud.motivo || 'Sin especificar', 170, yDetalles + 44, { width: 380 });

            doc.y = yPermiso + 110;
            doc.moveDown(1.5);

            // === INFORMACIÓN DE RECHAZO ===
            const yRechazo = doc.y;

            // Caja de rechazo
            doc.rect(50, yRechazo, 512, 140).fillAndStroke('#FFEBEE', '#dc3545');
            doc.fillColor('#dc3545').fontSize(14).font('Helvetica-Bold')
               .text('INFORMACIÓN DE RECHAZO', 60, yRechazo + 10);

            doc.fillColor('black').fontSize(10);

            const yInfoRechazo = yRechazo + 35;

            // Fecha de solicitud
            doc.font('Helvetica-Bold').text('Fecha de Solicitud:', 60, yInfoRechazo);
            const fechaSolicitud = formatearFechaHora(solicitud.fecha_solicitud);
            doc.font('Helvetica').text(fechaSolicitud, 180, yInfoRechazo);

            // Fecha de rechazo
            doc.font('Helvetica-Bold').text('Fecha de Rechazo:', 60, yInfoRechazo + 22);
            const fechaRechazo = formatearFechaHora(new Date());
            doc.font('Helvetica').text(fechaRechazo, 180, yInfoRechazo + 22);

            // Quien rechazó
            doc.font('Helvetica-Bold').text('Rechazado por:', 60, yInfoRechazo + 44);
            doc.font('Helvetica').text(rechazo.nombre, 180, yInfoRechazo + 44, { width: 200 });

            // Motivo del rechazo (destacado en rojo)
            doc.font('Helvetica-Bold').fillColor('#dc3545').text('Motivo del Rechazo:', 60, yInfoRechazo + 66);
            doc.fillColor('#333333').font('Helvetica').text(rechazo.motivo || 'Sin motivo especificado', 60, yInfoRechazo + 85, { width: 330 });

            // QR del rechazo
            const qrRechazo = await QRCode.toDataURL(
                `RECHAZO:${rechazo.rut || 'N/A'}|${rechazo.nombre}|SOLICITUD:${solicitud.id}|FECHA:${fechaRechazo}|MOTIVO:${rechazo.motivo}`
            );
            doc.image(qrRechazo, 420, yRechazo + 35, { width: 70, height: 70 });
            doc.fontSize(7).fillColor('#666666').text('QR Rechazo', 420, yRechazo + 108, { width: 70, align: 'center' });

            doc.fillColor('black');
            doc.y = yRechazo + 150;
            doc.moveDown(2);

            // === PIE DE PÁGINA ===
            doc.fontSize(8).fillColor('#666666');
            doc.text('─'.repeat(90), { align: 'center' });
            doc.moveDown(0.3);
            doc.text('Este documento certifica el rechazo del permiso solicitado.', { align: 'center' });
            doc.text('Los códigos QR contienen información verificable del proceso.', { align: 'center' });
            doc.text(`Generado: ${formatearFechaHora(new Date())}`, { align: 'center' });

            // Finalizar PDF
            doc.end();

            stream.on('finish', () => {
                console.log(`✅ PDF de rechazo generado: ${nombreArchivo}`);
                resolve(rutaArchivo);
            });

            stream.on('error', (error) => {
                console.error('❌ Error generando PDF de rechazo:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Error en generarPDFPermisoRechazado:', error);
            reject(error);
        }
    });
}

/**
 * Genera un PDF de permiso anulado
 * @param {Object} solicitud - Datos de la solicitud anulada
 * @param {Object} empleado - Datos del empleado solicitante
 * @param {Object} tipoPermiso - Datos del tipo de permiso
 * @param {Object} anulacion - Información de la anulación (quien anuló, motivo)
 * @returns {Promise<string>} - Ruta del PDF generado
 */
async function generarPDFPermisoAnulado(solicitud, empleado, tipoPermiso, anulacion) {
    return new Promise(async (resolve, reject) => {
        try {
            // Crear carpeta de PDFs si no existe
            const pdfDir = path.join(__dirname, '..', 'pdfs_permisos');
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Nombre del archivo: PERMISO_ANULADO_RUT_FECHA_ID.pdf
            const fecha = new Date().toISOString().split('T')[0];
            const rutLimpio = empleado.rut.replace(/[.-]/g, '');
            const nombreArchivo = `PERMISO_ANULADO_${rutLimpio}_${fecha}_${solicitud.id}.pdf`;
            const rutaArchivo = path.join(pdfDir, nombreArchivo);

            // Crear documento PDF
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // === LOGO Y NOMBRE DE LA INSTITUCIÓN ===
            const logoPath = path.join(__dirname, '..', 'logo.jpg.jfif');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 30, { width: 60 });
            }
            doc.fillColor('#ff9800').fontSize(14).font('Helvetica-Bold')
               .text('LICEO EXPERIMENTAL', 120, 45, { width: 442 });
            doc.fillColor('black').fontSize(10).font('Helvetica')
               .text('Sistema de Permisos Administrativos', 120, 62, { width: 442 });

            // === ENCABEZADO CON ESTILO NARANJA ===
            // Caja de encabezado naranja
            doc.rect(50, 100, 512, 70).fillAndStroke('#ff9800', '#ff9800');

            doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
               .text('PERMISO ANULADO', 50, 115, { align: 'center', width: 512 });
            doc.fontSize(18).text('POR ADMINISTRACIÓN', 50, 145, { align: 'center', width: 512 });

            // Folio en caja blanca
            doc.rect(50, 180, 512, 30).fillAndStroke('white', '#ff9800');
            doc.fillColor('#ff9800').fontSize(12).font('Helvetica-Bold')
               .text(`Folio N° ${solicitud.id.toString().padStart(6, '0')}`, 50, 190, { align: 'center', width: 512 });

            doc.fillColor('black');
            doc.y = 230;
            doc.moveDown(1);

            // === DATOS DEL EMPLEADO ===
            const yEmpleado = doc.y;

            // Caja de sección
            doc.rect(50, yEmpleado, 512, 110).fillAndStroke('#F0F8FF', '#2E86AB');
            doc.fillColor('#2E86AB').fontSize(14).font('Helvetica-Bold')
               .text('DATOS DEL SOLICITANTE', 60, yEmpleado + 10);

            doc.fillColor('black').fontSize(10);

            // Columna izquierda - Datos con mejor formato
            const yDatos = yEmpleado + 35;
            doc.font('Helvetica-Bold').text('Nombre:', 60, yDatos);
            doc.font('Helvetica').text(empleado.nombre, 120, yDatos, { width: 280 });

            doc.font('Helvetica-Bold').text('RUT:', 60, yDatos + 22);
            doc.font('Helvetica').text(empleado.rut, 120, yDatos + 22);

            doc.font('Helvetica-Bold').text('Cargo:', 60, yDatos + 44);
            doc.font('Helvetica').text(empleado.cargo || 'Sin cargo', 120, yDatos + 44, { width: 280 });

            // Generar QR del empleado
            const qrEmpleado = await QRCode.toDataURL(`EMPLEADO:${empleado.rut}|${empleado.nombre}|SOLICITUD:${solicitud.id}|ESTADO:ANULADO`);
            doc.image(qrEmpleado, 420, yEmpleado + 20, { width: 70, height: 70 });
            doc.fontSize(8).fillColor('#666666').text('Código QR', 420, yEmpleado + 93, { width: 70, align: 'center' });

            doc.fillColor('black');
            doc.y = yEmpleado + 120;
            doc.moveDown(1.5);

            // === DATOS DEL PERMISO ===
            const yPermiso = doc.y;

            // Caja de detalle del permiso
            doc.rect(50, yPermiso, 512, 100).fillAndStroke('#FFF8E7', '#F77F00');
            doc.fillColor('#F77F00').fontSize(14).font('Helvetica-Bold')
               .text('DETALLE DEL PERMISO ANULADO', 60, yPermiso + 10);

            doc.fillColor('black').fontSize(10);

            const yDetalles = yPermiso + 35;

            doc.font('Helvetica-Bold').text('Tipo de Permiso:', 60, yDetalles);
            doc.font('Helvetica').text(`${tipoPermiso.codigo} - ${tipoPermiso.nombre}`, 170, yDetalles, { width: 380 });

            doc.font('Helvetica-Bold').text('Fecha del Permiso:', 60, yDetalles + 22);
            const fechaDesde = formatearFecha(solicitud.fecha_desde);
            const fechaHasta = formatearFecha(solicitud.fecha_hasta);
            const rangoFechas = fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde} al ${fechaHasta}`;
            doc.font('Helvetica').text(rangoFechas, 170, yDetalles + 22);

            doc.font('Helvetica-Bold').text('Motivo Original:', 60, yDetalles + 44);
            doc.font('Helvetica').text(solicitud.motivo || 'Sin especificar', 170, yDetalles + 44, { width: 380 });

            doc.y = yPermiso + 110;
            doc.moveDown(1.5);

            // === INFORMACIÓN DE ANULACIÓN ===
            const yAnulacion = doc.y;

            // Caja de anulación
            doc.rect(50, yAnulacion, 512, 160).fillAndStroke('#FFF3E0', '#ff9800');
            doc.fillColor('#ff9800').fontSize(14).font('Helvetica-Bold')
               .text('INFORMACIÓN DE ANULACIÓN', 60, yAnulacion + 10);

            doc.fillColor('black').fontSize(10);

            const yInfoAnulacion = yAnulacion + 35;

            // Estado anterior
            doc.font('Helvetica-Bold').text('Estado Anterior:', 60, yInfoAnulacion);
            doc.font('Helvetica').text(solicitud.estado || 'N/A', 180, yInfoAnulacion);

            // Fecha de solicitud
            doc.font('Helvetica-Bold').text('Fecha de Solicitud:', 60, yInfoAnulacion + 22);
            const fechaSolicitud = formatearFechaHora(solicitud.fecha_solicitud);
            doc.font('Helvetica').text(fechaSolicitud, 180, yInfoAnulacion + 22);

            // Fecha de anulación
            doc.font('Helvetica-Bold').text('Fecha de Anulación:', 60, yInfoAnulacion + 44);
            const fechaAnulacion = formatearFechaHora(new Date());
            doc.font('Helvetica').text(fechaAnulacion, 180, yInfoAnulacion + 44);

            // Quien anuló
            doc.font('Helvetica-Bold').text('Anulado por:', 60, yInfoAnulacion + 66);
            doc.font('Helvetica').text(anulacion.admin || 'Administrador', 180, yInfoAnulacion + 66, { width: 200 });

            // Motivo de la anulación (destacado en naranja)
            doc.font('Helvetica-Bold').fillColor('#ff9800').text('Motivo de Anulación:', 60, yInfoAnulacion + 88);
            doc.fillColor('#333333').font('Helvetica').text(anulacion.motivo || 'Anulación administrativa', 60, yInfoAnulacion + 107, { width: 330 });

            // QR de la anulación
            const qrAnulacion = await QRCode.toDataURL(
                `ANULACION:ADMIN|${anulacion.admin}|SOLICITUD:${solicitud.id}|FECHA:${fechaAnulacion}|MOTIVO:${anulacion.motivo}`
            );
            doc.image(qrAnulacion, 420, yAnulacion + 35, { width: 70, height: 70 });
            doc.fontSize(7).fillColor('#666666').text('QR Anulación', 420, yAnulacion + 108, { width: 70, align: 'center' });

            doc.fillColor('black');
            doc.y = yAnulacion + 170;
            doc.moveDown(2);

            // === ADVERTENCIA ===
            doc.rect(50, doc.y, 512, 50).fillAndStroke('#FFF3E0', '#ff9800');
            const yAdvertencia = doc.y + 15;
            doc.fontSize(10).fillColor('#ff9800').font('Helvetica-Bold')
               .text('⚠️ IMPORTANTE', 60, yAdvertencia);
            doc.fontSize(9).fillColor('#333333').font('Helvetica')
               .text('Este permiso ha sido ANULADO por la administración y ya no es válido.', 60, yAdvertencia + 18, { width: 490 });

            doc.fillColor('black');
            doc.moveDown(2);

            // === PIE DE PÁGINA ===
            // Asegurar que hay espacio suficiente, si no, crear nueva página
            if (doc.y > 700) {
                doc.addPage();
            }

            const yPie = doc.y > 700 ? 50 : doc.y + 20;

            // Línea divisoria
            doc.moveTo(50, yPie).lineTo(562, yPie).stroke('#cccccc');

            // Texto del pie
            doc.fontSize(8).fillColor('#666666').font('Helvetica');
            doc.text('Este documento certifica la anulación del permiso.', 50, yPie + 10, {
                width: 512,
                align: 'center'
            });
            doc.text('Los códigos QR contienen información verificable del proceso.', 50, yPie + 24, {
                width: 512,
                align: 'center'
            });
            doc.text(`Generado: ${formatearFechaHora(new Date())}`, 50, yPie + 38, {
                width: 512,
                align: 'center'
            });

            // Finalizar PDF
            doc.end();

            stream.on('finish', () => {
                console.log(`✅ PDF de anulación generado: ${nombreArchivo}`);
                resolve(rutaArchivo);
            });

            stream.on('error', (error) => {
                console.error('❌ Error generando PDF de anulación:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Error en generarPDFPermisoAnulado:', error);
            reject(error);
        }
    });
}

module.exports = { generarPDFPermiso, generarPDFPermisoRechazado, generarPDFPermisoAnulado };
