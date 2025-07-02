// Risk calculator API for Vercel
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
      riskPercent,
      currentPrice
    } = req.body;
    
    // Validações
    if (!exchange || !symbol || !direction || !entryPrice || !accountSize || !riskPercent) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: exchange, symbol, direction, entryPrice, accountSize, riskPercent'
      });
    }
    
    // Converter para números
    const entry = parseFloat(entryPrice);
    const stop = stopLoss ? parseFloat(stopLoss) : null;
    const target = targetPrice ? parseFloat(targetPrice) : null;
    const account = parseFloat(accountSize);
    const risk = parseFloat(riskPercent);
    const current = currentPrice ? parseFloat(currentPrice) : entry;
    
    // Cálculos de risk management
    const riskAmount = (account * risk) / 100;
    
    let positionSize = 0;
    let rewardAmount = 0;
    let riskRewardRatio = 0;
    let stopDistance = 0;
    let targetDistance = 0;
    
    if (stop) {
      stopDistance = Math.abs(entry - stop);
      if (stopDistance > 0) {
        positionSize = riskAmount / stopDistance;
        
        if (target) {
          targetDistance = Math.abs(target - entry);
          rewardAmount = positionSize * targetDistance;
          riskRewardRatio = rewardAmount / riskAmount;
        }
      }
    }
    
    // Cálculos adicionais
    const positionValue = positionSize * entry;
    const marginRequired = positionValue; // Para spot trading
    const feeEstimate = positionValue * 0.001; // 0.1% fee estimate
    
    // PnL atual se tiver preço atual
    let currentPnL = 0;
    let currentPnLPercent = 0;
    if (current && current !== entry) {
      const priceDiff = direction.toUpperCase() === 'LONG' ? 
        (current - entry) : (entry - current);
      currentPnL = positionSize * priceDiff;
      currentPnLPercent = (currentPnL / riskAmount) * 100;
    }
    
    const result = {
      success: true,
      data: {
        // Dados de entrada
        exchange,
        symbol: symbol.toUpperCase(),
        direction: direction.toUpperCase(),
        entryPrice: entry,
        stopLoss: stop,
        targetPrice: target,
        currentPrice: current,
        accountSize: account,
        riskPercent: risk,
        
        // Cálculos principais
        riskAmount: parseFloat(riskAmount.toFixed(2)),
        positionSize: parseFloat(positionSize.toFixed(8)),
        positionValue: parseFloat(positionValue.toFixed(2)),
        rewardAmount: parseFloat(rewardAmount.toFixed(2)),
        riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
        
        // Distâncias
        stopDistance: parseFloat(stopDistance.toFixed(8)),
        targetDistance: parseFloat(targetDistance.toFixed(8)),
        
        // Custos e margin
        marginRequired: parseFloat(marginRequired.toFixed(2)),
        feeEstimate: parseFloat(feeEstimate.toFixed(2)),
        
        // PnL atual
        currentPnL: parseFloat(currentPnL.toFixed(2)),
        currentPnLPercent: parseFloat(currentPnLPercent.toFixed(2)),
        
        // Metadados
        timestamp: new Date().toISOString(),
        calculationId: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Erro no cálculo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}