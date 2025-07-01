#!/bin/bash

# Script para LIMPAR COMPLETAMENTE a VPS
# Remove TUDO relacionado ao BitAcademy

echo "🧹 LIMPEZA COMPLETA DA VPS - BITACADEMY"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

echo ""
warning "🚨 ATENÇÃO! ESTE SCRIPT IRÁ REMOVER:"
echo "   🗑️ TODAS as aplicações PM2"
echo "   🗑️ Diretório /var/www/bitacademy"
echo "   🗑️ Configurações do Nginx"
echo "   🗑️ Bancos de dados"
echo "   🗑️ Backups (opcional)"
echo "   🗑️ Processos Node.js relacionados"
echo ""
read -p "CONFIRMA QUE QUER REMOVER TUDO? (digite 'REMOVER TUDO'): " -r
if [ "$REPLY" != "REMOVER TUDO" ]; then
    log "Operação cancelada"
    exit 0
fi

echo ""
log "🛑 Parando TODAS as aplicações..."

# Parar e remover TODAS as aplicações PM2
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    pm2 unstartup 2>/dev/null || true
    success "PM2 completamente limpo"
else
    warning "PM2 não encontrado"
fi

echo ""
log "💀 Matando processos Node.js..."

# Matar TODOS os processos Node.js e npm
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true
pkill -f "bitacademy" 2>/dev/null || true

# Aguardar um pouco
sleep 3

# Força matar se ainda houver
pkill -9 -f node 2>/dev/null || true
pkill -9 -f npm 2>/dev/null || true

success "Processos Node.js eliminados"

echo ""
log "🗑️ Removendo diretórios da aplicação..."

# Remover diretório principal
if [ -d "/var/www/bitacademy" ]; then
    rm -rf /var/www/bitacademy
    success "Removido: /var/www/bitacademy"
else
    warning "Diretório /var/www/bitacademy não existe"
fi

# Remover outros possíveis locais
POSSIBLE_DIRS=(
    "/var/www/html/bitacademy"
    "/home/bitacademy"
    "/root/bitacademy"
    "/opt/bitacademy"
    "/usr/local/bitacademy"
)

for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        success "Removido: $dir"
    fi
done

echo ""
log "🌐 Removendo configurações do Nginx..."

# Remover configurações do Nginx
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/bitacademy"
    "/etc/nginx/sites-enabled/bitacademy"
    "/etc/nginx/sites-available/bitacademy-ssl"
    "/etc/nginx/sites-enabled/bitacademy-ssl"
)

for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ] || [ -L "$config" ]; then
        rm -f "$config"
        success "Removido: $config"
    fi
done

# Restaurar configuração padrão do Nginx
if [ -f "/etc/nginx/sites-available/default" ] && [ ! -L "/etc/nginx/sites-enabled/default" ]; then
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    success "Configuração padrão do Nginx restaurada"
fi

# Testar e recarregar Nginx
if command -v nginx &> /dev/null; then
    if nginx -t 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || true
        success "Nginx recarregado"
    else
        warning "Erro na configuração do Nginx"
    fi
fi

echo ""
log "💾 Removendo bancos de dados..."

# Procurar e remover bancos SQLite relacionados
find /var -name "*bitacademy*.db" -type f -delete 2>/dev/null || true
find /tmp -name "*bitacademy*.db" -type f -delete 2>/dev/null || true
find /root -name "*bitacademy*.db" -type f -delete 2>/dev/null || true

success "Bancos de dados removidos"

echo ""
log "🔒 Removendo certificados SSL (se existirem)..."

# Remover certificados SSL do Let's Encrypt (se existirem)
if [ -d "/etc/letsencrypt/live" ]; then
    find /etc/letsencrypt/live -name "*bitacademy*" -type d -exec rm -rf {} + 2>/dev/null || true
    find /etc/letsencrypt/renewal -name "*bitacademy*" -type f -delete 2>/dev/null || true
