// Admin dashboard API for Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  // Mock admin dashboard data
  const dashboardData = {
    overview: {
      totalUsers: 156,
      activeUsers: 89,
      totalTrades: 2847,
      totalVolume: 1245789.50,
      systemStatus: 'online',
      uptime: '99.8%'
    },
    recentActivity: [
      {
        id: 'activity_001',
        type: 'trade_created',
        user: 'user_123',
        description: 'Nova posição BTCUSDT criada',
        timestamp: '2024-12-02T10:30:00Z'
      },
      {
        id: 'activity_002',
        type: 'user_login',
        user: 'user_456',
        description: 'Login realizado',
        timestamp: '2024-12-02T10:25:00Z'
      },
      {
        id: 'activity_003',
        type: 'trade_closed',
        user: 'user_789',
        description: 'Posição ETHUSDT fechada com lucro',
        timestamp: '2024-12-02T10:20:00Z'
      }
    ],
    systemMetrics: {
      apiResponseTime: '245ms',
      databaseConnections: 12,
      memoryUsage: '68%',
      cpuUsage: '32%',
      diskUsage: '45%',
      activeConnections: 156
    },
    popularExchanges: [
      { name: 'Binance', usage: 45, trades: 1280 },
      { name: 'Bybit', usage: 28, trades: 798 },
      { name: 'BingX', usage: 18, trades: 512 },
      { name: 'Bitget', usage: 9, trades: 257 }
    ],
    topSymbols: [
      { symbol: 'BTCUSDT', trades: 567, volume: 234567.89 },
      { symbol: 'ETHUSDT', trades: 423, volume: 145678.23 },
      { symbol: 'SOLUSDT', trades: 234, volume: 67890.45 },
      { symbol: 'ADAUSDT', trades: 189, volume: 34567.12 }
    ],
    performanceStats: {
      avgWinRate: 64.2,
      avgRiskReward: 1.7,
      totalPnL: 45678.90,
      bestPerformer: 'user_321',
      worstPerformer: 'user_654'
    }
  };
  
  return res.status(200).json({
    success: true,
    data: dashboardData,
    timestamp: new Date().toISOString()
  });
}