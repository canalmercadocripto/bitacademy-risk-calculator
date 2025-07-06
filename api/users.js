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
      
      // Get all users
      const { data: users, error } = await supabase
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
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      
      console.log('📊 Usuários encontrados:', users.length);
      
      // Format users data
      const formattedUsers = users?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      })) || [];
      
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