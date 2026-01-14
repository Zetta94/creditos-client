# Arquitectura de Conexión - Dashboard Créditos

## 📐 Diagrama General

```
┌─────────────────────────────────────┐
│     CREDITOS-CLIENT (React)         │
│     Puerto: 5173                     │
│  ┌─────────────────────────────────┐ │
│  │  Components (JSX)               │ │
│  │  - Pages                        │ │
│  │  - Components                   │ │
│  └────────────┬────────────────────┘ │
│               │                       │
│  ┌────────────▼────────────────────┐ │
│  │  Redux Store                    │ │
│  │  - authSlice                    │ │
│  │  - clientsSlice                 │ │
│  │  - creditsSlice                 │ │
│  │  - paymentsSlice                │ │
│  └────────────┬────────────────────┘ │
│               │                       │
│  ┌────────────▼────────────────────┐ │
│  │  Services (api.js)              │ │
│  │  - axios instance               │ │
│  │  - Token en localStorage        │ │
│  └────────────┬────────────────────┘ │
└───────────────┼──────────────────────┘
                │ HTTP/REST
                │ Authorization: Bearer <token>
                │ CORS allowed from localhost:5173
                │
┌───────────────▼──────────────────────────┐
│    CREDITOS-API (Express.js)             │
│    Puerto: 3000                           │
│  ┌────────────────────────────────────┐  │
│  │  Routes (/api/...)                │  │
│  │  GET, POST, PUT, DELETE            │  │
│  └─────────────┬──────────────────────┘  │
│                │                          │
│  ┌─────────────▼──────────────────────┐  │
│  │  Middlewares                       │  │
│  │  - authMiddleware (verifica JWT)  │  │
│  │  - requireRole (verifica roles)    │  │
│  │  - validate (valida Zod)          │  │
│  └─────────────┬──────────────────────┘  │
│                │                          │
│  ┌─────────────▼──────────────────────┐  │
│  │  Controllers                       │  │
│  │  - Lógica de request/response     │  │
│  └─────────────┬──────────────────────┘  │
│                │                          │
│  ┌─────────────▼──────────────────────┐  │
│  │  Services                          │  │
│  │  - Lógica de negocio              │  │
│  │  - Validaciones adicionales       │  │
│  └─────────────┬──────────────────────┘  │
│                │                          │
│  ┌─────────────▼──────────────────────┐  │
│  │  Prisma Client                     │  │
│  │  - ORM para acceso a BD           │  │
│  └─────────────┬──────────────────────┘  │
└────────────────┼──────────────────────────┘
                 │ PostgreSQL
                 │ Connection: creditos_user:password
                 │
         ┌───────▼────────┐
         │  PostgreSQL    │
         │  Puerto: 5432  │
         │  Host: remote  │
         └────────────────┘
```

## 🔄 Flujo de una Petición (Ejemplo: Login)

### 1️⃣ Cliente (Frontend)
```javascript
// creditos-client/src/services/authService.js

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    // Response: { token: "jwt...", user: {...} }
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

**Lo que ocurre:**
1. Usuario ingresa credenciales en formulario
2. Se llama a `loginUser(email, password)`
3. Se prepara POST request a `http://localhost:3000/api/auth/login`
4. Axios envía: `{ email, password }`

### 2️⃣ Viaje por la Red
```
Client Request:
POST http://localhost:3000/api/auth/login
Headers:
  Content-Type: application/json
Body:
  { email: "admin@dashboard.com", password: "password123" }

↓ ↓ ↓ (vía HTTP)

Server Response:
Status: 200 OK
Headers:
  Access-Control-Allow-Origin: http://localhost:5173
Body:
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid123",
      "name": "Admin User",
      "email": "admin@dashboard.com",
      "role": "ADMIN"
    }
  }
```

### 3️⃣ Servidor (Backend)
```typescript
// creditos-api/src/modules/auth/auth.routes.ts

router.post('/login', validate(loginSchema), authController.login);

// creditos-api/src/modules/auth/auth.controller.ts

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // 1. Buscar usuario
  const user = await authService.findUserByEmail(email);
  
  // 2. Verificar contraseña
  const isValid = await authService.verifyPassword(password, user.password);
  
  // 3. Generar JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // 4. Retornar token
  res.json({ token, user });
};
```

### 4️⃣ Acceso a Base de Datos
```typescript
// creditos-api/src/modules/auth/auth.service.ts

export const findUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return user;
};
```

## 🔐 Autenticación y Autorización

### Token JWT
```
Header.Payload.Signature

Ejemplo decodificado:
{
  "id": "cuid123456789",
  "role": "ADMIN",
  "iat": 1704800000,
  "exp": 1704886400  // Expira en 24 horas
}
```

### Flujo de Autenticación en Peticiones Subsecuentes

```javascript
// creditos-client/src/api.js

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Interceptor de request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Lo que sucede:**
1. Cliente hace GET `/api/clients`
2. Axios interceptor añade header: `Authorization: Bearer eyJhbGci...`
3. Servidor valida token con middleware `authMiddleware`
4. Si es válido, continúa; si no, retorna 401 Unauthorized

### Middleware de Autenticación
```typescript
// creditos-api/src/middlewares/auth.ts

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Control de Roles
```typescript
// creditos-api/src/middlewares/requireRole.ts

export const requireRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## 📤 Ejemplo Completo: Crear Cliente

### Frontend
```javascript
// creditos-client/src/pages/AgregarCliente.jsx

