# 🚀 Configuración de Supabase - Guía Paso a Paso

## 1. Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com) 
2. Inicia sesión con tu cuenta
3. Ve al proyecto: `https://ajwinbhvfkzftmlntggo.supabase.co`

## 2. Ejecutar el Esquema Actualizado

1. Ve a **SQL Editor** en el panel izquierdo
2. Copia **TODO** el contenido del archivo: `database/supabase_schema_fixed.sql`
3. Pégalo en el editor SQL
4. Haz clic en **Run** para ejecutarlo

## 3. Verificar que se crearon las tablas

Después de ejecutar el esquema, verifica que se crearon:

### Tablas principales:
- ✅ `empleados` - Con columnas: nombre, rut, email, fecha_nacimiento, etc.
- ✅ `usuarios_admin` - Con roles: SUPER_ADMIN, SUPERVISOR, AUTORIZADOR
- ✅ `tipos_permisos` - 10 tipos de permisos
- ✅ `solicitudes_permisos` - Con campos para supervisor
- ✅ `notificaciones` - Sistema de notificaciones

### Usuarios por defecto creados:
- **admin** / admin123 (SUPER_ADMIN)
- **supervisor** / supervisor123 (SUPERVISOR - solo ve notificaciones)
- **autorizador** / autoriza123 (AUTORIZADOR - puede aprobar)

## 4. Migrar Datos del CSV

Una vez que el esquema esté ejecutado correctamente:

\`\`\`bash
npm run migrate-csv
\`\`\`

## 5. Verificar los Datos

En Supabase, ve a **Table Editor** y verifica:
- Tabla `empleados`: Debería tener ~119 empleados del colegio
- Tabla `usuarios_admin`: 3 usuarios administrativos
- Tabla `tipos_permisos`: 10 tipos de permisos

## 6. Configurar Variables de Entorno

Ya están configuradas en el archivo `.env`:
\`\`\`
DB_TYPE=supabase
SUPABASE_URL=https://ajwinbhvfkzftmlntggo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd2luYmh2Zmt6ZnRtbG50Z2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNzkwNDAsImV4cCI6MjA3MTk1NTA0MH0.PhndfICB1CF1EE3l-ynmp3plFVzp3m3j8jLs3-1qvBk
\`\`\`

## 7. Flujo de Permisos

### Rol SUPERVISOR:
- ✅ Ve todas las solicitudes como notificaciones
- ❌ NO puede aprobar ni rechazar
- ✅ Puede marcar como "visto"

### Rol AUTORIZADOR:
- ✅ Ve todas las solicitudes
- ✅ Puede aprobar o rechazar permisos
- ✅ Recibe notificaciones

## 8. Probar el Sistema

\`\`\`bash
npm start
\`\`\`

El servidor debería usar Supabase automáticamente.

## 🔧 Comandos Útiles

\`\`\`bash
npm run test-supabase     # Probar conexión
npm run migrate-csv       # Migrar datos del CSV
npm start                # Iniciar servidor con Supabase
\`\`\`

## 📊 Datos del Colegio

El archivo `base.csv` contiene:
- 125 empleados del colegio
- Información completa: RUT, nombre, cargo, supervisor, etc.
- Fechas de ingreso, emails, horas semanales

---

**Importante**: Ejecuta primero el esquema SQL en Supabase antes de la migración.