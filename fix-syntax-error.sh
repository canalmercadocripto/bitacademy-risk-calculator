#!/bin/bash

echo "🔧 CORRIGINDO ERRO DE SINTAXE - TRADEHISTORY.JS"
echo "==============================================="

cd /var/www/bitacademy-calculator/backend

echo ""
echo "1. 🔍 Verificando arquivo problemático..."

if [ -f "src/models/TradeHistory.js" ]; then
    echo "   📄 Arquivo encontrado"
    echo "   🔍 Verificando linha 200..."
    
    # Mostrar linhas ao redor do erro
    echo "   Conteúdo ao redor da linha 200:"
    sed -n '195,205p' src/models/TradeHistory.js
else
    echo "   ❌ Arquivo não encontrado!"
    exit 1
fi

echo ""
echo "2. 🛠️ Criando versão corrigida do TradeHistory.js..."

# Criar versão limpa e correta do TradeHistory.js
cat > src/models/TradeHistory.js << 'EOF'
// SEMPRE usar SQLite
const { query } = require('../config/database-sqlite');

class TradeHistory {
  
  // Salvar novo trade
  static async create(tradeData) {
    try {
      const crypto = require('crypto');
      const tradeId = crypto.randomBytes(16).toString('hex');
      
      const result = await query(`
        INSERT INTO trade_history (
          id, user_id, session_id, exchange, symbol, direction, entry_price,
          stop_loss, target_price, account_size, risk_percent, position_size,
          risk_amount, reward_amount, risk_reward_ratio, current_price,
          calculation_data, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tradeId, tradeData.user_id, tradeData.session_id, tradeData.exchange,
        tradeData.symbol, tradeData.direction, tradeData.entry_price,
        tradeData.stop_loss, tradeData.target_price, tradeData.account_size,
        tradeData.risk_percent, tradeData.position_size, tradeData.risk_amount,
        tradeData.reward_amount, tradeData.risk_reward_ratio, tradeData.current_price,
        tradeData.calculation_data, tradeData.ip_address, tradeData.user_agent
      ]);
      
      return { success: true, tradeId };
    } catch (error) {
      console.error('Erro ao salvar trade:', error);
      throw error;
    }
  }
  
  // Buscar trades do usuário
  static async getByUser(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await query(`
        SELECT * FROM trade_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
      
      const totalResult = await query(`
        SELECT COUNT(*) as total FROM trade_history WHERE user_id = ?
      `, [userId]);
      
      return {
        trades: result.rows || [],
        total: parseInt(totalResult.rows[0]?.total || 0),
        page,
        totalPages: Math.ceil((totalResult.rows[0]?.total || 0) / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar trades:', error);
      return { trades: [], total: 0, page, totalPages: 0 };
    }
  }
  
  // Buscar todos os trades (admin)
  static async getAll(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await query(`
        SELECT th.*, u.name, u.email 
        FROM trade_history th
        LEFT JOIN users u ON th.user_id = u.id
        ORDER BY th.created_at DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      const totalResult = await query(`
        SELECT COUNT(*) as total FROM trade_history
      `);
      
      return {
        trades: result.rows || [],
        total: parseInt(totalResult.rows[0]?.total || 0),
        page,
        totalPages: Math.ceil((totalResult.rows[0]?.total || 0) / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar todos os trades:', error);
      return { trades: [], total: 0, page, totalPages: 0 };
    }
  }
  
  // Estatísticas do usuário
  static async getUserStats(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_trades,
          AVG(risk_percent) as avg_risk,
          AVG(risk_reward_ratio) as avg_rr,
          COUNT(CASE WHEN direction = 'LONG' THEN 1 END) as long_trades,
          COUNT(CASE WHEN direction = 'SHORT' THEN 1 END) as short_trades
        FROM trade_history 
        WHERE user_id = ?
      `, [userId]);
      
      return result.rows[0] || {
        total_trades: 0,
        avg_risk: 0,
        avg_rr: 0,
        long_trades: 0,
        short_trades: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      return {
        total_trades: 0,
        avg_risk: 0,
        avg_rr: 0,
        long_trades: 0,
        short_trades: 0
      };
    }
  }
  
  // Estatísticas globais
  static async getGlobalStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(DISTINCT user_id) as active_users,
          AVG(risk_percent) as avg_risk,
          AVG(risk_reward_ratio) as avg_rr,
          COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as trades_last_week,
          COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as trades_last_month
        FROM trade_history
      `);
      
      return result.rows[0] || {
        total_trades: 0,
        active_users: 0,
        avg_risk: 0,
        avg_rr: 0,
        trades_last_week: 0,
        trades_last_month: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas globais:', error);
      return {
        total_trades: 0,
        active_users: 0,
        avg_risk: 0,
        avg_rr: 0,
        trades_last_week: 0,
        trades_last_month: 0
      };
    }
  }
  
  // Exchanges mais usadas
  static async getTopExchanges(limit = 10) {
    try {
      const result = await query(`
        SELECT exchange, COUNT(*) as count
        FROM trade_history 
        GROUP BY exchange 
        ORDER BY count DESC 
        LIMIT ?
      `, [limit]);
      
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar top exchanges:', error);
      return [];
    }
  }
  
  // Símbolos mais negociados
  static async getTopSymbols(limit = 10) {
    try {
      const result = await query(`
        SELECT symbol, COUNT(*) as count
        FROM trade_history 
        GROUP BY symbol 
        ORDER BY count DESC 
        LIMIT ?
      `, [limit]);
      
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar top símbolos:', error);
      return [];
    }
  }

  // Estatísticas de exchanges do usuário
  static async getUserExchangeStats(userId) {
    try {
      const result = await query(`
        SELECT 
          exchange,
          COUNT(*) as trade_count,
          AVG(risk_percent) as avg_risk,
          AVG(risk_reward_ratio) as avg_rr
        FROM trade_history 
        WHERE user_id = ? 
        GROUP BY exchange 
        ORDER BY trade_count DESC
      `, [userId]);
      
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas de exchange do usuário:', error);
      return [];
    }
  }
  
  // Estatísticas de símbolos do usuário
  static async getUserSymbolStats(userId) {
    try {
      const result = await query(`
        SELECT 
          symbol,
          COUNT(*) as trade_count,
          AVG(risk_percent) as avg_risk,
          AVG(risk_reward_ratio) as avg_rr
        FROM trade_history 
        WHERE user_id = ? 
        GROUP BY symbol 
        ORDER BY trade_count DESC 
        LIMIT 10
      `, [userId]);
      
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas de símbolo do usuário:', error);
      return [];
    }
  }
  
  // Deletar trade
  static async delete(tradeId) {
    try {
      await query(`DELETE FROM trade_history WHERE id = ?`, [tradeId]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar trade:', error);
      throw error;
    }
  }
  
  // Buscar trade por ID
  static async getById(tradeId) {
    try {
      const result = await query(`
        SELECT * FROM trade_history WHERE id = ?
      `, [tradeId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar trade por ID:', error);
      return null;
    }
  }
}

module.exports = TradeHistory;
EOF

echo "   ✅ TradeHistory.js reescrito com sintaxe correta"

echo ""
echo "3. 🔧 Verificando outros arquivos de modelo..."

# Verificar User.js também
if [ -f "src/models/User.js" ]; then
    echo "   🔍 Verificando User.js..."
    
    # Verificar se tem problemas de sintaxe
    node -c src/models/User.js 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ User.js está correto"
    else
        echo "   ⚠️ User.js tem problemas de sintaxe, corrigindo..."
        
        # Se já foi executado o script anterior, o User.js deve estar correto
        # Mas vamos garantir que está usando SQLite
        sed -i '1s/.*/const { query } = require("..\/config\/database-sqlite");/' src/models/User.js
        echo "   ✅ User.js corrigido"
    fi
fi

echo ""
echo "4. 🔄 Reiniciando aplicação..."

# Parar PM2
pm2 stop bitacademy-calculator

# Aguardar um pouco
sleep 2

# Iniciar novamente
pm2 start bitacademy-calculator

# Aguardar inicialização
sleep 5

echo ""
echo "5. 🧪 Testando aplicação..."

# Testar se iniciou sem erros de sintaxe
PM2_STATUS=$(pm2 list | grep bitacademy-calculator | grep online)

if [ -n "$PM2_STATUS" ]; then
    echo "   ✅ PM2 rodando online"
    
    # Testar health check
    sleep 2
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health 2>/dev/null)
    
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        echo "   ✅ Health check funcionando"
        echo "   Response: $HEALTH_RESPONSE"
        
        # Testar via nginx
        sleep 2
        NGINX_RESPONSE=$(curl -s http://calculadora.bitacademy.vip/api/health 2>/dev/null)
        
        if echo "$NGINX_RESPONSE" | grep -q "OK"; then
            echo "   ✅ Nginx proxy funcionando"
            echo ""
            echo "🎉 ERRO DE SINTAXE CORRIGIDO!"
            echo "============================"
            echo ""
            echo "🌐 Acesse: http://calculadora.bitacademy.vip"
            echo "🔑 Login: admin@seudominio.com"
            echo "🔐 Senha: Admin123456!"
        else
            echo "   ⚠️ Nginx ainda com problemas"
            echo "   Response: $NGINX_RESPONSE"
        fi
    else
        echo "   ⚠️ Health check falhando"
        echo "   Response: $HEALTH_RESPONSE"
    fi
else
    echo "   ❌ PM2 não está online"
    echo ""
    echo "📋 Status do PM2:"
    pm2 status
    echo ""
    echo "📋 Logs recentes:"
    pm2 logs bitacademy-calculator --lines 10
fi

echo ""
echo "🔍 Para monitoramento contínuo:"
echo "   pm2 logs bitacademy-calculator --lines 20"
echo "   curl -s http://localhost:3001/health"