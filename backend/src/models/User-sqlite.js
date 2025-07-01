// Usar SQLite por padrão em desenvolvimento
const dbConfig = process.env.NODE_ENV === 'production' 
  ? '../config/database' 
  : '../config/database-sqlite';

const { query } = require(dbConfig);

const bcrypt = require('bcrypt');

class User {
  
  // Criar novo usuário
  static async create({ email, password, name, role = 'user' }) {
    try {
      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);
      
      const result = await query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES (?, ?, ?, ?)
      `, [email, passwordHash, name, role]);
      
      // Buscar o usuário criado
      const newUser = await query(`
        SELECT id, email, name, role, created_at
        FROM users 
        WHERE id = ?
      `, [result.lastID || result.rows[0]?.id]);
      
      return newUser.rows[0];
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed') || error.code === '23505') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }
  
  // Buscar usuário por email
  static async findByEmail(email) {
    const result = await query(`
      SELECT id, email, password_hash, name, role, is_active, last_login, created_at
      FROM users 
      WHERE email = ? AND is_active = 1
    `, [email]);
    
    return result.rows[0];
  }
  
  // Buscar usuário por ID
  static async findById(id) {
    const result = await query(`
      SELECT id, email, name, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ? AND is_active = 1
    `, [id]);
    
    return result.rows[0];
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
  
  // Listar usuários (para admin)
  static async getAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.is_active, u.last_login, u.created_at,
        COUNT(th.id) as total_trades
      FROM users u
      LEFT JOIN trade_history th ON u.id = th.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.email, u.name, u.role, u.is_active, u.last_login, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Total de usuários
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users WHERE role != 'admin'
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
}

module.exports = User;