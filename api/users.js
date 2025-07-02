const { supabase } = require('../lib/supabase');

// Users management API
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  try {
    // Get all users
    if (req.method === 'GET' && action === 'list') {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data
      });
    }
    
    // Create user
    if (req.method === 'POST') {
      const { name, email, phone, password, role = 'user' } = req.body;
      
      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }
      
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está cadastrado'
        });
      }
      
      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email: email.toLowerCase(),
          phone,
          password,
          role,
          is_active: true
        })
        .select('id, name, email, phone, role, is_active, created_at')
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Usuário criado com sucesso'
      });
    }
    
    // Update user
    if (req.method === 'PUT') {
      const { userId, name, email, phone, role, isActive } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId é obrigatório'
        });
      }
      
      // Check if email already exists for other users
      if (email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase())
          .neq('id', userId)
          .single();
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está cadastrado'
          });
        }
      }
      
      // Build update object
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date().toISOString();
      
      // Update user
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, name, email, phone, role, is_active, updated_at')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        throw error;
      }
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Usuário atualizado com sucesso'
      });
    }
    
    // Change password
    if (req.method === 'PUT' && action === 'password') {
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'userId e newPassword são obrigatórios'
        });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 8 caracteres'
        });
      }
      
      const { data, error } = await supabase
        .from('users')
        .update({
          password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, name, email')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        throw error;
      }
      
      return res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    }
    
    // Delete user
    if (req.method === 'DELETE') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId é obrigatório'
        });
      }
      
      // Prevent deletion of admin user
      if (userId === '1' || userId === 'admin-001') {
        return res.status(403).json({
          success: false,
          message: 'Não é possível deletar o usuário administrativo principal'
        });
      }
      
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select('id')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        throw error;
      }
      
      return res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
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