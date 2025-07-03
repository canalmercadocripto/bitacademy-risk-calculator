const { supabase } = require('../lib/supabase');

// Get current user info from token
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    // Get token from Authorization header or query param
    let token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Decode simple token (userId:timestamp:role)
    let userId, role;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      userId = parts[0];
      role = parts[2];
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, is_active')
      .eq('id', userId)
      .eq('is_active', true)
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }
    
    // Return user data
    return res.status(200).json({
      success: true,
      message: 'Usuário autenticado',
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    console.error('Me API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}