#!/bin/bash

# Script simples para iniciar a aplicação localmente
# Calculadora de Risk Management - BitAcademy

set -e

echo "🚀 Iniciando Calculadora de Risk Management..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

echo "📦 Node.js version: $(node --version)"

# Criar arquivo .env se não existir
if [ ! -f "./backend/.env" ]; then
    echo "📝 Criando arquivo .env..."
    cp ./backend/.env.example ./backend/.env
    
    # Configurar variáveis básicas
    cat > ./backend/.env <<EOF
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CACHE_TTL=300
EOF
    echo "✅ Arquivo .env criado"
fi

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Aplicação parada"
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Verificar se as dependências estão instaladas
if [ ! -d "./backend/node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "./frontend/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd frontend && npm install && cd ..
fi

# Iniciar backend
echo "🔧 Iniciando backend na porta 3001..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 5

# Verificar se backend está funcionando
attempts=0
max_attempts=10
while [ $attempts -lt $max_attempts ]; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend funcionando!"
        break
    fi
    attempts=$((attempts + 1))
    echo "⏳ Tentativa $attempts/$max_attempts..."
    sleep 2
done

if [ $attempts -eq $max_attempts ]; then
    echo "❌ Backend não conseguiu iniciar"
    cleanup
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend na porta 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Aplicação iniciada com sucesso!"
echo ""
echo "📱 Acesse em:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:3001"
echo "   ❤️  Health Check: http://localhost:3001/health"
echo ""
echo "📊 Endpoints da API:"
echo "   📈 Exchanges: http://localhost:3001/api/exchanges"
echo "   🧮 Calculator: http://localhost:3001/api/calculator/info"
echo ""
echo "💡 Pressione Ctrl+C para parar a aplicação"
echo ""

# Aguardar frontend iniciar
echo "⏳ Aguardando frontend iniciar..."
sleep 10

# Verificar se frontend está acessível
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend acessível!"
    echo ""
    echo "🚀 Tudo funcionando! A calculadora está pronta para seus alunos."
else
    echo "⚠️  Frontend ainda inicializando... aguarde alguns segundos"
fi

# Manter o script rodando
echo ""
echo "🔄 Mantendo serviços ativos..."
echo "📊 PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"

# Wait para os processos filhos
wait