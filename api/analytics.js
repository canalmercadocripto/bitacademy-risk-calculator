const { supabase } = require('../lib/supabase');

// Analytics API for dashboard metrics
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    // Get user ID from token (for user-specific analytics)
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        userId = parseInt(parts[0]) || null;
      } catch (error) {
        console.log('⚠️ Could not decode token');
      }
    }
    
    const { period = '30d', view = 'overview' } = req.query;
    
    // Calculate date range
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startDateISO = startDate.toISOString();
    
    // Get overview metrics
    if (view === 'overview') {
      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // Active users (logged in within period)
      const { count: activeUsers } = await supabase
        .from('activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', startDateISO);
      
      // Total trades
      const { count: totalTrades } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });
      
      // Trades in period
      const { count: tradesThisPeriod } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateISO);
      
      // Get trade statistics
      const { data: tradeStats } = await supabase
        .from('trades')
        .select('account_size, risk_reward_ratio, position_size');
      
      const totalVolume = tradeStats?.reduce((sum, trade) => sum + parseFloat(trade.account_size || 0), 0) || 0;
      const avgRiskReward = tradeStats?.length > 0 ? 
        tradeStats.reduce((sum, trade) => sum + parseFloat(trade.risk_reward_ratio || 0), 0) / tradeStats.length : 0;
      
      return res.status(200).json({
        success: true,
        data: {
          overview: {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            totalTrades: totalTrades || 0,
            tradesThisPeriod: tradesThisPeriod || 0,
            totalVolume: totalVolume,
            avgRiskReward: parseFloat(avgRiskReward.toFixed(2)),
            successRate: 68.5, // TODO: Calculate real success rate
            platformUsage: ((activeUsers || 0) / (totalUsers || 1) * 100).toFixed(1)
          }
        }
      });
    }
    
    // Get user metrics
    if (view === 'users') {
      // New users in period
      const { count: newUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateISO);
      
      // Most active users
      const { data: mostActiveUsers } = await supabase
        .from('trades')
        .select(`
          user_id,
          users(name),
          account_size
        `)
        .gte('created_at', startDateISO);
      
      // Group by user and calculate stats
      const userStats = {};
      mostActiveUsers?.forEach(trade => {
        const userId = trade.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            name: trade.users?.name || 'Usuário',
            trades: 0,
            volume: 0
          };
        }
        userStats[userId].trades += 1;
        userStats[userId].volume += parseFloat(trade.account_size || 0);
      });
      
      const topUsers = Object.values(userStats)
        .sort((a, b) => b.trades - a.trades)
        .slice(0, 5);
      
      return res.status(200).json({
        success: true,
        data: {
          userMetrics: {
            newUsersThisPeriod: newUsers || 0,
            userRetentionRate: 72.5, // TODO: Calculate real retention
            avgTradesPerUser: totalTrades > 0 && totalUsers > 0 ? 
              (totalTrades / totalUsers).toFixed(1) : 0,
            mostActiveUsers: topUsers
          }
        }
      });
    }
    
    // Get trade metrics
    if (view === 'trades') {
      const { data: recentTrades } = await supabase
        .from('trades')
        .select('symbol, exchange, account_size, position_size, created_at')
        .gte('created_at', startDateISO)
        .order('created_at', { ascending: false });
      
      // Calculate metrics
      const avgTradeSize = recentTrades?.length > 0 ?
        recentTrades.reduce((sum, trade) => sum + parseFloat(trade.position_size || 0), 0) / recentTrades.length : 0;
      
      // Most traded pairs
      const symbolCount = {};
      recentTrades?.forEach(trade => {
        symbolCount[trade.symbol] = (symbolCount[trade.symbol] || 0) + 1;
      });
      
      const mostTradedPairs = Object.entries(symbolCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([symbol, count]) => ({ symbol, trades: count }));
      
      return res.status(200).json({
        success: true,
        data: {
          tradeMetrics: {
            tradesThisPeriod: recentTrades?.length || 0,
            avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
            mostTradedPairs: mostTradedPairs,
            recentActivity: recentTrades?.slice(0, 10) || []
          }
        }
      });
    }
    
    // Get performance data for charts
    if (view === 'performance') {
      const { data: dailyTrades } = await supabase
        .from('trades')
        .select('created_at, account_size, risk_amount, reward_amount')
        .gte('created_at', startDateISO)
        .order('created_at', { ascending: true });
      
      // Group by day
      const dailyStats = {};
      dailyTrades?.forEach(trade => {
        const date = trade.created_at.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            trades: 0,
            volume: 0,
            pnl: 0
          };
        }
        dailyStats[date].trades += 1;
        dailyStats[date].volume += parseFloat(trade.account_size || 0);
        dailyStats[date].pnl += parseFloat(trade.reward_amount || 0) - parseFloat(trade.risk_amount || 0);
      });
      
      const performanceData = Object.values(dailyStats);
      
      return res.status(200).json({
        success: true,
        data: {
          performanceData: performanceData
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'View not supported'
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