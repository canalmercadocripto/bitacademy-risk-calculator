class CalculatorService {
  constructor() {
    this.minRiskReward = 1.0;
    this.maxRiskPercent = 100;
  }

  calculateRiskManagement(params) {
    const {
      entryPrice,
      stopLoss,
      targetPrice,
      accountSize,
      riskPercent,
      direction
    } = params;

    // Validações
    this.validateInputs(params);

    const riskAmount = (riskPercent / 100) * accountSize;
    const riskDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / riskDistance;
    const positionValue = positionSize * entryPrice;
    
    // Calcular lucro baseado na direção
    let profit;
    if (direction.toLowerCase() === 'long') {
      profit = (targetPrice - entryPrice) * positionSize;
    } else {
      profit = (entryPrice - targetPrice) * positionSize;
    }
    
    const riskRewardRatio = Math.abs(profit / riskAmount);
    const profitPercentage = (profit / accountSize) * 100;
    const lossPercentage = (riskAmount / accountSize) * 100;

    // Gerar take profits múltiplos
    const takeProfits = this.generateTakeProfits(entryPrice, targetPrice, direction, positionSize);

    return {
      position: {
        size: positionSize,
        value: positionValue,
        direction: direction.toUpperCase()
      },
      risk: {
        amount: riskAmount,
        percentage: lossPercentage
      },
      profit: {
        amount: profit,
        percentage: profitPercentage
      },
      analysis: {
        riskRewardRatio,
        riskLevel: this.getRiskLevel(riskRewardRatio),
        recommendation: this.getRecommendation(riskRewardRatio, riskPercent)
      },
      takeProfits: takeProfits,
      details: {
        riskDistance: riskDistance,
        targetDistance: Math.abs(targetPrice - entryPrice),
        positionPercent: (positionValue / accountSize) * 100
      }
    };
  }

  validateInputs(params) {
    const {
      entryPrice,
      stopLoss,
      targetPrice,
      accountSize,
      riskPercent,
      direction
    } = params;

    // Validar se todos os valores são números positivos
    const numericFields = { entryPrice, stopLoss, targetPrice, accountSize, riskPercent };
    
    for (const [field, value] of Object.entries(numericFields)) {
      if (typeof value !== 'number' || value <= 0 || isNaN(value)) {
        throw new Error(`${field} deve ser um número positivo válido`);
      }
    }

    // Validar direção
    if (!['long', 'short'].includes(direction.toLowerCase())) {
      throw new Error('Direção deve ser LONG ou SHORT');
    }

    // Validar lógica do stop loss
    if (direction.toLowerCase() === 'long' && stopLoss >= entryPrice) {
      throw new Error('Para LONG: Stop Loss deve ser menor que o preço de entrada');
    }

    if (direction.toLowerCase() === 'short' && stopLoss <= entryPrice) {
      throw new Error('Para SHORT: Stop Loss deve ser maior que o preço de entrada');
    }

    // Validar target price
    if (direction.toLowerCase() === 'long' && targetPrice <= entryPrice) {
      throw new Error('Para LONG: Target deve ser maior que o preço de entrada');
    }

    if (direction.toLowerCase() === 'short' && targetPrice >= entryPrice) {
      throw new Error('Para SHORT: Target deve ser menor que o preço de entrada');
    }

    // Validar percentual de risco
    if (riskPercent > this.maxRiskPercent) {
      throw new Error(`Risco máximo permitido: ${this.maxRiskPercent}%`);
    }
  }

  getRiskLevel(riskRewardRatio) {
    if (riskRewardRatio >= 3) return 'EXCELENTE';
    if (riskRewardRatio >= 2) return 'BOM';
    if (riskRewardRatio >= 1.5) return 'ACEITÁVEL';
    return 'RUIM';
  }

  getRecommendation(riskRewardRatio, riskPercent) {
    const recommendations = [];

    if (riskRewardRatio < 1.5) {
      recommendations.push('⚠️ Risk/Reward muito baixo - Reconsiderar operação');
    } else if (riskRewardRatio >= 2) {
      recommendations.push('✅ Excelente Risk/Reward - Operação recomendada');
    }

    if (riskPercent > 5) {
      recommendations.push('⚠️ Risco por trade muito alto (>5%)');
    } else if (riskPercent <= 2) {
      recommendations.push('✅ Risco conservador - Boa gestão');
    }

    return recommendations.length > 0 ? recommendations : ['📊 Operação dentro dos parâmetros'];
  }

  // Método para calcular múltiplas posições ou cenários
  calculateMultipleScenarios(baseParams, scenarios) {
    return scenarios.map(scenario => {
      const params = { ...baseParams, ...scenario };
      return {
        scenario: scenario.name || 'Cenário',
        calculation: this.calculateRiskManagement(params)
      };
    });
  }

  // Gerar take profits múltiplos
  generateTakeProfits(entryPrice, targetPrice, direction, positionSize) {
    const takeProfits = [];
    const isLong = direction.toLowerCase() === 'long';
    
    // Percentuais padrão para take profits parciais
    const tpPercentages = [25, 50, 75, 100];
    
    for (let i = 0; i < tpPercentages.length; i++) {
      const percentage = tpPercentages[i];
      let tpPrice;
      
      if (isLong) {
        // Para LONG: interpolação entre entry e target
        tpPrice = entryPrice + ((targetPrice - entryPrice) * (percentage / 100));
      } else {
        // Para SHORT: interpolação entre entry e target
        tpPrice = entryPrice - ((entryPrice - targetPrice) * (percentage / 100));
      }
      
      // Calcular lucro para este TP
      let tpProfit;
      if (isLong) {
        tpProfit = (tpPrice - entryPrice) * positionSize;
      } else {
        tpProfit = (entryPrice - tpPrice) * positionSize;
      }
      
      takeProfits.push({
        level: i + 1,
        percentage: percentage,
        price: parseFloat(tpPrice.toFixed(8)),
        profit: parseFloat(tpProfit.toFixed(2)),
        description: `TP${i + 1} - ${percentage}% do alvo`
      });
    }
    
    return takeProfits;
  }
}

module.exports = new CalculatorService();