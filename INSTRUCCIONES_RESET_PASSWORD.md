# 📦 INSTALACIÓN DE DEPENDENCIAS

## Para Backend

```bash
cd creditos-api
npm install nodemailer
npm install -D @types/nodemailer  # TypeScript types
```

## Verificar Instalación

```bash
npm list nodemailer
# Debe mostrar: nodemailer@^6.x.x (o similar)
```

## Configurar Variables de Entorno

Crea o actualiza el archivo `.env` en `creditos-api/`:

```bash
# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=noreply@tuempresa.com

# Frontend URL (para links de reset)
FRONTEND_URL=http://localhost:5173
```

## Para Gmail (Recomendado)

1. Activa 2FA en tu cuenta Google: https://myaccount.google.com/security
2. Genera una App Password: https://myaccount.google.com/apppasswords
3. Selecciona "Mail" y "Windows Computer"
4. Copia la contraseña de 16 caracteres
5. Pégalo en `EMAIL_PASSWORD` del `.env`

## Listo ✅

Una vez configurado, inicia el servidor:

```bash
npm run dev
```

El sistema de reset de contraseña estará funcional.
