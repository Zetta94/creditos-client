# 📦 CONFIGURACIÓN PARA GITHUB

Instrucciones para sincronizar el proyecto con repositorios en GitHub.

---

## 1️⃣ Estructura de Repositorios

Tienes DOS repositorios separados:

```
GitHub Organización/
├── creditos-api          ← Repositorio backend
│   ├── src/
│   ├── package.json
│   ├── .gitignore
│   └── .env.example
│
└── creditos-client       ← Repositorio frontend
    ├── src/
    ├── package.json
    ├── .gitignore
    └── .env.example
```

---

## 2️⃣ Configuración .gitignore

### creditos-api/.gitignore
```
# Ambiente
.env
.env.local
.env.*.local

# Dependencias
node_modules/
package-lock.json

# Build
dist/
build/

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/.env
```

### creditos-client/.gitignore
```
# Dependencias
node_modules
.pnp
.pnp.js

# Testing
coverage

# Build
dist/
dist-ssr/
*.local

# Ambiente
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

---

## 3️⃣ Clonar Repositorios Localmente

```bash
# Crear directorio para el proyecto
mkdir Dashboard-Creditos
cd Dashboard-Creditos

# Clonar API
git clone https://github.com/tuorganizacion/creditos-api.git
cd creditos-api
npm install
npm run prisma:generate

# Volver atrás
cd ..

# Clonar Cliente
git clone https://github.com/tuorganizacion/creditos-client.git
cd creditos-client
npm install
```

---

## 4️⃣ Estructura de Branches

```
main (rama principal de producción)
  ↑
  ├── feature/nueva-funcionalidad (ramas de desarrollo)
  ├── bugfix/corregir-problema
  └── hotfix/parche-urgente
```

### Convención de Nombres
- `feature/` - Nueva funcionalidad
- `bugfix/` - Corrección de bug
- `hotfix/` - Parche de producción urgente
- `docs/` - Actualizar documentación
- `refactor/` - Refactorizar código
- `test/` - Agregar tests

---

## 5️⃣ Workflow Típico

### Crear Nueva Feature

```bash
# 1. Asegurar que estás en main y actualizado
git checkout main
git pull origin main

# 2. Crear rama para la feature
git checkout -b feature/nombre-feature

# 3. Hacer cambios
# Editar archivos...

# 4. Verificar cambios
git status

# 5. Stagear cambios
git add .

# 6. Commit con mensaje descriptivo
git commit -m "feat: descripción de la feature"

# 7. Push a repositorio remoto
git push origin feature/nombre-feature

# 8. Crear Pull Request en GitHub
# → GitHub web → Compare & pull request
# → Escribir descripción
# → Crear PR

# 9. Después de aprobación y merge
# Volver a main y actualizar local
git checkout main
git pull origin main
```

---

## 6️⃣ Convención de Commits

Usar formato Conventional Commits:

```
<tipo>(<alcance>): <asunto>

<cuerpo>

<pie de página>
```

### Tipos
- `feat:` - Nueva feature
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (sin lógica)
- `refactor:` - Refactorizar código
- `test:` - Agregar tests
- `chore:` - Tareas de mantenimiento

### Ejemplos
```bash
git commit -m "feat(auth): agregar login con JWT"
git commit -m "fix(clients): corregir validación de email"
git commit -m "docs(setup): actualizar instrucciones de instalación"
git commit -m "refactor(api): mejorar estructura de servicios"
```

---

## 7️⃣ Sincronización con Main

### Traer cambios de main a tu rama
```bash
git fetch origin
git rebase origin/main
# O merge (menos limpio)
git merge origin/main
```

### Actualizar main localmente
```bash
git checkout main
git pull origin main
```

---

## 8️⃣ Proteger Rama Main

En GitHub, configurar protecciones:

1. Ir a Settings → Branches
2. Seleccionar "main"
3. Habilitar:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Include administrators
   - ✅ Restrict who can push

---

## 9️⃣ Acciones en GitHub (CI/CD)

### Crear workflow automático

**creditos-api/.github/workflows/test.yml**
```yaml
name: Test API

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

**creditos-client/.github/workflows/build.yml**
```yaml
name: Build Client

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

---

## 🔟 Deploy Automático

### Usando GitHub Actions para desplegar

**creditos-api/.github/workflows/deploy.yml**
```yaml
name: Deploy API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          password: ${{ secrets.PASSWORD }}
          script: |
            cd /home/app/creditos-api
            git pull origin main
            npm install
            npm run build
            pm2 restart creditos-api
