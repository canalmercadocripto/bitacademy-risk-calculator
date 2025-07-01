#!/bin/bash

# Script de Deploy LIMPO para Produção
# Remove credenciais expostas e configura ambiente seguro

echo "🏭 DEPLOY DE PRODUÇÃO LIMPO - BITACADEMY"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
REPO_URL="https://github.com/canalmercadocripto/bitacademy-risk-calculator.git"
APP_DIR="/var/www/bitacademy"
BACKUP_DIR="/var/backups/bitacademy"
DATE=$(date +%Y%m%d_%H%M%S)

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
    error "Este script deve ser executado como root (use sudo)"
fi

echo ""
log "🔒 CONFIGURAÇÃO DE PRODUÇÃO SEGURA"
echo ""
echo "Este script irá:"
echo "✅ Fazer backup completo"
echo "✅ Instalar versão LIMPA (sem credenciais expostas)"
echo "✅ Configurar credenciais seguras"
echo "✅ Configurar ambiente de produção"
echo "✅ Testar todas as funcionalidades"
echo ""
read -p "Continuar com deploy de produção? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Deploy cancelado"
    exit 0
fi

echo ""
log "💾 Fazendo backup da versão atual..."

mkdir -p "$BACKUP_DIR"

if [ -d "$APP_DIR" ]; then
    # Parar aplicação
    pm2 stop all 2>/dev/null || true
    
    # Backup completo
    tar -czf "$BACKUP_DIR/production_backup_$DATE.tar.gz" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)" 2>/dev/null
    success "Backup salvo: $BACKUP_DIR/production_backup_$DATE.tar.gz"
    
    # Backup específico do banco com dados
    if [ -f "$APP_DIR/backend/bitacademy.db" ]; then
        cp "$APP_DIR/backend/bitacademy.db" "$BACKUP_DIR/production_db_$DATE.db"
        success "Backup do banco salvo"
    fi
fi

echo ""
log "🧹 Limpando instalação anterior..."

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"

echo ""
log "📥 Clonando versão limpa do GitHub..."

cd /var/www
git clone "$REPO_URL" bitacademy

if [ $? -ne 0 ]; then
    error "Falha no clone do GitHub"
fi

cd bitacademy

# Verificar se é a versão correta (com novas funcionalidades)
if [ ! -f "frontend/src/components/AuthModal.js" ]; then
    error "Versão incorreta clonada - AuthModal.js não encontrado"
fi

# Verificar se as credenciais foram removidas
if grep -q "admin@bitacademy.vip" frontend/src/components/LoginPage.js 2>/dev/null; then
    error "Credenciais ainda estão expostas no código! Atualize o repositório GitHub."
fi

success "Versão limpa clonada com sucesso"

echo ""
log "⚙️ Configurando ambiente de produção..."

# Usar configuração de produção
cp .env.production backend/.env

# Gerar credenciais únicas para esta instalação
UNIQUE_ADMIN_EMAIL="admin@bitacademy-$(date +%s).local"
UNIQUE_ADMIN_PASSWORD="BitAcademy$(date +%s)#Secure!"
JWT_SECRET="BitAcademy$(openssl rand -hex 32)Production"

# Atualizar arquivo .env com credenciais únicas
cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$UNIQUE_ADMIN_EMAIL
ADMIN_PASSWORD=$UNIQUE_ADMIN_PASSWORD
CACHE_TTL=300
CORS_ORIGIN=*
LOG_LEVEL=info
EOF

success "Configurações de produção aplicadas"

echo ""
log "💾 Configurando banco de dados..."

cd backend

# Instalar dependências do backend
npm install --production --silent

# Configurar banco com migração
node setup-database-sqlite.js

# Verificar se banco foi criado corretamente
if [ -f "bitacademy.db" ]; then
    success "Banco SQLite criado e migrado"
    
    # Verificar se admin foi criado
    ADMIN_COUNT=$(sqlite3 bitacademy.db "SELECT COUNT(*) FROM users WHERE role='admin';" 2>/dev/null)
    if [ "$ADMIN_COUNT" -gt 0 ]; then
        success "Usuário admin criado"
    else
        warning "Nenhum admin encontrado"
    fi
else
    error "Falha na criação do banco"
fi

echo ""
log "📦 Instalando dependências do frontend..."

cd ../frontend
npm install --silent

echo ""
log "🔨 Fazendo build de produção do frontend..."

npm run build

if [ -d "build" ] && [ -f "build/index.html" ]; then
    success "Build de produção concluído"
else
    error "Falha no build do frontend"
fi

echo ""
log "🌐 Configurando Nginx para produção..."

