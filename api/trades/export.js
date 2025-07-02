// Export trades API for Vercel
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
  
  const { format = 'json', dateFrom, dateTo } = req.query;
  
  // Mock export data
  const exportData = [
    {
      id: 'trade_001',
      date: '2024-12-01',
      exchange: 'Binance',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      entryPrice: 42000.00,
      exitPrice: 44000.00,
      positionSize: 0.1,
      pnl: 200.00,
      pnlPercent: 4.76,
      status: 'CLOSED'
    },
    {
      id: 'trade_002',
      date: '2024-12-02',
      exchange: 'Bybit',
      symbol: 'ETHUSDT',
      direction: 'SHORT',
      entryPrice: 2800.00,
      exitPrice: null,
      positionSize: 1.5,
      pnl: -25.00,
      pnlPercent: -0.89,
      status: 'ACTIVE'
    }
  ];
  
  if (format.toLowerCase() === 'csv') {
    // Generate CSV format
    const csvHeaders = 'ID,Date,Exchange,Symbol,Direction,Entry Price,Exit Price,Position Size,PnL,PnL %,Status\n';
    const csvRows = exportData.map(trade => 
      `${trade.id},${trade.date},${trade.exchange},${trade.symbol},${trade.direction},${trade.entryPrice},${trade.exitPrice || ''},${trade.positionSize},${trade.pnl},${trade.pnlPercent},${trade.status}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="trades_export.csv"');
    return res.status(200).send(csvHeaders + csvRows);
  }
  
  // Default JSON format
  return res.status(200).json({
    success: true,
    data: exportData,
    meta: {
      format,
      exportDate: new Date().toISOString(),
      totalRecords: exportData.length,
      dateFrom,
      dateTo
    }
  });
}