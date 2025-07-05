// Simple proxy server to handle Binance API requests
// This bypasses CORS restrictions for development/staging

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Binance API credentials (from environment or hardcoded for testing)
const API_KEY = process.env.BINANCE_API_KEY || '0k8fuw36SR2kyke48kOu8cxx7Z03TfUxpByECagAEz434XoKK3ZtKQ7MTlJrvFL0';
const SECRET_KEY = process.env.BINANCE_SECRET_KEY || 'v0c4dXjcqSCKOzyGcArx1i4rTMNgRNUWVOA1G9iDbBXuStmoFEADdB2XNpZqiKvy';
const BINANCE_BASE_URL = 'https://api.binance.com';

// Generate signature for Binance API
function generateSignature(queryString) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

// Proxy endpoint for Binance API requests
app.use('/api/binance', (req, res, next) => {
  const endpoint = req.path;
  
  (async () => {
    try {
      const timestamp = Date.now();
      
      // Prepare query parameters
      const queryParams = {
        ...req.query,
        timestamp
      };
      
      // Create query string and signature
      const queryString = new URLSearchParams(queryParams).toString();
      const signature = generateSignature(queryString);
      const finalQueryString = `${queryString}&signature=${signature}`;
      
      // Make request to Binance API
      const binanceUrl = `${BINANCE_BASE_URL}${endpoint}?${finalQueryString}`;
      console.log(`🔗 Proxying request to: ${binanceUrl}`);
      
      const response = await fetch(binanceUrl, {
        headers: {
          'X-MBX-APIKEY': API_KEY
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({
          error: data.msg || 'Binance API Error',
          code: data.code
        });
      }
      
      res.json(data);
      
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({
        error: 'Proxy server error',
        message: error.message
      });
    }
  })();
});

// Test endpoint for server connectivity
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Binance API Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Binance API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/api/binance/*`);
});

module.exports = app;