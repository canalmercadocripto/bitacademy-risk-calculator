// Vercel API Route para proxy da API Binance
// Resolve problemas de CORS executando no servidor

import crypto from 'crypto';

const BINANCE_API_BASE = 'https://api.binance.com';

// Generate HMAC SHA256 signature
function generateSignature(queryString, secretKey) {
  return crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Secret-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, ...params } = req.query;
    const apiKey = req.headers['x-api-key'] || process.env.REACT_APP_BINANCE_API_KEY;
    const secretKey = req.headers['x-secret-key'] || process.env.REACT_APP_BINANCE_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return res.status(400).json({
        error: 'API Key e Secret Key são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (!endpoint) {
      return res.status(400).json({
        error: 'Endpoint é obrigatório',
        code: 'MISSING_ENDPOINT'
      });
    }

    // Prepare parameters with timestamp
    const timestamp = Date.now();
    const queryParams = {
      ...params,
      timestamp
    };

    // Create query string and signature
    const queryString = new URLSearchParams(queryParams).toString();
    const signature = generateSignature(queryString, secretKey);
    const finalQueryString = `${queryString}&signature=${signature}`;

    // Make request to Binance API
    const binanceUrl = `${BINANCE_API_BASE}${endpoint}?${finalQueryString}`;
    
    console.log(`🔗 Proxying to Binance: ${endpoint}`);

    const response = await fetch(binanceUrl, {
      method: req.method,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Binance API Error:', data);
      return res.status(response.status).json({
        error: data.msg || 'Binance API Error',
        code: data.code || 'BINANCE_ERROR',
        details: data
      });
    }

    console.log(`✅ Success: ${endpoint}`);
    res.json(data);

  } catch (error) {
    console.error('Vercel API Route Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
}