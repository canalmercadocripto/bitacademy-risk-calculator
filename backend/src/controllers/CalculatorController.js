const CalculatorService = require('../services/CalculatorService');

class CalculatorController {
  async calculateRisk(req, res) {
    try {
      const {
        entryPrice,
        stopLoss,
        targetPrice,
        accountSize,
        riskPercent,
        direction
      } = req.body;

      // Converter strings para números se necessário
      const params = {
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        targetPrice: parseFloat(targetPrice),
        accountSize: parseFloat(accountSize),
        riskPercent: parseFloat(riskPercent),
        direction: direction
      };

      const result = CalculatorService.calculateRiskManagement(params);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Erro no cálculo de risco',
        message: error.message
      });
    }
  }

  async calculateMultipleScenarios(req, res) {
    try {
      const { baseParams, scenarios } = req.body;

      if (!Array.isArray(scenarios) || scenarios.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Lista de cenários é obrigatória'
        });
      }

      if (scenarios.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Máximo 5 cenários por requisição'
        });
      }

      // Converter baseParams para números
      const processedBaseParams = {
        entryPrice: parseFloat(baseParams.entryPrice),
        stopLoss: parseFloat(baseParams.stopLoss),
        targetPrice: parseFloat(baseParams.targetPrice),
        accountSize: parseFloat(baseParams.accountSize),
        riskPercent: parseFloat(baseParams.riskPercent),
        direction: baseParams.direction
      };

      const results = CalculatorService.calculateMultipleScenarios(
        processedBaseParams, 
        scenarios
      );

      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Erro no cálculo de múltiplos cenários',
        message: error.message
      });
    }
  }

  async validateTrade(req, res) {
    try {
      const params = {
        entryPrice: parseFloat(req.body.entryPrice),
        stopLoss: parseFloat(req.body.stopLoss),
        targetPrice: parseFloat(req.body.targetPrice),
        accountSize: parseFloat(req.body.accountSize),
        riskPercent: parseFloat(req.body.riskPercent),
        direction: req.body.direction
      };

      // Apenas validar sem calcular
      CalculatorService.validateInputs(params);

      res.json({
        success: true,
        message: 'Trade válido',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Trade inválido',
        message: error.message
      });
    }
  }

  async getCalculatorInfo(req, res) {
    try {
      res.json({
        success: true,
        data: {
          version: '1.0.0',
          features: [
            'Cálculo de position sizing',
            'Risk/Reward ratio',
            'Validação de trades',
            'Múltiplos cenários',
            'Suporte para Long/Short'
          ],
          limits: {
            maxRiskPercent: 100,
            minRiskReward: 1.0,
            maxScenariosPerRequest: 5
          },
          supportedDirections: ['LONG', 'SHORT']
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar informações da calculadora'
      });
    }
  }
}

module.exports = new CalculatorController();