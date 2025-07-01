#!/bin/bash

echo "🔄 ATUALIZAÇÃO FORÇADA - BITACADEMY CALCULATOR"
echo "============================================="

PROJECT_DIR="/var/www/bitacademy-calculator"
BACKUP_DIR="/tmp/bitacademy-backup-$(date +%Y%m%d_%H%M%S)"

echo ""
echo "⚠️  Esta atualização vai:"
echo "   1. Fazer backup do banco de dados atual"
echo "   2. Parar todos os serviços"
echo "   3. Baixar versão mais recente do GitHub"
echo "   4. Reconfigurar tudo do zero"
echo "   5. Restaurar banco de dados"
echo ""

read -p "Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 1
fi

echo ""
echo "📦 1. Fazendo backup do banco de dados..."

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Backup do banco se existir
if [ -f "$PROJECT_DIR/backend/bitacademy.db" ]; then
    cp "$PROJECT_DIR/backend/bitacademy.db" "$BACKUP_DIR/bitacademy.db.backup"
    echo "   ✅ Backup salvo em: $BACKUP_DIR/bitacademy.db.backup"
else
    echo "   ⚠️  Nenhum banco encontrado para backup"
fi

echo ""
echo "🛑 2. Parando serviços..."

# Parar PM2
pm2 stop all 2>/dev/null || echo "   PM2 não estava rodando"
pm2 delete all 2>/dev/null || echo "   Nenhum processo PM2 para deletar"

# Parar nginx temporariamente
systemctl stop nginx

echo ""
echo "🧹 3. Removendo instalação anterior..."

# Remover diretório completo
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "$PROJECT_DIR"
    echo "   ✅ Diretório anterior removido"
fi

echo ""
echo "📥 4. Clonando versão mais recente do GitHub..."

# Criar diretório e clonar
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone com cache bypass
git clone --depth 1 https://github.com/canalmercadocripto/bitacademy-risk-calculator.git .

# Verificar se clone foi bem-sucedido
if [ ! -f "backend/server.js" ]; then
    echo "❌ Erro ao clonar repositório!"
    exit 1
fi

echo "   ✅ Versão mais recente clonada"

# Mostrar último commit
echo "   📋 Último commit:"
git log --oneline -1

echo ""
echo "📦 5. Instalando dependências..."

# Backend
echo "   Instalando dependências do backend..."
cd backend
npm install --production --no-audit --progress=false
cd ..

# Frontend
echo "   Instalando dependências do frontend..."
cd frontend
npm install --no-audit --progress=false

echo "   Fazendo build do frontend..."
npm run build
cd ..

echo "   ✅ Dependências instaladas e build concluído"

echo ""
echo "⚙️  6. Configurando ambiente..."

# Criar .env para produção
cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=BitAcademy2025!SecureCalculatorJWT!$(openssl rand -hex 16)
CORS_ORIGIN=https://calculadora.bitacademy.vip,http://calculadora.bitacademy.vip
DOMAIN=calculadora.bitacademy.vip
EOF

echo "   ✅ Arquivo .env criado"

echo ""
echo "🗄️  7. Configurando banco de dados..."

cd backend

# Script de criação de tabelas
cat > create-tables.js << 'EOFJS'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bitacademy.db');
const db = new sqlite3.Database(dbPath);

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela users
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
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela users:', err);
        } else {
          console.log('✅ Tabela users criada');
        }
      });

      // Tabela trade_history
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
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela trade_history:', err);
        } else {
          console.log('✅ Tabela trade_history criada');
        }
      });

      // Tabela user_activities
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
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela user_activities:', err);
          reject(err);
        } else {
          console.log('✅ Tabela user_activities criada');
          db.close();
          resolve();
        }
      });
    });
  });
}

createTables()
  .then(() => {
    console.log('🎉 Banco de dados configurado com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao configurar banco:', err);
    process.exit(1);
  });
EOFJS

# Executar criação das tabelas
node create-tables.js

# Restaurar backup se existir
if [ -f "$BACKUP_DIR/bitacademy.db.backup" ]; then
    echo "   🔄 Restaurando dados do backup..."
    
    # Criar script para migrar dados
    cat > migrate-data.js << 'EOFJS'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const oldDbPath = process.argv[2];
