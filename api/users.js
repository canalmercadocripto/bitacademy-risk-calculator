const { sql } = require('@vercel/postgres');

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
      const result = await sql`
        SELECT id, name, email, phone, role, is_active, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC
      `;
      
      return res.status(200).json({
        success: true,
        data: result.rows
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
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email.toLowerCase()}
      `;
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está cadastrado'
        });
      }
      
      // Create user
      const result = await sql`
        INSERT INTO users (name, email, phone, password, role, is_active)
        VALUES (${name}, ${email.toLowerCase()}, ${phone}, ${password}, ${role}, true)
        RETURNING id, name, email, phone, role, is_active, created_at
      `;
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
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
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${email.toLowerCase()} AND id != ${userId}
        `;
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está cadastrado'
          });
        }
      }
      
      // Update user
      const result = await sql`
        UPDATE users 
        SET 
          name = COALESCE(${name}, name),
          email = COALESCE(${email ? email.toLowerCase() : null}, email),
          phone = COALESCE(${phone}, phone),
          role = COALESCE(${role}, role),
          is_active = COALESCE(${isActive}, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, name, email, phone, role, is_active, updated_at
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
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
      
      const result = await sql`
        UPDATE users 
        SET password = ${newPassword}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, name, email
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
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
      
      const result = await sql`
        DELETE FROM users WHERE id = ${userId} RETURNING id
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
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