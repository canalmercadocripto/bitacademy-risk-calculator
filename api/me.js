// Get user info API for Vercel
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
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
    
    // Decodificar token simples
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId] = decoded.split(':');
      
      // Buscar usuário admin
      let user;
      try {
        user = await kv.get('user:admin@seudominio.com');
      } catch (error) {
        // Fallback se KV não estiver configurado
        user = {
          id: 'admin-001',
          email: 'admin@seudominio.com',
          name: 'Administrador',
          lastName: 'Sistema',
          phone: '11999999999',
          countryCode: '+55',
          role: 'admin'
        };
      }
      
      if (!user || user.id !== userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Token inválido' 
        });
      }
      
      return res.status(200).json({
        success: true,
        user
      });
      
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido' 
      });
    }
    
  } catch (error) {
    console.error('Erro no me:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
}