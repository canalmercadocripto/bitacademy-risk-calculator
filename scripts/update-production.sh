#!/bin/bash

# Script para atualizar produção a partir do GitHub
echo "🚀 Atualizando aplicação em produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script a partir do diretório raiz do projeto${NC}"
    exit 1
fi

# Verificar se é um repositório git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Este não é um repositório Git. Execute primeiro o deploy-to-github.sh${NC}"
    exit 1
fi

# Fazer backup dos arquivos de configuração sensíveis
echo -e "${YELLOW}💾 Fazendo backup de configurações...${NC}"
cp backend/.env backend/.env.backup 2>/dev/null || true
cp /etc/nginx/sites-available/bitacademy /tmp/nginx-bitacademy.backup 2>/dev/null || true

# Parar aplicação
echo -e "${YELLOW}⏹️ Parando aplicação...${NC}"
pm2 stop all

# Atualizar código do GitHub
echo -e "${YELLOW}📥 Baixando atualizações do GitHub...${NC}"
git fetch origin
git reset --hard origin/main

# Restaurar arquivos de configuração
echo -e "${YELLOW}🔧 Restaurando configurações...${NC}"
cp backend/.env.backup backend/.env 2>/dev/null || true

# Verificar se arquivo .env existe
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️ Criando arquivo .env a partir do exemplo...${NC}"
    cp .env.example backend/.env
    echo -e "${BLUE}📝 Edite o arquivo backend/.env com suas configurações${NC}"
    echo "Arquivo criado com configurações padrão. Revise se necessário."
fi

# Atualizar dependências do backend
echo -e "${YELLOW}📦 Atualizando dependências do backend...${NC}"
cd backend
npm install --production
cd ..

# Atualizar e construir frontend
echo -e "${YELLOW}🎨 Construindo novo frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Verificar se o build foi criado
if [ ! -d "frontend/build" ]; then
    echo -e "${RED}❌ Falha ao construir frontend${NC}"
    exit 1
fi

# Copiar build para diretório do nginx
echo -e "${YELLOW}📁 Atualizando arquivos estáticos...${NC}"
sudo rm -rf /var/www/bitacademy/*
sudo cp -r frontend/build/* /var/www/bitacademy/
sudo chown -R www-data:www-data /var/www/bitacademy

# Testar configuração do nginx
echo -e "${YELLOW}🔍 Testando configuração do nginx...${NC}"
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro na configuração do nginx${NC}"
    echo "Restaurando backup..."
    sudo cp /tmp/nginx-bitacademy.backup /etc/nginx/sites-available/bitacademy 2>/dev/null || true
    exit 1
fi

# Reiniciar nginx
echo -e "${YELLOW}🔄 Reiniciando nginx...${NC}"
sudo systemctl reload nginx

# Iniciar aplicação
echo -e "${YELLOW}▶️ Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js

# Aguardar inicialização
sleep 5

# Verificar status
echo -e "${YELLOW}📊 Verificando status dos serviços...${NC}"
pm2 status

# Teste de saúde
echo -e "${YELLOW}🏥 Teste de saúde...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Backend funcionando corretamente${NC}"
else
    echo -e "${RED}❌ Backend com problemas (HTTP $HEALTH_CHECK)${NC}"
    echo "Verificando logs:"
    pm2 logs --lines 10
fi

# Verificar se frontend está sendo servido
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)

if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Frontend funcionando corretamente${NC}"
else
    echo -e "${RED}❌ Frontend com problemas (HTTP $FRONTEND_CHECK)${NC}"
fi

# Salvar processos PM2
pm2 save

# Limpar backups antigos
rm -f backend/.env.backup

echo ""
echo -e "${GREEN}🎉 Atualização concluída!${NC}"
echo ""
echo -e "${BLUE}📋 Status dos serviços:${NC}"
echo "• Backend: http://localhost:3001"
echo "• Frontend: http://localhost"
echo "• PM2 Status: $(pm2 list | grep -c online) processos online"
echo ""
echo -e "${BLUE}🔗 Acesse sua aplicação:${NC}"
echo "• Site: https://calculadora.bitacademy.vip"
echo "• API: https://calculadora.bitacademy.vip/api/exchanges"
echo ""
echo -e "${YELLOW}💡 Comandos úteis:${NC}"
echo "• pm2 status       - Ver status dos processos"
echo "• pm2 logs         - Ver logs em tempo real"
echo "• pm2 restart all  - Reiniciar todos os processos"
echo "• nginx -t         - Testar configuração do nginx"