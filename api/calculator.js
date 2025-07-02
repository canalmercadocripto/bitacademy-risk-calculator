// Consolidated calculator API for Vercel
module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  console.log('📊 Calculator API:', { method: req.method, action, url: req.url });
  console.log('🔍 Testando condições:', { 
    isPost: req.method === 'POST', 
    noAction: !action, 
    isCalculate: action === 'calculate',
    condition1: req.method === 'POST' && (!action || action === 'calculate'),
    condition2: req.method === 'POST' && action === 'scenarios'
  });
  
  // Calculator info endpoint
  if (req.method === 'GET' && !action) {
    return res.status(200).json({
      success: true,
      data: {
        name: 'BitAcademy Risk Calculator',
        version: '1.0.0',
        description: 'Calculadora profissional de gerenciamento de risco para trading',
        features: [
          'Cálculo de position sizing',
          'Risk/Reward ratio',
          'Stop loss e take profit',
          'Múltiplas exchanges',
          'Histórico de trades',
          'Análise de performance'
        ],
        supportedExchanges: ['Binance', 'Bybit', 'BingX', 'Bitget'],
        riskLevels: {
          conservative: { min: 0.5, max: 1.5, description: 'Conservador' },
          moderate: { min: 1.5, max: 3.0, description: 'Moderado' },
          aggressive: { min: 3.0, max: 5.0, description: 'Agressivo' },
          extreme: { min: 5.0, max: 10.0, description: 'Extremo' }
        },
        lastUpdated: new Date().toISOString()
      }
    });
  }
  
  // Calculate endpoint - aceitar POST sem action ou com action=calculate
  if (req.method === 'POST' && (!action || action === 'calculate')) {
    console.log('✅ Entrando no endpoint de cálculo');
    try {
      const {
        exchange, symbol, direction, entryPrice, stopLoss, targetPrice,
        accountSize, riskPercent, currentPrice
      } = req.body;
      
      console.log('📋 Dados recebidos:', { exchange, symbol, direction, entryPrice, accountSize, riskPercent });
      
      // Validar apenas campos essenciais para o cálculo
      if (!direction || !entryPrice || !accountSize || !riskPercent) {
        console.log('❌ Campos obrigatórios faltando');
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: direction, entryPrice, accountSize, riskPercent'
        });
      }
      
      console.log('✅ Validação passou, processando cálculo...');
      
      const entry = parseFloat(entryPrice);
      const stop = stopLoss ? parseFloat(stopLoss) : null;
      const target = targetPrice ? parseFloat(targetPrice) : null;
      const account = parseFloat(accountSize);
      const risk = parseFloat(riskPercent);
      const current = currentPrice ? parseFloat(currentPrice) : entry;
      
      console.log('🔢 Valores parseados:', { entry, stop, target, account, risk, current });
      
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
      
      const positionValue = positionSize * entry;
      const feeEstimate = positionValue * 0.001;
      
      let currentPnL = 0;
      let currentPnLPercent = 0;
      if (current && current !== entry) {
        const priceDiff = direction.toUpperCase() === 'LONG' ? 
          (current - entry) : (entry - current);
        currentPnL = positionSize * priceDiff;
        currentPnLPercent = (currentPnL / riskAmount) * 100;
      }
      
      console.log('💰 Cálculo concluído, retornando resultado...');
      
      return res.status(200).json({
        success: true,
        data: {
          exchange, symbol: symbol.toUpperCase(), direction: direction.toUpperCase(),
          entryPrice: entry, stopLoss: stop, targetPrice: target, currentPrice: current,
          accountSize: account, riskPercent: risk,
          riskAmount: parseFloat(riskAmount.toFixed(2)),
          positionSize: parseFloat(positionSize.toFixed(8)),
          positionValue: parseFloat(positionValue.toFixed(2)),
          rewardAmount: parseFloat(rewardAmount.toFixed(2)),
          riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
          stopDistance: parseFloat(stopDistance.toFixed(8)),
          targetDistance: parseFloat(targetDistance.toFixed(8)),
          feeEstimate: parseFloat(feeEstimate.toFixed(2)),
          currentPnL: parseFloat(currentPnL.toFixed(2)),
          currentPnLPercent: parseFloat(currentPnLPercent.toFixed(2)),
          timestamp: new Date().toISOString(),
          calculationId: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });
    } catch (error) {
      console.error('❌ Erro no cálculo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  // Scenarios endpoint
  if (req.method === 'POST' && action === 'scenarios') {
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
            expectedReturn: parseFloat(((rewardAmount * (scenario.expectedWinRate || 50) / 100) - 
              (riskAmount * (100 - (scenario.expectedWinRate || 50)) / 100)).toFixed(2))
          }
        };
      });
      
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
          baseParams, scenarios: results, comparison,
          totalScenarios: results.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}