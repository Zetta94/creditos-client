# 🔐 GUÍA RÁPIDA: RESET DE CONTRASEÑA

## Implementación Completa ✅

He agregado el **sistema de cambio de contraseña por email** que solicitaste.

---

## 🚀 INSTALACIÓN (3 PASOS)

### Paso 1: Instalar nodemailer
```bash
cd creditos-api
npm install nodemailer
```

### Paso 2: Configurar .env
Agrega estas líneas al archivo `creditos-api/.env`:

```bash
# Email (elige una opción)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=noreply@tuempresa.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

**Para Gmail:**
1. Activa 2FA: https://myaccount.google.com/security
2. Genera App Password: https://myaccount.google.com/apppasswords
3. Copia la contraseña de 16 caracteres
4. Pégalo en `EMAIL_PASSWORD`

### Paso 3: Iniciar aplicación
```bash
# Terminal 1 - Backend
cd creditos-api
npm run dev

# Terminal 2 - Frontend
cd creditos-client
npm run dev
```

---

## 🧪 PRUEBA EL SISTEMA

### Flow Completo:

1. **Ir a Login**
   ```
   http://localhost:5173/#/login
   ```

2. **Click en "¿Olvidaste la contraseña?"**
   ```
   http://localhost:5173/#/forgot-password
   ```

3. **Ingresa tu email**
   ```
   Email: admin@dashboard.com
   ```

4. **Recibe email (revisa inbox y spam)**
   - En desarrollo sin email: Verás el link en terminal del backend

5. **Haz click en el link del email**
   ```
   http://localhost:5173/#/reset-password?token=xyz&email=...
   ```

6. **Ingresa nueva contraseña**
   ```
   Nueva Contraseña: MiNuevaContra123
   Confirma: MiNuevaContra123
   ```

7. **Click "Cambiar Contraseña"**
   - Ves: ✅ "¡Éxito!"
   - Serás redirigido a /login

8. **Login con nueva contraseña**
   ```
   Email: admin@dashboard.com
   Contraseña: MiNuevaContra123
   ```

9. **¡Listo! Entraste correctamente ✅**

---

## 📁 CAMBIOS REALIZADOS

### Backend
- ✅ **Modelo Prisma** → PasswordReset table
- ✅ **Servicio de email** → email.service.ts (NUEVO)
- ✅ **Funciones auth** → requestPasswordReset, resetPassword, validateResetToken
- ✅ **Controllers** → 3 nuevos endpoints
- ✅ **Rutas** → POST /request-reset, POST /reset-password, POST /validate-reset-token

### Frontend
- ✅ **ForgotPassword.jsx** → Solicitar reset (NUEVO)
- ✅ **ResetPassword.jsx** → Cambiar contraseña (NUEVO)
- ✅ **Login.jsx** → Botón "¿Olvidaste la contraseña?"
- ✅ **App.jsx** → 2 nuevas rutas

---

## 🔗 ENDPOINTS

| Método | URL | Descripción |
|--------|-----|------------|
| POST | `/api/auth/request-reset` | Solicitar email de reset |
| POST | `/api/auth/reset-password` | Cambiar contraseña |
| POST | `/api/auth/validate-reset-token` | Verificar token (opcional) |

---

## 🔐 SEGURIDAD

- ✅ Tokens únicos (32 bytes aleatorios)
- ✅ Tokens hasheados en BD (SHA256)
- ✅ Expiración 1 hora
- ✅ Un uso por token
- ✅ Contraseña mínimo 6 caracteres
- ✅ Bcrypt para guardar contraseña

---

## ❓ PREGUNTAS COMUNES

**¿Qué pasa si el email no existe?**
- Por seguridad: No dice si existe o no
- Muestra: "Si el email existe, recibirás un enlace..."

**¿Cuánto tiempo dura el link?**
- Expira en 1 hora
- Después: Usuario debe solicitar nuevo reset

**¿Se puede reusar un token?**
- No, se elimina después del primer uso
- Mejora seguridad

**¿Qué contraseña necesito para Gmail?**
- No tu password de Gmail
- Una "App Password" de https://myaccount.google.com/apppasswords
- Solo funciona si activas 2FA

---

## 📖 DOCUMENTACIÓN COMPLETA

Ver archivos:
- `RESET_PASSWORD_SETUP.md` - Guía técnica detallada
- `RESUMEN_RESET_PASSWORD.txt` - Todas las características

---

## ✅ LISTO PARA PRODUCCIÓN

```bash
# En .env de producción:
EMAIL_HOST=smtp.sendgrid.net  # SendGrid recomendado
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxx
FRONTEND_URL=https://tudominio.com
```

¡Disfruta del nuevo sistema! 🎉
