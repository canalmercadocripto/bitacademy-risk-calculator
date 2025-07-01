const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  
  // Registrar novo usuário
  static async register(req, res) {
    try {
      const { email, password, name, lastName, phone, countryCode } = req.body;
      
      // Validações básicas
      if (!email || !password || !name || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email, senha, nome, sobrenome e telefone são obrigatórios'
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido'
        });
      }
      
      // Criar usuário
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        name,
        lastName,
        phone,
        countryCode: countryCode || '+55',
        role: 'user'
      });
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'bitacademy-secret-key',
        { expiresIn: '7d' }
      );
      
      // Log da atividade
      await AuthController.logActivity(user.id, 'user_registered', {
        email: user.email,
        name: user.name
      }, req);
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        }
      });
      
    } catch (error) {
      console.error('Erro no registro:', error);
      console.error('Stack trace:', error.stack);
      
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Login do usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }
      
      // Buscar usuário
      const user = await User.findByEmail(email.toLowerCase());
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }
      
      // Verificar senha
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }
      
      // Atualizar último login
      await User.updateLastLogin(user.id);
      
      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'bitacademy-secret-key',
        { expiresIn: '7d' }
      );
      
      // Log da atividade
      await AuthController.logActivity(user.id, 'user_login', {
        email: user.email
      }, req);
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        }
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Verificar token atual
  static async me(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            phone: user.phone,
            countryCode: user.countryCode,
            role: user.role,
            lastLogin: user.last_login,
            createdAt: user.created_at
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(req, res) {
    try {
      const { name, lastName, email, phone, countryCode } = req.body;
      const userId = req.user.userId;
      
      // Validações básicas
      if (!name || !lastName || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Nome, sobrenome, email e telefone são obrigatórios'
        });
      }
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido'
        });
      }
      
      // Verificar se o email já existe (mas não para o próprio usuário)
      const existingUser = await User.findByEmail(email.toLowerCase());
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso por outro usuário'
        });
      }
      
      // Atualizar perfil
      const success = await User.updateProfile(userId, {
        name,
        lastName,
        email: email.toLowerCase(),
        phone,
        countryCode: countryCode || '+55'
      });
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Log da atividade
      await AuthController.logActivity(userId, 'profile_updated', {
        email: email.toLowerCase(),
        name,
        lastName
      }, req);
      
      // Buscar dados atualizados
      const updatedUser = await User.findById(userId);
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            countryCode: updatedUser.countryCode,
            role: updatedUser.role,
            lastLogin: updatedUser.last_login,
            createdAt: updatedUser.created_at
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha do usuário
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      // Validações básicas
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha deve ter pelo menos 6 caracteres'
        });
      }
      
      // Buscar usuário atual com senha
      const user = await User.findByIdWithPassword(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Verificar senha atual
      const isValidCurrentPassword = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidCurrentPassword) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
      
      // Atualizar senha
      const success = await User.updatePassword(userId, newPassword);
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar senha'
        });
      }
      
      // Log da atividade
      await AuthController.logActivity(userId, 'password_changed', {
        email: user.email,
        name: user.name
      }, req);
      
      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { userId, email, role } = req.user;
      
      // Gerar novo token
      const token = jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET || 'bitacademy-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        data: { token }
      });
      
    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Logout (invalidar token no frontend)
  static async logout(req, res) {
    try {
      // Log da atividade
      await AuthController.logActivity(req.user.userId, 'user_logout', {
        email: req.user.email
      }, req);
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Função auxiliar para log de atividades
  static async logActivity(userId, action, details, req) {
    try {
      // Usar SQLite por padrão em desenvolvimento
      const dbConfig = process.env.NODE_ENV === 'production' 
        ? '../config/database' 
        : '../config/database-sqlite';
      
      const { query } = require(dbConfig);
      
      await query(`
        INSERT INTO user_activities (user_id, action, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        action,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]);
      
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
    }
  }
}

module.exports = AuthController;