// API Route for Vercel - Authentication
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Simulação de usuários (em produção, use banco de dados)
const users = [
  {
    id: 'admin-001',
    email: 'admin@seudominio.com',
    password_hash: '$2b$12$8xOxVe7aDY9Xr9XvVjQx3.rX8yGzQo6DQUDa7uVe7SZF2wqrP4sHC', // Admin123456!
    name: 'Administrador',
    lastName: 'Sistema',
    phone: '11999999999',
    countryCode: '+55',
    role: 'admin'
  }
];

module.exports = async function handler(req, res) {
  // Adicionar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    return handleLogin(req, res);
  }
  
  if (req.method === 'GET') {
    return handleMe(req, res);
  }
  
  res.status(404).json({ error: 'Rota não encontrada' });
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'BitAcademy2025SecureJWT',
      { expiresIn: '24h' }
    );
    
    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleMe(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BitAcademy2025SecureJWT');
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    const { password_hash, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
    
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}