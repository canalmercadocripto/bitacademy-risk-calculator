// Ultra-simple login without external dependencies
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    });
  }
  
  try {
    const { email, password } = req.body || {};
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Simple credential check
    if (email === 'admin@seudominio.com' && password === 'admin123') {
      // Create simple token
      const token = Buffer.from(`admin-001:${Date.now()}`).toString('base64');
      
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: {
            id: 'admin-001',
            email: 'admin@seudominio.com',
            name: 'Administrador',
            lastName: 'Sistema',
            phone: '11999999999',
            countryCode: '+55',
            role: 'admin'
          }
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}