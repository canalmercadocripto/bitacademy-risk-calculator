// Minimal test API for Vercel debugging
export default function handler(req, res) {
  res.json({ 
    message: 'API funcionando!',
    method: req.method,
    timestamp: Date.now()
  });
}