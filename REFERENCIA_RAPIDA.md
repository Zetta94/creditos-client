# 🎯 REFERENCIA RÁPIDA - Comandos Esenciales

## 🚀 INICIO LOCAL

### Opción 1: Automático (Windows)
```batch
start-dev.bat
```

### Opción 2: Manual
```bash
# Terminal 1 - API
cd creditos-api
npm run dev

# Terminal 2 - Cliente
cd creditos-client  
npm run dev
```

---

## ⚙️ CONFIGURACIÓN INICIAL (Primera Vez)

```bash
# API
cd creditos-api
npm install
npm run prisma:generate
npm run prisma:migrate
cp .env.example .env
# Editar .env con DATABASE_URL

# Cliente
cd creditos-client
npm install
cp .env.example .env
# Verificar VITE_API_URL=http://localhost:3000/api
```

---

## 🔧 COMANDOS API

```bash
# Desarrollo
npm run dev              # Iniciar servidor (watch mode)

# Producción
npm run build            # Compilar TypeScript
npm start                # Iniciar servidor compilado

# Base de datos
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Crear migraciones
npm run seed             # Poblar datos iniciales
npm run ps               # Abrir Prisma Studio

# Testing
npm run lint             # Verificar código
```

---

## 🔧 COMANDOS CLIENTE

```bash
# Desarrollo
npm run dev              # Iniciar dev server (Vite)
npm run preview          # Preview de build

# Producción
npm run build            # Compilar a dist/

# Calidad
npm run lint             # Verificar con ESLint
```

---

## 📍 URLs DE ACCESO

```
Cliente:        http://localhost:5173
API:            http://localhost:3000
API Health:     http://localhost:3000/health
Prisma Studio: http://localhost:5555  (si lo abres)
```

---

## 📝 VARIABLES DE ENTORNO CLAVE

### creditos-api/.env
```
DATABASE_URL=postgresql://creditos_user:zetta94636.@66.97.46.168:5432/creditos_db
PORT=3000
JWT_SECRET=tu_secreto_aqui_minimo_32_caracteres
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### creditos-client/.env
```
VITE_API_URL=http://localhost:3000/api
```

---

## 🔑 CREDENCIALES DE PRUEBA

```
Email:    admin@dashboard.com
Password: password123
```

(Después de ejecutar `npm run seed` en el API)

---

## 🆘 ERRORES COMUNES

| Error | Solución |
|-------|----------|
| `Cannot find module` | `npm install` |
| `ECONNREFUSED` | Verificar que API esté corriendo en 3000 |
| `DATABASE_URL not found` | Crear archivo `.env` |
| `CORS error` | Verificar `CORS_ORIGIN` en API |
| `Port already in use` | Cambiar puerto en `.env` o matar proceso |
| `JWT invalid` | Limpiar localStorage: `localStorage.clear()` |

---

## 📡 RUTAS API PRINCIPALES

```
# Auth (sin protección)
POST   /api/auth/login
POST   /api/auth/register

# Clientes
GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id

# Créditos
GET    /api/credits
POST   /api/credits
PUT    /api/credits/:id

# Pagos
GET    /api/payments
POST   /api/payments

# Reportes
GET    /api/reports

# Usuarios (solo ADMIN)
GET    /api/users
POST   /api/users
```

---

## 💻 GIT WORKFLOW

```bash
# Actualizar código
git pull origin main

# Crear rama para cambios
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commit
git add .
git commit -m "Descripción del cambio"

# Push a repositorio
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Después de merge...

# Volver a main
git checkout main
git pull origin main
```

---

## 🔐 ROLES Y PERMISOS

```
ADMIN:
  - Gestión completa de usuarios
  - Ver todas las asignaciones
  - Ver mensajes
  - Acceso a reportes
  - CRUD clientes y créditos

EMPLOYEE:
  - Ver clientes asignados
  - Crear/editar créditos
  - Registrar pagos
  - Ver reportes básicos

COBRADOR:
  - Ver clientes asignados
  - Registrar pagos
  - Ver reportes de cobros
```

---

## 🐛 DEBUGGING

### Ver logs de API
```bash
tail -f creditos-api/logs/access.log
```

### Ver logs del cliente
Abrir DevTools: `F12` → Console

### Verificar conexión a BD
```bash
psql -U creditos_user -d creditos_db -h 66.97.46.168
```

### Verificar API está vivo
```bash
curl http://localhost:3000/health
```

---

## 📊 MONITOREO

```bash
# Ver procesos con PM2 (en producción)
pm2 status
pm2 logs
pm2 monit

# Ver estadísticas
pm2 show app-name
```

---

## 🚀 DEPLOYMENT

```bash
# Compilar
npm run build

# En servidor
npm install --production
pm2 start ecosystem.config.js
pm2 save
```

---

## 📚 DOCUMENTACIÓN DISPONIBLE

| Archivo | Propósito |
|---------|-----------|
| INICIO_RAPIDO.md | Empezar rápidamente |
| GUIA_CONEXION.md | Entender la arquitectura |
| ARQUITECTURA_CONEXION.md | Detalles técnicos |
| DEPLOYMENT.md | Desplegar a producción |
| README_CONEXION.md | Este resumen |

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [ ] Cambiar JWT_SECRET
- [ ] Verificar DATABASE_URL
- [ ] Verificar CORS_ORIGIN es el dominio correcto
- [ ] npm run build sin errores
- [ ] Testing local completado
- [ ] Logs configurados
- [ ] Backups de BD programados
- [ ] SSL certificado obtenido
- [ ] Nginx configurado

---

## 📞 CONTACTO / SOPORTE

**Servidor de Producción:**
- Host: 66.97.46.168
- Usuario: app
- Contraseña: Franco636.elimperios

**Base de Datos:**
- Usuario: creditos_user
- Contraseña: zetta94636.

---

**Última actualización:** 9 de enero de 2026

*Para información más detallada, consulta los archivos de documentación específicos.*
