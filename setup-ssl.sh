#!/bin/bash

# Script para configurar SSL depois que o site estiver funcionando
echo "🔒 Configurando SSL com Let's Encrypt..."

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

# Verificar se o domínio foi configurado
echo -e "${YELLOW}⚠️ IMPORTANTE: Certifique-se de que:${NC}"
echo "1. Seu domínio está apontando para este servidor"
echo "2. O site está funcionando em HTTP"
echo "3. Você editou o nginx-initial.conf com seu domínio real"
echo ""
read -p "Seu domínio (ex: meusite.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domínio não informado!${NC}"
    exit 1
fi

# Testar conectividade
echo -e "${YELLOW}🌐 Testando conectividade...${NC}"
if curl -I "http://$DOMAIN" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Site acessível via HTTP${NC}"
else
    echo -e "${RED}❌ Site não está acessível. Verifique:${NC}"
    echo "- DNS está apontando correto?"
    echo "- Nginx está rodando? (systemctl status nginx)"
    echo "- PM2 está rodando? (pm2 status)"
    exit 1
fi

# Configurar SSL
echo -e "${YELLOW}🔒 Configurando SSL para $DOMAIN...${NC}"
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL configurado com sucesso!${NC}"
    
    # Testar HTTPS
    echo -e "${YELLOW}🧪 Testando HTTPS...${NC}"
    if curl -I "https://$DOMAIN" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HTTPS funcionando!${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTPS pode demorar alguns minutos para propagar${NC}"
    fi
    
    # Configurar renovação automática
    echo -e "${YELLOW}🔄 Configurando renovação automática...${NC}"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    echo -e "${GREEN}✅ Configuração SSL completa!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Seus sites:${NC}"
    echo "HTTP: http://$DOMAIN (redirecionará para HTTPS)"
    echo "HTTPS: https://$DOMAIN"
    echo ""
    echo -e "${BLUE}📋 Comandos úteis:${NC}"
    echo "- Ver certificados: certbot certificates"
    echo "- Renovar manualmente: certbot renew"
    echo "- Testar renovação: certbot renew --dry-run"
    
else
    echo -e "${RED}❌ Erro ao configurar SSL${NC}"
    echo ""
    echo -e "${YELLOW}💡 Possíveis soluções:${NC}"
    echo "1. Verificar se o domínio está apontando correto"
    echo "2. Aguardar propagação do DNS (até 24h)"
    echo "3. Verificar se há outro certificado conflitante"
    echo "4. Tentar novamente em alguns minutos"
    exit 1
fi