// Save trade API for Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const {
      exchange,
      symbol,
      direction,
      entryPrice,
      stopLoss,
      targetPrice,
      positionSize,
      riskAmount,
      notes
    } = req.body;
    
    // Validações básicas
    if (!exchange || !symbol || !direction || !entryPrice || !positionSize) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: exchange, symbol, direction, entryPrice, positionSize'
      });
    }
    
    // Simular salvamento do trade
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'admin-001',
      exchange,
      symbol: symbol.toUpperCase(),
      direction: direction.toUpperCase(),
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      positionSize: parseFloat(positionSize),
      riskAmount: parseFloat(riskAmount),
      notes: notes || '',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      data: trade,
      message: 'Trade salvo com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao salvar trade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}