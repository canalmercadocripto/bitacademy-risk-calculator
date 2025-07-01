// API Route for Vercel - Get Current User
const jwt = require('jsonwebtoken');

// Usuário admin para teste
const adminUser = {
  id: 'admin-001',
  email: 'admin@seudominio.com',
  name: 'Administrador',
  lastName: 'Sistema',
  phone: '11999999999',
  countryCode: '+55',
  role: 'admin'
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BitAcademy2025SecureCalculatorJWT');
    
    if (decoded.userId !== adminUser.id) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    res.status(200).json({ user: adminUser });
    
  } catch (error) {
    console.error('Erro no me:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};