```

---

## 1️⃣1️⃣ Secretos en GitHub

Para CI/CD necesitas guardar secretos:

1. Ir a Settings → Secrets and variables
2. Agregar secretos:
   - `HOST` - IP servidor
   - `USERNAME` - Usuario SSH
   - `PASSWORD` - Contraseña SSH
   - `JWT_SECRET` - Secret para producción

```bash
# En workflows, usar así:
${{ secrets.HOST }}
${{ secrets.JWT_SECRET }}
```

---

## 1️⃣2️⃣ Versionamiento Semántico

Usar tags para versiones:

```bash
# Crear tag
git tag -a v1.0.0 -m "Release versión 1.0.0"

# Push tag
git push origin v1.0.0

# Listar tags
git tag -l

# Ver tag específico
git show v1.0.0
```

---

## 1️⃣3️⃣ Issues y Projects

### Crear issues
1. GitHub → Issues → New issue
2. Usar plantillas si existen
3. Asignar labels y milestones
4. Asignar a personas

### Workflow
```
Issue creado
    ↓
Discutir en comentarios
    ↓
Crear rama: git checkout -b fix/issue-123
    ↓
Hacer cambios
    ↓
Push y PR
    ↓
PR cierra issue automáticamente
```

---

## 1️⃣4️⃣ Releases

Crear release automática en GitHub:

```bash
# 1. Crear tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 2. Push tag
git push origin v1.1.0

# 3. En GitHub:
#    - Ir a Releases
#    - Click "Create a new release"
#    - Seleccionar tag
#    - Escribir notas de release
#    - Publicar
```

---

## 1️⃣5️⃣ README para GitHub

### creditos-api/README.md
```markdown
# Dashboard Créditos API

Backend Express + TypeScript + Prisma

## 🚀 Inicio Rápido

```bash
npm install
npm run prisma:migrate
npm run dev
```

## 📚 Documentación

Ver [docs/](./docs/) para más información.

## 🔗 Repositorio Relacionado

Frontend: [creditos-client](https://github.com/org/creditos-client)

## 📄 Licencia

MIT
```

### creditos-client/README.md
```markdown
# Dashboard Créditos - Cliente

Frontend React + Vite + Redux

## 🚀 Inicio Rápido

```bash
npm install
npm run dev
```

## 📚 Documentación

Ver [docs/](./docs/) para más información.

## 🔗 Repositorio Relacionado

Backend: [creditos-api](https://github.com/org/creditos-api)

## 📄 Licencia

MIT
```

---

## 1️⃣6️⃣ Checklist GitHub

- [ ] Repositorios creados en GitHub
- [ ] .gitignore configurado en ambos
- [ ] main como rama principal
- [ ] Protecciones habilitadas en main
- [ ] .env.example sin valores reales
- [ ] README.md en ambos repos
- [ ] Workflows de CI/CD configurados
- [ ] Secretos agregados para deploy
- [ ] Tagging de versiones
- [ ] Documentación en Wiki o docs/

---

## 📝 Comandos Útiles

```bash
# Ver historial
git log --oneline

# Ver diferencias
git diff

# Ver estado
git status

# Deshacer cambios
git checkout -- archivo.txt

# Enmendar commit anterior
git commit --amend

# Ver branches remotas
git branch -r

# Eliminar rama local
git branch -d nombre-rama

# Eliminar rama remota
git push origin --delete nombre-rama
```

---

## 🚨 Errores Comunes

### "Permission denied (publickey)"
```bash
# Generar SSH key
ssh-keygen -t ed25519 -C "tu@email.com"

# Agregar a GitHub
cat ~/.ssh/id_ed25519.pub
# Copiar a GitHub → Settings → SSH keys
```

### "Your branch is ahead of origin"
```bash
# Push cambios
git push origin nombre-rama
```

### "Cannot push to main (protected)"
```bash
# Crear branch en lugar de pushear a main
git checkout -b feature/cambios
git push origin feature/cambios
# Luego hacer PR
```

---

## 📞 Colaboración

Para trabajar con otros desarrolladores:

```bash
# Antes de empezar
git pull origin main

# Después de terminar
git push origin mi-rama
# Crear PR en GitHub

# Para revisar cambios de otros
git fetch origin
git checkout origin/rama-de-otro
```

---

**Documentación de Git:** https://git-scm.com/doc
**GitHub Help:** https://docs.github.com
