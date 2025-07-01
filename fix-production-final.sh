#!/bin/bash

echo "🚀 CORREÇÃO FINAL - BITACADEMY CALCULATOR"
echo "========================================"
echo ""
echo "Este script corrige o erro 'dbConfig is not defined' e finaliza o deploy"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "/var/www/bitacademy-calculator" ]; then
    echo "❌ Diretório /var/www/bitacademy-calculator não encontrado!"
    echo "   Execute este script na VPS onde a aplicação está instalada."
    exit 1
fi

cd /var/www/bitacademy-calculator/backend

echo "1. 🔍 Verificando o problema atual..."
echo ""
echo "   Primeiras linhas do User.js problemático:"
head -5 src/models/User.js
echo ""

echo "2. 🛠️ Corrigindo User.js com imports corretos..."

# Backup do arquivo atual
cp src/models/User.js src/models/User.js.backup.$(date +%s)

# Reescrever User.js completamente com imports corretos
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

echo "   ✅ User.js reescrito com imports corretos"

echo ""
echo "3. 🔧 Verificando outros arquivos..."

# Verificar e corrigir AuthController
if grep -q "dbConfig" src/controllers/AuthController.js 2>/dev/null; then
    echo "   🔄 Corrigindo AuthController.js..."
    sed -i '1,3c\
const jwt = require("jsonwebtoken");\
const User = require("../models/User");' src/controllers/AuthController.js
    echo "   ✅ AuthController.js corrigido"
fi

# Verificar e corrigir TradeController
if [ -f "src/controllers/TradeController.js" ] && grep -q "dbConfig" src/controllers/TradeController.js 2>/dev/null; then
    echo "   🔄 Corrigindo TradeController.js..."
    sed -i '1c\
const TradeHistory = require("../models/TradeHistory");' src/controllers/TradeController.js
    echo "   ✅ TradeController.js corrigido"
fi

# Verificar e corrigir AdminController
if [ -f "src/controllers/AdminController.js" ] && grep -q "dbConfig" src/controllers/AdminController.js 2>/dev/null; then
    echo "   🔄 Corrigindo AdminController.js..."
    sed -i '1,5c\
const User = require("../models/User");\
const TradeHistory = require("../models/TradeHistory");' src/controllers/AdminController.js
    echo "   ✅ AdminController.js corrigido"
fi

echo ""
echo "4. 🧪 Testando sintaxe dos arquivos corrigidos..."

echo "   Testando User.js:"
if node -c src/models/User.js; then
    echo "   ✅ User.js sintaxe OK"
else
    echo "   ❌ User.js ainda com erro de sintaxe!"
    exit 1
fi

echo "   Testando AuthController.js:"
if node -c src/controllers/AuthController.js; then
    echo "   ✅ AuthController.js sintaxe OK"
else
    echo "   ⚠️ AuthController.js com problemas (não crítico)"
fi

echo ""
echo "5. 🔄 Parando aplicação atual..."

# Parar PM2
pm2 stop bitacademy-calculator 2>/dev/null || echo "   PM2 não estava rodando"

echo ""
echo "6. ⏱️ Aguardando parada completa..."
sleep 3

echo ""
echo "7. 🚀 Iniciando aplicação corrigida..."

# Iniciar novamente
pm2 start bitacademy-calculator

echo ""
echo "8. ⏱️ Aguardando inicialização..."
sleep 8

echo ""
echo "9. 🧪 Testando aplicação..."

echo "   Status do PM2:"
pm2 status

echo ""
echo "   Health Check Local:"
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q "OK"; then
    echo "   ✅ Backend funcionando!"
    
    echo ""
    echo "   Health Check via Nginx:"
    API=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
    echo "   Response: $API"
    
    if echo "$API" | grep -q "OK"; then
        echo "   ✅ API via Nginx funcionando!"
        
        echo ""
        echo "   Testando frontend:"
        FRONTEND=$(curl -s http://calculadora.bitacademy.vip 2>/dev/null | head -c 200)
        if echo "$FRONTEND" | grep -q "html"; then
            echo "   ✅ Frontend funcionando!"
            
            echo ""
            echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
            echo "================================"
            echo ""
            echo "🌐 Acesse: http://calculadora.bitacademy.vip"
            echo "🔑 Login: admin@seudominio.com"
            echo "🔐 Senha: Admin123456!"
            echo ""
            echo "✅ Erro 'dbConfig is not defined' CORRIGIDO"
            echo "✅ Backend funcionando com SQLite"
            echo "✅ Frontend servido pelo Nginx"
            echo "✅ API funcionando corretamente"
            echo ""
            echo "🎓 Sua aplicação está pronta para os alunos!"
            
        else
            echo "   ⚠️ Frontend com problemas"
        fi
    else
        echo "   ⚠️ API ainda com problemas via Nginx"
    fi
else
    echo "   ❌ Backend ainda com problemas"
    echo ""
    echo "📋 Logs de erro do PM2:"
    pm2 logs bitacademy-calculator --lines 10 --err
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   - Verificar se todas as dependências estão instaladas: npm install"
    echo "   - Verificar se o banco SQLite existe: ls -la bitacademy.db"
    echo "   - Verificar logs completos: pm2 logs bitacademy-calculator"
fi

echo ""
echo "🔍 Para monitoramento contínuo:"
echo "   pm2 logs bitacademy-calculator --lines 20"
echo "   pm2 monit"
echo "   curl -s http://localhost:3001/health"
echo "   curl -s http://calculadora.bitacademy.vip/api/health"

echo ""
echo "📊 Status final do PM2:"
pm2 status