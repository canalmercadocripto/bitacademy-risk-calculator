// Simple security middleware for Market Analytics APIs

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map();

// Security middleware
const securityMiddleware = {
  // CORS headers
  corsHeaders: (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  },

  // Simple rate limiting
  apiRateLimit: (req, res) => {
    const clientId = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return null;
    }

    const clientData = rateLimitStore.get(clientId);
    
    if (now > clientData.resetTime) {
      // Reset window
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return null;
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em um minuto.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }

    clientData.count++;
    return null;
  },

  // Input sanitization
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  },

  // Validate API parameters
  validateApiParams: (params) => {
    const validEndpoints = [
      'global', 'defi', 'derivatives', 'exchanges', 'trending', 
      'companies', 'sentiment', 'market_analysis', 'institutional', 'onchain',
      'comprehensive', 'etf_flows', 'ai_insights', 'news_analysis', 'market_structure'
    ];
    
    if (params.endpoint && !validEndpoints.includes(params.endpoint)) {
      return false;
    }
    
    return true;
  }
};

module.exports = securityMiddleware;