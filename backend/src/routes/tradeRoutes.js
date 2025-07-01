const express = require('express');
const TradeController = require('../controllers/TradeController');
const { optionalAuth, authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// Rota para salvar cálculo (funciona com ou sem autenticação)
router.post('/calculate', optionalAuth, TradeController.saveCalculation);

// Rotas protegidas para usuários logados
router.get('/history', authenticateToken, requireUser, TradeController.getUserHistory);
router.get('/stats', authenticateToken, requireUser, TradeController.getUserStats);

// Rota para buscar histórico de sessão anônima
router.get('/session/:sessionId', TradeController.getSessionHistory);

module.exports = router;