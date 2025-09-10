-- Script para agregar campos de autenticación a empleados
-- Ejecutar en Supabase SQL Editor

-- Agregar campos de contraseña y verificación de email a la tabla empleados
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_ultimo_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primer_login BOOLEAN DEFAULT TRUE;

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_empleados_email ON empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_token ON empleados(token_verificacion);

-- Crear tabla para tokens de verificación de email (opcional, por seguridad extra)
CREATE TABLE IF NOT EXISTS tokens_verificacion_email (
    id BIGSERIAL PRIMARY KEY,
    empleado_id BIGINT NOT NULL,
    token VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    expira_en TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- Índice para tokens
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens_verificacion_email(token);
CREATE INDEX IF NOT EXISTS idx_tokens_empleado ON tokens_verificacion_email(empleado_id);

-- Comentarios
COMMENT ON COLUMN empleados.password_hash IS 'Hash bcrypt de la contraseña del empleado';
COMMENT ON COLUMN empleados.email_verificado IS 'Indica si el email ha sido verificado';
COMMENT ON COLUMN empleados.token_verificacion IS 'Token temporal para verificación de email';
COMMENT ON COLUMN empleados.primer_login IS 'True si es el primer login del empleado';

COMMENT ON TABLE tokens_verificacion_email IS 'Tokens para verificación de correos electrónicos';