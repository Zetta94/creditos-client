# 🔐 SISTEMA DE RECUPERACIÓN DE CONTRASEÑA

## ✅ Implementación Completa

He configurado un **sistema seguro y profesional** de cambio de contraseña a través de email.

---

## 📋 Componentes Implementados

### Backend

#### 1️⃣ Nueva tabla en Prisma
```prisma
model PasswordReset {
  id        String   @id @default(cuid())
  token     String   @unique
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([email])
}
```

#### 2️⃣ Nuevos Endpoints de Autenticación

**1. Solicitar Reset** (Cualquiera)
```
POST /api/auth/request-reset
Content-Type: application/json

{
  "email": "usuario@empresa.com"
}

Response (200):
{
  "success": true,
  "message": "Si el email existe, recibirás un enlace de recuperación"
}
```

**2. Cambiar Contraseña** (Usando token)
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "xyz123...",
  "email": "usuario@empresa.com",
  "newPassword": "nuevaContraseña123"
}

Response (200):
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

**3. Validar Token** (Opcional, para verificar antes de cambiar)
```
POST /api/auth/validate-reset-token
Content-Type: application/json

{
  "token": "xyz123...",
  "email": "usuario@empresa.com"
}

Response (200):
{
  "valid": true,
  "message": "Token válido"
}
```

#### 3️⃣ Servicio de Email
- **Archivo:** `src/services/email.service.ts`
- **Librería:** `nodemailer`
- **Características:**
  - Templates HTML profesionales
  - Enlace con token único
  - Expiración de 1 hora
  - Recuperación de errores

#### 4️⃣ Seguridad
- ✅ Tokens hasheados en BD (SHA256)
- ✅ Expiración de 1 hora
- ✅ Un uso por token (se elimina después)
- ✅ Validación de email
- ✅ Contraseña mínimo 6 caracteres

---

### Frontend

#### 1️⃣ Nuevas Páginas React

**ForgotPassword.jsx**
- Formulario para solicitar reset
- Valida email
- Mensaje de confirmación
- Link para volver a login

**ResetPassword.jsx**
- Página protegida (requiere token y email en URL)
- Formulario con confirmación de contraseña
- Validaciones en tiempo real
- Mensaje de éxito y redirección

#### 2️⃣ Cambios en Páginas Existentes

**Login.jsx**
- ✅ Nuevo botón: "¿Olvidaste la contraseña?"
- Diseño consistente con el resto de la app

#### 3️⃣ Nuevas Rutas
```javascript
/forgot-password     → Solicitar reset
/reset-password      → Cambiar contraseña (con token en URL)
```

---

## 🚀 Configuración Requerida

### Variables de Entorno Backend (`.env`)

```bash
# Configuración de Email (Gmail, por ejemplo)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password

# Ejemplo con Gmail App Password:
# 1. Activa 2FA en tu cuenta Google
# 2. Genera una "App Password" en:
#    https://myaccount.google.com/apppasswords
# 3. Usa ese código como EMAIL_PASSWORD

EMAIL_FROM=noreply@tuempresa.com

# URL del Frontend (para construir el enlace de reset)
FRONTEND_URL=http://localhost:5173
# En producción: https://tudominio.com
```

### Opciones de Email

**Opción 1: Gmail (Recomendado para desarrollo)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=app-password-de-google
```

**Opción 2: Outlook/Office 365**
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-password
```

**Opción 3: SendGrid (Profesional)**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxx (tu SendGrid API key)
```

**Opción 4: MailerSend**
```bash
EMAIL_HOST=smtp.mailersend.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@tudominio.com
EMAIL_PASSWORD=tu-mailersend-token
```

---

## 🧪 Cómo Probar

### 1️⃣ Setup del Proyecto

```bash
# Backend
cd creditos-api
npm install nodemailer  # Si no está instalado
npm run dev

# Frontend
cd creditos-client
npm run dev
```

### 2️⃣ Probar Flujo Completo

**Paso 1: Ir a Login**
```
http://localhost:5173/#/login
```

**Paso 2: Click en "¿Olvidaste la contraseña?"**
```
http://localhost:5173/#/forgot-password
```

**Paso 3: Ingresar email**
```
Email: admin@dashboard.com
```

**Paso 4: Enviar**
- Deberías ver mensaje: "Si la cuenta existe, recibirás un enlace..."
- En producción: Revisa tu email
- En desarrollo: Chequea terminal del backend (verá un error si no está configurado email)

**Paso 5: Hacer clic en enlace de email**
```
http://localhost:5173/#/reset-password?token=xyz&email=admin@dashboard.com
```

**Paso 6: Cambiar contraseña**
- Ingresa nueva contraseña
- Confirma contraseña
- Click "Cambiar Contraseña"
- Deberías ver "¡Éxito!" y ser redirigido a login

**Paso 7: Login con nueva contraseña**
- Email: admin@dashboard.com
- Password: <tu nueva contraseña>
- ✅ Deberías entrar correctamente

---

## 🔍 Testing en Desarrollo (Sin Email Real)

Si quieres probar sin servidor de email configurado:

### Opción A: Logs en Terminal
El token se mostrerá en la terminal del backend. Puedes copiar y construir manualmente la URL.

### Opción B: Usar Mailtrap (Gratuito)
1. Crea cuenta en https://mailtrap.io
2. Obtén credenciales SMTP
3. Configura en `.env`:
```bash
EMAIL_HOST=send.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=xxx@mailtrap.io
EMAIL_PASSWORD=xxxx
```

### Opción C: Usar Gmail con App Password
1. https://myaccount.google.com/apppasswords
2. Selecciona "Mail" y "Windows Computer"
3. Te da una contraseña de 16 caracteres
4. Configura en `.env`:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=<16-caracteres-de-google>
```

