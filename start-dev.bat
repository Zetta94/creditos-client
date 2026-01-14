@echo off
REM Script para iniciar el proyecto completo en Windows

echo 🚀 Iniciando Dashboard Creditos - Desarrollo Completo
echo.

REM Verificar que Node.js esté instalado
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Iniciar API en nueva ventana
echo 📡 Iniciando API en terminal separada...
start cmd /k "cd creditos-api && npm run dev"

REM Esperar 3 segundos
timeout /t 3 /nobreak

REM Iniciar Cliente en nueva ventana
echo 🎨 Iniciando Cliente en terminal separada...
start cmd /k "cd creditos-client && npm run dev"

echo.
echo ✅ Ambos servicios iniciados:
echo    📡 API:     http://localhost:3000
echo    🎨 Cliente: http://localhost:5173
echo.
echo Presiona Ctrl+C en las ventanas de terminal para detener los servicios
echo.
pause
