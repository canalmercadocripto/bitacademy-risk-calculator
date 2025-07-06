const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Analytics API - advanced analytics with real data
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
    const { period = '30d', view = 'overview' } = req.query;
    
    console.log(`🔍 Gerando analytics para período: ${period}, view: ${view}`);
    
    // Get all trades and users
    const [tradesResult, usersResult] = await Promise.all([
      supabase
        .from('trades')
        .select(`
          id, user_id, exchange, symbol, account_size, risk_percentage,
          entry_price, stop_loss, take_profit, position_size, risk_amount,
          reward_amount, risk_reward_ratio, trade_type, status, created_at,
          users(name, email)
        `)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('users')
        .select('id, name, email, role, is_active, created_at')
        .order('created_at', { ascending: false })
    ]);
    
    if (tradesResult.error) throw tradesResult.error;
    if (usersResult.error) throw usersResult.error;
    
    const trades = tradesResult.data || [];
    const users = usersResult.data || [];
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Filter trades by period
    const filteredTrades = trades.filter(trade => 
      new Date(trade.created_at) >= startDate
    );
    
    // Filter users by period
    const filteredUsers = users.filter(user => 
      new Date(user.created_at) >= startDate
    );
    
    // Calculate overview metrics
    const overview = {
      totalTrades: filteredTrades.length,
      totalUsers: filteredUsers.length,
      totalVolume: filteredTrades.reduce((sum, trade) => sum + (trade.account_size || 0), 0),
      avgRiskReward: filteredTrades.length > 0 ? 
        filteredTrades.reduce((sum, trade) => sum + (trade.risk_reward_ratio || 0), 0) / filteredTrades.length : 0,
      activeTrades: filteredTrades.filter(t => t.status === 'active').length,
      closedTrades: filteredTrades.filter(t => t.status === 'closed').length,
      avgAccountSize: filteredTrades.length > 0 ? 
        filteredTrades.reduce((sum, trade) => sum + (trade.account_size || 0), 0) / filteredTrades.length : 0,
      avgRiskPercentage: filteredTrades.length > 0 ? 
        filteredTrades.reduce((sum, trade) => sum + (trade.risk_percentage || 0), 0) / filteredTrades.length : 0
    };
    
    // User metrics
    const userMetrics = {
      newUsers: filteredUsers.length,
      activeUsers: users.filter(u => u.is_active).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      userGrowthRate: users.length > 0 ? (filteredUsers.length / users.length * 100) : 0
    };
    
    // Trade metrics by exchange
    const exchangeMetrics = {};
    filteredTrades.forEach(trade => {
      const exchange = trade.exchange;
      if (!exchangeMetrics[exchange]) {
        exchangeMetrics[exchange] = {
          count: 0,
          volume: 0,
          avgRiskReward: 0
        };
      }
      exchangeMetrics[exchange].count++;
      exchangeMetrics[exchange].volume += trade.account_size || 0;
    });
    
    // Calculate average risk/reward for each exchange
    Object.keys(exchangeMetrics).forEach(exchange => {
      const exchangeTrades = filteredTrades.filter(t => t.exchange === exchange);
      exchangeMetrics[exchange].avgRiskReward = exchangeTrades.length > 0 ? 
        exchangeTrades.reduce((sum, t) => sum + (t.risk_reward_ratio || 0), 0) / exchangeTrades.length : 0;
    });
    
    // Performance data (daily aggregation)
    const performanceData = [];
    const days = parseInt(period.replace('d', '')) || 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = filteredTrades.filter(trade => 
        trade.created_at.startsWith(dateStr)
      );
      
      const dayUsers = filteredUsers.filter(user => 
        user.created_at.startsWith(dateStr)
      );
      
      performanceData.push({
        date: dateStr,
        trades: dayTrades.length,
        users: dayUsers.length,
        volume: dayTrades.reduce((sum, trade) => sum + (trade.account_size || 0), 0),
        avgRiskReward: dayTrades.length > 0 ? 
          dayTrades.reduce((sum, trade) => sum + (trade.risk_reward_ratio || 0), 0) / dayTrades.length : 0
      });
    }
    
    // Top performers
    const userPerformance = {};
    filteredTrades.forEach(trade => {
      const userId = trade.user_id;
      if (!userPerformance[userId]) {
        userPerformance[userId] = {
          userId,
          userName: trade.users?.name || 'Usuário Desconhecido',
          userEmail: trade.users?.email || 'N/A',
          totalTrades: 0,
          totalVolume: 0,
          avgRiskReward: 0,
          activeTrades: 0
        };
      }
      userPerformance[userId].totalTrades++;
      userPerformance[userId].totalVolume += trade.account_size || 0;
      if (trade.status === 'active') {
        userPerformance[userId].activeTrades++;
      }
    });
    
    // Calculate average risk/reward for each user
    Object.keys(userPerformance).forEach(userId => {
      const userTrades = filteredTrades.filter(t => t.user_id == userId);
      userPerformance[userId].avgRiskReward = userTrades.length > 0 ? 
        userTrades.reduce((sum, t) => sum + (t.risk_reward_ratio || 0), 0) / userTrades.length : 0;
    });
    
    const topPerformers = Object.values(userPerformance)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);
    
    // Risk analysis
    const riskAnalysis = {
      lowRisk: filteredTrades.filter(t => (t.risk_percentage || 0) <= 1).length,
      mediumRisk: filteredTrades.filter(t => (t.risk_percentage || 0) > 1 && (t.risk_percentage || 0) <= 3).length,
      highRisk: filteredTrades.filter(t => (t.risk_percentage || 0) > 3).length,
      avgRisk: overview.avgRiskPercentage,
      riskDistribution: {}
    };
    
    // Risk distribution by ranges
    const riskRanges = [
      { min: 0, max: 0.5, label: '0-0.5%' },
      { min: 0.5, max: 1, label: '0.5-1%' },
      { min: 1, max: 2, label: '1-2%' },
      { min: 2, max: 3, label: '2-3%' },
      { min: 3, max: 5, label: '3-5%' },
      { min: 5, max: 100, label: '5%+' }
    ];
    
    riskRanges.forEach(range => {
      riskAnalysis.riskDistribution[range.label] = filteredTrades.filter(t => 
        (t.risk_percentage || 0) > range.min && (t.risk_percentage || 0) <= range.max
      ).length;
    });
    
    console.log('📊 Analytics calculado:', {
      totalTrades: overview.totalTrades,
      totalUsers: overview.totalUsers,
      totalVolume: overview.totalVolume.toFixed(2),
      period
    });
    
    return res.status(200).json({
      success: true,
      data: {
        overview,
        userMetrics,
        exchangeMetrics,
        performanceData,
        topPerformers,
        riskAnalysis,
        period,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}