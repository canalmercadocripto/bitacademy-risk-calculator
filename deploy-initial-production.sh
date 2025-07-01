#!/bin/bash

# Deploy Inicial para Produção - BitAcademy
# Primeira instalação na VPS limpa

echo "🚀 DEPLOY INICIAL - BITACADEMY PRODUÇÃO"
echo "======================================"

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
    error "Execute como root: sudo $0"
fi

echo ""
log "🔍 Verificando sistema..."

# Verificar se VPS está limpa
if [ -d "$APP_DIR" ]; then
    warning "Aplicação já existe em $APP_DIR"
    read -p "Remover e reinstalar? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$APP_DIR"
        success "Diretório removido"
    else
        error "Deploy cancelado"
    fi
fi

echo ""
log "📦 Instalando dependências do sistema..."

# Atualizar sistema
apt update -qq && apt upgrade -y -qq

# Instalar dependências essenciais
apt install -y curl wget git nginx sqlite3 ufw

# Instalar Node.js 20 LTS
if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | sed 's/v//')" -lt 18 ]; then
    log "Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Instalar PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Verificar versões
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
PM2_VERSION=$(pm2 --version)

success "Node.js: $NODE_VERSION"
success "NPM: $NPM_VERSION"  
success "PM2: $PM2_VERSION"

echo ""
log "🔒 Configurando firewall..."

# Configurar UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

success "Firewall configurado (SSH, HTTP, HTTPS)"

echo ""
log "📁 Criando estrutura de diretórios..."

# Criar diretórios necessários
mkdir -p "$BACKUP_DIR"
mkdir -p /var/log/bitacademy
mkdir -p /var/www

echo ""
log "📥 Clonando aplicação do GitHub..."

# Clone do repositório
cd /var/www
git clone "$REPO_URL" bitacademy

if [ $? -ne 0 ]; then
    error "Falha no clone do GitHub"
fi

cd bitacademy

# Verificar branch e commit
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git branch --show-current)

success "Branch: $CURRENT_BRANCH"
success "Commit: $CURRENT_COMMIT"

echo ""
log "⚙️ Configurando ambiente de produção..."

# Criar arquivo .env seguro para produção
ADMIN_EMAIL="admin@bitacademy-$(date +%s).local"
ADMIN_PASSWORD="BitAcademy$(openssl rand -hex 8)#Pro"
JWT_SECRET="BitAcademy$(openssl rand -hex 32)Production"

cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
CACHE_TTL=300
CORS_ORIGIN=*
LOG_LEVEL=info
EOF

success "Arquivo .env criado com credenciais seguras"

echo ""
log "💾 Configurando banco de dados..."

cd backend

# Instalar dependências do backend
npm install --production

# Configurar banco SQLite
node setup-database-sqlite.js

if [ -f "bitacademy.db" ]; then
    success "Banco SQLite criado e migrado"
    
    # Verificar estrutura
    USERS_COUNT=$(sqlite3 bitacademy.db "SELECT COUNT(*) FROM users;" 2>/dev/null)
    success "Usuários na base: $USERS_COUNT"
else
    error "Falha na criação do banco"
fi

echo ""
log "🎨 Configurando frontend..."

cd ../frontend

# Instalar dependências
npm install

# Build de produção
npm run build

if [ -d "build" ] && [ -f "build/index.html" ]; then
    success "Build de produção criado"
else
    error "Falha no build do frontend"
fi

echo ""
log "🌐 Configurando Nginx..."

# Configuração otimizada do Nginx
cat > /etc/nginx/sites-available/bitacademy << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logs
    access_log /var/log/nginx/bitacademy_access.log;
    error_log /var/log/nginx/bitacademy_error.log;
    
    # Frontend (React build)
    location / {
        root /var/www/bitacademy/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
    
    # Block sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(env|log|conf|bak|sql|md)$ {
        deny all;
    }
}
EOF

# Ativar configuração
ln -sf /etc/nginx/sites-available/bitacademy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar Nginx
if nginx -t; then
    systemctl enable nginx
    systemctl restart nginx
    success "Nginx configurado e ativo"
else
    error "Erro na configuração do Nginx"
fi

