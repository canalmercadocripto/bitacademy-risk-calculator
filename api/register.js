const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// User registration API
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
  
  // Apply rate limiting for registration
  const rateLimitResult = securityMiddleware.loginRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate and sanitize input
  const sanitizeResult = securityMiddleware.validateAndSanitize(req, res);
  if (sanitizeResult) return sanitizeResult;
  
  try {
    const { name, lastName, email, password, phone, countryCode } = req.body;
    
    // Validações básicas
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, senha e telefone são obrigatórios'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }
    
    // Criar nome completo
    const fullName = lastName ? `${name} ${lastName}` : name;
    
    // Formatar telefone
    const formattedPhone = countryCode ? `${countryCode}${phone}` : phone;
    
    // Criar usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: fullName,
        email: email.toLowerCase(),
        phone: formattedPhone,
        password: password, // Em produção, usar bcrypt
        role: 'user',
        is_active: true
      })
      .select('id, name, email, phone, role, is_active, created_at')
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    // Log de atividade
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: newUser.id,
          action: 'register',
          description: 'Novo usuário registrado',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
        });
    } catch (logError) {
      console.log('⚠️ Failed to log activity:', logError.message);
    }
    
    // Criar token JWT simples
    const token = Buffer.from(`${newUser.id}:${Date.now()}:${newUser.role}`).toString('base64');
    
    // Preparar dados do usuário para resposta
    const userData = {
      id: newUser.id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    };
    
    console.log('✅ New user registered:', userData.email);
    
    return res.status(200).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        token,
        user: userData
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}