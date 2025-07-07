const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// Users API - manage users for admin
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
    const { action = 'list' } = req.query;
    
    if (action === 'list') {
      console.log('🔍 Buscando todos os usuários...');
      
      // Get all users with trade counts
      const [usersResult, tradesResult] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            phone,
            role,
            is_active,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('trades')
          .select('user_id, account_size')
      ]);
      
      if (usersResult.error) throw usersResult.error;
      if (tradesResult.error) throw tradesResult.error;
      
      const users = usersResult.data || [];
      const trades = tradesResult.data || [];
      
      console.log('📊 Usuários encontrados:', users.length);
      console.log('📊 Trades encontrados:', trades.length);
      
      // Calculate trade statistics for each user
      const userStats = {};
      trades.forEach(trade => {
        const userId = trade.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            totalTrades: 0,
            totalVolume: 0
          };
        }
        userStats[userId].totalTrades++;
        userStats[userId].totalVolume += trade.account_size || 0;
      });
      
      // Format users data with trade statistics
      const formattedUsers = users?.map(user => {
        const stats = userStats[user.id] || { totalTrades: 0, totalVolume: 0 };
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          totalTrades: stats.totalTrades,
          totalVolume: stats.totalVolume
        };
      }) || [];
      
      // Calculate statistics
      const totalUsers = formattedUsers.length;
      const activeUsers = formattedUsers.filter(u => u.isActive).length;
      const adminUsers = formattedUsers.filter(u => u.role === 'admin').length;
      const regularUsers = formattedUsers.filter(u => u.role === 'user').length;
      
      console.log('📈 Estatísticas dos usuários:', {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers
      });
      
      return res.status(200).json({
        success: true,
        data: formattedUsers,
        meta: {
          total: totalUsers
        },
        stats: {
          totalUsers,
          activeUsers,
          adminUsers,
          regularUsers
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Ação não suportada'
    });
    
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}