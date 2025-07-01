// Usar SQLite por padrão em desenvolvimento
const dbConfig = process.env.NODE_ENV === 'production' 
  ? '../config/database' 
  : '../config/database-sqlite';

const { query } = require(dbConfig);

const bcrypt = require('bcrypt');

class User {
  
  // Criar novo usuário
  static async create({ email, password, name, lastName, phone, countryCode = '+55', role = 'user' }) {
    try {
      // Validar telefone obrigatório
      if (!phone || phone.trim().length === 0) {
        throw new Error('Telefone é obrigatório');
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Gerar UUID para SQLite
      const crypto = require('crypto');
      const userId = crypto.randomBytes(16).toString('hex');
      
      const result = await query(`
        INSERT INTO users (id, email, password_hash, name, last_name, phone, country_code, role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, passwordHash, name, lastName, phone, countryCode, role]);
      
      // Buscar o usuário recém-criado
      const newUser = await query(`
        SELECT id, email, name, last_name, phone, country_code, role, created_at
        FROM users 
        WHERE id = ?
      `, [userId]);
      
      return newUser.rows[0];
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }
  
  // Buscar usuário por email
  static async findByEmail(email) {
    const result = await query(`
      SELECT id, email, password_hash, name, phone, country_code, role, is_active, last_login, created_at
      FROM users 
      WHERE email = ? AND is_active = 1
    `, [email]);
    
    return result.rows[0];
  }

  // Buscar usuário por email (incluindo inativos) - para validações admin
  static async findByEmailAll(email) {
    const result = await query(`
      SELECT id, email, password_hash, name, phone, country_code, role, is_active, last_login, created_at
      FROM users 
      WHERE email = ?
    `, [email]);
    
    return result.rows[0];
  }
  
  // Buscar usuário por ID
  static async findById(id) {
    const result = await query(`
      SELECT id, email, name, last_name, phone, country_code, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `, [id]);
    
    const user = result.rows[0];
    if (user) {
      // Mapear campos para manter compatibilidade
      user.lastName = user.last_name;
      user.countryCode = user.country_code;
    }
    
    return user;
  }

  // Buscar usuário por ID incluindo senha hash
  static async findByIdWithPassword(id) {
    const result = await query(`
      SELECT id, email, name, last_name, phone, country_code, password_hash, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `, [id]);
    
    const user = result.rows[0];
    if (user) {
      // Mapear campos para manter compatibilidade
      user.lastName = user.last_name;
      user.countryCode = user.country_code;
    }
    
    return user;
  }
  
  // Verificar senha
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Atualizar último login
  static async updateLastLogin(userId) {
    await query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId]);
  }
  
  // Listar usuários (para admin) - incluindo inativos
  static async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        u.id, u.email, u.name, u.phone, u.country_code, u.role, u.is_active, u.last_login, u.created_at,
        COUNT(th.id) as total_trades
      FROM users u
      LEFT JOIN trade_history th ON u.id = th.user_id
      GROUP BY u.id, u.email, u.name, u.phone, u.country_code, u.role, u.is_active, u.last_login, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Total de usuários
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users
    `);
    
    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    };
  }
  
  // Estatísticas de usuários
  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as active_week,
        COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as active_month,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as new_week
      FROM users 
      WHERE is_active = 1
    `);
    
    return result.rows[0];
  }
  
  // Desativar usuário (soft delete)
  static async deactivate(userId) {
    await query(`
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId]);
  }
  
  // Ativar usuário
  static async activate(userId) {
    await query(`
      UPDATE users 
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId]);
  }

  // Atualizar status do usuário
  static async updateStatus(userId, isActive) {
    console.log(`🔄 Atualizando status do usuário ${userId} para ${isActive ? 'ativo' : 'inativo'}`);
    
    const result = await query(`
      UPDATE users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [isActive ? 1 : 0, userId]);
    
    console.log(`✅ Resultado da atualização:`, result);
    
    // Verificar se a atualização foi bem-sucedida
    const updatedUser = await query(`
      SELECT id, email, name, is_active 
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    console.log(`🔍 Usuário após atualização:`, updatedUser.rows[0]);
    
    return result;
  }

  // Atualizar dados do usuário
  static async update(userId, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      return;
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    await query(`
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `, values);
  }

  // Atualizar perfil do usuário
  static async updateProfile(userId, profileData) {
    try {
      const { name, lastName, email, phone, countryCode } = profileData;
      
      const result = await query(`
        UPDATE users 
        SET name = ?, last_name = ?, email = ?, phone = ?, country_code = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [name, lastName, email, phone, countryCode, userId]);
      
      return result.affectedRows > 0 || result.changes > 0;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  // Atualizar senha do usuário
  static async updatePassword(userId, newPassword) {
    try {
      // Hash da nova senha
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      const result = await query(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [passwordHash, userId]);
      
      return result.affectedRows > 0 || result.changes > 0;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  // Deletar usuário (hard delete)
  static async delete(userId) {
    // Primeiro deletar trades relacionados
    await query(`DELETE FROM trade_history WHERE user_id = ?`, [userId]);
    
    // Depois deletar o usuário
    await query(`DELETE FROM users WHERE id = ?`, [userId]);
  }
}

module.exports = User;