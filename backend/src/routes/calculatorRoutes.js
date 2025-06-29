const express = require('express');
const CalculatorController = require('../controllers/CalculatorController');

const router = express.Router();

// POST /api/calculator/calculate - Calcular risk management
router.post('/calculate', CalculatorController.calculateRisk);

// POST /api/calculator/scenarios - Calcular múltiplos cenários
router.post('/scenarios', CalculatorController.calculateMultipleScenarios);

// POST /api/calculator/validate - Validar trade
router.post('/validate', CalculatorController.validateTrade);

// GET /api/calculator/info - Informações da calculadora
router.get('/info', CalculatorController.getCalculatorInfo);

module.exports = router;