#!/bin/bash

echo "🔧 CORRIGINDO ERRO DBCONFIG"
echo "=========================="

cd /var/www/bitacademy-calculator/backend

echo ""
echo "1. 🔍 Verificando arquivo User.js problemático..."

echo "   Primeiras 10 linhas do User.js:"
head -10 src/models/User.js

echo ""
echo "2. 🛠️ Reescrevendo User.js completamente..."

# Reescrever User.js do zero com imports corretos
cat > src/models/User.js << 'EOF'
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

echo "   ✅ User.js reescrito"

echo ""
echo "3. 🛠️ Verificando AuthController.js..."

# Verificar e corrigir AuthController
head -5 src/controllers/AuthController.js

echo ""
echo "   Corrigindo AuthController.js..."

# Reescrever o início do AuthController para garantir import correto
sed -i '1,3c\
const jwt = require("jsonwebtoken");\
const User = require("../models/User");' src/controllers/AuthController.js

echo "   ✅ AuthController.js corrigido"

echo ""
echo "4. 🛠️ Verificando outros arquivos..."

# Corrigir TradeController
if [ -f "src/controllers/TradeController.js" ]; then
    echo "   Corrigindo TradeController.js..."
    sed -i '1c\
const TradeHistory = require("../models/TradeHistory");' src/controllers/TradeController.js
    echo "   ✅ TradeController.js corrigido"
fi

# Corrigir AdminController
if [ -f "src/controllers/AdminController.js" ]; then
    echo "   Corrigindo AdminController.js..."
    sed -i '1,5c\
const User = require("../models/User");\
const TradeHistory = require("../models/TradeHistory");' src/controllers/AdminController.js
    echo "   ✅ AdminController.js corrigido"
fi

echo ""
echo "5. 🔄 Testando sintaxe dos arquivos..."

echo "   Testando User.js:"
node -c src/models/User.js && echo "   ✅ User.js sintaxe OK" || echo "   ❌ User.js com erro"

echo "   Testando AuthController.js:"
node -c src/controllers/AuthController.js && echo "   ✅ AuthController.js sintaxe OK" || echo "   ❌ AuthController.js com erro"

echo ""
echo "6. 🔄 Reiniciando aplicação..."

# Parar PM2
pm2 stop bitacademy-calculator

# Aguardar
sleep 3

# Iniciar novamente
pm2 start bitacademy-calculator

# Aguardar inicialização
sleep 8

echo ""
echo "7. 🧪 Testando aplicação..."

echo "   Status do PM2:"
pm2 status

echo ""
echo "   Health Check:"
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q "OK"; then
    echo "   ✅ Backend funcionando!"
    
    echo ""
    echo "   API via Nginx:"
    API=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
    echo "   Response: $API"
    
    if echo "$API" | grep -q "OK"; then
        echo "   ✅ API funcionando!"
        
        echo ""
        echo "🎉 ERRO DBCONFIG CORRIGIDO!"
        echo "=========================="
        echo ""
        echo "🌐 Acesse: http://calculadora.bitacademy.vip"
        echo "🔑 Login: admin@seudominio.com"
        echo "🔐 Senha: Admin123456!"
        
    else
        echo "   ⚠️ API ainda com problemas"
    fi
else
    echo "   ❌ Backend ainda com problemas"
    echo ""
    echo "   Últimos logs de erro:"
    pm2 logs bitacademy-calculator --lines 5 --err
fi

echo ""
echo "🔍 Para verificar se não há mais erros:"
echo "   pm2 logs bitacademy-calculator --lines 20"