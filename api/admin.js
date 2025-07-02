// Consolidated admin API for Vercel
module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  // Dashboard endpoint
  if (req.method === 'GET' && action === 'dashboard') {
    const dashboardData = {
      overview: {
        totalUsers: 156, activeUsers: 89, totalTrades: 2847, totalVolume: 1245789.50,
        systemStatus: 'online', uptime: '99.8%'
      },
      recentActivity: [
        { id: 'activity_001', type: 'trade_created', user: 'user_123',
          description: 'Nova posição BTCUSDT criada', timestamp: '2024-12-02T10:30:00Z' },
        { id: 'activity_002', type: 'user_login', user: 'user_456',
          description: 'Login realizado', timestamp: '2024-12-02T10:25:00Z' }
      ],
      systemMetrics: {
        apiResponseTime: '245ms', databaseConnections: 12, memoryUsage: '68%',
        cpuUsage: '32%', diskUsage: '45%', activeConnections: 156
      },
      popularExchanges: [
        { name: 'Binance', usage: 45, trades: 1280 },
        { name: 'Bybit', usage: 28, trades: 798 }
      ],
      topSymbols: [
        { symbol: 'BTCUSDT', trades: 567, volume: 234567.89 },
        { symbol: 'ETHUSDT', trades: 423, volume: 145678.23 }
      ],
      performanceStats: {
        avgWinRate: 64.2, avgRiskReward: 1.7, totalPnL: 45678.90,
        bestPerformer: 'user_321', worstPerformer: 'user_654'
      }
    };
    
    return res.status(200).json({
      success: true, data: dashboardData, timestamp: new Date().toISOString()
    });
  }
  
  // Users management
  if (action === 'users') {
    const mockUsers = [
      {
        id: 'admin-001', email: 'admin@seudominio.com', name: 'Admin BitAcademy',
        phone: '+55 11 99999-9999', role: 'admin', status: 'active',
        totalTrades: 24, totalPnL: 1250.00, lastLogin: '2024-12-02T08:30:00Z',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'user-002', email: 'trader1@example.com', name: 'João Silva',
        phone: '+55 11 88888-8888', role: 'user', status: 'active',
        totalTrades: 156, totalPnL: 2456.78, lastLogin: '2024-12-02T07:15:00Z',
        createdAt: '2024-02-20T14:30:00Z'
      }
    ];
    
    if (req.method === 'GET') {
      const { page = 1, limit = 20, search = '', status = '' } = req.query;
      
      let filteredUsers = mockUsers;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = mockUsers.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phone.includes(search)
        );
      }
      if (status) filteredUsers = filteredUsers.filter(user => user.status === status);
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limitNum);
      
      return res.status(200).json({
        success: true, data: paginatedUsers,
        meta: {
          page: pageNum, limit: limitNum, total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limitNum)
        }
      });
    }
    
    if (req.method === 'POST') {
      const { email, name, phone, role = 'user' } = req.body;
      
      if (!email || !name || !phone) {
        return res.status(400).json({
          success: false, message: 'Email, nome e telefone são obrigatórios'
        });
      }
      
      const newUser = {
        id: `user_${Date.now()}`, email, name, phone, role, status: 'active',
        totalTrades: 0, totalPnL: 0, lastLogin: null, createdAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true, data: newUser, message: 'Usuário criado com sucesso'
      });
    }
    
    if (req.method === 'PUT') {
      const { userId, name, phone, role, status } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId é obrigatório' });
      }
      
      const updatedUser = {
        id: userId, name: name || 'Nome Atualizado', phone: phone || '+55 11 00000-0000',
        role: role || 'user', status: status || 'active', updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true, data: updatedUser, message: 'Usuário atualizado com sucesso'
      });
    }
    
    if (req.method === 'DELETE') {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId é obrigatório' });
      }
      
      return res.status(200).json({
        success: true, message: 'Usuário removido com sucesso'
      });
    }
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}