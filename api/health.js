// Ultra-simple health check without any external dependencies
module.exports = function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Simple health response
  return res.status(200).json({
    status: 'OK',
    message: 'BitAcademy Calculator API funcionando',
    timestamp: new Date().toISOString(),
    vercel: true,
    method: req.method
  });
}