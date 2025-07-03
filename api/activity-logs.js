const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Activity logs API for admin dashboard
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate token and require admin
  const tokenResult = securityMiddleware.validateToken(req, res);
  if (tokenResult) return tokenResult;
  
  const adminResult = securityMiddleware.requireAdmin(req, res);
  if (adminResult) return adminResult;
  
  try {
    const { limit = 10, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    
    // Get recent activity logs with user names
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        description,
        created_at,
        ip_address,
        users(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);
    
    if (error) throw error;
    
    // Format activity data for frontend
    const formattedLogs = logs?.map(log => {
      const timeAgo = getTimeAgo(new Date(log.created_at));
      
      let icon = '📝';
      switch (log.action) {
        case 'login': icon = '🔐'; break;
        case 'register': icon = '👤'; break;
        case 'profile_update': icon = '✏️'; break;
        case 'trade_save': icon = '💰'; break;
        case 'backup': icon = '🔧'; break;
        default: icon = '📝';
      }
      
      return {
        id: log.id,
        type: log.action,
        user: log.users?.name || 'Sistema',
        action: log.description || formatActionDescription(log.action),
        time: timeAgo,
        icon: icon
      };
    }) || [];
    
    return res.status(200).json({
      success: true,
      data: formattedLogs
    });
    
  } catch (error) {
    console.error('Activity logs API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

// Helper function to format action descriptions
function formatActionDescription(action) {
  switch (action) {
    case 'login': return 'Fez login no sistema';
    case 'register': return 'Novo usuário registrado';
    case 'profile_update': return 'Atualizou o perfil';
    case 'trade_save': return 'Salvou um novo trade';
    case 'backup': return 'Backup automático realizado';
    default: return 'Ação realizada';
  }
}