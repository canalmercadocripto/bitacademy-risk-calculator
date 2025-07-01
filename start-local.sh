#!/bin/bash

echo "🚀 Iniciando Sistema BitAcademy Calculadora de Risco"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verificar dependências
echo -e "${BLUE}📋 Verificando dependências...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 16+ primeiro.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado. Instale npm primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) encontrado${NC}"
echo -e "${GREEN}✅ npm $(npm --version) encontrado${NC}"

# Configurar banco de dados
echo -e "\n${BLUE}🗄️ Configurando banco de dados...${NC}"
cd backend
if [ ! -f "bitacademy.db" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
    npm install --silent
    
    echo -e "${YELLOW}🔧 Criando banco SQLite...${NC}"
    node setup-database-sqlite.js
else
    echo -e "${GREEN}✅ Banco SQLite já configurado${NC}"
fi

# Verificar se as portas estão livres
echo -e "\n${BLUE}🔍 Verificando portas...${NC}"

if check_port 3001; then
    echo -e "${YELLOW}⚠️ Porta 3001 (backend) já está em uso${NC}"
    read -p "Deseja parar o processo existente? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "node.*server.js" 2>/dev/null || true
        sleep 2
    fi
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️ Porta 3000 (frontend) já está em uso${NC}"
    read -p "Deseja parar o processo existente? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "react-scripts start" 2>/dev/null || true
        sleep 2
    fi
fi

# Iniciar backend
echo -e "\n${BLUE}🖥️ Iniciando backend (porta 3001)...${NC}"
cd backend
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

# Aguardar backend inicializar
echo -e "${YELLOW}⏳ Aguardando backend inicializar...${NC}"
sleep 5

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend rodando em http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar backend. Verifique os logs em backend.log${NC}"
    exit 1
fi

# Configurar frontend
echo -e "\n${BLUE}🎨 Configurando frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
    npm install --silent
fi

# Iniciar frontend
echo -e "\n${BLUE}💻 Iniciando frontend (porta 3000)...${NC}"
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

# Aguardar frontend inicializar
echo -e "${YELLOW}⏳ Aguardando frontend inicializar...${NC}"
sleep 10

# Verificar se frontend está rodando
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend rodando em http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar frontend. Verifique os logs em frontend.log${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Sistema BitAcademy iniciado com sucesso!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:3001"
echo -e "${BLUE}💾 Banco:${NC}    SQLite (backend/bitacademy.db)"
echo ""
echo -e "${YELLOW}👤 Usuário Admin Padrão:${NC}"
echo -e "   Email: admin@bitacademy.vip"
echo -e "   Senha: admin123"
echo ""
echo -e "${BLUE}📝 Funcionalidades Disponíveis:${NC}"
echo "   ✅ Calculadora de Risk Management"
echo "   ✅ Sistema de Autenticação"
echo "   ✅ Histórico de Trades"
echo "   ✅ Dashboard Administrativo"
echo "   ✅ API Completa"
echo ""
echo -e "${YELLOW}📋 Comandos úteis:${NC}"
echo "   Para parar: ./stop-local.sh"
echo "   Ver logs backend: tail -f backend.log"
echo "   Ver logs frontend: tail -f frontend.log"
echo ""
echo -e "${GREEN}Pronto para usar! Acesse http://localhost:3000${NC}"