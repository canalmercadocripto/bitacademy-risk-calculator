const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Login with Postgres integration
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
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
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.loginRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate and sanitize input
  const sanitizeResult = securityMiddleware.validateAndSanitize(req, res);
  if (sanitizeResult) return sanitizeResult;
  
  try {
    const { email, password } = req.body || {};
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    console.log('🔐 Tentativa de login:', { email, password: '***' });
    
    // Check credentials ONLY against database
    let user = null;
    let isValidLogin = false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, is_active, password')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ User not found:', email);
        } else {
          throw error;
        }
      } else if (data) {
        // Simple password check (in production, use bcrypt)
        if (data.password === password) {
          user = {
            id: data.id.toString(),
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            role: data.role
          };
          isValidLogin = true;
          console.log('✅ Login via database successful');
        } else {
          console.log('❌ Password mismatch for user:', email);
        }
      }
    } catch (dbError) {
      console.error('❌ Database error during login:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erro de conexão com o banco de dados'
      });
    }
    
    if (isValidLogin && user) {
      // Create token
      const token = Buffer.from(`${user.id}:${Date.now()}:${user.role}`).toString('base64');
      
      // Log successful login
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: parseInt(user.id),
            action: 'login',
            description: 'Login realizado com sucesso',
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
          });
      } catch (logError) {
        console.log('⚠️ Failed to log activity:', logError.message);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user
        }
      });
    } else {
      console.log('❌ Invalid credentials provided');
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}