---

## 📊 Flujo de Seguridad

```
1. Usuario solicita reset
   ↓
2. Backend genera token aleatorio de 32 bytes
   ↓
3. Token se hashea con SHA256 para guardar en BD
   ↓
4. Email se envía con token SIN hashear (en enlace)
   ↓
5. Usuario hace click en enlace
   ↓
6. Frontend envía token original al backend
   ↓
7. Backend hashea el token recibido
   ↓
8. Compara hash con BD (coincide = válido)
   ↓
9. Verifica que no haya expirado (1 hora)
   ↓
10. Valida email coincida con token
    ↓
11. Hashea nueva contraseña con bcrypt
    ↓
12. Guarda en BD
    ↓
13. Elimina token de BD (1 uso)
    ↓
14. Elimina otros tokens del usuario
    ↓
15. Login con nueva contraseña ✅
```

---

## 🔐 Medidas de Seguridad

| Medida | Implementado | Detalles |
|--------|-------------|---------|
| Token único | ✅ | 32 bytes aleatorios |
| Token hasheado | ✅ | SHA256 en BD |
| Expiración | ✅ | 1 hora |
| Un uso | ✅ | Se elimina después |
| Email validado | ✅ | Debe coincidir |
| Password fuerte | ✅ | Mínimo 6 caracteres |
| Bcrypt | ✅ | Hash de contraseña |
| Sin info leak | ✅ | Nunca dice si email existe |

---

## 📝 Archivos Modificados/Creados

### Backend
```
✅ src/prisma/schema.prisma          → Modelo PasswordReset
✅ src/modules/auth/auth.service.ts  → 3 nuevas funciones
✅ src/modules/auth/auth.controller.ts → 3 nuevos controllers
✅ src/modules/auth/auth.routes.ts   → 3 nuevas rutas
✅ src/services/email.service.ts     → NUEVO
```

### Frontend
```
✅ src/pages/ForgotPassword.jsx       → NUEVO
✅ src/pages/ResetPassword.jsx        → NUEVO
✅ src/pages/Login.jsx                → Agregado botón
✅ src/App.jsx                        → 2 nuevas rutas
```

---

## 🚨 Solución de Problemas

### "Error al enviar email"
- **Causa:** Email no configurado
- **Solución:** Configura variables de entorno en `.env`
- **Dev:** Usa Mailtrap o Gmail

### "Token expirado"
- **Causa:** Enlace de email expiró (> 1 hora)
- **Solución:** Usuario vuelve a solicitar reset
- **UI:** Muestra botón "Volver a recuperar"

### "Email no coincide"
- **Causa:** Token no es del email ingresado
- **Solución:** Verifica que uses el email correcto
- **Dev:** Token solo funciona con el email original

### "Contraseña debe tener 6 caracteres"
- **Causa:** Contraseña muy corta
- **Solución:** Ingresa mínimo 6 caracteres
- **Nota:** Puedes cambiar el mínimo en `auth.controller.ts`

---

## ✨ Mejoras Futuras (Opcional)

1. **Dos Factores (2FA)**
   - SMS o app authenticator
   - Mayor seguridad

2. **Historial de Cambios**
   - Auditoría de quién cambió cuándo
   - Detección de cambios sospechosos

3. **Notificaciones**
   - Email cuando contraseña cambia
   - Alerta si cambio no solicitado

4. **Rate Limiting**
   - Max intentos por email
   - Espera entre reintentos

5. **Contraseña Anterior**
   - No permitir reusar últimas N contraseñas
   - Seguridad mejorada

---

## 📞 Resumen Rápido

**Para probar rápido:**
1. `npm install nodemailer` en backend (si falta)
2. Configura `EMAIL_*` en `.env`
3. Login → "¿Olvidaste la contraseña?" → Completa el flujo

**En producción:**
- Usa SendGrid, Mailgun o similar
- Configura `FRONTEND_URL` correctamente
- Habilita HTTPS

¡Listo! 🎉
