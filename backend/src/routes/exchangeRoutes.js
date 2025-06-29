const express = require('express');
const ExchangeController = require('../controllers/ExchangeController');

const router = express.Router();

// GET /api/exchanges - Listar exchanges disponíveis
router.get('/', ExchangeController.getExchanges);

// GET /api/exchanges/:exchange/symbols - Listar símbolos de uma exchange
router.get('/:exchange/symbols', ExchangeController.getSymbols);

// GET /api/exchanges/:exchange/price/:symbol - Buscar preço atual de um símbolo
router.get('/:exchange/price/:symbol', ExchangeController.getCurrentPrice);

// POST /api/exchanges/:exchange/prices - Buscar múltiplos preços
router.post('/:exchange/prices', ExchangeController.getMultiplePrices);

module.exports = router;