const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../database/db_config');
const router = express.Router();

// Configurar nodemailer (puedes ajustar según tu proveedor de email)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * POST /api/empleados-auth/verificar-rut
 * Verificar si existe un empleado con el RUT proporcionado
 */
router.post('/verificar-rut', async (req, res) => {
    try {
        const { rut } = req.body;
        
        if (!rut) {
            return res.status(400).json({ error: 'RUT es requerido' });
        }

        // Normalizar RUT (eliminar puntos y guiones)
        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        // Buscar empleado por RUT
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
            [rutNormalizado]
        );

        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
        }

        const emp = empleado[0];
        
        // Verificar si ya tiene contraseña
        const tienePassword = !!emp.password_hash;
        
        res.json({
            empleado: {
                id: emp.id,
                nombre: emp.nombre,
                rut: emp.rut,
                email: emp.email,
                cargo: emp.cargo
            },
            tienePassword,
            emailVerificado: emp.email_verificado || false
        });

    } catch (error) {
        console.error('Error verificando RUT:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/empleados-auth/crear-password
 * Crear contraseña para un empleado y enviar email de verificación
 */
router.post('/crear-password', async (req, res) => {
    try {
        const { empleadoId, password, confirmPassword } = req.body;
        
        if (!empleadoId || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Buscar empleado
        const empleado = await db.query('SELECT * FROM empleados WHERE id = ? AND activo = 1', [empleadoId]);
        
        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const emp = empleado[0];

        if (emp.password_hash) {
            return res.status(400).json({ error: 'El empleado ya tiene una contraseña configurada' });
        }

        if (!emp.email) {
            return res.status(400).json({ error: 'El empleado no tiene un email registrado' });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Generar token de verificación
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');

        // Actualizar empleado con contraseña (sin verificación de email)
        await db.run(
            `UPDATE empleados 
             SET password_hash = ?, email_verificado = 1, primer_login = 1
             WHERE id = ?`,
            [passwordHash, empleadoId]
        );

        res.json({
            success: true,
            message: 'Contraseña creada correctamente. Ya puedes iniciar sesión.',
            empleado: {
                id: emp.id,
                nombre: emp.nombre,
                email: emp.email
            }
        });

    } catch (error) {
        console.error('Error creando contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/empleados-auth/verificar-email/:token
 * Verificar email del empleado
 */
router.get('/verificar-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Token requerido' });
        }

        // Buscar empleado por token
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE token_verificacion = ? AND activo = 1',
            [token]
        );

        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Token inválido o expirado' });
        }

        const emp = empleado[0];

        // Marcar email como verificado y limpiar token
        await db.run(
            'UPDATE empleados SET email_verificado = 1, token_verificacion = NULL WHERE id = ?',
            [emp.id]
        );

        res.json({
            success: true,
            message: 'Email verificado correctamente',
            empleado: {
                id: emp.id,
                nombre: emp.nombre,
                email: emp.email
            }
        });

    } catch (error) {
        console.error('Error verificando email:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/empleados-auth/login
 * Login de empleado
 */
router.post('/login', async (req, res) => {
    try {
        const { rut, password } = req.body;
        
        if (!rut || !password) {
            return res.status(400).json({ error: 'RUT y contraseña son requeridos' });
        }

        // Normalizar RUT
        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        // Buscar empleado
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
            [rutNormalizado]
        );

        if (empleado.length === 0) {
            return res.status(401).json({ error: 'RUT o contraseña incorrectos' });
        }

        const emp = empleado[0];

        if (!emp.password_hash) {
            return res.status(401).json({ error: 'Debe crear una contraseña primero' });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, emp.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ error: 'RUT o contraseña incorrectos' });
        }

        // Actualizar fecha de último login
        await db.run(
            'UPDATE empleados SET fecha_ultimo_login = ?, primer_login = 0 WHERE id = ?',
            [new Date().toISOString(), emp.id]
        );

        // Generar JWT token
        const token = jwt.sign(
            { 
                id: emp.id, 
                rut: emp.rut, 
                tipo: 'empleado',
                nombre: emp.nombre,
                email: emp.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            empleado: {
                id: emp.id,
                nombre: emp.nombre,
                rut: emp.rut,
                email: emp.email,
                cargo: emp.cargo,
                supervisor: emp.supervisor,
                emailVerificado: emp.email_verificado,
                primerLogin: emp.primer_login
            }
        });

    } catch (error) {
        console.error('Error en login empleado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/empleados-auth/cambiar-password
 * Cambiar contraseña del empleado (requiere autenticación)
 */
router.post('/cambiar-password', async (req, res) => {
    try {
        const { passwordActual, passwordNuevo, confirmPassword } = req.body;
        
        // Verificar token JWT
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.tipo !== 'empleado') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!passwordActual || !passwordNuevo || !confirmPassword) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (passwordNuevo !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (passwordNuevo.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Buscar empleado
        const empleado = await db.query('SELECT * FROM empleados WHERE id = ? AND activo = 1', [decoded.id]);
        
        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const emp = empleado[0];

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, emp.password_hash);
        
        if (!passwordValida) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hash nueva contraseña
        const nuevoPasswordHash = await bcrypt.hash(passwordNuevo, 10);

        // Actualizar contraseña
        await db.run('UPDATE empleados SET password_hash = ? WHERE id = ?', [nuevoPasswordHash, emp.id]);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/empleados-auth/actualizar-datos
 * Actualizar datos del empleado (RUT, email, cargo)
 */
router.put('/actualizar-datos', async (req, res) => {
    try {
        const { email, cargo } = req.body;
        
        // Verificar token JWT
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.tipo !== 'empleado') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!email || !cargo) {
            return res.status(400).json({ error: 'Email y cargo son requeridos' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Formato de email inválido' });
        }

        // Verificar si el email ya existe en otro empleado
        const emailExistente = await db.query(
            'SELECT id FROM empleados WHERE email = ? AND id != ? AND activo = 1',
            [email, decoded.id]
        );

        if (emailExistente.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado en otro empleado' });
        }

        // Actualizar datos del empleado (sin incluir RUT)
        await db.run(
            'UPDATE empleados SET email = ?, cargo = ? WHERE id = ?',
            [email, cargo, decoded.id]
        );

        // Obtener datos actualizados
        const empleadoActualizado = await db.query('SELECT * FROM empleados WHERE id = ?', [decoded.id]);
        
        if (empleadoActualizado.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const emp = empleadoActualizado[0];

        res.json({
            success: true,
            message: 'Datos actualizados correctamente',
            empleado: {
                id: emp.id,
                nombre: emp.nombre,
                rut: emp.rut,
                email: emp.email,
                cargo: emp.cargo,
                supervisor: emp.supervisor
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        console.error('Error actualizando datos del empleado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/empleados-auth/solicitar-reset
 * Solicitar reset de contraseña por email
 */
router.post('/solicitar-reset', async (req, res) => {
    try {
        const { rut, email } = req.body;
        
        if (!rut || !email) {
            return res.status(400).json({ error: 'RUT y email son requeridos' });
        }

        // Normalizar RUT
        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        // Buscar empleado por RUT y email
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND email = ? AND activo = 1',
            [rutNormalizado, email]
        );

        if (empleado.length === 0) {
            return res.status(404).json({ error: 'No se encontró un empleado con ese RUT y email' });
        }

        const emp = empleado[0];

        // Generar token de reset (válido por 1 hora)
        const tokenReset = crypto.randomBytes(32).toString('hex');
        const fechaExpiracion = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en la base de datos
        await db.run(
            'UPDATE empleados SET token_reset = ?, reset_expiracion = ? WHERE id = ?',
            [tokenReset, fechaExpiracion.toISOString(), emp.id]
        );

        // Enviar email de reset
        const emailEnviado = await enviarEmailReset(emp.email, emp.nombre, tokenReset);
        
        if (!emailEnviado) {
            return res.status(500).json({ error: 'Error al enviar el email de recuperación' });
        }

        res.json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email'
        });

    } catch (error) {
        console.error('Error solicitando reset:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/empleados-auth/reset-password
 * Restablecer contraseña usando token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Buscar empleado por token
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE token_reset = ? AND activo = 1',
            [token]
        );

        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Token inválido o expirado' });
        }

        const emp = empleado[0];

        // Verificar que el token no haya expirado
        const ahora = new Date();
        const fechaExpiracion = new Date(emp.reset_expiracion);
        
        if (ahora > fechaExpiracion) {
            return res.status(400).json({ error: 'El token de recuperación ha expirado' });
        }

        // Hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Actualizar contraseña y limpiar token
        await db.run(
            'UPDATE empleados SET password_hash = ?, token_reset = NULL, reset_expiracion = NULL WHERE id = ?',
            [passwordHash, emp.id]
        );

        res.json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/empleados-auth/validar-token-reset/:token
 * Validar token de reset
 */
router.get('/validar-token-reset/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Token requerido' });
        }

        // Buscar empleado por token
        const empleado = await db.query(
            'SELECT * FROM empleados WHERE token_reset = ? AND activo = 1',
            [token]
        );

        if (empleado.length === 0) {
            return res.status(404).json({ error: 'Token inválido' });
        }

        const emp = empleado[0];

        // Verificar que el token no haya expirado
        const ahora = new Date();
        const fechaExpiracion = new Date(emp.reset_expiracion);
        
        if (ahora > fechaExpiracion) {
            return res.status(400).json({ error: 'Token expirado' });
        }

        res.json({
            success: true,
            valid: true,
            empleado: {
                nombre: emp.nombre,
                email: emp.email
            }
        });

    } catch (error) {
        console.error('Error validando token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * Función auxiliar para enviar email de reset
 */
async function enviarEmailReset(email, nombre, token) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP no configurado, saltando envío de email');
            return false;
        }

        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3446'}/portal_empleado_completo.html?reset=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Recuperación de Contraseña - Sistema de Permisos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Recuperación de Contraseña</h2>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Has solicitado restablecer tu contraseña en el Sistema de Permisos Administrativos.</p>
                    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p><strong>Este enlace expira en 1 hora.</strong></p>
                    <p>Si no puedes hacer clic en el enlace, copia y pega la siguiente URL en tu navegador:</p>
                    <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                    <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Sistema de Permisos Administrativos</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email de reset enviado a:', email);
        return true;
    } catch (error) {
        console.error('Error enviando email de reset:', error);
        return false;
    }
}

/**
 * Función auxiliar para enviar email de verificación
 */
async function enviarEmailVerificacion(email, nombre, token) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP no configurado, saltando envío de email');
            return false;
        }

        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3009'}/verificar-email?token=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verificación de Email - Sistema de Permisos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007bff;">Verificación de Email</h2>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Has creado una cuenta en el Sistema de Permisos Administrativos.</p>
                    <p>Por favor, haz clic en el siguiente enlace para verificar tu email:</p>
                    <p>
                        <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Verificar Email
                        </a>
                    </p>
                    <p>Si no puedes hacer clic en el enlace, copia y pega la siguiente URL en tu navegador:</p>
                    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Sistema de Permisos Administrativos</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email de verificación enviado a:', email);
        return true;
    } catch (error) {
        console.error('Error enviando email:', error);
        return false;
    }
}

module.exports = router;