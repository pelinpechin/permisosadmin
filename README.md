# 🎯 Sistema de Permisos Administrativos - Chile

## 📋 Descripción

Sistema completo de gestión de permisos administrativos diseñado específicamente para organizaciones chilenas. Permite a los empleados solicitar permisos y a los administradores gestionar, aprobar o rechazar dichas solicitudes de manera eficiente.

## ✨ Características Principales

### 👥 Para Empleados
- **Inicio de sesión seguro** con RUT
- **Solicitud de permisos** intuitiva y rápida
- **Dashboard personalizado** con estadísticas
- **Historial completo** de solicitudes
- **Notificaciones** en tiempo real
- **Calendario visual** de permisos

### 🛡️ Para Administradores
- **Panel de control completo** con métricas
- **Gestión de empleados** (CRUD completo)
- **Aprobación/rechazo** de solicitudes
- **Reportes detallados** y exportables
- **Sistema de notificaciones** automatizado
- **Análisis estadístico** avanzado

### 🏷️ Tipos de Permisos Soportados
- **T** - Permiso Jornada Completa
- **AM** - Permiso Primera Media Jornada (Mañana)
- **PM** - Permiso Segunda Media Jornada (Tarde)
- **S** - Permiso Sin Goce de Sueldo
- **BL** - Beneficio Licencia
- **L** - Licencia Médica
- **A** - Atraso
- **AJ** - Atraso Justificado
- **NM** - No Marcación
- **C** - Cumpleaños

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** - Servidor backend
- **Express.js** - Framework web
- **SQLite** - Base de datos (desarrollo/demo)
- **JWT** - Autenticación segura
- **bcryptjs** - Encriptación de contraseñas
- **Nodemailer** - Envío de notificaciones por email

### Frontend
- **HTML5/CSS3/JavaScript** - Tecnologías web estándar
- **Bootstrap 5** - Framework UI responsive
- **Chart.js** - Gráficos y visualizaciones
- **Font Awesome** - Iconografía

### Despliegue
- **Netlify** - Hosting y funciones serverless
- **Netlify Functions** - Backend serverless

## 🏗️ Estructura del Proyecto

```
permisos-administrativos/
├── 📁 database/                 # Base de datos y esquemas
│   ├── db.js                   # Conexión y utilidades de BD
│   └── schema.sql              # Esquema de la base de datos
├── 📁 routes/                  # Rutas de la API
│   ├── auth.js                 # Autenticación
│   ├── empleados.js            # Gestión de empleados
│   ├── permisos.js             # Gestión de permisos
│   └── dashboard.js            # Dashboard y reportes
├── 📁 public/                  # Frontend estático
│   ├── index.html              # Aplicación principal
│   ├── 📁 css/
│   │   └── styles.css          # Estilos personalizados
│   ├── 📁 js/
│   │   ├── app.js              # Aplicación principal
│   │   ├── auth.js             # Manejo de autenticación
│   │   ├── api.js              # Cliente API
│   │   └── utils.js            # Utilidades generales
│   └── 📁 assets/              # Recursos estáticos
├── 📁 netlify/functions/       # Funciones serverless
│   └── server.js               # Función principal de Netlify
├── server.js                   # Servidor principal (desarrollo)
├── package.json                # Dependencias del proyecto
├── netlify.toml               # Configuración de Netlify
└── README.md                  # Documentación
```