fi

success "Certificados SSL removidos"

echo ""
log "📜 Removendo logs..."

# Remover logs relacionados
find /var/log -name "*bitacademy*" -type f -delete 2>/dev/null || true
find /root -name "*bitacademy*" -type f -delete 2>/dev/null || true
find /tmp -name "*bitacademy*" -type f -delete 2>/dev/null || true

success "Logs removidos"

echo ""
log "🗄️ Removendo backups (opcional)..."

read -p "Remover também os backups em /var/backups/bitacademy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "/var/backups/bitacademy" ]; then
        rm -rf /var/backups/bitacademy
        success "Backups removidos"
    else
        warning "Nenhum backup encontrado"
    fi
else
    warning "Backups mantidos em /var/backups/bitacademy (se existirem)"
fi

echo ""
log "🧽 Limpando caches e temporários..."

# Limpar cache npm global (se existir)
if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null || true
fi

# Limpar arquivos temporários
rm -rf /tmp/bitacademy* 2>/dev/null || true
rm -rf /tmp/*bitacademy* 2>/dev/null || true

success "Caches limpos"

echo ""
log "🔍 Verificando se restou algo..."

# Verificar se ainda há processos relacionados
REMAINING_PROCESSES=$(ps aux | grep -i bitacademy | grep -v grep | wc -l)
if [ "$REMAINING_PROCESSES" -gt 0 ]; then
    warning "Ainda há $REMAINING_PROCESSES processos relacionados ao BitAcademy"
    ps aux | grep -i bitacademy | grep -v grep
else
    success "Nenhum processo relacionado encontrado"
fi

# Verificar portas 3000 e 3001
PORTS_IN_USE=$(netstat -tlnp 2>/dev/null | grep -E ':300[01] ' | wc -l)
if [ "$PORTS_IN_USE" -gt 0 ]; then
    warning "Portas 3000/3001 ainda em uso:"
    netstat -tlnp | grep -E ':300[01] '
else
    success "Portas 3000/3001 livres"
fi

# Verificar diretórios restantes
echo ""
log "📁 Verificando diretórios..."
find /var -name "*bitacademy*" -type d 2>/dev/null | head -5
find /home -name "*bitacademy*" -type d 2>/dev/null | head -5
find /root -name "*bitacademy*" -type d 2>/dev/null | head -5

echo ""
success "🎉 LIMPEZA COMPLETA CONCLUÍDA!"
echo ""
echo -e "${GREEN}📋 RESUMO:${NC}"
echo "✅ Aplicações PM2 removidas"
echo "✅ Processos Node.js eliminados"
echo "✅ Diretórios da aplicação removidos"
echo "✅ Configurações Nginx removidas"
echo "✅ Bancos de dados removidos"
echo "✅ Certificados SSL removidos"
echo "✅ Logs removidos"
echo "✅ Caches limpos"
echo ""
echo -e "${BLUE}🌐 Status do servidor:${NC}"

# Status final dos serviços
if command -v nginx &> /dev/null; then
    systemctl is-active --quiet nginx && echo "✅ Nginx: Ativo (configuração padrão)" || echo "❌ Nginx: Inativo"
else
    echo "ℹ️ Nginx: Não instalado"
fi

if command -v pm2 &> /dev/null; then
    PM2_COUNT=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
    echo "ℹ️ PM2: $PM2_COUNT aplicações rodando"
else
    echo "ℹ️ PM2: Disponível"
fi

echo ""
echo -e "${YELLOW}💡 VPS ESTÁ LIMPA E PRONTA PARA USO!${NC}"
echo ""
echo "🚀 Para reinstalar o BitAcademy:"
echo "   1. Clone o repositório"
echo "   2. Execute o script de deploy"
echo "   3. Configure domínio/SSL se necessário"
echo ""
success "🧹 LIMPEZA CONCLUÍDA COM SUCESSO!"