#!/bin/bash
echo "🔮 Crom Encantaria - Iniciando Sistema..."

# Check if node_modules exists, if not, install
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências globais..."
    npm install
fi

echo "🚀 Iniciando Servidor e Cliente..."
npm run dev
