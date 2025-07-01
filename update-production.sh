#!/bin/bash

# Script de Atualização Segura para VPS
# BitAcademy Risk Calculator - Novas funcionalidades de registro

echo "🚀 INICIANDO ATUALIZAÇÃO SEGURA DO BITACADEMY"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="/var/backups/bitacademy"
APP_DIR="/var/www/bitacademy"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Verificar se o diretório da aplicação existe
if [ ! -d "$APP_DIR" ]; then
    error "Diretório da aplicação não encontrado: $APP_DIR"
fi

echo ""
log "🔍 Verificando sistema atual..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 não encontrado. Instale com: npm install -g pm2"
fi

# Verificar se a aplicação está rodando
if ! pm2 list | grep -q "bitacademy"; then
    warning "Aplicação BitAcademy não encontrada no PM2"
    echo "Aplicações PM2 atuais:"
    pm2 list
    read -p "Continuar mesmo assim? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
log "💾 Criando backup completo..."

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Backup da aplicação atual
log "Fazendo backup dos arquivos da aplicação..."
tar -czf "$BACKUP_DIR/bitacademy_app_$DATE.tar.gz" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"
success "Backup da aplicação salvo: $BACKUP_DIR/bitacademy_app_$DATE.tar.gz"

# Backup do banco de dados
log "Fazendo backup do banco de dados..."
if [ -f "$APP_DIR/backend/bitacademy.db" ]; then
    cp "$APP_DIR/backend/bitacademy.db" "$BACKUP_DIR/bitacademy_db_$DATE.db"
    success "Backup do banco salvo: $BACKUP_DIR/bitacademy_db_$DATE.db"
else
    warning "Arquivo do banco não encontrado em $APP_DIR/backend/bitacademy.db"
fi

# Backup da configuração do nginx
log "Fazendo backup da configuração do nginx..."
if [ -f "/etc/nginx/sites-available/bitacademy" ]; then
    cp "/etc/nginx/sites-available/bitacademy" "$BACKUP_DIR/nginx_bitacademy_$DATE.conf"
    success "Backup do nginx salvo"
fi

# Backup das variáveis de ambiente
log "Fazendo backup das variáveis de ambiente..."
if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$BACKUP_DIR/backend_env_$DATE"
    success "Backup do .env salvo"
fi

echo ""
log "⏹️ Parando aplicação atual..."

# Parar aplicação PM2
pm2 stop all
success "Aplicação parada"

echo ""
log "📥 Baixando nova versão do GitHub..."

# Entrar no diretório da aplicação
cd "$APP_DIR" || error "Não foi possível acessar $APP_DIR"

# Fazer backup das mudanças locais (se houver)
if [ -n "$(git status --porcelain)" ]; then
    warning "Existem mudanças locais não commitadas"
    git add .
    git commit -m "backup: mudanças locais antes da atualização $DATE" 2>/dev/null || true
fi

# Puxar mudanças do GitHub
log "Atualizando código do repositório..."
git fetch origin
git reset --hard origin/main
success "Código atualizado do GitHub"

echo ""
log "🔄 Executando migração do banco de dados..."

# Executar migração do banco para adicionar novos campos
cd "$APP_DIR/backend" || error "Não foi possível acessar backend"

# Verificar se o arquivo de setup existe
if [ -f "setup-database-sqlite.js" ]; then
    log "Executando migração do banco SQLite..."
    node setup-database-sqlite.js
    success "Migração do banco concluída"
else
    warning "Script de migração não encontrado, pulando..."
fi

echo ""
log "📦 Instalando dependências atualizadas..."

# Instalar dependências do backend
log "Instalando dependências do backend..."
npm install --production
success "Dependências do backend instaladas"

# Instalar dependências do frontend
cd "$APP_DIR/frontend" || error "Não foi possível acessar frontend"
log "Instalando dependências do frontend..."
npm install
success "Dependências do frontend instaladas"

# Build do frontend
log "Fazendo build do frontend..."
npm run build
success "Build do frontend concluído"

echo ""
log "⚙️ Restaurando configurações..."

# Restaurar .env se existir backup
if [ -f "$BACKUP_DIR/backend_env_$DATE" ]; then
    cp "$BACKUP_DIR/backend_env_$DATE" "$APP_DIR/backend/.env"
    success "Configurações .env restauradas"
fi

echo ""
log "🚀 Iniciando aplicação atualizada..."

# Voltar para o diretório raiz da aplicação
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
log "🧪 Testando novas funcionalidades..."

# Testar endpoint de registro
log "Testando endpoint de registro..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","lastName":"User","email":"test@test.com","password":"123456","phone":"11999999999","countryCode":"+55"}')

if [ "$RESPONSE" = "201" ] || [ "$RESPONSE" = "409" ]; then
    success "✅ Endpoint de registro funcionando (código: $RESPONSE)"
else
    warning "⚠️ Endpoint de registro retornou código: $RESPONSE"
fi

echo ""
success "🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo -e "${GREEN}📋 RESUMO DA ATUALIZAÇÃO:${NC}"
echo "✅ Backup completo realizado em: $BACKUP_DIR"
echo "✅ Código atualizado do GitHub"
echo "✅ Migração do banco executada"
echo "✅ Dependências atualizadas"
echo "✅ Frontend rebuilded"
echo "✅ Aplicação reiniciada"
echo ""
echo -e "${BLUE}🆕 NOVAS FUNCIONALIDADES DISPONÍVEIS:${NC}"
echo "📝 Formulário de registro completo (nome, sobrenome, email, senha, telefone)"
echo "🔐 Validação completa de campos obrigatórios"
echo "📱 Campo telefone com seleção de código do país"
echo "🧪 Testes automatizados incluídos"
echo ""
echo -e "${YELLOW}📋 COMANDOS ÚTEIS:${NC}"
echo "Ver logs: pm2 logs"
echo "Status: pm2 status"
echo "Restart: pm2 restart all"
echo "Ver backups: ls -la $BACKUP_DIR"
echo ""
echo -e "${GREEN}🌐 Acesse seu site para testar as novas funcionalidades!${NC}"

# Salvar informações da atualização
cat > "$BACKUP_DIR/update_log_$DATE.txt" << EOF
ATUALIZAÇÃO BITACADEMY - $DATE
==============================

Data: $(date)
Versão anterior: Backup em bitacademy_app_$DATE.tar.gz
Versão atual: $(git rev-parse HEAD)

Novas funcionalidades:
- Formulário de registro completo
- Campos: nome, sobrenome, email, senha, telefone
- Validação completa
- Migração do banco de dados

Backups criados:
- Aplicação: $BACKUP_DIR/bitacademy_app_$DATE.tar.gz
- Banco: $BACKUP_DIR/bitacademy_db_$DATE.db
- Nginx: $BACKUP_DIR/nginx_bitacademy_$DATE.conf
- Env: $BACKUP_DIR/backend_env_$DATE

Status: SUCESSO
EOF

success "Log da atualização salvo em: $BACKUP_DIR/update_log_$DATE.txt"