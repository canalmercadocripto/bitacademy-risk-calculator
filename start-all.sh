#!/bin/bash

echo "🚀 Iniciando aplicação BitAcademy..."
echo ""

# Função para verificar se uma porta está em uso
check_port() {
    ss -tlnp | grep -q ":$1 "
}

# Parar processos existentes se necessário
echo "🧹 Limpando processos anteriores..."
pkill -f "react-scripts start" 2>/dev/null
pkill -f "node server.js" 2>/dev/null
sleep 2

# Iniciar backend
echo "🔧 Iniciando backend (porta 3001)..."
cd /home/admplay/calculator_bitacademy/backend

if check_port 3001; then
    echo "⚠️  Porta 3001 já está em uso"
else
    npm start > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
fi

# Aguardar backend inicializar
sleep 5

# Iniciar frontend
echo "🎨 Iniciando frontend (porta 3000)..."
cd /home/admplay/calculator_bitacademy/frontend

if check_port 3000; then
    echo "⚠️  Porta 3000 já está em uso"
else
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend PID: $FRONTEND_PID"
fi

# Aguardar frontend inicializar
sleep 10

echo ""
echo "🔍 Verificando serviços..."

# Executar verificação
/home/admplay/calculator_bitacademy/check-services.sh

echo ""
echo "📝 Logs disponíveis em:"
echo "   Backend: /home/admplay/calculator_bitacademy/backend/backend.log"
echo "   Frontend: /home/admplay/calculator_bitacademy/frontend/frontend.log"
echo ""
echo "🛑 Para parar tudo: pkill -f 'react-scripts\\|node server.js'"