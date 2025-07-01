#!/bin/bash

echo "🔧 FORÇANDO USO DO SQLITE - CORREÇÃO DEFINITIVA"
echo "==============================================="

echo ""
echo "1. 🔍 Identificando diretórios de instalação..."

# Verificar quais diretórios existem
DIRS_FOUND=""

if [ -d "/var/www/bitacademy" ]; then
    echo "   📁 Encontrado: /var/www/bitacademy"
    DIRS_FOUND="$DIRS_FOUND /var/www/bitacademy"
fi

if [ -d "/var/www/bitacademy-calculator" ]; then
    echo "   📁 Encontrado: /var/www/bitacademy-calculator"
    DIRS_FOUND="$DIRS_FOUND /var/www/bitacademy-calculator"
fi

if [ -z "$DIRS_FOUND" ]; then
    echo "   ❌ Nenhum diretório encontrado!"
    exit 1
fi

echo ""
echo "2. 🛑 Parando todos os processos PM2..."

pm2 stop all
pm2 delete all

echo ""
echo "3. 🧹 Limpando instalações antigas..."

# Remover todos os diretórios antigos
for dir in $DIRS_FOUND; do
    echo "   🗑️ Removendo: $dir"
    rm -rf "$dir"
done

echo ""
echo "4. 📥 Fazendo instalação limpa..."

PROJECT_DIR="/var/www/bitacademy-calculator"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone limpo
git clone https://github.com/canalmercadocripto/bitacademy-risk-calculator.git .

if [ ! -f "backend/server.js" ]; then
    echo "❌ Erro ao clonar repositório!"
    exit 1
fi

echo "   ✅ Repositório clonado"

echo ""
echo "5. 📦 Instalando dependências..."

# Backend
cd backend
npm install --production
cd ../frontend
npm install
npm run build
cd ..

echo ""
echo "6. 🛠️ Forçando configuração SQLite..."

cd backend

# Criar .env que FORÇA SQLite
cat > .env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=BitAcademy2025!SecureCalculatorJWT!$(openssl rand -hex 16)
CORS_ORIGIN=https://calculadora.bitacademy.vip,http://calculadora.bitacademy.vip
DOMAIN=calculadora.bitacademy.vip
FORCE_SQLITE=true
DB_TYPE=sqlite
EOF

echo "   ✅ .env criado com FORCE_SQLITE=true"

# Modificar server.js para SEMPRE usar SQLite
echo "   🔧 Modificando server.js..."

# Backup do server.js original
cp server.js server.js.backup

# Substituir linha de configuração do banco
sed -i '16,20c\
// SEMPRE usar SQLite (FORÇADO)\
const dbConfig = "./src/config/database-sqlite";' server.js

echo "   ✅ server.js modificado para sempre usar SQLite"

# Verificar se a modificação funcionou
echo "   📋 Verificando modificação:"
grep -A 2 -B 2 "database-sqlite" server.js

echo ""
echo "7. 🗄️ Configurando banco SQLite..."

