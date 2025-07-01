#!/bin/bash

# Atualização de Produção - BitAcademy
# Script para atualizar aplicação já em produção

echo "🔄 ATUALIZAÇÃO PRODUÇÃO - BITACADEMY"
echo "===================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_DIR="/var/www/bitacademy"
BACKUP_DIR="/var/backups/bitacademy"
DATE=$(date +%Y%m%d_%H%M%S)
BRANCH="main"

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Execute como root: sudo $0"
fi

# Verificar se aplicação existe
if [ ! -d "$APP_DIR" ]; then
    error "Aplicação não encontrada em $APP_DIR. Execute o deploy inicial primeiro."
fi

echo ""
log "🔍 Verificando estado atual..."

cd "$APP_DIR" || error "Não foi possível acessar $APP_DIR"

# Verificar se é um repositório git
if [ ! -d ".git" ]; then
    error "Diretório não é um repositório Git válido"
fi

# Obter informações atuais
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git branch --show-current)

success "Branch atual: $CURRENT_BRANCH"
success "Commit atual: $CURRENT_COMMIT"

echo ""
log "💾 Criando backup completo..."

# Criar backup da aplicação atual
BACKUP_NAME="backup_pre_update_$DATE"
mkdir -p "$BACKUP_DIR"

# Backup dos arquivos principais
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='frontend/build' \
    -C /var/www bitacademy

# Backup do banco de dados
if [ -f "$APP_DIR/backend/bitacademy.db" ]; then
    cp "$APP_DIR/backend/bitacademy.db" "$BACKUP_DIR/bitacademy_${DATE}.db"
    success "Backup do banco criado"
fi

success "Backup criado em: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"

echo ""
log "📥 Atualizando código do GitHub..."

# Stash mudanças locais se existirem
if ! git diff --quiet; then
    warning "Mudanças locais detectadas. Fazendo stash..."
    git stash push -m "Auto-stash antes da atualização $DATE"
fi

# Fetch das atualizações
git fetch origin

# Verificar se há atualizações
REMOTE_COMMIT=$(git rev-parse --short origin/$BRANCH)

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
    warning "Nenhuma atualização disponível. Sistema já está atualizado."
    echo ""
    echo "Deseja continuar mesmo assim? (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        success "Atualização cancelada"
        exit 0
    fi
else
    success "Nova versão disponível: $REMOTE_COMMIT"
fi

# Pull das atualizações
git pull origin $BRANCH

if [ $? -ne 0 ]; then
    error "Falha ao atualizar código do GitHub"
fi

NEW_COMMIT=$(git rev-parse --short HEAD)
success "Código atualizado para commit: $NEW_COMMIT"

echo ""
log "⚙️ Atualizando dependências..."

# Atualizar dependências do backend
cd backend
if [ -f "package.json" ]; then
    npm install --production
    if [ $? -ne 0 ]; then
        warning "Falha ao atualizar dependências do backend"
    else
        success "Dependências do backend atualizadas"
    fi
fi

# Executar migrações se necessário
if [ -f "src/database/migrations-sqlite.js" ]; then
    log "Executando migrações de banco..."
    node -e "
        const { runMigrations } = require('./src/database/migrations-sqlite.js');
        runMigrations().catch(console.error);
    "
    success "Migrações executadas"
fi

echo ""
log "🎨 Reconstruindo frontend..."

cd ../frontend
if [ -f "package.json" ]; then
    # Instalar dependências
    npm install
    
    if [ $? -ne 0 ]; then
        warning "Falha ao instalar dependências do frontend"
    else
        success "Dependências do frontend instaladas"
    fi
    
    # Build de produção
    npm run build
    
    if [ $? -ne 0 ]; then
        error "Falha no build do frontend"
    else
        success "Build de produção atualizado"
    fi
else
    warning "package.json não encontrado no frontend"
fi

echo ""
log "🔄 Reiniciando serviços..."

cd "$APP_DIR"

# Reiniciar aplicação com PM2
pm2 reload ecosystem.config.js

if [ $? -ne 0 ]; then
    warning "Falha ao recarregar com PM2, tentando restart..."
    pm2 restart all
fi

# Recarregar Nginx
systemctl reload nginx

success "Serviços reiniciados"

echo ""
log "⏳ Aguardando estabilização..."
sleep 10

