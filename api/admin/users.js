// Admin users management API for Vercel
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    
    // Mock users data
    const mockUsers = [
      {
        id: 'admin-001',
        email: 'admin@seudominio.com',
        name: 'Admin BitAcademy',
        phone: '+55 11 99999-9999',
        role: 'admin',
        status: 'active',
        totalTrades: 24,
        totalPnL: 1250.00,
        lastLogin: '2024-12-02T08:30:00Z',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'user-002',
        email: 'trader1@example.com',
        name: 'João Silva',
        phone: '+55 11 88888-8888',
        role: 'user',
        status: 'active',
        totalTrades: 156,
        totalPnL: 2456.78,
        lastLogin: '2024-12-02T07:15:00Z',
        createdAt: '2024-02-20T14:30:00Z'
      },
      {
        id: 'user-003',
        email: 'trader2@example.com',
        name: 'Maria Santos',
        phone: '+55 11 77777-7777',
        role: 'user',
        status: 'active',
        totalTrades: 89,
        totalPnL: -234.56,
        lastLogin: '2024-12-01T19:45:00Z',
        createdAt: '2024-03-10T09:20:00Z'
      },
      {
        id: 'user-004',
        email: 'trader3@example.com',
        name: 'Pedro Costa',
        phone: '+55 11 66666-6666',
        role: 'user',
        status: 'suspended',
        totalTrades: 23,
        totalPnL: 567.89,
        lastLogin: '2024-11-28T16:30:00Z',
        createdAt: '2024-04-05T11:10:00Z'
      }
    ];
    
    // Filter users
    let filteredUsers = mockUsers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(search)
      );
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return res.status(200).json({
      success: true,
      data: paginatedUsers,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limitNum)
      }
    });
  }
  
  if (req.method === 'POST') {
    // Create new user
    try {
      const { email, name, phone, role = 'user' } = req.body;
      
      if (!email || !name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email, nome e telefone são obrigatórios'
        });
      }
      
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        phone,
        role,
        status: 'active',
        totalTrades: 0,
        totalPnL: 0,
        lastLogin: null,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        data: newUser,
        message: 'Usuário criado com sucesso'
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  if (req.method === 'PUT') {
    // Update user
    try {
      const { userId, name, phone, role, status } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId é obrigatório'
        });
      }
      
      const updatedUser = {
        id: userId,
        name: name || 'Nome Atualizado',
        phone: phone || '+55 11 00000-0000',
        role: role || 'user',
        status: status || 'active',
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Usuário atualizado com sucesso'
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  if (req.method === 'DELETE') {
    // Delete user
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId é obrigatório'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Usuário removido com sucesso'
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}