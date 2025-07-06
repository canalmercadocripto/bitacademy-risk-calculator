const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Admin trades API - view all trades from all users
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate token and require admin
  const tokenResult = securityMiddleware.validateToken(req, res);
  if (tokenResult) return tokenResult;
  
  const adminResult = securityMiddleware.requireAdmin(req, res);
  if (adminResult) return adminResult;
  
  try {
    console.log('Admin trades API called with query:', req.query);
    console.log('Supabase URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    const { action = 'list', exchange = '', status = '' } = req.query;
    
    if (action === 'list') {
      console.log('🔍 Buscando TODOS os trades do banco...');
      
      // Build query to get ALL trades with user information (no pagination)
      let query = supabase
        .from('trades')
        .select(`
          id,
          user_id,
          exchange,
          symbol,
          account_size,
          risk_percentage,
          entry_price,
          stop_loss,
          take_profit,
          position_size,
          risk_amount,
          reward_amount,
          risk_reward_ratio,
          current_price,
          trade_type,
          status,
          notes,
          created_at,
          updated_at,
          users(name, email)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters if provided
      if (exchange && exchange !== 'all') {
        query = query.eq('exchange', exchange);
      }
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data: trades, error, count } = await query;
      
      console.log('Supabase query result:', { trades: trades?.length, error: error?.message });
      
      if (error) throw error;
      
      // Format trades data for frontend
      const formattedTrades = trades?.map(trade => ({
        id: trade.id,
        userId: trade.user_id,
        userName: trade.users?.name || 'Usuário Desconhecido',
        userEmail: trade.users?.email || 'email@desconhecido.com',
        exchange: trade.exchange,
        symbol: trade.symbol,
        accountSize: parseFloat(trade.account_size || 0),
        riskPercentage: parseFloat(trade.risk_percentage || 0),
        entryPrice: parseFloat(trade.entry_price || 0),
        stopLoss: parseFloat(trade.stop_loss || 0),
        takeProfit: parseFloat(trade.take_profit || 0),
        positionSize: parseFloat(trade.position_size || 0),
        riskAmount: parseFloat(trade.risk_amount || 0),
        rewardAmount: parseFloat(trade.reward_amount || 0),
        riskRewardRatio: parseFloat(trade.risk_reward_ratio || 0),
        currentPrice: parseFloat(trade.current_price || 0),
        tradeType: trade.trade_type || 'long',
        status: trade.status || 'active',
        notes: trade.notes || '',
        createdAt: trade.created_at,
        updatedAt: trade.updated_at
      })) || [];
      
      // Calculate statistics
      const totalTrades = formattedTrades.length;
      const activeTrades = formattedTrades.filter(t => t.status === 'active').length;
      const closedTrades = formattedTrades.filter(t => t.status === 'closed').length;
      const avgRiskReward = totalTrades > 0 ? 
        formattedTrades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / totalTrades : 0;
      
      console.log('📊 Estatísticas dos trades:', {
        totalTrades,
        activeTrades,
        closedTrades,
        avgRiskReward: parseFloat(avgRiskReward.toFixed(2))
      });
      
      return res.status(200).json({
        success: true,
        data: formattedTrades,
        meta: {
          total: totalTrades
        },
        stats: {
          totalTrades,
          activeTrades,
          closedTrades,
          avgRiskReward: parseFloat(avgRiskReward.toFixed(2))
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Ação não suportada'
    });
    
  } catch (error) {
    console.error('Admin trades API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}