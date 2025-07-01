const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }
    
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bitacademy-secret-key');
    
    // Verificar se usuário ainda existe e está ativo
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - usuário não encontrado'
      });
    }
    
    // Adicionar dados do usuário na requisição
    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware de autorização para admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado - privilégios de administrador requeridos'
    });
  }
};

// Middleware de autorização para usuário ou admin
const requireUser = (req, res, next) => {
  if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado - login requerido'
    });
  }
};

// Middleware opcional de autenticação (não bloqueia se não houver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bitacademy-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }
    
    next();
    
  } catch (error) {
    // Se houver erro no token opcional, apenas continue sem autenticação
    next();
  }
};

// Middleware para verificar se é o próprio usuário ou admin
const requireSelfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'admin' || req.user.userId === targetUserId) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado - você só pode acessar seus próprios dados'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  optionalAuth,
  requireSelfOrAdmin
};