const newDbPath = path.join(__dirname, 'bitacademy.db');

const oldDb = new sqlite3.Database(oldDbPath);
const newDb = new sqlite3.Database(newDbPath);

async function migrateData() {
  try {
    // Migrar users
    const users = await new Promise((resolve, reject) => {
      oldDb.all('SELECT * FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      await new Promise((resolve, reject) => {
        newDb.run(`
          INSERT OR REPLACE INTO users 
          (id, email, password_hash, name, last_name, phone, country_code, role, is_active, last_login, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [user.id, user.email, user.password_hash, user.name, user.last_name, user.phone, user.country_code, user.role, user.is_active, user.last_login, user.created_at, user.updated_at], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`✅ Migrados ${users.length} usuários`);

    // Migrar trade_history se existir
    try {
      const trades = await new Promise((resolve, reject) => {
        oldDb.all('SELECT * FROM trade_history', [], (err, rows) => {
          if (err) {
            if (err.message.includes('no such table')) {
              resolve([]);
            } else {
              reject(err);
            }
          } else {
            resolve(rows);
          }
        });
      });

      for (const trade of trades) {
        await new Promise((resolve, reject) => {
          newDb.run(`
            INSERT OR REPLACE INTO trade_history 
            (id, user_id, session_id, exchange, symbol, direction, entry_price, stop_loss, target_price, account_size, risk_percent, position_size, risk_amount, reward_amount, risk_reward_ratio, current_price, calculation_data, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [trade.id, trade.user_id, trade.session_id, trade.exchange, trade.symbol, trade.direction, trade.entry_price, trade.stop_loss, trade.target_price, trade.account_size, trade.risk_percent, trade.position_size, trade.risk_amount, trade.reward_amount, trade.risk_reward_ratio, trade.current_price, trade.calculation_data, trade.ip_address, trade.user_agent, trade.created_at], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      console.log(`✅ Migrados ${trades.length} trades`);
    } catch (e) {
      console.log('⚠️  Nenhum trade para migrar');
    }

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    oldDb.close();
    newDb.close();
  }
}

migrateData();
EOFJS

    node migrate-data.js "$BACKUP_DIR/bitacademy.db.backup"
else
    echo "   📝 Criando usuário admin..."
    node ../create-admin.js
fi

# Limpar arquivos temporários
rm -f create-tables.js migrate-data.js

echo ""
echo "🌐 8. Configurando Nginx..."

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
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Ativar configuração
ln -sf /etc/nginx/sites-available/bitacademy-calculator /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

echo ""
echo "🚀 9. Iniciando serviços..."

# PM2 config
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

# Iniciar serviços
pm2 start ecosystem.config.js
pm2 save

# Iniciar nginx
systemctl start nginx

echo ""
echo "🔒 10. Configurando SSL..."

# Tentar SSL (pode falhar se DNS não estiver propagado)
certbot --nginx -d calculadora.bitacademy.vip --non-interactive --agree-tos -m admin@bitacademy.vip || echo "⚠️  SSL será configurado quando DNS estiver propagado"

echo ""
echo "🧪 11. Testes finais..."

sleep 5

# Testes
echo "   Backend Health:"
curl -s http://localhost:3001/health | head -1

echo "   Frontend (local):"
curl -s http://calculadora.bitacademy.vip | grep -o "<title>.*</title>" | head -1

echo "   API via Nginx:"
curl -s http://calculadora.bitacademy.vip/api/health | head -1

echo ""
echo "🎉 ATUALIZAÇÃO CONCLUÍDA!"
echo "========================"
echo ""
echo "🌐 Acesse: http://calculadora.bitacademy.vip"
echo "🔑 Login: admin@seudominio.com"
echo "🔐 Senha: Admin123456!"
echo ""
echo "📋 Status dos serviços:"
pm2 status
echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
echo ""
echo "🔍 Para debug:"
echo "   pm2 logs bitacademy-calculator"
echo "   tail -f /var/log/nginx/bitacademy-calculator.error.log"