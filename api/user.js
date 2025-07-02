// Consolidated user API for Vercel
module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // Get user profile with stats
    const profile = {
      id: 'admin-001',
      email: 'admin@seudominio.com',
      name: 'Admin BitAcademy',
      phone: '+55 11 99999-9999',
      bio: 'Administrador da plataforma BitAcademy',
      role: 'admin',
      preferences: {
        defaultRisk: 2.0,
        defaultAccountSize: 10000,
        notifications: true,
        darkMode: false,
        language: 'pt-BR'
      },
      stats: {
        totalCalculations: 156,
        avgRiskReward: 2.8,
        totalRisk: 1240.50,
        totalPotential: 3473.40,
        favoriteExchange: 'Binance',
        joinDate: '2024-01-15T10:00:00Z'
      },
      createdAt: '2024-01-15T10:00:00Z',
      lastLoginAt: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      data: profile
    });
  }
  
  if (req.method === 'PUT') {
    // Update user profile
    try {
      const { name, phone, bio, preferences } = req.body;
      
      const updatedProfile = {
        id: 'admin-001',
        email: 'admin@seudominio.com',
        name: name || 'Admin BitAcademy',
        phone: phone || '+55 11 99999-9999',
        bio: bio || 'Administrador da plataforma BitAcademy',
        role: 'admin',
        preferences: {
          defaultRisk: preferences?.defaultRisk || 2.0,
          defaultAccountSize: preferences?.defaultAccountSize || 10000,
          notifications: preferences?.notifications !== undefined ? preferences.notifications : true,
          darkMode: preferences?.darkMode || false,
          language: preferences?.language || 'pt-BR'
        },
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Perfil atualizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}