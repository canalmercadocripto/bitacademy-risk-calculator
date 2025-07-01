#!/bin/bash

echo "🔧 CORRIGINDO PROBLEMAS DE PRODUÇÃO"
echo "=================================="

cd /var/www/bitacademy-calculator

echo ""
echo "1. 🗄️ Criando tabelas do banco de dados..."

# Criar script para setup das tabelas
cat > backend/setup-tables.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bitacademy.db');
const db = new sqlite3.Database(dbPath);

async function createTables() {
  console.log('🗄️ Criando estrutura do banco de dados...');
  
  try {
    // Criar tabela users
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
      `, function(err) {
        if (err) {
          console.error('Erro ao criar tabela users:', err);
          reject(err);
        } else {
          console.log('✅ Tabela users criada');
          resolve();
        }
      });
    });

    // Criar tabela trade_history
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS trade_history (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
      `, function(err) {
        if (err) {
          console.error('Erro ao criar tabela trade_history:', err);
          reject(err);
        } else {
          console.log('✅ Tabela trade_history criada');
          resolve();
        }
      });
    });

    // Criar tabela user_activities
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, function(err) {
        if (err) {
          console.error('Erro ao criar tabela user_activities:', err);
          reject(err);
        } else {
          console.log('✅ Tabela user_activities criada');
          resolve();
        }
      });
    });

    console.log('🎉 Todas as tabelas criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    db.close();
  }
}

createTables();
EOF

# Executar criação das tabelas
cd backend
node setup-tables.js

echo ""
echo "2. 👑 Criando usuário administrador..."

# Criar admin agora que as tabelas existem
node ../create-admin.js

echo ""
echo "3. 🌐 Corrigindo configuração Nginx para SSL..."

# Configuração nginx apenas com domínio principal (sem www)
cat > /etc/nginx/sites-available/bitacademy-calculator << 'EOF'
server {
    listen 80;
    server_name calculadora.bitacademy.vip;

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

# Recarregar nginx
nginx -t && systemctl reload nginx

echo ""
echo "4. 🔒 Configurando SSL apenas para domínio principal..."

# SSL apenas para o domínio principal
certbot --nginx -d calculadora.bitacademy.vip --non-interactive --agree-tos -m admin@bitacademy.vip

echo ""
echo "5. 🔄 Reiniciando serviços..."

# Reiniciar PM2
pm2 restart bitacademy-calculator

# Aguardar um pouco
sleep 5

echo ""
echo "6. 🧪 Testando tudo novamente..."

# Testar backend
echo "   Testando backend..."
BACKEND_TEST=$(curl -s http://localhost:3001/health 2>/dev/null)
if echo "$BACKEND_TEST" | grep -q "OK"; then
    echo "   ✅ Backend funcionando"
else
    echo "   ❌ Backend com problemas"
    echo "   Logs do backend:"
    pm2 logs bitacademy-calculator --lines 10
fi

# Testar frontend via nginx
echo "   Testando frontend..."
FRONTEND_TEST=$(curl -s http://calculadora.bitacademy.vip 2>/dev/null)
if echo "$FRONTEND_TEST" | grep -q "<!DOCTYPE html>"; then
    echo "   ✅ Frontend servindo"
else
    echo "   ❌ Frontend com problemas"
    echo "   Logs do nginx:"
    tail -5 /var/log/nginx/bitacademy-calculator.error.log
fi

# Testar API
echo "   Testando API..."
API_TEST=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
if echo "$API_TEST" | grep -q "OK"; then
    echo "   ✅ API funcionando"
else
    echo "   ❌ API com problemas"
fi

# Testar HTTPS se disponível
echo "   Testando HTTPS..."
HTTPS_TEST=$(curl -s https://calculadora.bitacademy.vip 2>/dev/null)
if echo "$HTTPS_TEST" | grep -q "<!DOCTYPE html>"; then
    echo "   ✅ HTTPS funcionando"
else
    echo "   ⚠️  HTTPS pode ter problemas (normal se SSL ainda não configurado)"
fi

echo ""
echo "7. 📊 Status final dos serviços..."

echo "   PM2 Status:"
pm2 status

echo ""
echo "   Nginx Status:"
systemctl status nginx --no-pager -l

echo ""
echo "🎉 CORREÇÕES APLICADAS!"
echo "======================"
echo ""
echo "🌐 URLs de Acesso:"
echo "   HTTP:  http://calculadora.bitacademy.vip"
echo "   HTTPS: https://calculadora.bitacademy.vip (se SSL configurado)"
echo ""
echo "🔑 Login:"
echo "   Email: admin@seudominio.com"
echo "   Senha: Admin123456!"
echo ""
echo "📋 Comandos de monitoramento:"
echo "   pm2 logs bitacademy-calculator"
echo "   tail -f /var/log/nginx/bitacademy-calculator.error.log"
echo "   curl -s http://calculadora.bitacademy.vip/api/health"
echo ""
echo "⚠️  Se ainda houver problemas:"
echo "   1. Verifique se o domínio calculadora.bitacademy.vip aponta para 185.225.232.65"
echo "   2. Execute: pm2 logs bitacademy-calculator"
echo "   3. Execute: nginx -t"