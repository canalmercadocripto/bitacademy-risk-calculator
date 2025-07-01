// API Route for Vercel - Health Check
export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return health status
  return res.status(200).json({ 
    status: 'OK', 
    message: 'BitAcademy Calculator API funcionando no Vercel',
    timestamp: new Date().toISOString(),
    method: req.method,
    vercel: true
  });
}