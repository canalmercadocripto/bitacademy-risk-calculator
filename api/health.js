// API Route for Vercel - Health Check
module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'BitAcademy Calculator API funcionando',
    timestamp: new Date().toISOString(),
    vercel: true
  });
}