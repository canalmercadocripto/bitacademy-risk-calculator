#!/bin/bash

echo "🛑 Parando Sistema BitAcademy"
echo "============================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parar processos usando PIDs
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}🔄 Parando backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        rm backend.pid
    else
        echo -e "${YELLOW}⚠️ Backend não estava rodando${NC}"
        rm -f backend.pid
    fi
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}🔄 Parando frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        rm frontend.pid
    else
        echo -e "${YELLOW}⚠️ Frontend não estava rodando${NC}"
        rm -f frontend.pid
    fi
fi

# Força parar qualquer processo relacionado
echo -e "${BLUE}🧹 Limpando processos relacionados...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Verificar se as portas estão livres
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️ Porta 3001 ainda está em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 3001 (backend) liberada${NC}"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}⚠️ Porta 3000 ainda está em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 3000 (frontend) liberada${NC}"
fi

echo ""
echo -e "${GREEN}✅ Sistema BitAcademy parado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Logs salvos em:${NC}"
echo "   - backend.log"
echo "   - frontend.log"
echo ""
echo -e "${YELLOW}Para reiniciar: ./start-local.sh${NC}"