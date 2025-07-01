// API Route for Vercel - Login
import jwt from 'jsonwebtoken';

// Usuário admin para teste
const adminUser = {
  id: 'admin-001',
  email: 'admin@seudominio.com',
  password_hash: '$2b$12$LQv3c1yqBwEHFNjKJ4OY/.8kJpb5H9QOZyYcRJjIpgH7.8K8GnF42', // Admin123456!
  name: 'Administrador',
  lastName: 'Sistema',
  phone: '11999999999',
  countryCode: '+55',
  role: 'admin'
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Verificar se é o admin
    if (email !== adminUser.email) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificação simples da senha (sem bcrypt para evitar problemas no Vercel)
    if (password !== 'Admin123456!') {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'BitAcademy2025SecureCalculatorJWT',
      { expiresIn: '24h' }
    );
    
    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = adminUser;
    
    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};