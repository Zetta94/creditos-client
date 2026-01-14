#!/bin/bash

# Script para iniciar el proyecto completo
# Ejecutar: ./start-dev.sh

echo "🚀 Iniciando Dashboard Créditos - Desarrollo Completo"
echo ""

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js versión: $(node -v)"
echo ""

# Crear terminal 1 para API
echo "📡 Iniciando API en terminal separada..."
gnome-terminal -- bash -c "cd creditos-api && npm run dev" &
API_PID=$!

# Esperar un poco para que el API inicie
sleep 3

# Crear terminal 2 para Cliente
echo "🎨 Iniciando Cliente en terminal separada..."
gnome-terminal -- bash -c "cd creditos-client && npm run dev" &
CLIENT_PID=$!

echo ""
echo "✅ Ambos servicios iniciados:"
echo "   📡 API:     http://localhost:3000"
echo "   🎨 Cliente: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Esperar a que se detengan
wait
