// Ultra-simple login for Vercel - NO external dependencies
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only POST allowed
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha obrigatórios' });
      return;
    }
    
    // Check credentials
    if (email === 'admin@seudominio.com' && password === 'Admin123456!') {
      // Create simple token (without JWT for now)
      const simpleToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      res.status(200).json({
        message: 'Login realizado com sucesso',
        token: simpleToken,
        user: {
          id: 'admin-001',
          email: 'admin@seudominio.com',
          name: 'Administrador',
          lastName: 'Sistema',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
}