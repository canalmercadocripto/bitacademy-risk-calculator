// Multiple scenarios calculator API for Vercel
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
    const { baseParams, scenarios } = req.body;
    
    if (!baseParams || !scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        message: 'baseParams e scenarios (array) são obrigatórios'
      });
    }
    
    const results = scenarios.map((scenario, index) => {
      const params = { ...baseParams, ...scenario };
      
      // Mesma lógica de cálculo da API calculate
      const entry = parseFloat(params.entryPrice);
      const stop = params.stopLoss ? parseFloat(params.stopLoss) : null;
      const target = params.targetPrice ? parseFloat(params.targetPrice) : null;
      const account = parseFloat(params.accountSize);
      const risk = parseFloat(params.riskPercent);
      
      const riskAmount = (account * risk) / 100;
      let positionSize = 0;
      let rewardAmount = 0;
      let riskRewardRatio = 0;
      
      if (stop) {
        const stopDistance = Math.abs(entry - stop);
        if (stopDistance > 0) {
          positionSize = riskAmount / stopDistance;
          
          if (target) {
            const targetDistance = Math.abs(target - entry);
            rewardAmount = positionSize * targetDistance;
            riskRewardRatio = rewardAmount / riskAmount;
          }
        }
      }
      
      return {
        scenarioIndex: index,
        scenarioName: scenario.name || `Cenário ${index + 1}`,
        params,
        results: {
          riskAmount: parseFloat(riskAmount.toFixed(2)),
          positionSize: parseFloat(positionSize.toFixed(8)),
          rewardAmount: parseFloat(rewardAmount.toFixed(2)),
          riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
          winRate: scenario.expectedWinRate || 50,
          expectedReturn: parseFloat(((rewardAmount * (scenario.expectedWinRate || 50) / 100) - (riskAmount * (100 - (scenario.expectedWinRate || 50)) / 100)).toFixed(2))
        }
      };
    });
    
    // Análise comparativa
    const comparison = {
      bestRiskReward: results.reduce((best, current) => 
        current.results.riskRewardRatio > best.results.riskRewardRatio ? current : best
      ),
      lowestRisk: results.reduce((lowest, current) => 
        current.results.riskAmount < lowest.results.riskAmount ? current : lowest
      ),
      highestReward: results.reduce((highest, current) => 
        current.results.rewardAmount > highest.results.rewardAmount ? current : highest
      )
    };
    
    return res.status(200).json({
      success: true,
      data: {
        baseParams,
        scenarios: results,
        comparison,
        totalScenarios: results.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro nos cenários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}