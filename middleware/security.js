const security = require('../lib/security');

// Rate limiting instances
const loginRateLimit = security.createRateLimit();
const apiRateLimit = security.createRateLimit();

// Security middleware
const securityMiddleware = {
  // CORS with restricted origins
  corsHeaders: (req, res) => {
    const corsConfig = security.getCORSConfig();
    const origin = req.headers.origin;
    
    if (corsConfig.origin.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  },

  // Rate limiting for login endpoints
  loginRateLimit: (req, res) => {
    const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    if (!loginRateLimit(identifier, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      return res.status(429).json({
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: 15 * 60
      });
    }
    
    return null; // Continue
  },

  // Rate limiting for general API endpoints
  apiRateLimit: (req, res) => {
    const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    if (!apiRateLimit(identifier, 100, 60 * 1000)) { // 100 requests per minute
      return res.status(429).json({
        success: false,
        message: 'Rate limit excedido. Tente novamente em alguns segundos.',
        retryAfter: 60
      });
    }
    
    return null; // Continue
  },

  // Input validation and sanitization
  validateAndSanitize: (req, res) => {
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          // Validate against SQL injection
          if (!security.validateInput(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: 'Entrada inválida detectada'
            });
          }
          
          // Sanitize input
          req.body[key] = security.sanitizeInput(req.body[key]);
        }
      }
    }
    
    return null; // Continue
  },

  // Token validation
  validateToken: (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const [userId, timestamp, role] = parts;
      const tokenAge = Date.now() - parseInt(timestamp);
      
      // Token expires after 24 hours
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      req.user = {
        id: parseInt(userId),
        role: role
      };
      
      return null; // Continue
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  },

  // Admin role check
  requireAdmin: (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso restrito para administradores'
      });
    }
    
    return null; // Continue
  }
};

module.exports = securityMiddleware;