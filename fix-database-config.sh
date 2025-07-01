#!/bin/bash

echo "🔧 CORRIGINDO CONFIGURAÇÃO DO BANCO DE DADOS"
echo "============================================"

cd /var/www/bitacademy-calculator/backend

echo ""
echo "1. 🔍 Problema identificado:"
echo "   ❌ Backend tentando conectar PostgreSQL (porta 5432)"
echo "   ✅ Deve usar SQLite local"

echo ""
echo "2. 🛠️ Corrigindo configuração do User.js..."

# Forçar uso do SQLite no modelo User
cat > src/models/User.js << 'EOF'
// SEMPRE usar SQLite em produção
const { query } = require('../config/database-sqlite');
const bcrypt = require('bcrypt');

class User {
  
  // Criar novo usuário
  static async create({ email, password, name, lastName, phone, countryCode = '+55', role = 'user' }) {
    try {
      // Validar telefone obrigatório
      if (!phone || phone.trim().length === 0) {
        throw new Error('Telefone é obrigatório');
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Gerar UUID para SQLite
      const crypto = require('crypto');
      const userId = crypto.randomBytes(16).toString('hex');
      
      const result = await query(`
        INSERT INTO users (id, email, password_hash, name, last_name, phone, country_code, role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, passwordHash, name, lastName, phone, countryCode, role]);
      
      // Buscar o usuário recém-criado
      const newUser = await query(`
        SELECT id, email, name, last_name, phone, country_code, role, created_at
        FROM users 
        WHERE id = ?
      `, [userId]);
      
      return newUser.rows[0];
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }
  
  // Buscar usuário por email
  static async findByEmail(email) {
    const result = await query(`
      SELECT id, email, password_hash, name, last_name, phone, country_code, role, is_active, last_login, created_at
      FROM users 
      WHERE email = ? AND is_active = 1
    `, [email]);
    
    return result.rows[0];
  }

  // Buscar usuário por ID
  static async findById(id) {
    const result = await query(`
      SELECT id, email, name, last_name, phone, country_code, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `, [id]);
    
    const user = result.rows[0];
    if (user) {
      // Mapear campos para manter compatibilidade
      user.lastName = user.last_name;
      user.countryCode = user.country_code;
    }
    
    return user;
  }

  // Buscar usuário por ID incluindo senha hash
  static async findByIdWithPassword(id) {
    const result = await query(`
      SELECT id, email, name, last_name, phone, country_code, password_hash, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `, [id]);
    
    const user = result.rows[0];
    if (user) {
      // Mapear campos para manter compatibilidade
      user.lastName = user.last_name;
      user.countryCode = user.country_code;
    }
    
    return user;
  }
  
  // Verificar senha
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Atualizar último login
  static async updateLastLogin(userId) {
    await query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId]);
  }

  // Atualizar perfil do usuário
  static async updateProfile(userId, profileData) {
    try {
      const { name, lastName, email, phone, countryCode } = profileData;
      
      const result = await query(`
        UPDATE users 
        SET name = ?, last_name = ?, email = ?, phone = ?, country_code = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [name, lastName, email, phone, countryCode, userId]);
      
      return result.affectedRows > 0 || result.changes > 0;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  // Atualizar senha do usuário
  static async updatePassword(userId, newPassword) {
    try {
      // Hash da nova senha
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      const result = await query(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [passwordHash, userId]);
      
      return result.affectedRows > 0 || result.changes > 0;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  // Listar usuários (para admin)
  static async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        u.id, u.email, u.name, u.last_name, u.phone, u.country_code, u.role, u.is_active, u.last_login, u.created_at,
        COUNT(th.id) as total_trades
      FROM users u
      LEFT JOIN trade_history th ON u.id = th.user_id
      GROUP BY u.id, u.email, u.name, u.last_name, u.phone, u.country_code, u.role, u.is_active, u.last_login, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Total de usuários
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users
    `);
    
    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    };
  }

  // Estatísticas de usuários
  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as active_week,
        COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as active_month,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as new_week
      FROM users 
      WHERE is_active = 1
    `);
    
    return result.rows[0];
  }
}

module.exports = User;
EOF

echo "   ✅ User.js corrigido para usar SQLite"

echo ""
echo "3. 🛠️ Verificando TradeHistory.js..."

# Verificar se TradeHistory usa SQLite
if grep -q "database'" src/models/TradeHistory.js; then
    echo "   🔄 Corrigindo TradeHistory.js..."
    
    # Corrigir primeira linha do TradeHistory
    sed -i '1,10s/require.*database.*sqlite.*/const { query } = require("..\/config\/database-sqlite");/' src/models/TradeHistory.js
    
    echo "   ✅ TradeHistory.js corrigido"
else
    echo "   ✅ TradeHistory.js já correto"
fi

echo ""
echo "4. 🛠️ Verificando arquivo .env..."

# Verificar e corrigir .env
if [ -f ".env" ]; then
    echo "   📄 Arquivo .env encontrado:"
    cat .env
    
    # Adicionar configuração para forçar SQLite
    echo "" >> .env
    echo "# Forçar uso do SQLite" >> .env
    echo "DB_TYPE=sqlite" >> .env
    echo "FORCE_SQLITE=true" >> .env
    
    echo "   ✅ .env atualizado"
else
    echo "   📄 Criando arquivo .env..."
    cat > .env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=BitAcademy2025!SecureCalculatorJWT!$(openssl rand -hex 16)
CORS_ORIGIN=https://calculadora.bitacademy.vip,http://calculadora.bitacademy.vip
DOMAIN=calculadora.bitacademy.vip
DB_TYPE=sqlite
FORCE_SQLITE=true
EOF
    echo "   ✅ .env criado"
fi

echo ""
echo "5. 🗄️ Verificando banco SQLite..."

if [ ! -f "bitacademy.db" ]; then
    echo "   📄 Criando banco SQLite..."
    
    # Criar script de setup do banco
    cat > setup-sqlite.js << 'EOFJS'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bitacademy.db');
const db = new sqlite3.Database(dbPath);

console.log('🗄️ Criando estrutura do banco SQLite...');

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
    if (err) console.error('Erro users:', err);
    else console.log('✅ Tabela users criada');
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
    if (err) console.error('Erro trade_history:', err);
    else console.log('✅ Tabela trade_history criada');
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
    if (err) console.error('Erro user_activities:', err);
    else {
      console.log('✅ Tabela user_activities criada');
      console.log('🎉 Banco SQLite configurado!');
      db.close();
    }
  });
});
EOFJS

    node setup-sqlite.js
    rm setup-sqlite.js