const handleSubmit = async (formData) => {
  try {
    const response = await api.post('/clients', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address
    });
    
    // Actualizar Redux store
    dispatch(addClient(response.data));
    
    // Mostrar toast de éxito
    toast.success('Cliente creado exitosamente');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error al crear cliente');
  }
};
```

### Backend
```typescript
// creditos-api/src/modules/client/client.controller.ts

export const createClient = async (req: Request, res: Response) => {
  const { name, email, phone, address } = req.body;
  
  // Validación automática por Zod
  const validated = createClientSchema.parse(req.body);
  
  // Crear en BD
  const client = await prisma.client.create({
    data: validated
  });
  
  // Retornar cliente creado
  res.status(201).json(client);
};
```

### Base de Datos
```sql
-- Tabla Cliente
CREATE TABLE "Client" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Client" (name, email, phone, address)
VALUES ('Juan Pérez', 'juan@example.com', '123456789', 'Calle 123');
```

## 🛣️ Rutas Disponibles

### Autenticación (Sin protección)
```
POST   /api/auth/login              Iniciar sesión
POST   /api/auth/register           Registrar usuario
GET    /api/auth/me                 Obtener usuario actual
```

### Clientes (Requiere authMiddleware)
```
GET    /api/clients                 Listar todos
GET    /api/clients/:id             Obtener uno
POST   /api/clients                 Crear
PUT    /api/clients/:id             Actualizar
DELETE /api/clients/:id             Eliminar
```

### Créditos (Requiere authMiddleware)
```
GET    /api/credits                 Listar todos
GET    /api/credits/:id             Obtener uno
POST   /api/credits                 Crear
PUT    /api/credits/:id             Actualizar
DELETE /api/credits/:id             Eliminar
```

### Pagos (Requiere authMiddleware)
```
GET    /api/payments                Listar todos
POST   /api/payments                Registrar pago
```

### Usuarios (Requiere authMiddleware + ADMIN)
```
GET    /api/users                   Listar usuarios
POST   /api/users                   Crear usuario
PUT    /api/users/:id               Actualizar
DELETE /api/users/:id               Eliminar
```

### Reportes (Requiere authMiddleware)
```
GET    /api/reports                 Obtener reportes
```

### Mensajes (Requiere authMiddleware + ADMIN)
```
GET    /api/messages                Listar mensajes
POST   /api/messages                Crear mensaje
```

### Asignaciones (Requiere authMiddleware + ADMIN)
```
GET    /api/assignments             Listar asignaciones
POST   /api/assignments             Crear asignación
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

**User**
```
id (PK)
name
email (UNIQUE)
password (hash)
role (ENUM: ADMIN, EMPLOYEE, COBRADOR)
salary
phone
address
createdAt
updatedAt
```

**Client**
```
id (PK)
name
email
phone
address
reliability (ENUM: MUYALTA, ALTA, MEDIA, BAJA, MOROSO)
createdAt
updatedAt
assignedTo (FK -> User)
```

**Credit**
```
id (PK)
clientId (FK -> Client)
amount
interestRate
creditType (ENUM: DAILY, WEEKLY, MONTHLY)
status (ENUM: PENDING, PAID, OVERDUE)
startDate
endDate
createdAt
updatedAt
```

**Payment**
```
id (PK)
creditId (FK -> Credit)
amount
paymentDate
method
createdAt
```

## ⚙️ Variables de Entorno Clave

### API (.env)
```
DATABASE_URL         - Conexión a PostgreSQL
PORT                 - Puerto del servidor (3000)
JWT_SECRET           - Clave para firmar tokens JWT
NODE_ENV             - development o production
CORS_ORIGIN          - URL del cliente (http://localhost:5173)
```

### Cliente (.env)
```
VITE_API_URL        - URL base de la API (http://localhost:3000/api)
```

## 🧪 Testing de la Conexión

### Verificar API
```bash
curl -X GET http://localhost:3000/health
# Respuesta: {"ok":true}
```

### Verificar CORS
```bash
curl -X OPTIONS http://localhost:3000/api/clients \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
# Debe retornar Access-Control-Allow-Origin header
```

### Verificar JWT
```bash
# 1. Obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dashboard.com","password":"password123"}'

# 2. Usar token
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer <token>"
```

## 🚀 Deployment

### Producción - Variables de Entorno
```
DATABASE_URL=postgresql://creditos_user:password@prod-host:5432/creditos_db
PORT=3000
JWT_SECRET=<valor_secreto_largo_y_seguro>
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
```

### Build
```bash
# API
npm run build
node dist/server.js

# Cliente
npm run build
# Archivos listos en dist/
```

## 📋 Checklist de Integración

- [ ] Ambas variables .env configuradas
- [ ] Base de datos PostgreSQL accesible
- [ ] `npm install` ejecutado en ambas carpetas
- [ ] `npm run prisma:migrate` ejecutado
- [ ] API corriendo sin errores
- [ ] Cliente cargando sin errores CORS
- [ ] Login funciona y guarda token
- [ ] Peticiones subsecuentes incluyen token
- [ ] CRUD de clientes funciona
- [ ] CRUD de créditos funciona
- [ ] Reportes cargan datos
- [ ] Roles se aplican correctamente