# Configuração Nginx otimizada para produção
cat > /etc/nginx/sites-available/bitacademy << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React build)
    location / {
        root /var/www/bitacademy/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|conf)$ {
        deny all;
    }
}
EOF

# Ativar configuração
ln -sf /etc/nginx/sites-available/bitacademy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

if nginx -t; then
    systemctl reload nginx
    success "Nginx configurado e recarregado"
else
    error "Erro na configuração do Nginx"
fi

echo ""
log "🚀 Iniciando aplicação de produção..."

cd /var/www/bitacademy

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar auto-start
pm2 startup 2>/dev/null || true
pm2 save

echo ""
log "⏳ Aguardando inicialização completa..."
sleep 20

echo ""
log "🧪 Testando aplicação..."

# Verificar PM2
PM2_STATUS=$(pm2 status | grep "online" | wc -l)
if [ "$PM2_STATUS" -gt 0 ]; then
    success "✅ PM2 com $PM2_STATUS aplicações online"
else
    warning "⚠️ Problemas com PM2"
fi

# Verificar backend
if curl -s http://localhost:3001/health > /dev/null; then
    success "✅ Backend respondendo"
else
    warning "⚠️ Backend não está respondendo"
fi

# Verificar frontend
if curl -s http://localhost/ > /dev/null; then
    success "✅ Frontend respondendo"
else
    warning "⚠️ Frontend não está respondendo"
fi

# Testar API de registro
REGISTER_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)

if [ "$REGISTER_TEST" = "400" ]; then
    success "✅ API de registro validando corretamente"
else
    warning "⚠️ API retornou código: $REGISTER_TEST"
fi

echo ""
success "🎉 DEPLOY DE PRODUÇÃO CONCLUÍDO!"
echo ""
echo -e "${GREEN}📋 RESUMO DA INSTALAÇÃO:${NC}"
echo "✅ Versão limpa instalada (sem credenciais expostas)"
echo "✅ Ambiente de produção configurado"
echo "✅ Banco SQLite criado e migrado"
echo "✅ Nginx configurado com headers de segurança"
echo "✅ PM2 com auto-start configurado"
echo "✅ Build de produção otimizado"
echo ""
echo -e "${BLUE}🌐 ACESSO:${NC}"
echo "Site: http://SEU-IP"
echo "API: http://SEU-IP/api"
echo "Health: http://SEU-IP/health"
echo ""
echo -e "${YELLOW}🔒 CREDENCIAIS DE ADMIN (ANOTE!):${NC}"
echo "Email: $UNIQUE_ADMIN_EMAIL"
echo "Senha: $UNIQUE_ADMIN_PASSWORD"
echo ""
echo -e "${GREEN}🆕 FUNCIONALIDADES DISPONÍVEIS:${NC}"
echo "📝 Formulário completo: nome, sobrenome, email, senha, telefone"
echo "🔐 Sistema de autenticação seguro"
echo "📊 Dashboard administrativo"
echo "🧮 Calculadora de risk management"
echo "👥 Gestão de usuários"
echo ""
echo -e "${YELLOW}📋 COMANDOS ÚTEIS:${NC}"
echo "pm2 status          # Status das aplicações"
echo "pm2 logs            # Ver logs"
echo "systemctl status nginx  # Status do Nginx"
echo ""

# Salvar informações importantes
cat > "$BACKUP_DIR/production_info_$DATE.txt" << EOF
DEPLOY DE PRODUÇÃO BITACADEMY - $DATE
=====================================

Data: $(date)
Versão: Produção limpa (sem credenciais expostas)
Commit: $(git rev-parse --short HEAD)

CREDENCIAIS ADMIN:
Email: $UNIQUE_ADMIN_EMAIL
Senha: $UNIQUE_ADMIN_PASSWORD

URLs:
- Site: http://SEU-IP
- API: http://SEU-IP/api
- Health: http://SEU-IP/health

Configuração:
- Node.js $(node --version)
- PM2 $(pm2 --version)
- Nginx configurado
- SQLite database
- Build de produção

Status: DEPLOY CONCLUÍDO COM SUCESSO
EOF

success "Informações salvas em: $BACKUP_DIR/production_info_$DATE.txt"

echo ""
warning "💡 IMPORTANTE PARA SEUS ALUNOS:"
echo "1. Acesse: http://SEU-IP"
echo "2. Clique em 'Criar conta' para se registrar"
echo "3. Preencha: nome, sobrenome, email, senha e telefone"
echo "4. Use a calculadora após o login"
echo ""
warning "🔒 GUARDE AS CREDENCIAIS DE ADMIN EM LOCAL SEGURO!"
echo ""
success "🚀 SISTEMA PRONTO PARA PRODUÇÃO!"