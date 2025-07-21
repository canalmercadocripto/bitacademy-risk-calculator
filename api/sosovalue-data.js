const securityMiddleware = require('../middleware/security');

// SoSoValue API - Crypto ETF and News Data
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  // Apply rate limiting (SoSoValue has 20 calls/min limit)
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // SoSoValue is public data - no token validation required
  
  try {
    const { category = 'etf' } = req.query;
    
    console.log(`🔍 Buscando dados SoSoValue: ${category}`);
    
    if (category === 'etf') {
      // ETF data from SoSoValue
      const etfData = await getSoSoValueETFData();
      return res.status(200).json({
        success: true,
        data: etfData,
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    } else if (category === 'news') {
      // Crypto news from SoSoValue
      const newsData = await getSoSoValueNewsData();
      return res.status(200).json({
        success: true,
        data: newsData,
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    } else if (category === 'all') {
      // Combined data
      const [etfData, newsData] = await Promise.all([
        getSoSoValueETFData(),
        getSoSoValueNewsData()
      ]);
      
      return res.status(200).json({
        success: true,
        data: {
          etf: etfData,
          news: newsData
        },
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Categoria inválida. Use: etf, news, ou all'
    });
    
  } catch (error) {
    console.error('SoSoValue API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// SoSoValue ETF Data
async function getSoSoValueETFData() {
  try {
    const API_KEY = 'SOSO-740b8b46230b4f84bc575e0e13b3985b';
    const baseUrl = 'https://api.sosovalue.com';
    const headers = {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('🔍 Buscando dados ETF da SoSoValue...');
    
    // Try different possible endpoints for ETF data
    const etfEndpoints = [
      '/v1/etf/current',
      '/v1/etf/metrics',
      '/v1/etf/historical',
      '/etf/current',
      '/etf/metrics',
      '/api/v1/etf',
      '/api/etf'
    ];
    
    let etfData = null;
    let successfulEndpoint = null;
    
    for (const endpoint of etfEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ETF data found at: ${endpoint}`);
          etfData = data;
          successfulEndpoint = endpoint;
          break;
        } else {
          console.log(`⚠️ ETF endpoint ${endpoint} returned: ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ ETF endpoint ${endpoint} error: ${err.message}`);
      }
    }
    
    // If no specific ETF endpoints work, try currencies endpoint
    if (!etfData) {
      try {
        const response = await fetch(`${baseUrl}/v1/currencies`, { headers });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Using currencies data as fallback for ETF');
          etfData = {
            currencies: data,
            fallback: true
          };
          successfulEndpoint = '/v1/currencies';
        }
      } catch (err) {
        console.log(`❌ Currencies fallback error: ${err.message}`);
      }
    }
    
    if (!etfData) {
      throw new Error('Nenhum endpoint ETF da SoSoValue funcionou');
    }
    
    // Process and format ETF data
    const processedData = {
      endpoint: successfulEndpoint,
      raw: etfData,
      processed: {
        btcETFs: [],
        ethETFs: [],
        totalInflows: 0,
        totalOutflows: 0,
        netFlows: 0,
        topPerformers: [],
        summary: {
          totalAssets: 0,
          averageExpense: 0,
          marketCap: 0
        }
      }
    };
    
    // Try to extract meaningful ETF data from response
    if (etfData.data && Array.isArray(etfData.data)) {
      processedData.processed.btcETFs = etfData.data.filter(item => 
        item.name?.toLowerCase().includes('bitcoin') || item.symbol?.toLowerCase().includes('btc')
      ).slice(0, 10);
      
      processedData.processed.ethETFs = etfData.data.filter(item => 
        item.name?.toLowerCase().includes('ethereum') || item.symbol?.toLowerCase().includes('eth')
      ).slice(0, 10);
    }
    
    return processedData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados ETF SoSoValue:', error.message);
    throw new Error(`Falha ao buscar dados ETF: ${error.message}`);
  }
}

// SoSoValue News Data
async function getSoSoValueNewsData() {
  try {
    const API_KEY = 'SOSO-740b8b46230b4f84bc575e0e13b3985b';
    const baseUrl = 'https://api.sosovalue.com';
    const headers = {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('🔍 Buscando notícias cripto da SoSoValue...');
    
    // Try different possible endpoints for news data
    const newsEndpoints = [
      '/v1/news',
      '/v1/news/featured',
      '/v1/feed/news',
      '/news',
      '/news/featured',
      '/api/v1/news',
      '/api/news'
    ];
    
    let newsData = null;
    let successfulEndpoint = null;
    
    for (const endpoint of newsEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ News data found at: ${endpoint}`);
          newsData = data;
          successfulEndpoint = endpoint;
          break;
        } else {
          console.log(`⚠️ News endpoint ${endpoint} returned: ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ News endpoint ${endpoint} error: ${err.message}`);
      }
    }
    
    if (!newsData) {
      throw new Error('Nenhum endpoint de notícias da SoSoValue funcionou');
    }
    
    // Process and format news data
    const processedData = {
      endpoint: successfulEndpoint,
      raw: newsData,
      processed: {
        featured: [],
        latest: [],
        categories: [],
        totalCount: 0,
        lastUpdate: new Date().toISOString()
      }
    };
    
    // Try to extract meaningful news data from response
    if (newsData.data && Array.isArray(newsData.data)) {
      processedData.processed.latest = newsData.data.slice(0, 20).map(article => ({
        id: article.id || Date.now() + Math.random(),
        title: article.title || article.headline || 'Sem título',
        summary: article.summary || article.description || '',
        url: article.url || article.link || '#',
        publishedAt: article.publishedAt || article.published || article.date || new Date().toISOString(),
        source: article.source || 'SoSoValue',
        category: article.category || 'crypto',
        image: article.image || article.thumbnail || null
      }));
      
      processedData.processed.featured = processedData.processed.latest.slice(0, 5);
      processedData.processed.totalCount = newsData.data.length;
    }
    
    return processedData;
  } catch (error) {
    console.error('❌ Erro ao buscar notícias SoSoValue:', error.message);
    throw new Error(`Falha ao buscar notícias: ${error.message}`);
  }
}