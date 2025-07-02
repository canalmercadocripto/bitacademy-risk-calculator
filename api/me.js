// Ultra-simple user info without external dependencies
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Decode simple token
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId] = decoded.split(':');
      
      if (userId === 'admin-001') {
        return res.status(200).json({
          success: true,
          user: {
            id: 'admin-001',
            email: 'admin@seudominio.com',
            name: 'Administrador',
            lastName: 'Sistema',
            phone: '11999999999',
            countryCode: '+55',
            role: 'admin'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}