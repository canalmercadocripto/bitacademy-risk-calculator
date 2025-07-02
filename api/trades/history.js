// Trade history API for Vercel
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
  
  const { page = 1, limit = 20, status = '', exchange = '' } = req.query;
  
  // Mock trade history data
  const mockTrades = [
    {
      id: 'trade_001',
      userId: 'admin-001',
      exchange: 'Binance',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      entryPrice: 42000.00,
      stopLoss: 41000.00,
      targetPrice: 44000.00,
      positionSize: 0.1,
      riskAmount: 100.00,
      status: 'CLOSED',
      pnl: 200.00,
      pnlPercent: 4.76,
      notes: 'Trade baseado em suporte técnico',
      createdAt: '2024-12-01T10:00:00Z',
      closedAt: '2024-12-01T14:30:00Z'
    },
    {
      id: 'trade_002',
      userId: 'admin-001',
      exchange: 'Bybit',
      symbol: 'ETHUSDT',
      direction: 'SHORT',
      entryPrice: 2800.00,
      stopLoss: 2850.00,
      targetPrice: 2700.00,
      positionSize: 1.5,
      riskAmount: 75.00,
      status: 'ACTIVE',
      pnl: -25.00,
      pnlPercent: -0.89,
      notes: 'Esperando rompimento de resistência',
      createdAt: '2024-12-02T08:15:00Z',
      closedAt: null
    },
    {
      id: 'trade_003',
      userId: 'admin-001',
      exchange: 'BingX',
      symbol: 'SOLUSDT',
      direction: 'LONG',
      entryPrice: 95.50,
      stopLoss: 92.00,
      targetPrice: 102.00,
      positionSize: 5.0,
      riskAmount: 175.00,
      status: 'CLOSED',
      pnl: 325.00,
      pnlPercent: 6.80,
      notes: 'Trade de momentum',
      createdAt: '2024-11-30T16:20:00Z',
      closedAt: '2024-12-01T09:45:00Z'
    },
    {
      id: 'trade_004',
      userId: 'admin-001',
      exchange: 'Bitget',
      symbol: 'ADAUSDT',
      direction: 'LONG',
      entryPrice: 0.42,
      stopLoss: 0.40,
      targetPrice: 0.48,
      positionSize: 1000,
      riskAmount: 20.00,
      status: 'STOPPED',
      pnl: -20.00,
      pnlPercent: -4.76,
      notes: 'Stop loss ativado',
      createdAt: '2024-11-29T12:00:00Z',
      closedAt: '2024-11-29T18:30:00Z'
    }
  ];
  
  // Filter trades
  let filteredTrades = mockTrades;
  
  if (status) {
    filteredTrades = mockTrades.filter(trade => trade.status === status.toUpperCase());
  }
  
  if (exchange) {
    filteredTrades = filteredTrades.filter(trade => 
      trade.exchange.toLowerCase() === exchange.toLowerCase()
    );
  }
  
  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);
  
  // Calculate stats
  const stats = {
    totalTrades: filteredTrades.length,
    activeTrades: filteredTrades.filter(t => t.status === 'ACTIVE').length,
    closedTrades: filteredTrades.filter(t => t.status === 'CLOSED').length,
    totalPnL: filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    winRate: filteredTrades.filter(t => t.status === 'CLOSED').length > 0 ? 
      (filteredTrades.filter(t => t.status === 'CLOSED' && t.pnl > 0).length / 
       filteredTrades.filter(t => t.status === 'CLOSED').length * 100) : 0
  };
  
  return res.status(200).json({
    success: true,
    data: paginatedTrades,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: filteredTrades.length,
      totalPages: Math.ceil(filteredTrades.length / limitNum),
      hasNextPage: endIndex < filteredTrades.length,
      hasPrevPage: pageNum > 1
    },
    stats
  });
}