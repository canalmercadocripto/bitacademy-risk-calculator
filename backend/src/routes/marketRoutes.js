const express = require('express');
const router = express.Router();

// Import API handlers
const coinGeckoProfessional = require('./coingecko-professional');
const sosoValueAdvanced = require('./sosovalue-advanced');

// CoinGecko Professional endpoint
router.get('/coingecko-professional', async (req, res) => {
  try {
    await coinGeckoProfessional(req, res);
  } catch (error) {
    console.error('CoinGecko Professional API error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no serviço CoinGecko Professional',
      error: error.message
    });
  }
});

// SoSoValue Advanced endpoint
router.get('/sosovalue-advanced', async (req, res) => {
  try {
    await sosoValueAdvanced(req, res);
  } catch (error) {
    console.error('SoSoValue Advanced API error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no serviço SoSoValue Advanced',
      error: error.message
    });
  }
});

// Health check for market services
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Market Analytics API funcionando',
    timestamp: new Date().toISOString(),
    services: {
      coingecko: 'Available',
      sosovalue: 'Available'
    }
  });
});

module.exports = router;