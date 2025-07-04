const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Consolidated trades API for Vercel with Supabase
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate and sanitize input for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    const sanitizeResult = securityMiddleware.validateAndSanitize(req, res);
    if (sanitizeResult) return sanitizeResult;
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
      
      // Get user ID from token if provided
      let userId = 1; // Default user
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const parts = decoded.split(':');
          userId = parseInt(parts[0]) || 1;
        } catch (error) {
          console.log('⚠️ Could not decode token, using default user');
        }
      }
      
      // Inserir trade no banco
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          exchange,
          symbol: symbol.toUpperCase(),
          account_size: parseFloat(accountSize || 0),
          risk_percentage: parseFloat(riskPercentage || 0),
          entry_price: parseFloat(entryPrice),
          stop_loss: stopLoss ? parseFloat(stopLoss) : null,
          take_profit: takeProfit ? parseFloat(takeProfit) : null,
          position_size: parseFloat(positionSize),
          risk_amount: parseFloat(riskAmount || 0),
          reward_amount: parseFloat(rewardAmount || 0),
          risk_reward_ratio: parseFloat(riskRewardRatio || 0),
          current_price: currentPrice ? parseFloat(currentPrice) : null,
          trade_type: tradeType,
          notes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database fields to frontend expected fields
      const mappedTrade = {
        id: data.id,
        exchange: data.exchange,
        symbol: data.symbol,
        direction: data.trade_type?.toUpperCase() || 'LONG',
        entryPrice: parseFloat(data.entry_price),
        stopLoss: data.stop_loss ? parseFloat(data.stop_loss) : null,
        targetPrice: data.take_profit ? parseFloat(data.take_profit) : null,
        positionSize: parseFloat(data.position_size),
        riskAmount: parseFloat(data.risk_amount || 0),
        rewardAmount: parseFloat(data.reward_amount || 0),
        riskRewardRatio: parseFloat(data.risk_reward_ratio || 0),
        accountSize: parseFloat(data.account_size || 0),
        riskPercentage: parseFloat(data.risk_percentage || 0),
        currentPrice: data.current_price ? parseFloat(data.current_price) : null,
        status: data.status || 'calculated',
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return res.status(200).json({
        success: true,
        data: mappedTrade,
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
      
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: status || 'active',
          notes: notes || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false, message: 'Trade não encontrado'
          });
        }
        throw error;
      }
      
      // Map database fields to frontend expected fields
      const mappedTrade = {
        id: data.id,
        exchange: data.exchange,
        symbol: data.symbol,
        direction: data.trade_type?.toUpperCase() || 'LONG',
        entryPrice: parseFloat(data.entry_price),
        stopLoss: data.stop_loss ? parseFloat(data.stop_loss) : null,
        targetPrice: data.take_profit ? parseFloat(data.take_profit) : null,
        positionSize: parseFloat(data.position_size),
        riskAmount: parseFloat(data.risk_amount || 0),
        rewardAmount: parseFloat(data.reward_amount || 0),
        riskRewardRatio: parseFloat(data.risk_reward_ratio || 0),
        accountSize: parseFloat(data.account_size || 0),
        riskPercentage: parseFloat(data.risk_percentage || 0),
        currentPrice: data.current_price ? parseFloat(data.current_price) : null,
        status: data.status || 'calculated',
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return res.status(200).json({
        success: true,
        data: mappedTrade,
        message: 'Trade atualizado com sucesso'
      });
    }
    
    // Get history
    if (req.method === 'GET' && action === 'history') {
      const { page = 1, limit = 20, status = '', exchange = '' } = req.query;
      
      // Get user ID from token
      let userId = 1; // Default user
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const parts = decoded.split(':');
          userId = parseInt(parts[0]) || 1;
        } catch (error) {
          console.log('⚠️ Could not decode token, using default user');
        }
      }
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
      // Build query
      let query = supabase
        .from('trades')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (exchange) {
        query = query.ilike('exchange', `%${exchange}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Get stats
      let statsQuery = supabase
        .from('trades')
        .select('status, reward_amount, risk_amount, risk_reward_ratio')
        .eq('user_id', userId);
        
      if (status) {
        statsQuery = statsQuery.eq('status', status);
      }
      
      if (exchange) {
        statsQuery = statsQuery.ilike('exchange', `%${exchange}%`);
      }
      
      const { data: statsData, error: statsError } = await statsQuery;
      
      if (statsError) throw statsError;
      
      const totalTrades = statsData.length;
      const activeTrades = statsData.filter(t => t.status === 'active').length;
      const closedTrades = statsData.filter(t => t.status === 'closed').length;
      const totalPnL = statsData.reduce((sum, t) => sum + (parseFloat(t.reward_amount || 0) - parseFloat(t.risk_amount || 0)), 0);
      const avgRiskReward = totalTrades > 0 ? 
        statsData.reduce((sum, t) => sum + parseFloat(t.risk_reward_ratio || 0), 0) / totalTrades : 0;
      
      // Map database fields to frontend expected fields
      const mappedData = data.map(trade => ({
        id: trade.id,
        exchange: trade.exchange,
        symbol: trade.symbol,
        direction: trade.trade_type?.toUpperCase() || 'LONG',
        entryPrice: parseFloat(trade.entry_price),
        stopLoss: trade.stop_loss ? parseFloat(trade.stop_loss) : null,
        targetPrice: trade.take_profit ? parseFloat(trade.take_profit) : null,
        positionSize: parseFloat(trade.position_size),
        riskAmount: parseFloat(trade.risk_amount || 0),
        rewardAmount: parseFloat(trade.reward_amount || 0),
        riskRewardRatio: parseFloat(trade.risk_reward_ratio || 0),
        accountSize: parseFloat(trade.account_size || 0),
        riskPercentage: parseFloat(trade.risk_percentage || 0),
        currentPrice: trade.current_price ? parseFloat(trade.current_price) : null,
        status: trade.status || 'calculated',
        notes: trade.notes || '',
        createdAt: trade.created_at,
        updatedAt: trade.updated_at
      }));

      return res.status(200).json({
        success: true,
        data: mappedData,
        meta: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum),
          hasNextPage: offset + limitNum < count,
          hasPrevPage: pageNum > 1
        },
        stats: {
          totalTrades,
          activeTrades,
          closedTrades,
          totalPnL,
          avgRiskReward,
          winRate: totalTrades > 0 ? (closedTrades / totalTrades * 100) : 0
        }
      });
    }
    
    // Export trades
    if (req.method === 'GET' && action === 'export') {
      const { format = 'json' } = req.query;
      
      // Get user ID from token
      let userId = 1; // Default user
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const parts = decoded.split(':');
          userId = parseInt(parts[0]) || 1;
        } catch (error) {
          console.log('⚠️ Could not decode token, using default user');
        }
      }
      
      const { data, error } = await supabase
        .from('trades')
        .select(`
          id, exchange, symbol, entry_price, stop_loss, take_profit,
          position_size, risk_amount, reward_amount, risk_reward_ratio,
          trade_type, status, notes, created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const exportData = data.map(trade => ({
        id: trade.id,
        date: new Date(trade.created_at).toISOString().split('T')[0],
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
      
      const { data, error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .select('id')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false, message: 'Trade não encontrado'
          });
        }
        throw error;
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