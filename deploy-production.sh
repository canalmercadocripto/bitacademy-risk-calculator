#!/bin/bash

echo "🚀 DEPLOY BITACADEMY CALCULADORA - PRODUÇÃO"
echo "==========================================="

# Configurações
DOMAIN="calculadora.bitacademy.vip"
VPS_IP="185.225.232.65"
PROJECT_DIR="/var/www/bitacademy-calculator"
NGINX_CONFIG="/etc/nginx/sites-available/bitacademy-calculator"

echo ""
echo "📋 Configurações:"
echo "   Domínio: $DOMAIN"
echo "   IP: $VPS_IP"
echo "   Diretório: $PROJECT_DIR"
echo ""

# Verificar se estamos na VPS
if [ "$HOSTNAME" != "vps-4b3c9bcf" ] && [ "$(whoami)" != "root" ]; then
    echo "⚠️  Execute este script na VPS como root ou com sudo"
    echo "   ssh root@$VPS_IP"
    echo "   cd /tmp && wget https://raw.githubusercontent.com/canalmercadocripto/bitacademy-risk-calculator/main/deploy-production.sh"
    echo "   chmod +x deploy-production.sh && ./deploy-production.sh"
    exit 1
fi

echo "🔍 1. Verificando dependências..."

# Instalar dependências básicas
apt update -y
apt install -y curl git nginx nodejs npm certbot python3-certbot-nginx

# Verificar Node.js versão
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt "18" ]; then
    echo "📦 Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

echo "✅ Node.js $(node --version) instalado"
echo "✅ NPM $(npm --version) instalado"

echo ""
echo "🛑 2. Parando serviços antigos..."

# Parar PM2 se estiver rodando
pm2 stop all 2>/dev/null || echo "   PM2 não estava rodando"
pm2 delete all 2>/dev/null || echo "   Nenhum processo PM2 para deletar"

# Parar nginx temporariamente
systemctl stop nginx

echo ""
echo "🧹 3. Limpando instalação anterior..."

# Remover diretório antigo se existir
if [ -d "$PROJECT_DIR" ]; then
    echo "   Removendo $PROJECT_DIR..."
    rm -rf "$PROJECT_DIR"
fi

# Remover configuração nginx antiga
if [ -f "$NGINX_CONFIG" ]; then
    echo "   Removendo configuração nginx antiga..."
    rm -f "$NGINX_CONFIG"
    rm -f "/etc/nginx/sites-enabled/bitacademy-calculator"
fi

echo ""
echo "📥 4. Clonando projeto do GitHub..."

# Criar diretório e clonar
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

git clone https://github.com/canalmercadocripto/bitacademy-risk-calculator.git .

echo "✅ Projeto clonado"

echo ""
echo "📦 5. Instalando dependências..."

# Backend
cd backend
npm install --production
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..

echo "✅ Dependências instaladas e frontend buildado"

echo ""
echo "⚙️  6. Configurando ambiente de produção..."

# Criar arquivo .env para produção
cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=BitAcademy2025!SecureCalculatorJWT!$(openssl rand -hex 16)
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,http://$DOMAIN
DOMAIN=$DOMAIN
EOF

echo "✅ Arquivo .env criado"

echo ""
echo "🗄️  7. Configurando banco de dados..."

cd backend

# Executar migrações se necessário
node -e "
const { query } = require('./src/config/database-sqlite');
console.log('✅ Banco SQLite configurado');
" 2>/dev/null || echo "⚠️  Verificar configuração do banco"

echo ""
echo "👑 8. Criando usuário administrador..."

# Criar usuário admin
node ../create-admin.js

echo ""
echo "🌐 9. Configurando Nginx..."

# Configuração Nginx para coexistir com n8n
cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name calculadora.bitacademy.vip www.calculadora.bitacademy.vip;

    # Logs específicos para a calculadora
    access_log /var/log/nginx/bitacademy-calculator.access.log;
    error_log /var/log/nginx/bitacademy-calculator.error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend - servir arquivos estáticos
    location / {
        root /var/www/bitacademy-calculator/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
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
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Ativar configuração
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

# Testar configuração nginx
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração Nginx válida"
else
    echo "❌ Erro na configuração Nginx"
    exit 1
fi

echo ""
echo "🚀 10. Iniciando serviços..."

# Instalar PM2 globalmente
npm install -g pm2

# Configurar PM2 para o backend
cd "$PROJECT_DIR/backend"

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bitacademy-calculator',
    script: 'server.js',
    cwd: '/var/www/bitacademy-calculator/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/bitacademy-calculator.error.log',
    out_file: '/var/log/bitacademy-calculator.out.log',
    log_file: '/var/log/bitacademy-calculator.combined.log'
  }]
};
EOF

# Iniciar backend com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Backend iniciado com PM2"

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

echo "✅ Nginx iniciado"

echo ""
echo "🔒 11. Configurando SSL..."

# Configurar SSL com Let's Encrypt
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m admin@bitacademy.vip

echo ""
echo "🧪 12. Testando instalação..."

sleep 5

# Testar backend
echo "   Testando backend..."
BACKEND_TEST=$(curl -s http://localhost:3001/api/auth/me 2>/dev/null || echo "backend não respondeu")
if echo "$BACKEND_TEST" | grep -q "success\|error\|Token"; then
    echo "   ✅ Backend respondendo"
else
    echo "   ⚠️  Backend pode ter problemas"
fi

# Testar frontend
echo "   Testando frontend..."
if curl -s "http://$DOMAIN" | grep -q "<!DOCTYPE html>"; then
    echo "   ✅ Frontend servindo"
else
    echo "   ⚠️  Frontend pode ter problemas"
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "==================="
echo ""
echo "🌐 Acesse: https://$DOMAIN"
echo "🔑 Login: admin@seudominio.com"
echo "🔐 Senha: Admin123456!"
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 status                    # Status dos processos"
echo "   pm2 logs bitacademy-calculator # Ver logs"
echo "   pm2 restart bitacademy-calculator # Reiniciar"
echo "   nginx -t                      # Testar configuração nginx"
echo "   systemctl status nginx        # Status do nginx"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Altere a senha do admin após primeiro login"
echo "   2. Configure backups do banco de dados"
echo "   3. Configure monitoramento de logs"
echo ""
echo "🔍 Logs importantes:"
echo "   Backend: pm2 logs bitacademy-calculator"
echo "   Nginx: tail -f /var/log/nginx/bitacademy-calculator.error.log"
echo "   Sistema: journalctl -u nginx"