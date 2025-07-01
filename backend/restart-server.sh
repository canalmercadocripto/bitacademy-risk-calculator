#!/bin/bash

echo "🔄 Reiniciando servidor BitAcademy..."

# Parar processos existentes
echo "⏹️ Parando servidor..."
pkill -f "node server.js" 2>/dev/null
pkill -f "npm start" 2>/dev/null

# Aguardar um momento
sleep 3

# Iniciar servidor
echo "🚀 Iniciando servidor..."
npm start &

# Aguardar inicialização
sleep 5

# Testar se está funcionando
echo "🔍 Testando conexão..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Servidor funcionando!"
    echo "🌐 Backend: http://localhost:3001"
    echo "🌐 Frontend: http://localhost:3000"
else
    echo "❌ Servidor não está respondendo"
fi