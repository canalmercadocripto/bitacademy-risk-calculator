const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// API endpoint para renovar token
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    console.log('🔄 Tentativa de renovação de token para:', email);
    
    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, role, is_active')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    if (!user.is_active) {
      console.log('❌ Usuário inativo:', email);
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }
    
    // Verificar senha (assumindo que é armazenada em texto plano por simplicidade)
    if (user.password !== password) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar novo token
    const timestamp = Date.now();
    const tokenData = `${user.id}:${timestamp}:${user.role}`;
    const token = Buffer.from(tokenData).toString('base64');
    
    console.log('✅ Token renovado para:', email, 'Role:', user.role);
    
    return res.status(200).json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}