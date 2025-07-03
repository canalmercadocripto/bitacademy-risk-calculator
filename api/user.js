const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// User profile API
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate token
  const tokenResult = securityMiddleware.validateToken(req, res);
  if (tokenResult) return tokenResult;
  
  const userId = req.user.id;
  
  try {
    // GET - Get user profile with real statistics
    if (req.method === 'GET') {
      // Get user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, role, created_at')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Get user's trade statistics
      const { data: trades } = await supabase
        .from('trades')
        .select('account_size, risk_reward_ratio, risk_amount, reward_amount, created_at, exchange')
        .eq('user_id', userId);
      
      // Calculate real statistics
      const totalCalculations = trades?.length || 0;
      const avgRiskReward = totalCalculations > 0 ? 
        trades.reduce((sum, trade) => sum + parseFloat(trade.risk_reward_ratio || 0), 0) / totalCalculations : 0;
      const totalRisk = trades?.reduce((sum, trade) => sum + parseFloat(trade.risk_amount || 0), 0) || 0;
      const totalPotential = trades?.reduce((sum, trade) => sum + parseFloat(trade.reward_amount || 0), 0) || 0;
      
      // Find favorite exchange
      const exchangeCount = {};
      trades?.forEach(trade => {
        exchangeCount[trade.exchange] = (exchangeCount[trade.exchange] || 0) + 1;
      });
      const favoriteExchange = Object.keys(exchangeCount).length > 0 ?
        Object.keys(exchangeCount).reduce((a, b) => exchangeCount[a] > exchangeCount[b] ? a : b) : '';
      
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            joinDate: userData.created_at
          },
          stats: {
            totalCalculations,
            avgRiskReward: parseFloat(avgRiskReward.toFixed(2)),
            totalRisk: parseFloat(totalRisk.toFixed(2)),
            totalPotential: parseFloat(totalPotential.toFixed(2)),
            favoriteExchange,
            joinDate: userData.created_at.split('T')[0]
          }
        }
      });
    }
    
    // PUT - Update user profile
    if (req.method === 'PUT') {
      // Validate and sanitize input
      const sanitizeResult = securityMiddleware.validateAndSanitize(req, res);
      if (sanitizeResult) return sanitizeResult;
      
      const { name, email, phone, bio } = req.body;
      
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nome e email são obrigatórios'
        });
      }
      
      // Check if email is already taken by another user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', userId)
        .single();
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }
      
      // Update user
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, name, email, phone, role')
        .single();
      
      if (error) {
        throw error;
      }
      
      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            action: 'profile_update',
            description: 'Perfil atualizado',
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
          });
      } catch (logError) {
        console.log('⚠️ Failed to log activity:', logError.message);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: updatedUser
        }
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
    
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}