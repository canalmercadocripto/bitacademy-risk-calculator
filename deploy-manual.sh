#!/bin/bash

# Deploy manual sem Docker para desenvolvimento/teste
# Calculadora de Risk Management - BitAcademy

set -e

echo "🚀 Iniciando deploy manual da Calculadora de Risk Management..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "📦 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Criar arquivo .env se não existir
if [ ! -f "./backend/.env" ]; then
    echo "📝 Criando arquivo .env..."
    cp ./backend/.env.example ./backend/.env
    echo "⚠️  Configure as variáveis de ambiente em ./backend/.env"
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# Iniciar backend em background
echo "🔧 Iniciando backend..."
cd backend
nohup npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 10

# Verificar se backend está rodando
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend funcionando na porta 3001"
else
    echo "❌ Erro ao iniciar backend"
    cat backend.log
    exit 1
fi

# Build do frontend
echo "🔨 Fazendo build do frontend..."
cd frontend
npm run build
cd ..

# Instalar e configurar nginx se necessário
if ! command -v nginx &> /dev/null; then
    echo "🌐 Instalando nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Configurar nginx para servir o frontend
echo "🌐 Configurando nginx..."
sudo tee /etc/nginx/sites-available/risk-calculator > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    root /home/admplay/calculator_bitacademy/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/risk-calculator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração nginx
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "🎉 Deploy manual concluído!"
echo ""
echo "📱 Aplicação disponível em:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "📊 Para monitorar os logs:"
echo "   Backend: tail -f backend.log"
echo "   Nginx: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🛑 Para parar a aplicação:"
echo "   kill \$(cat backend.pid)"
echo "   sudo systemctl stop nginx"
echo ""

# Verificar se tudo está funcionando
sleep 5

if curl -f http://localhost/api/exchanges > /dev/null 2>&1; then
    echo "✅ Frontend + Backend funcionando perfeitamente!"
else
    echo "⚠️  Possível problema na comunicação Frontend -> Backend"
    echo "Verifique os logs em backend.log"
fi

echo ""
echo "📋 Processos rodando:"
echo "Backend PID: $(cat backend.pid)"
ps aux | grep node | grep -v grep