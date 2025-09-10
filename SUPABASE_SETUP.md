# 🚀 Configuración de Supabase para Sistema de Permisos

Esta guía te ayudará a migrar tu sistema de permisos administrativos de SQLite a Supabase.

## 📋 Pasos para Configurar Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - **Nombre**: `permisos-administrativos`
   - **Región**: Elige la más cercana (ej: South America para Chile)
   - **Plan**: Starter (gratis) es suficiente para comenzar

### 2. Configurar Base de Datos

1. Ve a **SQL Editor** en tu proyecto Supabase
2. Copia y pega el contenido del archivo `database/supabase_schema.sql`
3. Ejecuta el script para crear las tablas y datos iniciales

### 3. Obtener Credenciales

1. Ve a **Settings > API** en tu proyecto
2. Copia los siguientes valores:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public key** (para operaciones públicas)
   - **service_role key** (para operaciones administrativas - ¡mantén secreta!)

### 4. Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto (copia desde `.env.example`):

```env
# Cambiar a Supabase
DB_TYPE=supabase

# Credenciales de Supabase (reemplazar con tus valores)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui

# JWT (generar una nueva clave segura)
JWT_SECRET=tu_nueva_clave_jwt_super_segura_para_produccion

# Resto de configuración
NODE_ENV=production
PORT=3001
```

### 5. Configurar Row Level Security (RLS)

El esquema ya incluye políticas de seguridad básicas, pero puedes ajustarlas:

1. Ve a **Authentication > Policies** en Supabase
2. Revisa las políticas creadas para cada tabla
3. Ajusta según tus necesidades de seguridad

### 6. Migrar Datos Existentes (Opcional)

Si tienes datos en SQLite que quieres migrar:

```bash
# 1. Exportar datos de SQLite
node scripts/export_sqlite_data.js

# 2. Importar a Supabase usando el SQL Editor
# Copia el contenido generado y pégalo en Supabase
```

### 7. Probar la Conexión

```bash
# Cambiar a modo Supabase y probar
npm run test-supabase
```

## 🔧 Configuración para Producción

### Variables de Entorno en Netlify

Si usas Netlify, configura estas variables en el dashboard:

```
DB_TYPE=supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
JWT_SECRET=tu-clave-jwt-production
```

### Dominios Autorizados

1. Ve a **Authentication > Settings** en Supabase
2. Agrega tu dominio a la lista de URLs autorizadas:
   - `http://localhost:3001` (desarrollo)
   - `https://tu-app.netlify.app` (producción)

## 📊 Ventajas de Supabase

✅ **Base de datos PostgreSQL** escalable
✅ **Dashboard web** para administrar datos
✅ **APIs REST automáticas** generadas
✅ **Row Level Security** para seguridad granular
✅ **Backups automáticos**
✅ **Monitoreo en tiempo real**
✅ **Escalabilidad automática**

## 🔒 Consideraciones de Seguridad

1. **Service Role Key**: Solo usar en el backend, nunca exponer al frontend
2. **RLS Policies**: Revisar y ajustar según tus reglas de negocio
3. **JWT Secret**: Usar una clave fuerte y diferente en producción
4. **Dominios**: Solo autorizar dominios conocidos

## 🧪 Testing

Para probar que todo funciona:

1. Cambia `DB_TYPE=supabase` en tu `.env`
2. Reinicia el servidor: `npm start`
3. Prueba login y creación de solicitudes
4. Verifica en el dashboard de Supabase que los datos se guardan

## 🆘 Troubleshooting

### Error: "Variables de entorno de Supabase no configuradas"
- Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén en el `.env`

### Error: "Invalid API key"
- Verifica que las claves sean correctas y no tengan espacios extra

### Error de conexión
- Verifica que la URL del proyecto sea correcta
- Chequea que el proyecto esté activo en Supabase

### Datos no aparecen
- Revisa las políticas RLS en **Authentication > Policies**
- Verifica que el usuario tenga permisos para ver los datos

## 🔄 Rollback a SQLite

Si necesitas volver a SQLite:

```env
DB_TYPE=sqlite
DATABASE_URL=./database/permisos_admin.db
```

Reinicia el servidor y todo volverá a funcionar con SQLite local.

---

**¿Necesitas ayuda?** Abre un issue en el repositorio o contacta al equipo de desarrollo.