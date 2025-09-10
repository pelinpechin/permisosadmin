const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Crear la aplicación Express
const app = express();

// Configurar middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Configurar Supabase solo si las variables están disponibles
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error configurando Supabase:', error);
    }
}

// Configurar nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Función helper para ejecutar queries en Supabase
async function executeQuery(operation, table, data = null, filters = null) {
    if (!supabase) {
        throw new Error('Supabase no está configurado');
    }

    try {
        let query = supabase.from(table);

        switch (operation) {
            case 'select':
                if (filters) {
                    Object.keys(filters).forEach(key => {
                        query = query.eq(key, filters[key]);
                    });
                }
                const { data: selectData, error: selectError } = await query.select('*');
                if (selectError) throw selectError;
                return selectData;

            case 'insert':
                const { data: insertData, error: insertError } = await query.insert(data);
                if (insertError) throw insertError;
                return insertData;

            case 'update':
                const { data: updateData, error: updateError } = await query
                    .update(data)
                    .eq('id', filters.id);
                if (updateError) throw updateError;
                return updateData;

            default:
                throw new Error(`Operación no soportada: ${operation}`);
        }
    } catch (error) {
        console.error(`Error en ${operation} ${table}:`, error);
        throw error;
    }
}

// Ruta de verificar RUT empleado
app.post('/api/empleados-auth/verificar-rut', async (req, res) => {
    try {
        const { rut } = req.body;
        
        if (!rut) {
            return res.status(400).json({ error: 'RUT es requerido' });
        }

        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        const empleados = await executeQuery('select', 'empleados', null, { activo: true });
        const empleado = empleados.find(emp => 
            emp.rut.replace(/\./g, '').replace(/-/g, '') === rutNormalizado
        );

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
        }
        
        res.json({
            empleado: {
                id: empleado.id,
                nombre: empleado.nombre,
                rut: empleado.rut,
                email: empleado.email,
                cargo: empleado.cargo
            },
            tienePassword: !!empleado.password_hash,
            emailVerificado: empleado.email_verificado || false
        });
        
    } catch (error) {
        console.error('Error verificando RUT:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de login empleado
app.post('/api/empleados-auth/login', async (req, res) => {
    try {
        const { rut, password } = req.body;
        
        if (!rut || !password) {
            return res.status(400).json({ error: 'RUT y contraseña son requeridos' });
        }

        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        const empleados = await executeQuery('select', 'empleados', null, { activo: true });
        const empleado = empleados.find(emp => 
            emp.rut.replace(/\./g, '').replace(/-/g, '') === rutNormalizado
        );

        if (!empleado) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (!empleado.password_hash) {
            return res.status(401).json({ error: 'Cuenta no activada. Contacte al administrador.' });
        }

        const passwordValid = await bcrypt.compare(password, empleado.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo,
                type: 'empleado'
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            success: true,
            token,
            empleado: {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de solicitar reset de contraseña
app.post('/api/empleados-auth/solicitar-reset', async (req, res) => {
    try {
        const { rut, email } = req.body;
        
        if (!rut || !email) {
            return res.status(400).json({ error: 'RUT y email son requeridos' });
        }

        const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '');
        
        const empleados = await executeQuery('select', 'empleados', null, { activo: true });
        const empleado = empleados.find(emp => 
            emp.rut.replace(/\./g, '').replace(/-/g, '') === rutNormalizado && 
            emp.email === email
        );

        if (!empleado) {
            return res.status(404).json({ error: 'No se encontró un empleado con ese RUT y email' });
        }

        // Generar token de reset
        const tokenReset = crypto.randomBytes(32).toString('hex');
        const fechaExpiracion = new Date(Date.now() + 3600000); // 1 hora

        // Actualizar empleado con token de reset
        await executeQuery('update', 'empleados', {
            token_reset: tokenReset,
            reset_expiracion: fechaExpiracion.toISOString()
        }, { id: empleado.id });

        // Si no hay configuración SMTP, simular envío exitoso
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('EMAIL SIMULADO - Token de reset:', tokenReset);
            console.log('EMAIL SIMULADO - Para:', email);
            return res.json({
                success: true,
                message: 'Se ha enviado un enlace de recuperación a tu email (modo demo)'
            });
        }

        // Enviar email real
        const resetUrl = `${process.env.URL || 'https://permisosadministrativos.netlify.app'}/reset-password.html?token=${tokenReset}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Recuperación de Contraseña - Sistema de Permisos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Recuperación de Contraseña</h2>
                    <p>Hola <strong>${empleado.nombre}</strong>,</p>
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
        
        res.json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email'
        });
        
    } catch (error) {
        console.error('Error en solicitar-reset:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        supabase: !!supabase 
    });
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Exportar como función serverless para Netlify
module.exports.handler = serverless(app);