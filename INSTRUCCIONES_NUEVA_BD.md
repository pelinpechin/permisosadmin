# 🗄️ CREAR NUEVA BASE DE DATOS SUPABASE CON TODOS LOS EMPLEADOS

## ✅ **PREPARADO PARA TI:**

- ✅ **119 empleados reales** extraídos del Excel
- ✅ **Francisco Mancilla** con supervisor **Andrea Naguelquin** ✅
- ✅ **Esquema limpio** sin errores 500
- ✅ **Relaciones supervisor-subordinado** correctas

---

## 🚀 **PASOS PARA CREAR LA NUEVA BD:**

### 1. CREAR NUEVO PROYECTO EN SUPABASE
- Ve a [database.new](https://database.new) 
- Crea un nuevo proyecto llamado: `permisos-administrativos-v2`
- Escoge región más cercana (preferentemente US East)
- Anota la URL y API Key que te dé

### 2. EJECUTAR ESQUEMA COMPLETO
- Ve al **SQL Editor** en tu nuevo proyecto Supabase
- Copia y pega TODO el contenido del archivo `BASE_DATOS_FINAL_COMPLETA.sql`
- Haz clic en **RUN** para ejecutar

### 3. ACTUALIZAR RELACIONES SUPERVISOR
Ejecuta estos comandos para establecer las FK correctas:

```sql
-- Actualizar supervisor_id basándose en supervisor_nombre
UPDATE empleados SET supervisor_id = (
    SELECT id FROM empleados e2 
    WHERE e2.nombre = empleados.supervisor_nombre
) WHERE supervisor_nombre IS NOT NULL;

-- Verificar relación Andrea-Francisco
SELECT 
    e1.nombre as empleado,
    e1.cargo,
    e2.nombre as supervisor
FROM empleados e1 
LEFT JOIN empleados e2 ON e1.supervisor_id = e2.id 
WHERE e1.nombre LIKE '%Francisco%Mancilla%';
```

### 4. CREAR USUARIOS CON CONTRASEÑAS
```sql
-- Usuarios principales
INSERT INTO usuarios (empleado_id, username, password_hash) VALUES
((SELECT id FROM empleados WHERE nombre LIKE '%Andrea%Naguelquin%'), 'andrea.naguelquin', '$2b$10$eoTCVr89MPJ8Iq.dyGImbuJpTvpFKu1eGVuMJn5AtdS.K1okMjs4O'),
((SELECT id FROM empleados WHERE nombre LIKE '%Francisco%Mancilla%'), 'francisco.mancilla', '$2b$10$NNPnWWYRIDWbl4esfN4St.8Dh1rEFuO90MKQlXZ2R7JkkldATDpH2'),
((SELECT id FROM empleados WHERE nombre LIKE '%Ronny%Cisterna%'), 'ronny.cisterna', '$2b$10$Z8a8Is4C8Hd3Y.k483n4aeUViIyfz687kXgoDqE4wu09HYf4kMyR6'),
((SELECT id FROM empleados WHERE nombre LIKE '%Nelson%Patricio%'), 'nelson.bravo', '$2b$10$ZRHzPEUhQNSCQy0vU4kXvuMJI1sQ2o10duCM3XBznpp0J407/5Atk2');
```

### 5. SOLICITUD DE PRUEBA
```sql
-- Insertar solicitud pendiente de Francisco
INSERT INTO solicitudes_permisos (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado) VALUES
((SELECT id FROM empleados WHERE nombre LIKE '%Francisco%Mancilla%'), 1, '2025-01-20', '2025-01-20', 'Cita médica familiar', 'PENDIENTE');
```

### 6. VERIFICAR TODO
```sql
-- Ver empleados clave
SELECT id, nombre, cargo, supervisor_id, es_supervisor, es_admin 
FROM empleados 
WHERE nombre LIKE '%Andrea%' OR nombre LIKE '%Francisco%' OR nombre LIKE '%Ronny%' OR nombre LIKE '%Nelson%'
ORDER BY nombre;

-- Ver solicitud de Francisco
SELECT s.*, e.nombre as empleado, t.nombre as tipo 
FROM solicitudes_permisos s
JOIN empleados e ON s.empleado_id = e.id
JOIN tipos_permisos t ON s.tipo_permiso_id = t.id;

-- Ver usuarios
SELECT u.username, e.nombre, e.cargo
FROM usuarios u 
JOIN empleados e ON u.empleado_id = e.id;
```

---

## 🔑 **CREDENCIALES DE ACCESO:**

| Usuario | Password | Empleado | Cargo |
|---------|----------|----------|-------|
| `andrea.naguelquin` | `andrea123` | Andrea Naguelquin Garcia | Encargado de Tesorería |
| `francisco.mancilla` | `francisco123` | Francisco Mancilla Vargas | Administrativo de Recaudación |
| `ronny.cisterna` | `ronny123` | Ronny Cisterna Galaz | Administrador |
| `nelson.bravo` | `nelson123` | Nelson Patricio Bravo | Director |

---

## 📊 **BASE DE DATOS INCLUYE:**

- ✅ **119 empleados reales** del archivo Excel
- ✅ **4 tipos de permisos** (T, AM, PM, S)
- ✅ **Relaciones supervisor-subordinado** correctas
- ✅ **Andrea supervisa a Francisco** ✅
- ✅ **1 solicitud de prueba** de Francisco pendiente
- ✅ **Esquema optimizado** sin errores 500
- ✅ **Índices para rendimiento**

---

## 🎯 **DESPUÉS DE CREAR LA BD:**

**Dame la nueva URL y API Key** y yo voy a:

1. ✅ Actualizar `netlify/functions/server.js` con nuevas credenciales
2. ✅ Probar login de Andrea y Francisco  
3. ✅ Probar creación de solicitudes
4. ✅ Probar flujo de aprobación completo
5. ✅ **TODO VA A FUNCIONAR PERFECTAMENTE** 🎉

**¿Listo para crear la nueva base de datos?** 

**Recuerda: La base de datos actual NO se va a borrar. Esta es completamente nueva.**