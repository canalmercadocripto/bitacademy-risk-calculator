// Servidor proxy simples para API Binance
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const url = require('url');

const API_KEY = process.env.BINANCE_API_KEY || '0k8fuw36SR2kyke48kOu8cxx7Z03TfUxpByECagAEz434XoKK3ZtKQ7MTlJrvFL0';
const SECRET_KEY = process.env.BINANCE_SECRET_KEY || 'v0c4dXjcqSCKOzyGcArx1i4rTMNgRNUWVOA1G9iDbBXuStmoFEADdB2XNpZqiKvy';
const BINANCE_BASE = 'api.binance.com';

function generateSignature(queryString) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Proxy rodando',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const endpoint = parsedUrl.pathname;
  
  if (!endpoint.startsWith('/api/v3/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    return;
  }
  
  // Preparar parâmetros
  const timestamp = Date.now();
  const queryParams = {
    ...parsedUrl.query,
    timestamp
  };
  
  // Criar query string e assinatura
  const queryString = Object.keys(queryParams)
    .map(key => `${key}=${queryParams[key]}`)
    .join('&');
  
  const signature = generateSignature(queryString);
  const finalQuery = `${queryString}&signature=${signature}`;
  
  // Fazer requisição para Binance
  const options = {
    hostname: BINANCE_BASE,
    path: `${endpoint}?${finalQuery}`,
    method: req.method,
    headers: {
      'X-MBX-APIKEY': API_KEY,
      'Content-Type': 'application/json'
    }
  };
  
  console.log(`📡 Proxy: ${options.method} https://${options.hostname}${options.path}`);
  
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    
    proxyRes.on('data', chunk => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Erro no proxy:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erro do proxy', message: err.message }));
  });
  
  proxyReq.end();
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Proxy Binance rodando em http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Use: http://localhost:${PORT}/api/v3/account`);
});

module.exports = server;