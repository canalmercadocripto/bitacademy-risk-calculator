// API Route for Vercel - Health Check
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    message: 'BitAcademy Calculator API funcionando',
    timestamp: new Date().toISOString(),
    vercel: true
  });
}