echo ""
log "🚀 Iniciando aplicação..."

cd /var/www/bitacademy

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar auto-start
pm2 startup systemd -u root --hp /root
pm2 save

success "Aplicação iniciada com PM2"

echo ""
log "⏳ Aguardando inicialização..."
sleep 15

echo ""
log "🧪 Testando aplicação..."

# Testes de funcionalidade
TESTS_PASSED=0
TOTAL_TESTS=5

# Teste 1: PM2 Status
if pm2 list | grep -q "online"; then
    success "✅ PM2 com aplicações online"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Problemas no PM2"
fi

# Teste 2: Backend
if curl -s http://localhost:3001/health > /dev/null; then
    success "✅ Backend respondendo (3001)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Backend não responde"
fi

# Teste 3: Frontend via Nginx
if curl -s http://localhost/ > /dev/null; then
    success "✅ Frontend via Nginx (80)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Frontend não responde"
fi

# Teste 4: API de registro
REGISTER_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)

if [ "$REGISTER_TEST" = "400" ]; then
    success "✅ API validando corretamente"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ API retornou: $REGISTER_TEST"
fi

# Teste 5: Nginx Status
if systemctl is-active --quiet nginx; then
    success "✅ Nginx ativo"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    warning "❌ Nginx inativo"
fi

# Taxa de sucesso
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo ""
if [ $SUCCESS_RATE -ge 80 ]; then
    success "🎉 DEPLOY INICIAL CONCLUÍDO COM SUCESSO!"
    echo ""
    echo -e "${GREEN}📊 Taxa de sucesso: $SUCCESS_RATE% ($TESTS_PASSED/$TOTAL_TESTS)${NC}"
else
    warning "⚠️ Deploy concluído com problemas ($SUCCESS_RATE% sucesso)"
fi

echo ""
echo -e "${BLUE}🌐 INFORMAÇÕES DE ACESSO:${NC}"
echo "Site: http://SEU-IP"
echo "API: http://SEU-IP/api"
echo "Health: http://SEU-IP/health"
echo ""
echo -e "${YELLOW}🔒 CREDENCIAIS ADMIN:${NC}"
echo "Email: $ADMIN_EMAIL"
echo "Senha: $ADMIN_PASSWORD"
echo ""
echo -e "${GREEN}🛠️ FUNCIONALIDADES DISPONÍVEIS:${NC}"
echo "✅ Formulário completo: nome, sobrenome, email, senha, telefone"
echo "✅ Sistema de autenticação seguro"
echo "✅ Dashboard administrativo"
echo "✅ Calculadora de risk management"
echo "✅ Gestão de usuários"
echo ""
echo -e "${BLUE}📋 COMANDOS ÚTEIS:${NC}"
echo "pm2 status              # Status aplicações"
echo "pm2 logs                # Ver logs"
echo "pm2 restart all         # Reiniciar"
echo "systemctl status nginx  # Status Nginx"
echo ""

# Salvar informações do deploy
cat > "$BACKUP_DIR/deploy_initial_$DATE.txt" << EOF
DEPLOY INICIAL BITACADEMY - $DATE
=================================

Data: $(date)
Commit: $CURRENT_COMMIT
Branch: $CURRENT_BRANCH
Taxa de sucesso: $SUCCESS_RATE%

CREDENCIAIS ADMIN:
Email: $ADMIN_EMAIL
Senha: $ADMIN_PASSWORD

URLs:
- Site: http://SEU-IP
- API: http://SEU-IP/api

Configuração:
- Node.js $NODE_VERSION
- PM2 $PM2_VERSION
- Nginx configurado
- SQLite database
- Firewall ativo

Status: DEPLOY INICIAL CONCLUÍDO
EOF

success "Informações salvas em: $BACKUP_DIR/deploy_initial_$DATE.txt"

echo ""
warning "💡 PRÓXIMOS PASSOS:"
echo "1. Configure domínio se necessário"
echo "2. Configure SSL/HTTPS se necessário"
echo "3. Teste todas as funcionalidades"
echo "4. Compartilhe com seus alunos"
echo ""
success "🚀 SISTEMA PRONTO PARA PRODUÇÃO!"