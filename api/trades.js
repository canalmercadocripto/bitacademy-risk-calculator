const { sql } = require('@vercel/postgres');

// Consolidated trades API for Vercel with Postgres
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  try {
    // Save trade - aceitar POST sem action ou com action=save
    if (req.method === 'POST' && (!action || action === 'save')) {
      const { 
        exchange, symbol, accountSize, riskPercentage, entryPrice, 
        stopLoss, takeProfit, positionSize, riskAmount, rewardAmount, 
        riskRewardRatio, currentPrice, tradeType = 'long', notes = '' 
      } = req.body;
      
      if (!exchange || !symbol || !entryPrice || !positionSize) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: exchange, symbol, entryPrice, positionSize'
        });
      }
      
      // Inserir trade no banco
      const result = await sql`
        INSERT INTO trades (
          user_id, exchange, symbol, account_size, risk_percentage, 
          entry_price, stop_loss, take_profit, position_size, 
          risk_amount, reward_amount, risk_reward_ratio, 
          current_price, trade_type, notes
        ) VALUES (
          1, ${exchange}, ${symbol.toUpperCase()}, ${parseFloat(accountSize || 0)}, ${parseFloat(riskPercentage || 0)},
          ${parseFloat(entryPrice)}, ${stopLoss ? parseFloat(stopLoss) : null}, 
          ${takeProfit ? parseFloat(takeProfit) : null}, ${parseFloat(positionSize)},
          ${parseFloat(riskAmount || 0)}, ${parseFloat(rewardAmount || 0)}, ${parseFloat(riskRewardRatio || 0)},
          ${currentPrice ? parseFloat(currentPrice) : null}, ${tradeType}, ${notes}
        ) RETURNING *
      `;
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Trade salvo com sucesso no banco de dados'
      });
    }
    
    // Update trade
    if (req.method === 'PUT' && action === 'update') {
      const { tradeId, status, notes } = req.body;
      
      if (!tradeId) {
        return res.status(400).json({
          success: false, message: 'tradeId é obrigatório'
        });
      }
      
      const result = await sql`
        UPDATE trades 
        SET status = ${status || 'active'}, 
            notes = ${notes || ''}, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${tradeId}
        RETURNING *
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false, message: 'Trade não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Trade atualizado com sucesso'
      });
    }
    
    // Get history
    if (req.method === 'GET' && action === 'history') {
      const { page = 1, limit = 20, status = '', exchange = '', userId = 1 } = req.query;
      
      let query = `SELECT * FROM trades WHERE user_id = $1`;
      let params = [userId];
      let paramCount = 1;
      
      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (exchange) {
        paramCount++;
        query += ` AND exchange ILIKE $${paramCount}`;
        params.push(`%${exchange}%`);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limitNum, offset);
      
      const result = await sql.query(query, params);
      
      // Count total
      let countQuery = `SELECT COUNT(*) FROM trades WHERE user_id = $1`;
      let countParams = [userId];
      let countParamCount = 1;
      
      if (status) {
        countParamCount++;
        countQuery += ` AND status = $${countParamCount}`;
        countParams.push(status);
      }
      
      if (exchange) {
        countParamCount++;
        countQuery += ` AND exchange ILIKE $${countParamCount}`;
        countParams.push(`%${exchange}%`);
      }
      
      const countResult = await sql.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
      // Stats
      const statsResult = await sql`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trades,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
          COALESCE(SUM(reward_amount - risk_amount), 0) as total_pnl,
          COALESCE(AVG(risk_reward_ratio), 0) as avg_rr_ratio
        FROM trades 
        WHERE user_id = ${userId}
      `;
      
      const stats = statsResult.rows[0];
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: offset + limitNum < total,
          hasPrevPage: pageNum > 1
        },
        stats: {
          totalTrades: parseInt(stats.total_trades),
          activeTrades: parseInt(stats.active_trades),
          closedTrades: parseInt(stats.closed_trades),
          totalPnL: parseFloat(stats.total_pnl),
          avgRiskReward: parseFloat(stats.avg_rr_ratio),
          winRate: stats.closed_trades > 0 ? 
            (stats.closed_trades / stats.total_trades * 100) : 0
        }
      });
    }
    
    // Export trades
    if (req.method === 'GET' && action === 'export') {
      const { format = 'json', userId = 1 } = req.query;
      
      const result = await sql`
        SELECT 
          id, exchange, symbol, entry_price, stop_loss, take_profit,
          position_size, risk_amount, reward_amount, risk_reward_ratio,
          trade_type, status, notes, created_at
        FROM trades 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      
      const exportData = result.rows.map(trade => ({
        id: trade.id,
        date: trade.created_at.toISOString().split('T')[0],
        exchange: trade.exchange,
        symbol: trade.symbol,
        type: trade.trade_type,
        entryPrice: parseFloat(trade.entry_price),
        stopLoss: trade.stop_loss ? parseFloat(trade.stop_loss) : null,
        takeProfit: trade.take_profit ? parseFloat(trade.take_profit) : null,
        positionSize: parseFloat(trade.position_size),
        riskAmount: parseFloat(trade.risk_amount),
        rewardAmount: parseFloat(trade.reward_amount),
        riskRewardRatio: parseFloat(trade.risk_reward_ratio),
        status: trade.status,
        notes: trade.notes
      }));
      
      if (format.toLowerCase() === 'csv') {
        const csvHeaders = 'ID,Date,Exchange,Symbol,Type,Entry Price,Stop Loss,Take Profit,Position Size,Risk Amount,Reward Amount,Risk/Reward,Status,Notes\n';
        const csvRows = exportData.map(trade => 
          `${trade.id},${trade.date},${trade.exchange},${trade.symbol},${trade.type},${trade.entryPrice},${trade.stopLoss || ''},${trade.takeProfit || ''},${trade.positionSize},${trade.riskAmount},${trade.rewardAmount},${trade.riskRewardRatio},${trade.status},"${(trade.notes || '').replace(/"/g, '""')}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="trades_export.csv"');
        return res.status(200).send(csvHeaders + csvRows);
      }
      
      return res.status(200).json({
        success: true,
        data: exportData,
        meta: {
          format,
          exportDate: new Date().toISOString(),
          totalRecords: exportData.length
        }
      });
    }
    
    // Delete trade
    if (req.method === 'DELETE') {
      const { tradeId } = req.query;
      
      if (!tradeId) {
        return res.status(400).json({
          success: false, message: 'tradeId é obrigatório'
        });
      }
      
      const result = await sql`
        DELETE FROM trades WHERE id = ${tradeId} RETURNING id
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false, message: 'Trade não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Trade deletado com sucesso'
      });
    }
    
    return res.status(405).json({ error: 'Método não permitido' });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}