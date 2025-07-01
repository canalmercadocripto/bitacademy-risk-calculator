#!/bin/bash

echo "🔍 Verificando status dos serviços BitAcademy..."
echo ""

# Função para verificar porta
check_port() {
    local port=$1
    local service=$2
    
    if ss -tlnp | grep -q ":$port "; then
        echo "✅ $service (porta $port): FUNCIONANDO"
        return 0
    else
        echo "❌ $service (porta $port): PARADO"
        return 1
    fi
}

# Verificar serviços
frontend_status=0
backend_status=0

check_port 3000 "Frontend React" || frontend_status=1
check_port 3001 "Backend Node.js" || backend_status=1

echo ""

# Testar conectividade
if [ $backend_status -eq 0 ]; then
    echo "🌐 Testando API do backend..."
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ API Backend: RESPONDENDO"
    else
        echo "❌ API Backend: NÃO RESPONDE"
        backend_status=1
    fi
fi

if [ $frontend_status -eq 0 ]; then
    echo "🌐 Testando Frontend..."
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend: CARREGANDO"
    else
        echo "❌ Frontend: NÃO CARREGA"
        frontend_status=1
    fi
fi

echo ""

# Status geral
if [ $frontend_status -eq 0 ] && [ $backend_status -eq 0 ]; then
    echo "🎉 TUDO FUNCIONANDO!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🌐 Backend: http://localhost:3001"
    echo "👑 Admin: http://localhost:3000/admin"
else
    echo "⚠️ PROBLEMAS DETECTADOS!"
    echo ""
    echo "Para resolver:"
    
    if [ $backend_status -eq 1 ]; then
        echo "🔧 Backend parado - Execute: cd backend && npm start"
    fi
    
    if [ $frontend_status -eq 1 ]; then
        echo "🔧 Frontend parado - Execute: cd frontend && npm start"
    fi
fi

echo ""