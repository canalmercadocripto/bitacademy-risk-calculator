// Login API for Vercel with KV storage
import { kv } from '@vercel/kv';

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
      return res.status(400).json({ 
        success: false,
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário no KV
    let user;
    try {
      user = await kv.get(`user:${email}`);
    } catch (error) {
      // Se KV não estiver configurado, usar fallback
      console.warn('KV não configurado, usando dados hardcoded');
      if (email === 'admin@seudominio.com' && password === 'Admin123456!') {
        user = {
          id: 'admin-001',
          email: 'admin@seudominio.com',
          name: 'Administrador',
          lastName: 'Sistema',
          role: 'admin'
        };
      }
    }
    
    if (!user) {
      // Criar admin se não existir (primeira execução)
      if (email === 'admin@seudominio.com' && password === 'Admin123456!') {
        user = {
          id: 'admin-001',
          email: 'admin@seudominio.com',
          name: 'Administrador',
          lastName: 'Sistema',
          phone: '11999999999',
          countryCode: '+55',
          role: 'admin',
          created_at: new Date().toISOString()
        };
        
        // Salvar no KV se disponível
        try {
          await kv.set(`user:${email}`, user);
          console.log('Admin criado no KV');
        } catch (error) {
          console.warn('Não foi possível salvar no KV');
        }
      } else {
        return res.status(401).json({ 
          success: false,
          message: 'Credenciais inválidas' 
        });
      }
    }
    
    // Verificar senha (simplificado para demo)
    if (password !== 'Admin123456!') {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }
    
    // Criar token simples
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    // Atualizar último login
    if (user) {
      user.last_login = new Date().toISOString();
      try {
        await kv.set(`user:${email}`, user);
      } catch (error) {
        console.warn('Não foi possível atualizar último login no KV');
      }
    }
    
    // Remover dados sensíveis
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
}