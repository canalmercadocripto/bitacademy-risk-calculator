// Ultra-simple health check for Vercel
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple response
  res.status(200).json({
    status: 'OK',
    message: 'API funcionando',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
}