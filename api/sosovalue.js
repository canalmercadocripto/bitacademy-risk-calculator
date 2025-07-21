const securityMiddleware = require('../middleware/security');

// SoSoValue Official API Integration
// Base URL: https://openapi.sosovalue.com
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
  
  try {
    const { category = 'currencies' } = req.query;
    const API_KEY = 'SOSO-740b8b46230b4f84bc575e0e13b3985b';
    
    console.log(`🔍 Buscando dados SoSoValue: ${category}`);
    
    if (category === 'currencies') {
      const currenciesData = await getSoSoValueCurrencies(API_KEY);
      return res.status(200).json({
        success: true,
        data: currenciesData,
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    } else if (category === 'etf') {
      const etfData = await getSoSoValueETF(API_KEY);
      return res.status(200).json({
        success: true,
        data: etfData,
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    } else if (category === 'news') {
      const newsData = await getSoSoValueNews(API_KEY);
      return res.status(200).json({
        success: true,
        data: newsData,
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    } else if (category === 'all') {
      const [currenciesData, etfData, newsData] = await Promise.allSettled([
        getSoSoValueCurrencies(API_KEY),
        getSoSoValueETF(API_KEY),
        getSoSoValueNews(API_KEY)
      ]);
      
      return res.status(200).json({
        success: true,
        data: {
          currencies: currenciesData.status === 'fulfilled' ? currenciesData.value : null,
          etf: etfData.status === 'fulfilled' ? etfData.value : null,
          news: newsData.status === 'fulfilled' ? newsData.value : null,
          errors: [
            currenciesData.status === 'rejected' ? { type: 'currencies', error: currenciesData.reason.message } : null,
            etfData.status === 'rejected' ? { type: 'etf', error: etfData.reason.message } : null,
            newsData.status === 'rejected' ? { type: 'news', error: newsData.reason.message } : null
          ].filter(Boolean)
        },
        timestamp: new Date().toISOString(),
        source: 'SoSoValue'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Categoria inválida. Use: currencies, etf, news, ou all'
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

// Get all listed currencies from SoSoValue
async function getSoSoValueCurrencies(apiKey) {
  const baseUrl = 'https://openapi.sosovalue.com';
  const headers = {
    'x-soso-api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'BitAcademy-Market-Overview/1.0'
  };
  
  console.log('🔍 Buscando currencies da SoSoValue...');
  
  try {
    const endpoint = '/openapi/v1/data/default/coin/list';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Currencies data found: ${data?.data?.length || 0} currencies`);
      
      return {
        endpoint,
        raw: data,
        processed: processCurrenciesData(data)
      };
    } else {
      const errorData = await response.text();
      console.log(`⚠️ Currencies API returned: ${response.status} ${response.statusText}`);
      console.log('Error response:', errorData);
      throw new Error(`SoSoValue API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Currencies API error: ${error.message}`);
    throw new Error(`Falha ao buscar currencies: ${error.message}`);
  }
}

// Get ETF data from SoSoValue
async function getSoSoValueETF(apiKey) {
  const baseUrl = 'https://openapi.sosovalue.com';
  const headers = {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'BitAcademy-Market-Overview/1.0'
  };
  
  console.log('🔍 Buscando ETF data da SoSoValue...');
  
  // Try different possible endpoints for ETF data
  const etfEndpoints = [
    '/v1/etf/current',
    '/v1/etf',
    '/etf/current',
    '/etf',
    '/v1/etf/bitcoin',
    '/v1/etf/ethereum',
    '/v1/etf/historical',
    '/api/etf'
  ];
  
  for (const endpoint of etfEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ETF data found at: ${endpoint}`);
        
        return {
          endpoint,
          raw: data,
          processed: processETFData(data)
        };
      } else {
        console.log(`⚠️ ETF endpoint ${endpoint} returned: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ETF endpoint ${endpoint} error: ${error.message}`);
    }
  }
  
  throw new Error('Nenhum endpoint de ETF da SoSoValue funcionou');
}

// Get featured news from SoSoValue
async function getSoSoValueNews(apiKey) {
  const baseUrl = 'https://openapi.sosovalue.com';
  const headers = {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'BitAcademy-Market-Overview/1.0'
  };
  
  console.log('🔍 Buscando news da SoSoValue...');
  
  // Try different possible endpoints for news
  const newsEndpoints = [
    '/v1/news/featured',
    '/v1/news',
    '/news/featured',
    '/news',
    '/v1/feed',
    '/feed',
    '/api/news'
  ];
  
  for (const endpoint of newsEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ News data found at: ${endpoint}`);
        
        return {
          endpoint,
          raw: data,
          processed: processNewsData(data)
        };
      } else {
        console.log(`⚠️ News endpoint ${endpoint} returned: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ News endpoint ${endpoint} error: ${error.message}`);
    }
  }
  
  throw new Error('Nenhum endpoint de news da SoSoValue funcionou');
}

// Process currencies data
function processCurrenciesData(data) {
  if (!data) return null;
  
  try {
    // Handle SoSoValue API structure: { code: 0, data: [...] }
    const currencies = data.data || [];
    
    if (Array.isArray(currencies)) {
      return {
        total: currencies.length,
        currencies: currencies.slice(0, 100).map(currency => ({
          id: currency.currencyId || currency.id,
          name: currency.fullName || currency.name || 'Unknown',
          symbol: currency.currencyName || currency.symbol || 'N/A',
          // Note: This endpoint only provides basic info, not prices
          // Will need additional endpoints for market data
          price: null,
          change24h: null,
          marketCap: null,
          volume24h: null,
          rank: null,
          isSupported: true
        })),
        // Top cryptocurrencies by popularity
        topCurrencies: currencies.slice(0, 20).filter(c => 
          ['btc', 'eth', 'usdt', 'bnb', 'usdc', 'xrp', 'ada', 'doge', 'sol', 'ltc', 'dot', 'matic', 'dai', 'shib', 'wbtc', 'avax', 'uni', 'leo', 'link', 'atom'].includes(c.currencyName?.toLowerCase())
        ).map(currency => ({
          id: currency.currencyId,
          name: currency.fullName,
          symbol: currency.currencyName?.toUpperCase(),
          supported: true
        })),
        // Categories
        categories: {
          stablecoins: currencies.filter(c => 
            ['usdt', 'usdc', 'dai', 'usdd', 'tusd', 'usdp', 'usds', 'eurt', 'eurc'].includes(c.currencyName?.toLowerCase())
          ).length,
          layer1: currencies.filter(c => 
            ['btc', 'eth', 'ada', 'sol', 'dot', 'avax', 'atom', 'near', 'algo', 'xtz', 'neo', 'icp'].includes(c.currencyName?.toLowerCase())
          ).length,
          defi: currencies.filter(c => 
            ['uni', 'aave', 'crv', 'comp', 'snx', 'mkr', 'yfi', 'ldo', 'bal', 'rpl'].includes(c.currencyName?.toLowerCase())
          ).length,
          meme: currencies.filter(c => 
            ['doge', 'shib', 'pepe', 'floki', 'elon', 'babydoge'].includes(c.currencyName?.toLowerCase())
          ).length
        }
      };
    }
    
    return {
      total: 0,
      currencies: [],
      raw: data
    };
  } catch (error) {
    return {
      error: error.message,
      raw: data
    };
  }
}

// Process ETF data
function processETFData(data) {
  if (!data) return null;
  
  try {
    // Handle different possible data structures
    const etfs = data.data || data.etfs || data.results || data;
    
    if (Array.isArray(etfs)) {
      return {
        total: etfs.length,
        btcETFs: etfs.filter(etf => 
          etf.name?.toLowerCase().includes('bitcoin') || 
          etf.symbol?.toLowerCase().includes('btc') ||
          etf.ticker?.toLowerCase().includes('btc')
        ),
        ethETFs: etfs.filter(etf => 
          etf.name?.toLowerCase().includes('ethereum') || 
          etf.symbol?.toLowerCase().includes('eth') ||
          etf.ticker?.toLowerCase().includes('eth')
        ),
        allETFs: etfs.map(etf => ({
          id: etf.id || etf.symbol || etf.ticker,
          name: etf.name || 'Unknown ETF',
          symbol: etf.symbol || etf.ticker || 'N/A',
          price: etf.price || etf.nav || 0,
          change24h: etf.change_24h || etf.price_change || 0,
          volume: etf.volume || etf.trading_volume || 0,
          aum: etf.aum || etf.assets_under_management || 0,
          inflows: etf.inflows || etf.net_inflows || 0
        }))
      };
    }
    
    return {
      total: 0,
      btcETFs: [],
      ethETFs: [],
      allETFs: [],
      raw: data
    };
  } catch (error) {
    return {
      error: error.message,
      raw: data
    };
  }
}

// Process news data
function processNewsData(data) {
  if (!data) return null;
  
  try {
    // Handle different possible data structures
    const news = data.data || data.news || data.articles || data.results || data;
    
    if (Array.isArray(news)) {
      return {
        total: news.length,
        featured: news.slice(0, 5).map(article => ({
          id: article.id || Date.now() + Math.random(),
          title: article.title || article.headline || 'Sem título',
          summary: article.summary || article.description || article.excerpt || '',
          url: article.url || article.link || '#',
          publishedAt: article.published_at || article.publish_time || article.date || new Date().toISOString(),
          source: article.source || 'SoSoValue',
          category: article.category || article.tag || 'crypto',
          image: article.image || article.thumbnail || null
        })),
        latest: news.slice(0, 20).map(article => ({
          id: article.id || Date.now() + Math.random(),
          title: article.title || article.headline || 'Sem título',
          summary: article.summary || article.description || '',
          publishedAt: article.published_at || article.publish_time || article.date || new Date().toISOString(),
          source: article.source || 'SoSoValue',
          category: article.category || 'crypto'
        }))
      };
    }
    
    return {
      total: 0,
      featured: [],
      latest: [],
      raw: data
    };
  } catch (error) {
    return {
      error: error.message,
      raw: data
    };
  }
}