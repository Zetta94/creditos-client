# 🌍 DEPLOYMENT Y PRODUCCIÓN

Guía para desplegar Dashboard Créditos en el servidor de producción.

## 📍 Servidor de Producción

```
Host: 66.97.46.168
Usuario: app
Contraseña: Franco636.elimperios
Base de datos: creditos_db
Usuario BD: creditos_user
Contraseña BD: zetta94636.
```

## 🔑 Acceso SSH

```bash
ssh app@66.97.46.168
# Ingresar contraseña: Franco636.elimperios
```

## 📦 Estructura en Servidor

```
/home/app/
├── creditos-api/
│   ├── .env (variables de producción)
│   ├── dist/ (código compilado)
│   ├── src/
│   ├── package.json
│   └── node_modules/
├── creditos-client/
│   ├── .env (variables de producción)
│   ├── dist/ (archivos estáticos)
│   └── node_modules/
└── pm2/ (gestor de procesos)
    ├── api.config.js
    └── client.config.js
```

## 🚀 Proceso de Deployment

### Fase 1: Preparación en Servidor

```bash
# 1. Conectar al servidor
ssh app@66.97.46.168

# 2. Ir a directorio de aplicación
cd /home/app

# 3. Crear directorios si no existen
mkdir -p creditos-api creditos-client
```

### Fase 2: Desplegar API

```bash
# 1. Navegar a carpeta API
cd /home/app/creditos-api

# 2. Copiar código (desde tu máquina local)
# Usar SCP o Git (recomendado)

# Opción A: Clonar desde Git
git clone https://github.com/tuusuario/creditos-api.git .
git pull origin main

# Opción B: Copiar manualmente
scp -r ./creditos-api/* app@66.97.46.168:/home/app/creditos-api/

# 3. Instalar dependencias
npm install --production

# 4. Compilar TypeScript
npm run build

# 5. Crear .env para producción
nano .env
```

**Contenido de .env para producción:**
```
DATABASE_URL=postgresql://creditos_user:zetta94636.@localhost:5432/creditos_db
PORT=3000
JWT_SECRET=<cambiar_con_valor_muy_seguro_32_caracteres>
NODE_ENV=production
CORS_ORIGIN=https://tudominio.com
LOG_PATH=/home/app/creditos-api/logs
```

### Fase 3: Desplegar Cliente

```bash
# 1. Navegar a carpeta Cliente
cd /home/app/creditos-client

# 2. Copiar código
# Opción A: Git
git clone https://github.com/tuusuario/creditos-client.git .
git pull origin main

# Opción B: SCP
scp -r ./creditos-client/* app@66.97.46.168:/home/app/creditos-client/

# 3. Instalar dependencias
npm install --production

# 4. Crear .env para producción
nano .env
```

**Contenido de .env para cliente:**
```
VITE_API_URL=https://api.tudominio.com/api
```

```bash
# 5. Compilar assets
npm run build

# 6. Verificar que se creó dist/
ls -la dist/
```

### Fase 4: Configurar PM2 (Gestor de Procesos)

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Crear configuración para API
cat > /home/app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'creditos-api',
      script: './dist/server.js',
      cwd: '/home/app/creditos-api',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
EOF

# 3. Iniciar con PM2
pm2 start ecosystem.config.js

# 4. Guardar configuración para reinicio automático
pm2 save

# 5. Crear script de startup
pm2 startup
```

### Fase 5: Configurar Nginx (Servidor Web)

```bash
# 1. Instalar Nginx si no está
sudo apt-get update
sudo apt-get install -y nginx

# 2. Crear configuración de sitio
sudo nano /etc/nginx/sites-available/creditos
```

**Contenido de configuración Nginx:**
```nginx
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Cliente Frontend
    location / {
        alias /home/app/creditos-client/dist/;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1024;
}
```

```bash
# 3. Habilitar sitio
sudo ln -s /etc/nginx/sites-available/creditos /etc/nginx/sites-enabled/

# 4. Probar configuración
sudo nginx -t

# 5. Reiniciar Nginx
sudo systemctl restart nginx

