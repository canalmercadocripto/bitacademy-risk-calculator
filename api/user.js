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
    // Get user profile
    const profile = {
      id: 'admin-001',
      email: 'admin@seudominio.com',
      name: 'Admin BitAcademy',
      phone: '+55 11 99999-9999',
      role: 'admin',
      preferences: {
        defaultExchange: 'Binance',
        defaultRiskPercent: 2.0,
        currency: 'USD',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          trades: true,
          alerts: true
        }
      },
      stats: {
        totalTrades: 24,
        activeTrades: 3,
        totalPnL: 1250.00,
        winRate: 68.5,
        avgRiskReward: 1.8,
        bestTrade: 450.00,
        worstTrade: -125.00
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
      const { name, phone, preferences } = req.body;
      
      const updatedProfile = {
        id: 'admin-001',
        email: 'admin@seudominio.com',
        name: name || 'Admin BitAcademy',
        phone: phone || '+55 11 99999-9999',
        role: 'admin',
        preferences: {
          defaultExchange: preferences?.defaultExchange || 'Binance',
          defaultRiskPercent: preferences?.defaultRiskPercent || 2.0,
          currency: preferences?.currency || 'USD',
          timezone: preferences?.timezone || 'America/Sao_Paulo',
          notifications: preferences?.notifications || {
            email: true,
            trades: true,
            alerts: true
          }
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