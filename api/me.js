// Ultra-simple user info for Vercel
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only GET allowed
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }
    
    // For now, just return admin user for any valid token
    res.status(200).json({
      user: {
        id: 'admin-001',
        email: 'admin@seudominio.com',
        name: 'Administrador',
        lastName: 'Sistema',
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}