else
    echo "   ✅ Banco SQLite já existe"
fi

echo ""
echo "6. 👑 Criando usuário admin..."

# Criar admin usando o script correto
cd ..
node create-admin.js
cd backend

echo ""
echo "7. 🔄 Reiniciando aplicação..."

# Reiniciar PM2 com variáveis de ambiente atualizadas
pm2 restart bitacademy-calculator --update-env

echo ""
echo "8. ⏱️ Aguardando inicialização..."

sleep 5

echo ""
echo "9. 🧪 Testando conexão..."

# Testar health check
HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
echo "Health Check Response: $HEALTH_CHECK"

if echo "$HEALTH_CHECK" | grep -q "OK"; then
    echo "✅ Backend funcionando!"
    
    # Testar via nginx
    sleep 2
    NGINX_TEST=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
    echo "Nginx Test Response: $NGINX_TEST"
    
    if echo "$NGINX_TEST" | grep -q "OK"; then
        echo "✅ Nginx funcionando!"
        echo ""
        echo "🎉 PROBLEMA CORRIGIDO!"
        echo "====================="
        echo ""
        echo "🌐 Acesse: http://calculadora.bitacademy.vip"
        echo "🔑 Login: admin@seudominio.com"
        echo "🔐 Senha: Admin123456!"
    else
        echo "⚠️ Nginx ainda com problemas"
    fi
else
    echo "❌ Backend ainda com problemas"
    echo ""
    echo "📋 Logs do PM2:"
    pm2 logs bitacademy-calculator --lines 10
fi

echo ""
echo "🔍 Para monitorar:"
echo "   pm2 logs bitacademy-calculator"
echo "   curl -s http://localhost:3001/health"