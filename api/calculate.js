// API Route for Vercel - Risk Calculator
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
      accountSize,
      riskPercent
    } = req.body;
    
    // Validações
    if (!exchange || !symbol || !direction || !entryPrice || !accountSize || !riskPercent) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    // Cálculos
    const riskAmount = (accountSize * riskPercent) / 100;
    
    let positionSize = 0;
    let rewardAmount = 0;
    let riskRewardRatio = 0;
    
    if (stopLoss) {
      const stopDistance = Math.abs(entryPrice - stopLoss);
      positionSize = riskAmount / stopDistance;
      
      if (targetPrice) {
        const targetDistance = Math.abs(targetPrice - entryPrice);
        rewardAmount = positionSize * targetDistance;
        riskRewardRatio = rewardAmount / riskAmount;
      }
    }
    
    const result = {
      exchange,
      symbol,
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      accountSize: parseFloat(accountSize),
      riskPercent: parseFloat(riskPercent),
      positionSize: parseFloat(positionSize.toFixed(8)),
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      rewardAmount: parseFloat(rewardAmount.toFixed(2)),
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      calculation: result
    });
    
  } catch (error) {
    console.error('Erro no cálculo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}