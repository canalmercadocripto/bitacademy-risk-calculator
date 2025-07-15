// Usar SQLite por padrão em desenvolvimento
const dbConfig = process.env.NODE_ENV === 'production' 
  ? '../config/database' 
  : '../config/database-sqlite';

const { query } = require(dbConfig);

class TradeHistory {
  
  // Salvar novo trade (imutável)
  static async create(tradeData) {
    try {
      const {
        userId,
        sessionId,
        exchange,
        symbol,
        direction,
        entryPrice,
        stopLoss,
        targetPrice,
        accountSize,
        riskPercent,
        positionSize,
        riskAmount,
        rewardAmount,
        riskRewardRatio,
        currentPrice,
        calculationData,
        ipAddress,
        userAgent
      } = tradeData;
      
      const result = await query(`
        INSERT INTO trade_history (
          user_id, session_id, exchange, symbol, direction,
          entry_price, stop_loss, target_price, account_size, risk_percent,
          position_size, risk_amount, reward_amount, risk_reward_ratio,
          current_price, calculation_data, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, sessionId, exchange, symbol, direction,
        entryPrice, stopLoss, targetPrice, accountSize, riskPercent,
        positionSize, riskAmount, rewardAmount, riskRewardRatio,
        currentPrice, JSON.stringify(calculationData), ipAddress, userAgent
      ]);
      
      // Para SQLite, retornar o ID inserido
      const insertedId = result.lastID || result.insertId;
      
      if (!insertedId) {
        console.error('Erro: ID não retornado após inserção', result);
        throw new Error('Falha ao obter ID do trade inserido');
      }
      
      // Retornar dados básicos diretamente para evitar problemas de consulta
      return {
        id: insertedId,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao salvar trade:', error);
      throw error;
    }
  }
  
  // Buscar trades por usuário
  static async getByUser(userId, page = 1, limit = 100) {
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        id, exchange, symbol, direction, entry_price, stop_loss, target_price,
        account_size, risk_percent, position_size, risk_amount, reward_amount,
        risk_reward_ratio, current_price, created_at
      FROM trade_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
    
    // Total de trades do usuário
    const countResult = await query(`
      SELECT COUNT(*) as total FROM trade_history WHERE user_id = ?
    `, [userId]);
    
    return {
      trades: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    };
  }
  
  // Estatísticas de trades por usuário
  static async getUserStats(userId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT exchange) as exchanges_used,
        COUNT(DISTINCT symbol) as symbols_traded,
        AVG(risk_percent) as avg_risk_percent,
        AVG(risk_reward_ratio) as avg_risk_reward,
        SUM(risk_amount) as total_risk_amount,
        MAX(created_at) as last_trade,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as trades_last_7_days,
        COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as trades_this_month,
        (SELECT exchange FROM trade_history WHERE user_id = ? GROUP BY exchange ORDER BY COUNT(*) DESC LIMIT 1) as favorite_exchange
      FROM trade_history 
      WHERE user_id = ?
    `, [userId, userId]);
    
    return result.rows[0];
  }

  // Estatísticas por exchange do usuário
  static async getUserExchangeStats(userId) {
    const result = await query(`
      SELECT 
        exchange,
        COUNT(*) as trade_count,
        AVG(risk_percent) as avg_risk,
        SUM(risk_amount) as total_volume,
        MAX(created_at) as last_trade
      FROM trade_history 
      WHERE user_id = ?
      GROUP BY exchange 
      ORDER BY trade_count DESC
    `, [userId]);
    
    return result.rows;
  }

  // Estatísticas mensais do usuário
  static async getUserMonthlyStats(userId) {
    const result = await query(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as trades,
        AVG(risk_percent) as avg_risk,
        SUM(risk_amount) as volume,
        COUNT(DISTINCT exchange) as exchanges_used
      FROM trade_history 
      WHERE user_id = ? AND created_at > datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `, [userId]);
    
    return result.rows;
  }
  
  // Estatísticas gerais para admin
  static async getGlobalStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT exchange) as exchanges_used,
        COUNT(DISTINCT symbol) as symbols_traded,
        AVG(risk_percent) as avg_risk_percent,
        AVG(risk_reward_ratio) as avg_risk_reward,
        SUM(risk_amount) as total_risk_volume
      FROM trade_history 
      WHERE created_at > datetime('now', '-30 days')
    `);
    
    return result.rows[0];
  }
  
  // Trades por exchange (para admin)
  static async getByExchange(days = 30) {
    const result = await query(`
      SELECT 
        exchange,
        COUNT(*) as trade_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(risk_percent) as avg_risk,
        SUM(risk_amount) as total_volume
      FROM trade_history 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY exchange 
      ORDER BY trade_count DESC
    `);
    
    return result.rows;
  }
  
  // Símbolos mais tradados
  static async getTopSymbols(limit = 10, days = 30) {
    const result = await query(`
      SELECT 
        symbol,
        exchange,
        COUNT(*) as trade_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM trade_history 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY symbol, exchange 
      ORDER BY trade_count DESC 
      LIMIT ?
    `, [limit]);
    
    return result.rows;
  }
  
  // Atividade por dia (para gráficos)
  static async getDailyActivity(days = 30) {
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as trades,
        COUNT(DISTINCT user_id) as active_users,
        SUM(risk_amount) as volume
      FROM trade_history 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `);
    
    return result.rows;
  }
  
  // Buscar todos os trades (para admin)
  static async getAll(page = 1, limit = 50, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    // Filtros opcionais
    if (filters.exchange) {
      whereClause += ` AND exchange = ?`;
      params.push(filters.exchange);
    }
    
    if (filters.symbol) {
      whereClause += ` AND symbol = ?`;
      params.push(filters.symbol);
    }
    
    if (filters.userId) {
      whereClause += ` AND user_id = ?`;
      params.push(filters.userId);
    }
    
    if (filters.startDate) {
      whereClause += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      whereClause += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }
    
    params.push(limit, offset);
    
    const result = await query(`
      SELECT 
        th.id, th.user_id, th.session_id, th.exchange, th.symbol, th.direction, 
        th.entry_price, th.stop_loss, th.target_price, th.account_size, 
        th.risk_percent, th.position_size, th.risk_amount, th.reward_amount,
        th.risk_reward_ratio, th.current_price, th.calculation_data, th.ip_address, th.user_agent,
        th.created_at, u.email as user_email, u.name as user_name
      FROM trade_history th
      LEFT JOIN users u ON th.user_id = u.id
      ${whereClause}
      ORDER BY th.created_at DESC 
      LIMIT ? OFFSET ?
    `, params);
    
    // Total com filtros
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM trade_history th 
      LEFT JOIN users u ON th.user_id = u.id
      ${whereClause}
    `, params.slice(0, -2));
    
    return {
      trades: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    };
  }
}

module.exports = TradeHistory;