const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, get, run } = require('../database/db_config');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';

// Middleware para verificar token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        req.user = decoded;
        next();
    });
};

// Login de administradores
router.post('/login/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña requeridos'
            });
        }
        
        const admin = await get(
            'SELECT * FROM usuarios_admin WHERE username = ? AND activo = 1',
            [username]
        );
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        // Actualizar último acceso
        await run(
            'UPDATE usuarios_admin SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );
        
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                nombre: admin.nombre,
                rol: admin.rol,
                type: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    nombre: admin.nombre,
                    email: admin.email,
                    rol: admin.rol
                }
            }
        });
        
    } catch (error) {
        console.error('Error en login admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Login de empleados (usando RUT)
router.post('/login/empleado', async (req, res) => {
    try {
        const { rut } = req.body;
        
        if (!rut) {
            return res.status(400).json({
                success: false,
                message: 'RUT requerido'
            });
        }
        
        // Intentar primero búsqueda directa por RUT
        console.log('🔍 Buscando empleado con RUT:', rut);
        let empleado = await get(
            'SELECT * FROM empleados WHERE rut = ? AND activo = 1',
            [rut]
        );
        
        // Si no se encuentra, intentar con normalización
        if (!empleado) {
            console.log('🔍 No encontrado con RUT directo, intentando normalización...');
            const rutLimpio = rut.replace(/[\.-]/g, '');
            empleado = await get(
                'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
                [rutLimpio]
            );
        }
        
        console.log('🔍 Empleado encontrado:', empleado ? `ID: ${empleado.id}, Nombre: ${empleado.nombre}` : 'No encontrado');
        
        if (!empleado) {
            return res.status(401).json({
                success: false,
                message: 'RUT no encontrado en el sistema'
            });
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
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: empleado.id,
                    rut: empleado.rut,
                    nombre: empleado.nombre,
                    cargo: empleado.cargo,
                    numero: empleado.numero
                }
            }
        });
        
    } catch (error) {
        console.error('Error en login empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// Logout
router.post('/logout', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Cambiar contraseña (solo admins)
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }
        
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña requeridas'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        const admin = await get(
            'SELECT password_hash FROM usuarios_admin WHERE id = ?',
            [req.user.id]
        );
        
        const passwordMatch = await bcrypt.compare(currentPassword, admin.password_hash);
        
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }
        
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        
        await run(
            'UPDATE usuarios_admin SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;