# 6. Habilitar para startup automático
sudo systemctl enable nginx
```

### Fase 6: Certificado SSL (Let's Encrypt)

```bash
# 1. Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Obtener certificado
sudo certbot certonly --nginx -d tudominio.com -d www.tudominio.com

# 3. Auto-renovación
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Fase 7: Verificación Final

```bash
# 1. Ver estado de PM2
pm2 status

# 2. Ver logs del API
pm2 logs creditos-api

# 3. Verificar que la BD está accesible
psql -U creditos_user -d creditos_db -c "SELECT 1;"

# 4. Probar API localmente
curl http://localhost:3000/health

# 5. Probar desde internet
curl https://tudominio.com/api/health
```

## 🔄 Updates en Producción

### Actualizar Código

```bash
# 1. SSH al servidor
ssh app@66.97.46.168

# 2. API
cd /home/app/creditos-api
git pull origin main
npm install
npm run build
pm2 restart creditos-api

# 3. Cliente
cd /home/app/creditos-client
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

### Monitorear Procesos

```bash
# Ver dashboard PM2
pm2 monit

# Ver logs en tiempo real
pm2 logs creditos-api --lines 100 --follow

# Reiniciar servicio si falla
pm2 restart creditos-api
```

## 🛡️ Seguridad

### Variables Sensibles
```bash
# Usar diferentes valores en producción
JWT_SECRET=<generar_valor_aleatorio_seguro>
DATABASE_URL=<cambiar_credenciales>
```

### Firewall
```bash
# Permitir puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Respaldos Base de Datos
```bash
# Crear respaldo manual
pg_dump -U creditos_user creditos_db > /home/app/backups/creditos_db_$(date +%Y%m%d).sql

# Restaurar respaldo
psql -U creditos_user creditos_db < /home/app/backups/creditos_db_YYYYMMDD.sql

# Programar respaldos automáticos (cron)
0 2 * * * pg_dump -U creditos_user creditos_db > /home/app/backups/creditos_db_$(date +\%Y\%m\%d).sql
```

## 📊 Monitoreo

### Logs Importantes
```bash
# Logs del API
/home/app/creditos-api/logs/access.log
/home/app/creditos-api/logs/pm2-out.log
/home/app/creditos-api/logs/pm2-error.log

# Logs de Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# Logs del sistema
journalctl -u nginx -f
```

### Health Check
```bash
# Verificar todos los servicios
curl https://tudominio.com/api/health
curl https://tudominio.com/

# Desde cron cada 5 minutos
*/5 * * * * curl -f https://tudominio.com/api/health || /usr/local/bin/alert.sh
```

## 🆘 Troubleshooting en Producción

### API no inicia
```bash
pm2 logs creditos-api
# Verificar DATABASE_URL y credenciales
# Verificar JWT_SECRET
```

### CORS error
```bash
# Verificar CORS_ORIGIN en .env
grep CORS_ORIGIN /home/app/creditos-api/.env
# Debe coincider con dominio del cliente
```

### Puerto 3000 en uso
```bash
lsof -i :3000
kill -9 <PID>
# O cambiar puerto en .env
```

### Base de datos no accesible
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"

# Verificar credenciales
psql -U creditos_user -d creditos_db -h localhost
```

## 📋 Checklist de Deployment

- [ ] Servidor SSH accesible
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL corriendo
- [ ] PM2 instalado globalmente
- [ ] Nginx instalado y configurado
- [ ] Certificado SSL obtentido
- [ ] Código API clonado/copiado
- [ ] Código Cliente clonado/copiado
- [ ] .env configurado en ambos lados
- [ ] npm install ejecutado en ambos
- [ ] npm run build ejecutado en API
- [ ] npm run build ejecutado en Cliente
- [ ] PM2 iniciado y corriendo
- [ ] Nginx reiniciado
- [ ] Health check responde
- [ ] Cliente accesible desde navegador
- [ ] Puedo iniciar sesión
- [ ] CRUD funciona correctamente

---

**Nota:** Reemplazar `tudominio.com` con tu dominio real y ajustar paths según sea necesario.
