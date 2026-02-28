# Guía de despliegue en 66.97.46.168

## 1. Preparar el entorno local

1. **Actualizar dependencias (opcional si hubo cambios)**
   ````bash
   cd creditos-client
   npm install
   cd ../creditos-api
   npm install
   ````
   _Por qué_: evita sorpresas al compilar; si un compañero agregó paquetes nuevos, los tendrás antes de generar artefactos.

2. **Construir los proyectos localmente**
   ````bash
   cd creditos-client
   npm run build
   cd ../creditos-api
   npm run build
   ````
   _Por qué_: confirma que las ramas están listas para producción antes de subirlas; fallas de compilación aparecen aquí y no en el servidor.

3. **Publicar los commits al repositorio remoto**
   ````bash
   # En cada repo (frontend y backend)
   git status
   git add <archivos>
   git commit -m "mensaje"
   git push origin main
   ````
   _Por qué_: el servidor extrae los cambios desde GitHub; si no haces push no habrá nada nuevo que descargar.

## 2. Conectarse al servidor

1. **Abrir sesión SSH**
   ````bash
   ssh root@66.97.46.168
   ````
   _Por qué_: necesitas ejecutar el despliegue directamente en producción. Si la llave pública deja de funcionar, vuelve a copiarla a `~/.ssh/authorized_keys`.

## 3. Actualizar el backend (`/var/www/backend/creditos-api`)

1. **Entrar en la carpeta del backend**
   ````bash
   cd /var/www/backend/creditos-api
   ````
   _Por qué_: todos los comandos siguientes se deben ejecutar dentro del repositorio backend.

2. **Resguardar y limpiar logs para evitar conflictos de Git**
   ````bash
   ts=$(date +%Y%m%d%H%M%S)
   cp logs/access.log logs/access.log.$ts.bak
   git checkout -- logs/access.log
   ````
   _Por qué_: `logs/access.log` cambia a diario y Git rechaza el `pull`; se respalda y se restaura el estado limpio antes de sincronizar.

3. **Descargar los commits más recientes**
   ````bash
   git pull origin main
   ````
   _Por qué_: sincroniza la copia del servidor con GitHub.

4. **Instalar dependencias (producción + desarrollo)**
   ````bash
   npm install --production
   npm install
   ````
   _Por qué_: `--production` asegura módulos runtime; el segundo `npm install` trae `devDependencies` necesarios para TypeScript y Prisma.

5. **Aplicar migraciones de base de datos**
   ````bash
   npx prisma migrate deploy
   ````
   _Por qué_: crea o actualiza tablas y columnas nuevas sin perder datos existentes.

6. **Regenerar el cliente Prisma**
   ````bash
   npx prisma generate
   ````
   _Por qué_: actualiza el cliente ORM para reflejar los cambios de esquema recién aplicados.

7. **Compilar TypeScript**
   ````bash
   npm run build
   ````
   _Por qué_: produce los archivos JavaScript en `dist/` que PM2 ejecutará.

8. **Reintegrar el log respaldado (opcional)**
   ````bash
   cat logs/access.log.$ts.bak >> logs/access.log
   ````
   _Por qué_: preserva el historial del log de accesos. El paso es opcional si ya se centraliza en otro sistema.

9. **Reiniciar el servicio**
   ````bash
   pm2 restart creditos-api
   ````
   _Por qué_: recarga el backend con el nuevo build y código.

## 4. Actualizar el frontend (`/var/www/frontend/creditos-client/creditos-client`)

1. **Cambiar a la carpeta del proyecto**
   ````bash
   cd /var/www/frontend/creditos-client/creditos-client
   ````
   _Por qué_: el repositorio está un nivel más abajo dentro de `creditos-client`.

2. **Sincronizar con GitHub**
   ````bash
   git pull origin main
   ````
   _Por qué_: descarga el build más reciente y los cambios de código.

3. **Instalar dependencias**
   ````bash
   npm install
   ````
   _Por qué_: asegura que el servidor tenga todas las librerías necesarias para compilar y servir el frontend.

4. **Compilar los assets de producción**
   ````bash
   npm run build
   ````
   _Por qué_: genera la carpeta `dist/` que Nginx expone a los usuarios.

5. **Reiniciar Nginx**
   ````bash
   sudo systemctl restart nginx
   ````
   _Por qué_: fuerza a Nginx a servir los archivos recién generados (especialmente si hay caching).

## 5. Verificación post-despliegue

1. **Comprobar PM2**
   ````bash
   pm2 status creditos-api
   ````
   _Por qué_: confirma que el backend está corriendo sin errores.

2. **Healthcheck de la API**
   ````bash
   curl http://localhost:3000/health
   ````
   _Por qué_: verifica que la aplicación responde correctamente desde el propio servidor (ajusta al dominio público para probar externamente).

3. **Revisión visual del frontend**
   Abre el dominio en el navegador y valida funciones clave (login, listados, generación de PDF, etc.).

4. **Log de despliegue**
   ````bash
   tail -n 100 /var/www/backend/creditos-api/logs/access.log
   sudo tail -n 100 /var/log/nginx/error.log
   ````
   _Por qué_: permite detectar rápidamente errores después del restart.

## 6. Tips adicionales

- **SSH sin contraseña**: si vuelves a ver el prompt `root@... password`, sube otra vez la llave pública a `~/.ssh/authorized_keys`.
- **Respaldo de logs**: conserva los archivos `logs/access.log.<timestamp>.bak` en un almacenamiento externo si necesitas auditoría.
- **Automatización**: cuando el proceso esté estable, puedes encapsular los comandos clave en un script `deploy.sh` que invoque cada bloque en orden.
