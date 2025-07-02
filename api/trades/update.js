// Update trade API for Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const {
      tradeId,
      status,
      exitPrice,
      exitDate,
      pnl,
      notes
    } = req.body;
    
    if (!tradeId) {
      return res.status(400).json({
        success: false,
        message: 'tradeId é obrigatório'
      });
    }
    
    // Simular atualização do trade
    const updatedTrade = {
      id: tradeId,
      userId: 'admin-001',
      status: status || 'ACTIVE',
      exitPrice: exitPrice ? parseFloat(exitPrice) : null,
      exitDate: exitDate || null,
      pnl: pnl ? parseFloat(pnl) : null,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      data: updatedTrade,
      message: 'Trade atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar trade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}