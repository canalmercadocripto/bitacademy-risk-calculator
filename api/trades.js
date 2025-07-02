// Consolidated trades API for Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  // Mock trade data
  const mockTrades = [
    {
      id: 'trade_001', userId: 'admin-001', exchange: 'Binance', symbol: 'BTCUSDT',
      direction: 'LONG', entryPrice: 42000.00, stopLoss: 41000.00, targetPrice: 44000.00,
      positionSize: 0.1, riskAmount: 100.00, status: 'CLOSED', pnl: 200.00, pnlPercent: 4.76,
      notes: 'Trade baseado em suporte técnico', createdAt: '2024-12-01T10:00:00Z',
      closedAt: '2024-12-01T14:30:00Z'
    },
    {
      id: 'trade_002', userId: 'admin-001', exchange: 'Bybit', symbol: 'ETHUSDT',
      direction: 'SHORT', entryPrice: 2800.00, stopLoss: 2850.00, targetPrice: 2700.00,
      positionSize: 1.5, riskAmount: 75.00, status: 'ACTIVE', pnl: -25.00, pnlPercent: -0.89,
      notes: 'Esperando rompimento', createdAt: '2024-12-02T08:15:00Z', closedAt: null
    }
  ];
  
  // Save trade
  if (req.method === 'POST' && action === 'save') {
    try {
      const { exchange, symbol, direction, entryPrice, stopLoss, targetPrice, positionSize, riskAmount, notes } = req.body;
      
      if (!exchange || !symbol || !direction || !entryPrice || !positionSize) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: exchange, symbol, direction, entryPrice, positionSize'
        });
      }
      
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'admin-001', exchange, symbol: symbol.toUpperCase(), direction: direction.toUpperCase(),
        entryPrice: parseFloat(entryPrice), stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null, positionSize: parseFloat(positionSize),
        riskAmount: parseFloat(riskAmount), notes: notes || '', status: 'ACTIVE',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true, data: trade, message: 'Trade salvo com sucesso'
      });
    } catch (error) {
      return res.status(500).json({
        success: false, message: 'Erro interno do servidor', error: error.message
      });
    }
  }
  
  // Update trade
  if (req.method === 'PUT' && action === 'update') {
    try {
      const { tradeId, status, exitPrice, exitDate, pnl, notes } = req.body;
      
      if (!tradeId) {
        return res.status(400).json({
          success: false, message: 'tradeId é obrigatório'
        });
      }
      
      const updatedTrade = {
        id: tradeId, userId: 'admin-001', status: status || 'ACTIVE',
        exitPrice: exitPrice ? parseFloat(exitPrice) : null, exitDate: exitDate || null,
        pnl: pnl ? parseFloat(pnl) : null, notes: notes || '',
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true, data: updatedTrade, message: 'Trade atualizado com sucesso'
      });
    } catch (error) {
      return res.status(500).json({
        success: false, message: 'Erro interno do servidor', error: error.message
      });
    }
  }
  
  // Get history
  if (req.method === 'GET' && action === 'history') {
    const { page = 1, limit = 20, status = '', exchange = '' } = req.query;
    
    let filteredTrades = mockTrades;
    if (status) filteredTrades = mockTrades.filter(trade => trade.status === status.toUpperCase());
    if (exchange) filteredTrades = filteredTrades.filter(trade => trade.exchange.toLowerCase() === exchange.toLowerCase());
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTrades = filteredTrades.slice(startIndex, startIndex + limitNum);
    
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
      success: true, data: paginatedTrades,
      meta: {
        page: pageNum, limit: limitNum, total: filteredTrades.length,
        totalPages: Math.ceil(filteredTrades.length / limitNum),
        hasNextPage: startIndex + limitNum < filteredTrades.length,
        hasPrevPage: pageNum > 1
      },
      stats
    });
  }
  
  // Export trades
  if (req.method === 'GET' && action === 'export') {
    const { format = 'json' } = req.query;
    
    const exportData = mockTrades.map(trade => ({
      id: trade.id, date: trade.createdAt.split('T')[0], exchange: trade.exchange,
      symbol: trade.symbol, direction: trade.direction, entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || null, positionSize: trade.positionSize,
      pnl: trade.pnl || 0, pnlPercent: trade.pnlPercent || 0, status: trade.status
    }));
    
    if (format.toLowerCase() === 'csv') {
      const csvHeaders = 'ID,Date,Exchange,Symbol,Direction,Entry Price,Exit Price,Position Size,PnL,PnL %,Status\n';
      const csvRows = exportData.map(trade => 
        `${trade.id},${trade.date},${trade.exchange},${trade.symbol},${trade.direction},${trade.entryPrice},${trade.exitPrice || ''},${trade.positionSize},${trade.pnl},${trade.pnlPercent},${trade.status}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trades_export.csv"');
      return res.status(200).send(csvHeaders + csvRows);
    }
    
    return res.status(200).json({
      success: true, data: exportData,
      meta: { format, exportDate: new Date().toISOString(), totalRecords: exportData.length }
    });
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}