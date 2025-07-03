const crypto = require('crypto');

// Security utilities
const security = {
  // Generate secure JWT secret
  generateJWTSecret: () => {
    return crypto.randomBytes(64).toString('hex');
  },

  // Generate secure API key
  generateAPIKey: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Hash password with salt
  hashPassword: (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
  },

  // Verify password
  verifyPassword: (password, salt, hash) => {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  },

  // Validate input for SQL injection
  validateInput: (input) => {
    if (typeof input !== 'string') return false;
    
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
      /['"`;\\]/,
      /(--|\|\||&&)/,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i
    ];
    
    return !sqlInjectionPatterns.some(pattern => pattern.test(input));
  },

  // Rate limiting helper
  createRateLimit: () => {
    const attempts = new Map();
    
    return (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier) || [];
      
      // Clean old attempts
      const validAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return false; // Rate limit exceeded
      }
      
      validAttempts.push(now);
      attempts.set(identifier, validAttempts);
      return true; // Allow request
    };
  },

  // Sanitize user input
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential XSS
      .replace(/['"`;\\]/g, '') // Remove SQL injection chars
      .trim()
      .slice(0, 1000); // Limit length
  },

  // Generate CORS configuration
  getCORSConfig: () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'https://calculator-bitacademy.vercel.app'];
    
    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  }
};

module.exports = security;