#!/bin/bash

# Script de configuração da VPS
# Execute este script NA SUA VPS depois de fazer upload dos arquivos

echo "🚀 Configurando VPS para BitAcademy Risk Calculator..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se é root ou sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Execute este script como root ou com sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}📦 Instalando dependências básicas...${NC}"
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Instalar Node.js 20.x LTS
echo -e "${YELLOW}📦 Instalando Node.js 20.x LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar versões instaladas
echo -e "${BLUE}📋 Versões instaladas:${NC}"
node --version
npm --version

# Instalar PM2 globalmente
echo -e "${YELLOW}📦 Instalando PM2...${NC}"
npm install -g pm2 serve

# Configurar firewall
echo -e "${YELLOW}🔒 Configurando firewall...${NC}"
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Criar diretório de logs
echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
mkdir -p /var/www/bitacademy/logs
mkdir -p /var/log/nginx

# Configurar nginx
echo -e "${YELLOW}⚙️ Configurando nginx...${NC}"
cp nginx.conf /etc/nginx/sites-available/bitacademy
ln -sf /etc/nginx/sites-available/bitacademy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do nginx
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuração do nginx OK${NC}"
    systemctl restart nginx
    systemctl enable nginx
else
    echo -e "${RED}❌ Erro na configuração do nginx${NC}"
    exit 1
fi

echo -e "${GREEN}✅ VPS configurada com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Copie os arquivos do projeto para: /var/www/bitacademy/"
echo "2. Execute: cd /var/www/bitacademy && npm run deploy"
echo "3. Configure SSL: certbot --nginx -d seu-dominio.com"
echo "4. Inicie os serviços: pm2 start ecosystem.config.js"
echo "5. Configure PM2 startup: pm2 startup && pm2 save"
echo ""
echo -e "${BLUE}🔗 Comandos úteis:${NC}"
echo "- Ver logs: pm2 logs"
echo "- Restart: pm2 restart all"
echo "- Status: pm2 status"
echo "- Monitor: pm2 monit"