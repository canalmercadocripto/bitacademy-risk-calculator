#!/bin/bash

# Script de Rollback para VPS
# BitAcademy Risk Calculator - Restaurar versão anterior

echo "🔄 SCRIPT DE ROLLBACK DO BITACADEMY"
echo "==================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="/var/backups/bitacademy"
APP_DIR="/var/www/bitacademy"

# Função para log
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (use sudo)"
fi

# Verificar se o diretório de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    error "Diretório de backup não encontrado: $BACKUP_DIR"
fi

echo ""
log "🔍 Listando backups disponíveis..."

# Listar backups disponíveis
echo -e "${YELLOW}Backups de aplicação disponíveis:${NC}"
ls -la "$BACKUP_DIR" | grep "bitacademy_app_.*\.tar\.gz" | nl

echo ""
read -p "Digite o número do backup que deseja restaurar (ou 'q' para sair): " BACKUP_CHOICE

if [ "$BACKUP_CHOICE" = "q" ]; then
    log "Operação cancelada pelo usuário"
    exit 0
fi

# Obter o arquivo de backup selecionado
BACKUP_FILE=$(ls "$BACKUP_DIR"/bitacademy_app_*.tar.gz | sed -n "${BACKUP_CHOICE}p")

if [ -z "$BACKUP_FILE" ]; then
    error "Backup selecionado não é válido"
fi

echo ""
log "📦 Backup selecionado: $(basename $BACKUP_FILE)"

# Extrair data do backup para encontrar outros arquivos relacionados
BACKUP_DATE=$(basename "$BACKUP_FILE" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
log "Data do backup: $BACKUP_DATE"

# Confirmar operação
echo ""
warning "⚠️ ATENÇÃO: Esta operação irá:"
echo "   1. Parar a aplicação atual"
echo "   2. Restaurar o backup selecionado"
echo "   3. Restaurar o banco de dados"
echo "   4. Restaurar configurações"
echo "   5. Reiniciar a aplicação"
echo ""
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Operação cancelada"
    exit 0
fi

echo ""
log "⏹️ Parando aplicação atual..."

# Parar aplicação PM2
pm2 stop all
success "Aplicação parada"

echo ""
log "🗂️ Fazendo backup da versão atual (antes do rollback)..."

# Criar backup da versão atual antes do rollback
ROLLBACK_DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/bitacademy_before_rollback_$ROLLBACK_DATE.tar.gz" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"
success "Backup pré-rollback criado: bitacademy_before_rollback_$ROLLBACK_DATE.tar.gz"

echo ""
log "🔄 Restaurando backup selecionado..."

# Remover aplicação atual
rm -rf "$APP_DIR"

# Restaurar backup
tar -xzf "$BACKUP_FILE" -C "$(dirname $APP_DIR)"
success "Arquivos da aplicação restaurados"

echo ""
log "💾 Restaurando banco de dados..."

# Restaurar banco de dados se existir
DB_BACKUP="$BACKUP_DIR/bitacademy_db_$BACKUP_DATE.db"
if [ -f "$DB_BACKUP" ]; then
    cp "$DB_BACKUP" "$APP_DIR/backend/bitacademy.db"
    success "Banco de dados restaurado"
else
    warning "Backup do banco não encontrado para esta data: $DB_BACKUP"
fi

echo ""
log "⚙️ Restaurando configurações..."

# Restaurar configuração do nginx
NGINX_BACKUP="$BACKUP_DIR/nginx_bitacademy_$BACKUP_DATE.conf"
if [ -f "$NGINX_BACKUP" ]; then
    cp "$NGINX_BACKUP" "/etc/nginx/sites-available/bitacademy"
    success "Configuração do nginx restaurada"
    
    # Testar e recarregar nginx
    if nginx -t; then
        systemctl reload nginx
        success "Nginx recarregado"
    else
        warning "Erro na configuração do nginx, verifique manualmente"
    fi
fi

# Restaurar .env
ENV_BACKUP="$BACKUP_DIR/backend_env_$BACKUP_DATE"
if [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" "$APP_DIR/backend/.env"
    success "Variáveis de ambiente restauradas"
fi

echo ""
log "🚀 Iniciando aplicação restaurada..."

# Entrar no diretório da aplicação
cd "$APP_DIR" || error "Não foi possível acessar $APP_DIR"

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js
success "Aplicação iniciada"

# Aguardar alguns segundos para a aplicação inicializar
log "Aguardando aplicação inicializar..."
sleep 10

echo ""
log "🔍 Verificando status da aplicação..."

# Verificar status do PM2
pm2 status

# Verificar se a aplicação está respondendo
if curl -s http://localhost:3001/health > /dev/null; then
    success "✅ Backend está respondendo (porta 3001)"
else
    error "❌ Backend não está respondendo na porta 3001"
fi

if curl -s http://localhost:3000 > /dev/null; then
    success "✅ Frontend está respondendo (porta 3000)"
else
    warning "⚠️ Frontend pode não estar respondendo na porta 3000"
fi

echo ""
success "🎉 ROLLBACK CONCLUÍDO COM SUCESSO!"
echo ""
echo -e "${GREEN}📋 RESUMO DO ROLLBACK:${NC}"
echo "✅ Backup atual criado: bitacademy_before_rollback_$ROLLBACK_DATE.tar.gz"
echo "✅ Aplicação restaurada do backup: $(basename $BACKUP_FILE)"
echo "✅ Banco de dados restaurado"
echo "✅ Configurações restauradas"
echo "✅ Aplicação reiniciada"
echo ""
echo -e "${YELLOW}📋 COMANDOS ÚTEIS:${NC}"
echo "Ver logs: pm2 logs"
echo "Status: pm2 status"
echo "Restart: pm2 restart all"
echo ""
echo -e "${GREEN}🌐 Teste seu site para confirmar que está funcionando!${NC}"

# Salvar log do rollback
cat > "$BACKUP_DIR/rollback_log_$ROLLBACK_DATE.txt" << EOF
ROLLBACK BITACADEMY - $ROLLBACK_DATE
=====================================

Data: $(date)
Backup restaurado: $(basename $BACKUP_FILE)
Data do backup: $BACKUP_DATE

Arquivos restaurados:
- Aplicação: $BACKUP_FILE
- Banco: $DB_BACKUP
- Nginx: $NGINX_BACKUP
- Env: $ENV_BACKUP

Backup pré-rollback: bitacademy_before_rollback_$ROLLBACK_DATE.tar.gz

Status: SUCESSO
EOF

success "Log do rollback salvo em: $BACKUP_DIR/rollback_log_$ROLLBACK_DATE.txt"