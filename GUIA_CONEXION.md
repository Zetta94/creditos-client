# Guía de Conexión Completa - Dashboard Créditos

Esta guía explica cómo conectar completamente el proyecto, integrando creditos-api y creditos-client.

## 📋 Estructura del Proyecto

El proyecto está compuesto por dos repositorios:
- **creditos-api**: Backend en Express + TypeScript + Prisma + PostgreSQL
- **creditos-client**: Frontend en React + Vite + Redux + TailwindCSS

## 🔧 Configuración del API (creditos-api)

### 1. Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz de `creditos-api` basado en `.env.example`:

```bash
cp .env.example .env
```

**Archivo `.env` completado:**
```
DATABASE_URL=postgresql://creditos_user:zetta94636.@66.97.46.168:5432/creditos_db
PORT=3000
JWT_SECRET=tu_jwt_secret_muy_seguro_minimo_32_caracteres
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_PATH=./logs
```

### 3. Instalación de Dependencias
```bash
cd creditos-api
npm install
```

### 4. Configurar Base de Datos
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear/migrar la base de datos
npm run prisma:migrate

# Seedear datos iniciales (opcional)
npm run seed
```

### 5. Iniciar el API
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`
Health check: `http://localhost:3000/health`

## 🎨 Configuración del Cliente (creditos-client)

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz de `creditos-client`:

```bash
cp .env.example .env
```

**Archivo `.env` completado:**
```
VITE_API_URL=http://localhost:3000/api
```

### 2. Instalación de Dependencias
```bash
cd creditos-client
npm install
```

### 3. Iniciar el Cliente en Desarrollo
```bash
npm run dev
```

El cliente estará disponible en: `http://localhost:5173`

## 🌐 Conexión entre API y Cliente

### Cómo funciona:

1. **Cliente hace peticiones** al API mediante `src/api.js`:
   ```javascript
   const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
   ```
   - URL base: `http://localhost:3000/api`

2. **Autenticación JWT**:
   - El token se almacena en `localStorage`
   - Se envía automáticamente en el header `Authorization: Bearer <token>`
   - Interceptor de axios en `src/api.js` añade el token a cada request

3. **CORS habilitado** en el API:
   - El API permite requests desde `http://localhost:5173` (cliente local)
   - Configurado en `src/app.ts` con `cors()`

## 📡 Rutas del API

Todas las rutas requieren autenticación (excepto `/auth`):

```
POST   /api/auth/login           - Iniciar sesión
POST   /api/auth/register        - Registrar nuevo usuario
GET    /api/auth/me              - Obtener usuario actual

GET    /api/clients              - Listar clientes
POST   /api/clients              - Crear cliente
PUT    /api/clients/:id          - Actualizar cliente
DELETE /api/clients/:id          - Eliminar cliente

GET    /api/credits              - Listar créditos
POST   /api/credits              - Crear crédito
PUT    /api/credits/:id          - Actualizar crédito

GET    /api/payments             - Listar pagos
POST   /api/payments             - Registrar pago

GET    /api/reports              - Reportes
GET    /api/messages             - Mensajes
GET    /api/assignments          - Asignaciones
GET    /api/users                - Usuarios (solo ADMIN)
```

## 🚀 Ejecución Completa

### Terminal 1 - API:
```bash
cd creditos-api
npm run dev
```
Esperar: `[server] Listening on http://localhost:3000`

### Terminal 2 - Cliente:
```bash
cd creditos-client
npm run dev
```
Esperado: `VITE v7.1.9 ready in XXX ms`

### Acceder a la aplicación:
```
http://localhost:5173
```

## 🔐 Usuarios de Prueba

Después de ejecutar `npm run seed` en el API, puedes usar:
- Email: `admin@dashboard.com` - Contraseña: `password123`
- Email: `user@dashboard.com` - Contraseña: `password123`

(Verifica el archivo `src/prisma/seed.ts` para ver las credenciales exactas)

## 📝 Estructura de Peticiones

### Ejemplo: Login
```javascript
// En creditos-client/src/services/authService.js
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  // Respuesta: { token, user: { id, name, role, ... } }
  return response.data;
};
```

### Flujo de autenticación:
1. Usuario inicia sesión en el cliente
2. Cliente envía credenciales al API
3. API valida y retorna JWT token
4. Cliente almacena token en localStorage
5. Siguientes peticiones incluyen token automáticamente

## 🛠️ Build para Producción

### API:
```bash
cd creditos-api
npm run build
npm start
```

### Cliente:
```bash
cd creditos-client
npm run build
```
Genera carpeta `dist/` lista para deploy

## 📊 Roles de Usuario

- **ADMIN**: Acceso total
- **EMPLOYEE**: Acceso a funcionalidades generales
- **COBRADOR**: Acceso limitado (cobros y reportes)

## 🐛 Troubleshooting

### Error: "ECONNREFUSED" en el cliente
- Verifica que el API esté corriendo en puerto 3000
- Verifica variable `VITE_API_URL` correcta en `.env`

### Error: "JWT inválido"
- Limpia localStorage: `localStorage.clear()`
- Vuelve a iniciar sesión

### Error: "DATABASE_URL inválida"
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales: `creditos_user:zetta94636.`
- Verifica host: `66.97.46.168`

### Error: "CORS error"
- Verifica que `CORS_ORIGIN` en API sea correcto
- Por defecto es `http://localhost:5173`

## 📚 Servicios Principales

### Frontend (creditos-client/src/services/):
- `authService.js` - Autenticación
- `clientsService.js` - Gestión de clientes
- `creditsService.js` - Gestión de créditos
- `paymentsService.js` - Registro de pagos
- `reportsService.js` - Reportes
- `usersService.js` - Gestión de usuarios
- `messagesService.js` - Mensajes
- `assignmentsService.js` - Asignaciones

### Backend (creditos-api/src/modules/):
- `auth/` - Autenticación y JWT
- `client/` - CRUD de clientes
- `credits/` - CRUD de créditos
- `payments/` - CRUD de pagos
- `reports/` - Reportes
- `users/` - Gestión de usuarios
- `messages/` - Sistema de mensajes
- `assignments/` - Asignación de clientes

## ✅ Checklist de Verificación

- [ ] Clonar ambos repositorios
- [ ] Crear archivos `.env` en ambas carpetas
- [ ] `npm install` en creditos-api
- [ ] `npm install` en creditos-client
- [ ] Base de datos PostgreSQL creada y accesible
- [ ] `npm run prisma:migrate` ejecutado
- [ ] API corriendo en puerto 3000
- [ ] Cliente corriendo en puerto 5173
- [ ] Poder iniciar sesión desde la interfaz
- [ ] Operaciones CRUD funcionando

## 📞 Servidor de Producción

**Servidor:** `66.97.46.168`
**Usuario SSH:** `app`
**Contraseña:** `Franco636.elimperios`

Base de datos PostgreSQL está en este servidor en puerto 5432.
