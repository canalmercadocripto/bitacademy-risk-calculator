const TradeHistory = require('../models/TradeHistory');
const { v4: uuidv4 } = require('uuid');

class TradeController {
  
  // Salvar novo cálculo de trade (sempre salva, mesmo para usuários anônimos)
  static async saveCalculation(req, res) {
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
        positionSize,
        riskAmount,
        rewardAmount,
        riskRewardRatio,
        currentPrice,
        calculationData
      } = req.body;
      
      // Validações básicas
      if (!exchange || !symbol || !direction || !entryPrice || !accountSize || !riskPercent) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: exchange, symbol, direction, entryPrice, accountSize, riskPercent'
        });
      }
      
      // Dados do trade para salvar
      const tradeData = {
        userId: req.user ? req.user.userId : null, // null para usuários anônimos
        sessionId: req.sessionId || uuidv4(), // ID da sessão para usuários anônimos
        exchange,
        symbol,
        direction,
        entryPrice: parseFloat(entryPrice),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        accountSize: parseFloat(accountSize),
        riskPercent: parseFloat(riskPercent),
        positionSize: positionSize ? parseFloat(positionSize) : null,
        riskAmount: riskAmount ? parseFloat(riskAmount) : null,
        rewardAmount: rewardAmount ? parseFloat(rewardAmount) : null,
        riskRewardRatio: riskRewardRatio ? parseFloat(riskRewardRatio) : null,
        currentPrice: currentPrice ? parseFloat(currentPrice) : null,
        calculationData: calculationData || {},
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };
      
      // Salvar no histórico
      const savedTrade = await TradeHistory.create(tradeData);
      
      // Verificar se o trade foi salvo corretamente
      if (!savedTrade || !savedTrade.id) {
        console.error('Erro: Trade não retornou dados válidos', savedTrade);
        throw new Error('Falha ao salvar trade - dados inválidos retornados');
      }
      
      // Log para admin (se usuário logado)
      if (req.user) {
        try {
          await TradeController.logActivity(req.user.userId, 'trade_calculated', {
            exchange,
            symbol,
            direction,
            riskPercent,
            tradeId: savedTrade.id
          }, req);
        } catch (logError) {
          console.error('Erro ao logar atividade:', logError);
          // Não falhar por erro de log
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Cálculo salvo com sucesso',
        data: {
          tradeId: savedTrade.id,
          createdAt: savedTrade.created_at
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar cálculo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Buscar histórico do usuário logado
  static async getUserHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const result = await TradeHistory.getByUser(
        req.user.userId,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Estatísticas do usuário
  static async getUserStats(req, res) {
    try {
      const [basicStats, exchangeStats, monthlyStats] = await Promise.all([
        TradeHistory.getUserStats(req.user.userId),
        TradeHistory.getUserExchangeStats(req.user.userId),
        TradeHistory.getUserMonthlyStats(req.user.userId)
      ]);
      
      res.json({
        success: true,
        data: {
          ...basicStats,
          exchanges: exchangeStats,
          monthly: monthlyStats
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Buscar histórico específico de uma sessão anônima
  static async getSessionHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID é obrigatório'
        });
      }
      
      // Usar SQLite por padrão em desenvolvimento
      const dbConfig = process.env.NODE_ENV === 'production' 
        ? '../config/database' 
        : '../config/database-sqlite';
      
      const { query } = require(dbConfig);
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const result = await query(`
        SELECT 
          id, exchange, symbol, direction, entry_price, stop_loss, target_price,
          account_size, risk_percent, position_size, risk_amount, reward_amount,
          risk_reward_ratio, current_price, created_at
        FROM trade_history 
        WHERE session_id = $1 AND user_id IS NULL
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [sessionId, parseInt(limit), offset]);
      
      const countResult = await query(`
        SELECT COUNT(*) as total 
        FROM trade_history 
        WHERE session_id = $1 AND user_id IS NULL
      `, [sessionId]);
      
      res.json({
        success: true,
        data: {
          trades: result.rows,
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          totalPages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar histórico da sessão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Função auxiliar para log de atividades
  static async logActivity(userId, action, details, req) {
    try {
      // Usar SQLite por padrão em desenvolvimento
      const dbConfig = process.env.NODE_ENV === 'production' 
        ? '../config/database' 
        : '../config/database-sqlite';
      
      const { query } = require(dbConfig);
      
      await query(`
        INSERT INTO user_activities (user_id, action, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        action,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]);
      
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  }
}

module.exports = TradeController;