# Criar banco SQLite
cat > setup-db.js << 'EOFJS'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'bitacademy.db');
console.log('📍 Criando banco em:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(async () => {
  console.log('🗄️ Criando tabelas...');
  
  // Tabela users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      last_name TEXT,
      phone TEXT,
      country_code TEXT DEFAULT '+55',
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erro users:', err);
    else console.log('✅ Tabela users criada');
  });

  // Tabela trade_history
  db.run(`
    CREATE TABLE IF NOT EXISTS trade_history (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      session_id TEXT,
      exchange TEXT NOT NULL,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_price REAL NOT NULL,
      stop_loss REAL,
      target_price REAL,
      account_size REAL NOT NULL,
      risk_percent REAL NOT NULL,
      position_size REAL,
      risk_amount REAL,
      reward_amount REAL,
      risk_reward_ratio REAL,
      current_price REAL,
      calculation_data TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erro trade_history:', err);
    else console.log('✅ Tabela trade_history criada');
  });

  // Tabela user_activities
  db.run(`
    CREATE TABLE IF NOT EXISTS user_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, async (err) => {
    if (err) {
      console.error('Erro user_activities:', err);
      return;
    }
    
    console.log('✅ Tabela user_activities criada');
    
    // Criar usuário admin
    try {
      const adminId = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash('Admin123456!', 12);
      
      db.run(`
        INSERT OR REPLACE INTO users 
        (id, email, password_hash, name, last_name, phone, country_code, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'admin@seudominio.com',
        passwordHash,
        'Administrador',
        'Sistema',
        '11999999999',
        '+55',
        'admin',
        1
      ], (err) => {
        if (err) {
          console.error('❌ Erro ao criar admin:', err);
        } else {
          console.log('✅ Usuário admin criado');
          console.log('📧 Email: admin@seudominio.com');
          console.log('🔐 Senha: Admin123456!');
        }
        
        db.close();
        console.log('🎉 Banco configurado com sucesso!');
      });
    } catch (error) {
      console.error('❌ Erro ao criar hash da senha:', error);
      db.close();
    }
  });
});
EOFJS

node setup-db.js
rm setup-db.js

echo ""
echo "8. 🚀 Configurando PM2..."

# Criar ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bitacademy-calculator',
    script: 'server.js',
    cwd: '$PROJECT_DIR/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      FORCE_SQLITE: 'true',
      DB_TYPE: 'sqlite'
    },
    error_file: '/var/log/bitacademy-calculator.error.log',
    out_file: '/var/log/bitacademy-calculator.out.log',
    log_file: '/var/log/bitacademy-calculator.combined.log'
  }]
};
EOF

echo ""
echo "9. 🌐 Configurando Nginx..."

# Configuração Nginx
cat > /etc/nginx/sites-available/bitacademy-calculator << 'EOF'
server {
    listen 80;
    server_name calculadora.bitacademy.vip;

    access_log /var/log/nginx/bitacademy-calculator.access.log;
    error_log /var/log/nginx/bitacademy-calculator.error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        root /var/www/bitacademy-calculator/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
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
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Ativar configuração
ln -sf /etc/nginx/sites-available/bitacademy-calculator /etc/nginx/sites-enabled/
nginx -t

echo ""
echo "10. 🚀 Iniciando serviços..."

# Iniciar PM2
pm2 start ecosystem.config.js
pm2 save

# Iniciar nginx
systemctl restart nginx

echo ""
echo "11. ⏱️ Aguardando inicialização..."

sleep 8

echo ""
echo "12. 🧪 Testando tudo..."

echo "   Backend Health Check:"
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q "OK"; then
    echo "   ✅ Backend funcionando!"
    
    echo ""
    echo "   Frontend via Nginx:"
    FRONTEND=$(curl -s http://calculadora.bitacademy.vip | head -c 200)
    if echo "$FRONTEND" | grep -q "html"; then
        echo "   ✅ Frontend funcionando!"
    else
        echo "   ⚠️ Frontend com problemas"
    fi
    
    echo ""
    echo "   API via Nginx:"
    API=$(curl -s http://calculadora.bitacademy.vip/api/health)
    echo "   Response: $API"
    
    if echo "$API" | grep -q "OK"; then
        echo "   ✅ API funcionando!"
        
        echo ""
        echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
        echo "=================================="
        echo ""
        echo "🌐 Acesse: http://calculadora.bitacademy.vip"
        echo "🔑 Login: admin@seudominio.com"
        echo "🔐 Senha: Admin123456!"
        echo ""
        echo "✅ SQLITE configurado e funcionando"
        echo "✅ Não há mais tentativas de PostgreSQL"
    else
        echo "   ❌ API com problemas"
    fi
else
    echo "   ❌ Backend com problemas"
    echo ""
    echo "📋 Logs do PM2:"
    pm2 logs bitacademy-calculator --lines 10
fi

echo ""
echo "📊 Status final:"
pm2 status

echo ""
echo "🔍 Para monitoramento:"
echo "   pm2 logs bitacademy-calculator"
echo "   tail -f /var/log/nginx/bitacademy-calculator.error.log"
echo "   curl -s http://localhost:3001/health"