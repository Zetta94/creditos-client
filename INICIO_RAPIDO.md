# 🚀 GUÍA RÁPIDA DE INICIO - Dashboard Créditos

## ⚡ Opción 1: Inicio Automático (Windows)

1. En la carpeta raíz del proyecto, doble-clic en:
   ```
   start-dev.bat
   ```

Esto abrirá dos ventanas de terminal automáticamente:
- Terminal 1: API en `http://localhost:3000`
- Terminal 2: Cliente en `http://localhost:5173`

---

## ⚡ Opción 2: Inicio Manual (Recomendado para Control)

### Paso 1: Preparar API

```bash
# 1. Abrir terminal
cd creditos-api

# 2. Instalar dependencias (solo primera vez)
npm install

# 3. Crear .env (basado en .env.example)
copy .env.example .env
# Editar .env con tus credenciales

# 4. Preparar base de datos (solo primera vez)
npm run prisma:generate
npm run prisma:migrate

# 5. Iniciar servidor
npm run dev
```

**Esperar a ver:**
```
[server] Listening on http://localhost:3000
```

---

### Paso 2: Preparar Cliente (en otra terminal)

```bash
# 1. Abrir nueva terminal
cd creditos-client

# 2. Instalar dependencias (solo primera vez)
npm install

# 3. Crear .env (basado en .env.example)
copy .env.example .env
# Verificar que VITE_API_URL=http://localhost:3000/api

# 4. Iniciar cliente
npm run dev
```

**Esperar a ver:**
```
VITE v7.1.9 ready in XXX ms
```

---

## 🌐 Acceder a la Aplicación

Una vez que ambos servicios estén corriendo:

```
Abrir en navegador: http://localhost:5173
```

### Credenciales de Prueba (después de ejecutar seed)
- **Email:** admin@dashboard.com
- **Contraseña:** password123

---

## 📝 Variables de Entorno Necesarias

### creditos-api/.env
```
DATABASE_URL=postgresql://creditos_user:zetta94636.@66.97.46.168:5432/creditos_db
PORT=3000
JWT_SECRET=dev_secret_minimo_32_caracteres
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
LOG_PATH=./logs
```

### creditos-client/.env
```
VITE_API_URL=http://localhost:3000/api
```

---

## 🆘 Troubleshooting

### ❌ "Cannot find module..."
```bash
# Solución:
npm install
```

### ❌ "ECONNREFUSED" - No puede conectar con API
- ✅ Verificar que API esté corriendo en puerto 3000
- ✅ Verificar `VITE_API_URL` en cliente
- ✅ Limpiar cache: `Ctrl+Shift+Delete` en navegador

### ❌ "DATABASE_URL inválida"
- ✅ Verificar credenciales en .env
- ✅ Verificar que PostgreSQL esté accesible
- ✅ Verificar host y puerto

### ❌ "CORS error" en consola
- ✅ Verificar `CORS_ORIGIN` en API
- ✅ Verificar que cliente esté en `http://localhost:5173`
- ✅ Reiniciar API después de cambiar .env

### ❌ Puerto 3000 o 5173 ya en uso
```bash
# Encontrar proceso en puerto 3000 (Windows PowerShell)
Get-Process | Where-Object { $_.Handles -like '*3000*' }

# O cambiar puertos en .env
PORT=3001
# y VITE_API_URL=http://localhost:3001/api
```

---

## 📊 Estado de Servicios

### Verificar API
```bash
curl http://localhost:3000/health
# Respuesta: {"ok":true}
```

### Verificar Cliente
```
http://localhost:5173
# Debe cargar la página de login
```

### Ver Logs
```bash
# API
tail -f creditos-api/logs/access.log

# Cliente
Ver consola del navegador (F12)
```

---

## 📚 Documentación Adicional

Para información más detallada, ver:
- [GUIA_CONEXION.md](./GUIA_CONEXION.md) - Guía completa
- [ARQUITECTURA_CONEXION.md](./ARQUITECTURA_CONEXION.md) - Arquitectura técnica

---

## ✅ Verificación Final

Cuando todo esté funcionando correctamente:

- [ ] API responde en `http://localhost:3000/health`
- [ ] Cliente carga en `http://localhost:5173`
- [ ] Puedo iniciar sesión
- [ ] Los datos se cargan desde la API
- [ ] Las operaciones CRUD funcionan

---

## 🎯 Siguientes Pasos

1. **Explorar el Dashboard** - Familiarizarse con la interfaz
2. **Crear Datos de Prueba** - Añadir clientes y créditos
3. **Revisar Reportes** - Ver funcionalidades de análisis
4. **Usar Diferentes Roles** - Probar con ADMIN, EMPLOYEE, COBRADOR

---

**¿Problemas?** Revisar los logs o consultar [ARQUITECTURA_CONEXION.md](./ARQUITECTURA_CONEXION.md)