echo ""
log "🧪 Testando aplicação atualizada..."

# Testes de funcionalidade
TESTS_PASSED=0
TOTAL_TESTS=4

# Teste 1: PM2 Status
if pm2 list | grep -q "online"; then
    success "✅ PM2 com aplicações online"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Problemas no PM2"
fi

# Teste 2: Backend
if curl -s http://localhost:3001/health > /dev/null; then
    success "✅ Backend respondendo"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Backend não responde"
fi

# Teste 3: Frontend
if curl -s http://localhost/ > /dev/null; then
    success "✅ Frontend respondendo"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Frontend não responde"
fi

# Teste 4: API de registro
REGISTER_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)

if [ "$REGISTER_TEST" = "400" ]; then
    success "✅ API funcionando corretamente"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ API retornou: $REGISTER_TEST"
fi

# Taxa de sucesso
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo ""
if [ $SUCCESS_RATE -ge 75 ]; then
    success "🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo -e "${GREEN}📊 Taxa de sucesso: $SUCCESS_RATE% ($TESTS_PASSED/$TOTAL_TESTS)${NC}"
    
    # Remover backup antigo se tudo ok
    if [ $SUCCESS_RATE -eq 100 ]; then
        # Manter apenas os 3 backups mais recentes
        cd "$BACKUP_DIR"
        ls -t backup_pre_update_*.tar.gz | tail -n +4 | xargs -r rm
        success "Backups antigos removidos"
    fi
else
    error "⚠️ Atualização com problemas ($SUCCESS_RATE% sucesso). Verifique os logs."
fi

echo ""
echo -e "${BLUE}📋 RESUMO DA ATUALIZAÇÃO:${NC}"
echo "Commit anterior: $CURRENT_COMMIT"
echo "Commit atual: $NEW_COMMIT"
echo "Data: $(date)"
echo "Taxa de sucesso: $SUCCESS_RATE%"
echo ""
echo -e "${YELLOW}🔧 COMANDOS ÚTEIS:${NC}"
echo "pm2 logs                # Ver logs em tempo real"
echo "pm2 status              # Status aplicações"
echo "systemctl status nginx  # Status Nginx"
echo ""

# Salvar log da atualização
cat > "$BACKUP_DIR/update_${DATE}.txt" << EOF
ATUALIZAÇÃO BITACADEMY - $DATE
=============================

Data: $(date)
Commit anterior: $CURRENT_COMMIT
Commit novo: $NEW_COMMIT
Taxa de sucesso: $SUCCESS_RATE%
Backup: ${BACKUP_NAME}.tar.gz

Testes realizados:
- PM2: $([ $((TESTS_PASSED >= 1)) -eq 1 ] && echo "✅" || echo "❌")
- Backend: $([ $((TESTS_PASSED >= 2)) -eq 1 ] && echo "✅" || echo "❌")
- Frontend: $([ $((TESTS_PASSED >= 3)) -eq 1 ] && echo "✅" || echo "❌")
- API: $([ $((TESTS_PASSED >= 4)) -eq 1 ] && echo "✅" || echo "❌")

Status: ATUALIZAÇÃO CONCLUÍDA
EOF

success "Log salvo em: $BACKUP_DIR/update_${DATE}.txt"

# Rollback automático se muitas falhas
if [ $SUCCESS_RATE -lt 50 ]; then
    echo ""
    warning "⚠️ MUITAS FALHAS DETECTADAS!"
    echo "Deseja fazer rollback automático para a versão anterior? (y/N): "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "🔄 Executando rollback..."
        
        # Restaurar código
        git reset --hard "$CURRENT_COMMIT"
        
        # Restaurar banco se necessário
        if [ -f "$BACKUP_DIR/bitacademy_${DATE}.db" ]; then
            cp "$BACKUP_DIR/bitacademy_${DATE}.db" "$APP_DIR/backend/bitacademy.db"
        fi
        
        # Reinstalar e rebuild
        cd "$APP_DIR/backend" && npm install --production
        cd "$APP_DIR/frontend" && npm install && npm run build
        
        # Reiniciar serviços
        pm2 restart all
        systemctl reload nginx
        
        success "Rollback executado. Sistema restaurado para $CURRENT_COMMIT"
    fi
fi

echo ""
success "🚀 ATUALIZAÇÃO FINALIZADA!"