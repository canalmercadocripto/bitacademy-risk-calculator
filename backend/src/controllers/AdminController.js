const User = require('../models/User');
const TradeHistory = require('../models/TradeHistory');
const { query } = require('../config/database-sqlite');
const fs = require('fs');
const path = require('path');

class AdminController {
  
  // Dashboard principal com estatísticas gerais
  static async getDashboard(req, res) {
    try {
      const [userStats, tradeStats, exchangeStats, topSymbols, dailyActivity] = await Promise.all([
        User.getStats(),
        TradeHistory.getGlobalStats(),
        TradeHistory.getByExchange(30),
        TradeHistory.getTopSymbols(10, 30),
        TradeHistory.getDailyActivity(30)
      ]);
      
      res.json({
        success: true,
        data: {
          summary: {
            users: userStats,
            trades: tradeStats
          },
          exchanges: exchangeStats,
          topSymbols,
          dailyActivity
        }
      });
      
    } catch (error) {
      console.error('Erro no dashboard admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Listar todos os usuários
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      const result = await User.getAll(parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Detalhes de um usuário específico
  static async getUserDetails(req, res) {
    try {
      const { userId } = req.params;
      
      const [user, userStats, recentTrades] = await Promise.all([
        User.findById(userId),
        TradeHistory.getUserStats(userId),
        TradeHistory.getByUser(userId, 1, 10)
      ]);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: {
          user,
          stats: userStats,
          recentTrades: recentTrades.trades
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Listar todos os trades com filtros
  static async getAllTrades(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        exchange, 
        symbol, 
        userId, 
        startDate, 
        endDate 
      } = req.query;
      
      const filters = {};
      if (exchange) filters.exchange = exchange;
      if (symbol) filters.symbol = symbol;
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const result = await TradeHistory.getAll(
        parseInt(page),
        parseInt(limit),
        filters
      );
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Erro ao listar trades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Relatório de atividade por período
  static async getActivityReport(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const [dailyActivity, exchangeStats, topSymbols] = await Promise.all([
        TradeHistory.getDailyActivity(parseInt(days)),
        TradeHistory.getByExchange(parseInt(days)),
        TradeHistory.getTopSymbols(20, parseInt(days))
      ]);
      
      res.json({
        success: true,
        data: {
          period: `${days} dias`,
          dailyActivity,
          exchangeStats,
          topSymbols
        }
      });
      
    } catch (error) {
      console.error('Erro no relatório de atividade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Atividades dos usuários (logs)
  static async getUserActivities(req, res) {
    try {
      const { page = 1, limit = 50, userId } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      let paramCount = 0;
      
      if (userId) {
        whereClause += ` AND user_id = ?`;
        params.push(userId);
      }
      
      params.push(parseInt(limit), offset);
      
      // Usar SQLite por padrão em desenvolvimento
      const dbConfig = process.env.NODE_ENV === 'production' 
        ? '../config/database' 
        : '../config/database-sqlite';
      
      const { query } = require(dbConfig);
      
      const result = await query(`
        SELECT 
          ua.id, ua.action, ua.details, ua.ip_address, ua.created_at,
          u.email as user_email, u.name as user_name
        FROM user_activities ua
        LEFT JOIN users u ON ua.user_id = u.id
        ${whereClause}
        ORDER BY ua.created_at DESC
        LIMIT ? OFFSET ?
      `, params);
      
      const countResult = await query(`
        SELECT COUNT(*) as total 
        FROM user_activities ua
        LEFT JOIN users u ON ua.user_id = u.id
        ${whereClause}
      `, params.slice(0, -2));
      
      res.json({
        success: true,
        data: {
          activities: result.rows,
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          totalPages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Ativar/Desativar usuário
  static async toggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { is_active } = req.body;
      
      console.log(`🎯 Tentando alterar status do usuário: ${userId} para ${is_active}`);
      console.log(`📝 Body da requisição:`, req.body);
      
      const user = await User.findById(userId);
      console.log(`👤 Usuário encontrado:`, user);
      
      if (!user) {
        console.log(`❌ Usuário ${userId} não encontrado`);
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      console.log(`🔄 Status atual do usuário: ${user.is_active}, novo status: ${is_active}`);
      
      await User.updateStatus(userId, is_active);
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'user_status_changed', {
        targetUserId: userId,
        newStatus: is_active ? 'active' : 'inactive',
        adminId: req.user.userId
      }, req);
      
      console.log(`✅ Status do usuário ${userId} alterado com sucesso`);
      
      res.json({
        success: true,
        message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`
      });
      
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar novo usuário
  static async createUser(req, res) {
    try {
      const { name, email, password, phone, countryCode, role = 'user' } = req.body;
      
      // Validar dados obrigatórios
      if (!name || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email, senha e telefone são obrigatórios'
        });
      }
      
      // Verificar se email já existe
      const existingUser = await User.findByEmailAll(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
      
      // Criar usuário
      const newUser = await User.create({ name, email, password, phone, countryCode, role });
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'user_created', {
        newUserId: newUser.id,
        newUserEmail: email,
        adminId: req.user.userId
      }, req);
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: { user: newUser }
      });
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Editar usuário
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { name, email, phone, country_code, role } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Verificar se email já existe (se foi alterado)
      if (email && email !== user.email) {
        const existingUser = await User.findByEmailAll(email);
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email já está em uso'
          });
        }
      }
      
      // Atualizar usuário
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (country_code) updateData.country_code = country_code;
      if (role) updateData.role = role;
      
      await User.update(userId, updateData);
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'user_updated', {
        targetUserId: userId,
        updatedFields: Object.keys(updateData),
        adminId: req.user.userId
      }, req);
      
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Remover usuário
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Não permitir que admin delete a si mesmo
      if (userId === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: 'Você não pode deletar sua própria conta'
        });
      }
      
      await User.delete(userId);
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'user_deleted', {
        deletedUserId: userId,
        deletedUserEmail: user.email,
        adminId: req.user.userId
      }, req);
      
      res.json({
        success: true,
        message: 'Usuário removido com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Estatísticas em tempo real
  static async getRealtimeStats(req, res) {
    try {
      // Usar SQLite por padrão em desenvolvimento
      const dbConfig = process.env.NODE_ENV === 'production' 
        ? '../config/database' 
        : '../config/database-sqlite';
      
      const { query } = require(dbConfig);
      
      // Estatísticas das últimas 24 horas (SQLite)
      const realtimeStats = await query(`
        SELECT 
          COUNT(CASE WHEN created_at > datetime('now', '-1 hours') THEN 1 END) as trades_last_hour,
          COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as trades_last_24h,
          COUNT(DISTINCT CASE WHEN created_at > datetime('now', '-24 hours') THEN user_id END) as active_users_24h,
          COUNT(DISTINCT CASE WHEN created_at > datetime('now', '-24 hours') THEN exchange END) as active_exchanges_24h,
          AVG(CASE WHEN created_at > datetime('now', '-24 hours') THEN risk_percent END) as avg_risk_24h
        FROM trade_history
      `);
      
      // Usuários online (último login nas últimas 2 horas)
      const onlineUsers = await query(`
        SELECT COUNT(*) as online_users
        FROM users 
        WHERE last_login > datetime('now', '-2 hours') AND is_active = 1
      `);
      
      res.json({
        success: true,
        data: {
          ...realtimeStats.rows[0],
          ...onlineUsers.rows[0]
        }
      });
      
    } catch (error) {
      console.error('Erro nas estatísticas em tempo real:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
  
  // Backup do banco de dados
  static async backupDatabase(req, res) {
    try {
      const dbPath = path.join(__dirname, '../../bitacademy.db');
      const backupDir = path.join(__dirname, '../../backups');
      
      // Criar diretório de backup se não existir
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `bitacademy-backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);
      
      // Copiar arquivo do banco
      fs.copyFileSync(dbPath, backupPath);
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'database_backup', {
        backupFile: backupFileName,
        adminId: req.user.userId
      }, req);
      
      // Configurar headers para download
      res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Enviar arquivo para download
      res.sendFile(backupPath, (err) => {
        if (err) {
          console.error('Erro ao enviar backup:', err);
        } else {
          // Remover arquivo temporário após download
          setTimeout(() => {
            if (fs.existsSync(backupPath)) {
              fs.unlinkSync(backupPath);
            }
          }, 60000); // Remove após 1 minuto
        }
      });
      
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar backup do banco de dados'
      });
    }
  }
  
  // Export de usuários em CSV
  static async exportUsers(req, res) {
    try {
      const { format = 'csv' } = req.query;
      
      const users = await query(`
        SELECT 
          u.id, u.email, u.name, u.phone, u.country_code, u.role, 
          u.is_active, u.last_login, u.created_at,
          COUNT(th.id) as total_trades,
          COALESCE(SUM(th.account_size), 0) as total_volume
        FROM users u
        LEFT JOIN trade_history th ON u.id = th.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (format === 'csv') {
        // Gerar CSV
        const csvHeader = 'ID,Email,Nome,Telefone,País,Perfil,Status,Último Login,Data Criação,Total Trades,Volume Total\n';
        const csvRows = users.rows.map(user => {
          const phone = user.country_code && user.phone ? `${user.country_code} ${user.phone}` : 'Não informado';
          const status = user.is_active ? 'Ativo' : 'Inativo';
          const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca';
          const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
          
          return `"${user.id}","${user.email}","${user.name}","${phone}","${user.country_code || '+55'}","${user.role}","${status}","${lastLogin}","${createdAt}","${user.total_trades}","${user.total_volume}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        const fileName = `usuarios-export-${timestamp}.csv`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send('\uFEFF' + csvContent); // BOM para UTF-8
        
      } else if (format === 'json') {
        // Gerar JSON
        const jsonData = {
          exportDate: new Date().toISOString(),
          totalUsers: users.rows.length,
          users: users.rows.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            countryCode: user.country_code,
            fullPhone: user.country_code && user.phone ? `${user.country_code} ${user.phone}` : null,
            role: user.role,
            isActive: Boolean(user.is_active),
            lastLogin: user.last_login,
            createdAt: user.created_at,
            stats: {
              totalTrades: user.total_trades,
              totalVolume: user.total_volume
            }
          }))
        };
        
        const fileName = `usuarios-export-${timestamp}.json`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(jsonData);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Formato não suportado. Use csv ou json'
        });
      }
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'users_export', {
        format,
        totalUsers: users.rows.length,
        adminId: req.user.userId
      }, req);
      
    } catch (error) {
      console.error('Erro ao exportar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar usuários'
      });
    }
  }
  
  // Export de trades em CSV/JSON
  static async exportTrades(req, res) {
    try {
      const { format = 'csv', startDate, endDate } = req.query;
      
      let whereClause = '';
      const params = [];
      
      if (startDate) {
        whereClause += ' WHERE th.created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        whereClause += (whereClause ? ' AND' : ' WHERE') + ' th.created_at <= ?';
        params.push(endDate);
      }
      
      const trades = await query(`
        SELECT 
          th.id, th.exchange, th.symbol, th.direction, th.entry_price, 
          th.stop_loss, th.target_price, th.account_size, th.risk_percent,
          th.position_size, th.risk_amount, th.reward_amount, th.risk_reward_ratio,
          th.current_price, th.calculation_data, th.created_at,
          u.email as user_email, u.name as user_name, u.phone as user_phone, u.country_code
        FROM trade_history th
        LEFT JOIN users u ON th.user_id = u.id
        ${whereClause}
        ORDER BY th.created_at DESC
      `, params);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (format === 'csv') {
        // Gerar CSV para trades
        const csvHeader = 'ID,Exchange,Símbolo,Direção,Preço Entrada,Stop Loss,Alvo,Conta,Risco %,Tamanho Posição,Valor Risco,Valor Reward,R/R,Preço Atual,Data,Usuário,Email,Telefone\n';
        const csvRows = trades.rows.map(trade => {
          const userPhone = trade.country_code && trade.user_phone ? `${trade.country_code} ${trade.user_phone}` : 'Não informado';
          const createdAt = new Date(trade.created_at).toLocaleString('pt-BR');
          
          return `"${trade.id}","${trade.exchange}","${trade.symbol}","${trade.direction}","${trade.entry_price}","${trade.stop_loss}","${trade.target_price}","${trade.account_size}","${trade.risk_percent}","${trade.position_size || 0}","${trade.risk_amount || 0}","${trade.reward_amount || 0}","${trade.risk_reward_ratio || 0}","${trade.current_price}","${createdAt}","${trade.user_name || 'N/A'}","${trade.user_email || 'N/A'}","${userPhone}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        const fileName = `trades-export-${timestamp}.csv`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send('\uFEFF' + csvContent);
        
      } else if (format === 'json') {
        // Gerar JSON para trades
        const jsonData = {
          exportDate: new Date().toISOString(),
          totalTrades: trades.rows.length,
          filters: { startDate, endDate },
          trades: trades.rows.map(trade => ({
            ...trade,
            calculation_data: trade.calculation_data ? JSON.parse(trade.calculation_data) : null,
            user: {
              name: trade.user_name,
              email: trade.user_email,
              phone: trade.user_phone,
              countryCode: trade.country_code,
              fullPhone: trade.country_code && trade.user_phone ? `${trade.country_code} ${trade.user_phone}` : null
            }
          }))
        };
        
        const fileName = `trades-export-${timestamp}.json`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(jsonData);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Formato não suportado. Use csv ou json'
        });
      }
      
      // Log da atividade
      await AdminController.logActivity(req.user.userId, 'trades_export', {
        format,
        totalTrades: trades.rows.length,
        filters: { startDate, endDate },
        adminId: req.user.userId
      }, req);
      
    } catch (error) {
      console.error('Erro ao exportar trades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao exportar trades'
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

module.exports = AdminController;