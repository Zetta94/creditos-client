# 🧪 TESTING RÁPIDO (Checklist)

## PREREQUISITOS (5 min)

```bash
# 1. Instalar
cd creditos-api
npm install nodemailer

# 2. Configurar .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=app-password
FRONTEND_URL=http://localhost:5173

# 3. Iniciar servidores
Terminal 1: cd creditos-api && npm run dev
Terminal 2: cd creditos-client && npm run dev

# 4. Abrir
http://localhost:5173/#/login
```

---

## FEATURE 1: PANTALLAS CONECTADAS (15 min)

### Test 1.1: Crear Cliente
```
Login: admin@dashboard.com / password123
→ Clientes → + Nuevo
→ Nombre: "Juan Pérez"
→ Guardar
✅ Aparece en lista
✅ POST /api/clients en Network
```

### Test 1.2: Crear Crédito
```
→ Créditos → + Nuevo
→ Cliente: "Juan Pérez"
→ Tipo: "DAILY"
→ Monto: "1000"
→ Guardar
✅ Aparece en lista
✅ POST /api/credits en Network
```

### Test 1.3: Registrar Pago
```
→ Créditos → Click en crédito → Registrar Pago
→ Monto: "100"
→ Guardar
✅ POST /api/payments en Network
```

### Test 1.4: Crear Usuario
```
→ Usuarios → + Nuevo
→ Nombre: "Carlos López"
→ Email: "carlos@empresa.com"
→ Rol: "COBRADOR"
→ Guardar
✅ Aparece en lista
```

### Test 1.5: Editar Cliente
```
→ Clientes → Click "Juan Pérez" → Editar
→ Cambia teléfono
→ Guardar
✅ PUT /api/clients/:id en Network
```

---

## FEATURE 2: ORDENAMIENTO (10 min)

### Test 2.1: Cargar Clientes
```
→ Ordenar Clientes (si existe en UI)
→ Selecciona cobrador
✅ Carga lista ordenada
```

### Test 2.2: Drag & Drop
```
→ "Editar orden"
→ Arrastra cliente
→ "Guardar"
✅ Toast: "Orden guardada"
✅ POST /assignments/reorder/batch en Network
```

### Test 2.3: Persistencia
```
→ F5 (refrescar)
→ Vuelve a Ordenar
✅ El orden persiste
```

### Test 2.4: Seguridad
```
→ Login como COBRADOR
→ Intenta acceder a Ordenar Clientes
✅ No puede entrar (solo ADMIN)
```

---

## FEATURE 3: RESET CONTRASEÑA (20 min)

### Test 3.1: Solicitar Reset
```
→ Login → "¿Olvidaste la contraseña?"
→ Email: "admin@dashboard.com"
→ "Enviar"
✅ Toast: "Email enviado"
✅ POST /auth/request-reset en Network
✅ ¡Revisa tu email!
```

### Test 3.2: Abrir Email
```
✅ Recibes email con link
✅ El link incluye token y email
```

### Test 3.3: Cambiar Contraseña
```
→ Click en link del email
→ Nueva Contraseña: "NuevaContra123"
→ Confirma: "NuevaContra123"
→ "Cambiar"
✅ Toast: "¡Éxito!"
✅ POST /auth/reset-password en Network
✅ Se redirige a login
```

### Test 3.4: Login Nueva Contraseña
```
→ Email: "admin@dashboard.com"
→ Contraseña: "NuevaContra123"
→ "Ingresar"
✅ Login funciona ✓
```

### Test 3.5: Reusar Token
```
→ Abre el link del email otra vez
→ Intenta cambiar otra contraseña
✅ Error: "Token inválido"
✅ No funciona (1 uso solamente)
```

### Test 3.6: Validaciones
```
→ Solicita reset
→ Intenta enviar sin email
✅ Error: "Email requerido"

→ Solicita reset
→ Contraseña: "abc" (menos de 6)
✅ Error: "Mínimo 6 caracteres"

→ Intenta cambiar con contraseñas distintas
✅ Error: "No coinciden"
```

---

## 📊 RESUMEN RÁPIDO

| Feature | Tests | Tiempo |
|---------|-------|--------|
| Pantallas Conectadas | 5 | 15 min |
| Ordenamiento | 4 | 10 min |
| Reset Contraseña | 6 | 20 min |
| **TOTAL** | **15** | **45 min** |

---

## ✅ CHECKLIST FINAL

```
FEATURE 1:
  [ ] TEST 1.1 Crear Cliente
  [ ] TEST 1.2 Crear Crédito
  [ ] TEST 1.3 Registrar Pago
  [ ] TEST 1.4 Crear Usuario
  [ ] TEST 1.5 Editar Cliente

FEATURE 2:
  [ ] TEST 2.1 Cargar Clientes
  [ ] TEST 2.2 Drag & Drop
  [ ] TEST 2.3 Persistencia
  [ ] TEST 2.4 Seguridad

FEATURE 3:
  [ ] TEST 3.1 Solicitar Reset
  [ ] TEST 3.2 Abrir Email
  [ ] TEST 3.3 Cambiar Contraseña
  [ ] TEST 3.4 Login Nueva
  [ ] TEST 3.5 Reusar Token
  [ ] TEST 3.6 Validaciones
```

---

## 🐛 PROBLEMAS COMUNES

**"Error de CORS"**
→ Backend en :3000 y Frontend en :5173

**"401 Unauthorized"**
→ Token expiró. Haz logout y login nuevamente

**"Email no llega"**
→ Revisa spam o configura SMTP en .env

**"Token inválido"**
→ Expira en 1 hora. Solicita nuevo reset.

---

## 🎉 ¡LISTO!

Si todo pasó: **¡Tu app funciona perfectamente!**

Ver detalles: [`PLAN_TESTING_COMPLETO.md`](./PLAN_TESTING_COMPLETO.md)
