# 👥 SUPERVISORES Y SUBORDINADOS - DÓNDE VER LOS PERMISOS

## 🎯 **UBICACIÓN DE LOS PERMISOS DE TRABAJADORES A CARGO**

Los permisos de trabajadores que supervisas se encuentran en el **Portal del Empleado** con una pestaña especial para supervisores.

---

## 🚀 **CÓMO ACCEDER:**

### 1. **Iniciar Sesión Como Empleado Supervisor**
```
1. Ir a: http://localhost:3446
2. Ingresar tu RUT (sin contraseña)
3. Sistema automáticamente detecta si eres supervisor
```

### 2. **Pestaña de Supervisión Automática**
Si eres supervisor, el sistema mostrará automáticamente:
- ✅ **Pestaña "Supervisión"** en tu portal
- 👁️ **Lista de subordinados** bajo tu cargo
- 📋 **Solicitudes pendientes** de tus trabajadores

---

## 📊 **JERARQUÍA DE SUPERVISORES CONFIGURADA:**

| Supervisor | Subordinados | Nivel |
|------------|-------------|-------|
| **Andrea Naguelquin** | Francisco Mancilla | Supervisor Directo |
| **Ronny Cisterna** | Miguel Rodriguez | Supervisor Superior |
| **Patricio Bravo** | - | Autoridad Máxima |

### **Configuración Específica:**
```javascript
// Jerarquía programada en el sistema:
jerarquiaSupervisores = {
    'andrea': ['francisco', 'mancilla'],
    'ronny': ['miguel', 'rodriguez'], 
    'cisterna': ['miguel', 'rodriguez'],
    'patricio': [], // Autoridad máxima
    'bravo': []     // Autoridad máxima
};
```

---

## 🔍 **DETECCIÓN AUTOMÁTICA DE SUPERVISORES:**

El sistema detecta automáticamente si eres supervisor mediante:

1. **Campo `visualizacion`** en base de datos
2. **Campo `autorizacion`** en base de datos  
3. **Lista de nombres** específicos (andrea, ronny, cisterna, patricio, bravo)

### **Ejemplo de Detección:**
```javascript
// Si tu nombre contiene estas palabras, eres supervisor:
const supervisores = ['andrea', 'ronny', 'cisterna', 'patricio', 'bravo'];

// Verificación automática al hacer login
if (empleado.visualizacion === true || empleado.autorizacion === true) {
    mostrarPestañaSupervision();
}
```

---

## 🛠️ **FUNCIONALIDADES DE SUPERVISIÓN:**

### **Para Supervisores Directos (ej: Andrea):**
- 👁️ **Ver solicitudes PENDIENTES** de subordinados
- ✅ **Aprobar/Rechazar** permisos de trabajadores a cargo
- 📧 **Recibir notificaciones** de nuevas solicitudes

### **Para Supervisores Superiores (ej: Ronny):**
- 👁️ **Ver solicitudes APROBADAS** por supervisor directo
- ✅ **Autorización final** de permisos
- 📊 **Vista general** de todo el equipo

### **Para Autoridades Máximas (ej: Patricio):**
- 👁️ **Vista completa** de todas las solicitudes
- ✅ **Aprobación directa** sin niveles previos
- 📈 **Dashboard administrativo** completo

---

## 📱 **INTERFAZ DE SUPERVISIÓN:**

### **Pestañas Visibles:**
1. **"Mis Solicitudes"** - Tus propias solicitudes de permiso
2. **"Supervisión"** - Solicitudes de trabajadores a tu cargo ⭐
3. **"Perfil"** - Tu información personal

### **En la Pestaña "Supervisión" verás:**
```
📋 SOLICITUDES DE MIS TRABAJADORES

┌─────────────────────────────────────────────────────┐
│ Francisco Mancilla Vargas                           │
│ RUT: 12.345.678-9                                 │
│ Tipo: T (Turno Toda la jornada)                   │
│ Fecha: 2025-01-25                                 │
│ Motivo: Cita médica familiar                      │
│ Estado: PENDIENTE                                 │
│                                                    │
│ [✅ APROBAR]  [❌ RECHAZAR]                        │
└─────────────────────────────────────────────────────┘
```

---

## 🚦 **ESTADOS DE SOLICITUDES:**

| Estado | Descripción | Quién ve |
|--------|-------------|----------|
| **PENDIENTE** | Recién creada | Supervisor directo |
| **APROBADO_SUPERVISOR** | Aprobada por supervisor directo | Supervisor superior |
| **APROBADO** | Completamente aprobada | Todos |
| **RECHAZADO** | Rechazada | Empleado y supervisores |

---

## 🔧 **ENDPOINTS DEL SISTEMA:**

### **Para obtener subordinados:**
```
GET /api/solicitudes-empleado/subordinados
Authorization: Bearer [tu_token_jwt]
```

### **Para aprobar solicitudes:**
```
POST /api/solicitudes-empleado/aprobar-supervisor/:id
Authorization: Bearer [tu_token_jwt]
```

### **Para rechazar solicitudes:**
```
POST /api/solicitudes-empleado/rechazar-supervisor/:id
Authorization: Bearer [tu_token_jwt]
Body: { "motivo": "Razón del rechazo" }
```

---

## ✅ **PASOS PARA VER LOS PERMISOS DE TUS TRABAJADORES:**

### **MÉTODO 1: Acceso Directo**
1. **Abrir**: `http://localhost:3446`
2. **Ingresar**: Tu RUT (ej: `15.678.901-2`)
3. **Buscar**: Pestaña "Supervisión" automáticamente visible
4. **Revisar**: Lista de solicitudes pendientes

### **MÉTODO 2: Verificar si eres Supervisor**
```javascript
// En consola del navegador:
verificarSupervisores()

// Debería mostrar:
// "✅ Usuario identificado como supervisor: [Tu Nombre]"
```

---

## 📧 **SISTEMA DE NOTIFICACIONES:**

### **Recibes notificación cuando:**
- 📨 Subordinado crea **nueva solicitud**
- ⏰ Solicitud requiere **tu aprobación**
- ✅ Solicitud ha sido **aprobada/rechazada**

### **Ubicación de notificaciones:**
- 🔔 **Badge en pestaña** "Supervisión"
- 📱 **Lista dentro** del portal
- 📧 **Email** (si está configurado)

---

## 🎉 **EJEMPLO PRÁCTICO:**

### **Andrea Naguelquin puede ver:**
1. **Sus propios permisos** en "Mis Solicitudes"
2. **Permisos de Francisco** en "Supervisión"
3. **Aprobar/Rechazar** solicitudes de Francisco
4. **Recibir notificaciones** cuando Francisco solicita permisos

### **Francisco Mancilla puede ver:**
1. **Solo sus propios permisos** en "Mis Solicitudes"
2. **NO tiene pestaña** "Supervisión" (no es supervisor)

---

**🔗 URL del Sistema**: `http://localhost:3446`

**✨ ¡La pestaña de "Supervisión" aparece automáticamente si tienes trabajadores a cargo!**

---

*Fecha de actualización: 12 de septiembre de 2025*
*Sistema funcionando en puerto 3446*