## ⚡ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/permisos-administrativos.git
cd permisos-administrativos
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos
DATABASE_URL=./database/permisos_admin.db

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# Entorno
NODE_ENV=development
PORT=3000
```

### 4. Ejecutar en Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# O servidor normal
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Despliegue en Netlify

### 1. Conectar Repositorio
- Conecta tu repositorio a Netlify
- La configuración está en `netlify.toml`

### 2. Variables de Entorno en Netlify
Configurar en el panel de Netlify:
```
JWT_SECRET=tu_clave_secreta_para_produccion
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@empresa.cl
SMTP_PASS=contraseña_aplicacion
```

### 3. Desplegar
```bash
# Build y deploy automático al hacer push a main
git push origin main
```

## 👨‍💼 Usuarios por Defecto

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** Super Administrador

### Empleados de Ejemplo
- **Juan Pérez:** RUT `12345678-9`
- **María García:** RUT `98765432-1`
- **Carlos Rodríguez:** RUT `11111111-1`

## 📱 Características de la Interfaz

### 🎨 Diseño Responsive
- **Mobile-first** - Optimizado para dispositivos móviles
- **Tablets** - Interfaz adaptada para tablets
- **Desktop** - Experiencia completa en escritorio

### 🌙 Soporte para Modo Oscuro
- Detección automática de preferencias del sistema
- Cambio manual disponible

### ♿ Accesibilidad
- **WCAG 2.1** - Cumple estándares de accesibilidad
- **Navegación por teclado** - Totalmente accesible
- **Screen readers** - Compatible con lectores de pantalla

## 🔐 Seguridad

### Autenticación
- **JWT Tokens** con expiración
- **Bcrypt** para hash de contraseñas
- **Rate limiting** para prevenir ataques

### Autorización
- **Roles y permisos** granulares
- **Validación de sesión** en cada request
- **Auto-logout** por inactividad

### Headers de Seguridad
- **CSP** - Content Security Policy
- **HSTS** - HTTP Strict Transport Security
- **X-Frame-Options** - Protección contra clickjacking

## 📊 Características Avanzadas

### Dashboard Interactivo
- **Métricas en tiempo real**
- **Gráficos dinámicos** (Chart.js)
- **KPIs personalizados**
- **Filtros avanzados**

### Sistema de Notificaciones
- **Notificaciones en tiempo real**
- **Email automático** (opcional)
- **Historial de notificaciones**
- **Marcado como leído**

### Reportes y Exportación
- **Exportar a CSV/JSON**
- **Reportes personalizables**
- **Filtros por fechas y tipos**
- **Estadísticas detalladas**

## 🛠️ Desarrollo

### Scripts Disponibles
```bash
npm start          # Servidor producción
npm run dev        # Servidor desarrollo (nodemon)
npm run build      # Build para producción
npm test           # Ejecutar tests (si están configurados)
```

### Estructura de la API

#### Autenticación
```
POST /api/auth/login/admin      # Login administrador
POST /api/auth/login/empleado   # Login empleado
GET  /api/auth/verify           # Verificar token
PUT  /api/auth/change-password  # Cambiar contraseña
POST /api/auth/logout           # Cerrar sesión
```

#### Empleados
```
GET    /api/empleados           # Listar empleados
GET    /api/empleados/:id       # Obtener empleado
POST   /api/empleados           # Crear empleado
PUT    /api/empleados/:id       # Actualizar empleado
DELETE /api/empleados/:id       # Desactivar empleado
```

#### Permisos
```
GET    /api/permisos/tipos      # Tipos de permisos
GET    /api/permisos            # Listar solicitudes
GET    /api/permisos/:id        # Obtener solicitud
POST   /api/permisos            # Crear solicitud
PUT    /api/permisos/:id/estado # Aprobar/rechazar
DELETE /api/permisos/:id        # Cancelar solicitud
```

#### Dashboard
```
GET /api/dashboard/admin        # Dashboard administrador
GET /api/dashboard/empleado     # Dashboard empleado
GET /api/dashboard/reportes     # Reportes
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Error de Base de Datos
```bash
# Recrear base de datos
rm database/permisos_admin.db
npm start
```

#### Error de Permisos en Netlify
- Verificar que las variables de entorno están configuradas
- Revisar los logs de Netlify Functions

#### Error de CORS
- Verificar la configuración de CORS en `netlify.toml`
- Asegurar que el dominio está en la lista permitida

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si necesitas ayuda o tienes preguntas:

- 📧 **Email:** soporte@empresa.cl
- 📱 **WhatsApp:** +56 9 XXXX XXXX
- 🐛 **Issues:** [GitHub Issues](https://github.com/tu-usuario/permisos-administrativos/issues)

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] **Integración con sistemas HR** externos
- [ ] **API REST completa** para integraciones
- [ ] **App móvil nativa** (React Native)
- [ ] **Flujos de aprobación** multinivel
- [ ] **Integración con calendarios** (Google/Outlook)
- [ ] **Reportes avanzados** con BI
- [ ] **Multi-tenancy** para múltiples empresas
- [ ] **Integración con biométricos**

### Mejoras Técnicas
- [ ] **Tests automatizados** (Jest/Cypress)
- [ ] **Docker** containerización
- [ ] **CI/CD** pipeline completo
- [ ] **Base de datos PostgreSQL** para producción
- [ ] **Redis** para cache y sesiones
- [ ] **Microservicios** arquitectura

---

**⭐ Si este proyecto te fue útil, no olvides darle una estrella en GitHub!**

---

<div align="center">
  <p><strong>🇨🇱 Hecho con ❤️ en Chile</strong></p>
  <p>Sistema de Permisos Administrativos - La solución más completa para gestión de permisos en Chile</p>
</div>