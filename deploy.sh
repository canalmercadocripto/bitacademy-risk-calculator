#!/bin/bash

# Script de Deploy para VPS
# BitAcademy Risk Calculator

echo "🚀 Iniciando deploy do BitAcademy Risk Calculator..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script a partir do diretório raiz do projeto${NC}"
    exit 1
fi

# Instalar dependências do backend
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
cd backend
npm install --production
cd ..

# Instalar dependências do frontend
echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
cd frontend
npm install

# Build do frontend para produção
echo -e "${YELLOW}🔨 Fazendo build do frontend...${NC}"
npm run build
cd ..

# Criar arquivo de ambiente para produção
echo -e "${YELLOW}⚙️ Configurando ambiente de produção...${NC}"
cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
CACHE_TTL=300
CORS_ORIGIN=http://localhost:3000,https://seu-dominio.com
EOF

echo -e "${GREEN}✅ Deploy preparado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Fazer upload dos arquivos para sua VPS"
echo "2. Instalar Node.js na VPS (versão 18+)"
echo "3. Instalar PM2 para gerenciar processos"
echo "4. Configurar nginx como proxy reverso"
echo "5. Configurar domínio e SSL"
echo ""
echo -e "${GREEN}🔗 Arquivos prontos para upload!${NC}"