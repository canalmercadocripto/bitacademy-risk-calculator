const securityMiddleware = require('../middleware/security');

// Market Data API - Crypto and Traditional Markets Overview
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
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate token
  const tokenResult = securityMiddleware.validateToken(req, res);
  if (tokenResult) return tokenResult;
  
  try {
    const { category = 'crypto' } = req.query;
    
    console.log(`🔍 Buscando dados de mercado: ${category}`);
    
    if (category === 'crypto') {
      // Crypto market data from CoinGecko API
      const cryptoData = await getCryptoMarketData();
      return res.status(200).json({
        success: true,
        data: cryptoData,
        timestamp: new Date().toISOString()
      });
    } else if (category === 'traditional') {
      // Traditional market data (stocks, forex, commodities)
      const traditionalData = await getTraditionalMarketData();
      return res.status(200).json({
        success: true,
        data: traditionalData,
        timestamp: new Date().toISOString()
      });
    } else if (category === 'overview') {
      // Combined overview
      const [cryptoData, traditionalData] = await Promise.all([
        getCryptoMarketData(),
        getTraditionalMarketData()
      ]);
      
      return res.status(200).json({
        success: true,
        data: {
          crypto: cryptoData,
          traditional: traditionalData,
          combined: getCombinedMetrics(cryptoData, traditionalData)
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Categoria inválida. Use: crypto, traditional, ou overview'
    });
    
  } catch (error) {
    console.error('Market Data API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Crypto Market Data from CoinGecko
async function getCryptoMarketData() {
  try {
    // Get global crypto market data
    const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
    const globalData = await globalResponse.json();
    
    // Get top cryptocurrencies
    const coinsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d'
    );
    const coinsData = await coinsResponse.json();
    
    // Get trending coins
    const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const trendingData = await trendingResponse.json();
    
    // Get fear & greed index
    const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
    const fearGreedData = await fearGreedResponse.json();
    
    // Process and format data
    const processedData = {
      global: {
        totalMarketCap: globalData.data?.total_market_cap?.usd || 0,
        totalVolume24h: globalData.data?.total_volume?.usd || 0,
        marketCapChange24h: globalData.data?.market_cap_change_percentage_24h_usd || 0,
        btcDominance: globalData.data?.market_cap_percentage?.btc || 0,
        ethDominance: globalData.data?.market_cap_percentage?.eth || 0,
        activeCryptocurrencies: globalData.data?.active_cryptocurrencies || 0
      },
      topCoins: coinsData.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        rank: coin.market_cap_rank,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
        priceChange24h: coin.price_change_percentage_24h || 0,
        priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
        image: coin.image,
        sparkline: coin.sparkline_in_7d?.price || []
      })),
      trending: trendingData.coins?.slice(0, 5).map(trend => ({
        id: trend.item.id,
        name: trend.item.name,
        symbol: trend.item.symbol,
        rank: trend.item.market_cap_rank,
        image: trend.item.large,
        score: trend.item.score
      })) || [],
      fearGreed: {
        value: parseInt(fearGreedData.data?.[0]?.value || 50),
        classification: fearGreedData.data?.[0]?.value_classification || 'Neutral',
        timestamp: fearGreedData.data?.[0]?.timestamp || Date.now()
      },
      categories: await getCryptoCategoriesData()
    };
    
    return processedData;
  } catch (error) {
    console.error('Erro ao buscar dados crypto:', error);
    // Return fallback data
    return getFallbackCryptoData();
  }
}

// Traditional Market Data (Stocks, Forex, Commodities)
async function getTraditionalMarketData() {
  try {
    // For now, return mock data - in production you would integrate with financial APIs
    // like Alpha Vantage, Yahoo Finance, or Bloomberg Terminal API
    return {
      indices: [
        {
          name: 'S&P 500',
          symbol: 'SPX',
          price: 4756.50,
          change: 23.45,
          changePercent: 0.49,
          volume: 3245000000
        },
        {
          name: 'NASDAQ',
          symbol: 'IXIC',
          price: 14845.73,
          change: -45.32,
          changePercent: -0.30,
          volume: 4123000000
        },
        {
          name: 'Dow Jones',
          symbol: 'DJI',
          price: 37123.89,
          change: 156.78,
          changePercent: 0.42,
          volume: 2876000000
        },
        {
          name: 'IBOVESPA',
          symbol: 'IBOV',
          price: 134567.89,
          change: -234.56,
          changePercent: -0.17,
          volume: 15600000000
        }
      ],
      forex: [
        {
          pair: 'EUR/USD',
          price: 1.0845,
          change: 0.0012,
          changePercent: 0.11,
          bid: 1.0843,
          ask: 1.0847
        },
        {
          pair: 'GBP/USD',
          price: 1.2634,
          change: -0.0023,
          changePercent: -0.18,
          bid: 1.2632,
          ask: 1.2636
        },
        {
          pair: 'USD/JPY',
          price: 149.67,
          change: 0.34,
          changePercent: 0.23,
          bid: 149.65,
          ask: 149.69
        },
        {
          pair: 'USD/BRL',
          price: 4.9234,
          change: 0.0123,
          changePercent: 0.25,
          bid: 4.9230,
          ask: 4.9238
        }
      ],
      commodities: [
        {
          name: 'Gold',
          symbol: 'XAU/USD',
          price: 2034.56,
          change: 12.34,
          changePercent: 0.61,
          unit: 'oz'
        },
        {
          name: 'Silver',
          symbol: 'XAG/USD',
          price: 24.67,
          change: -0.23,
          changePercent: -0.92,
          unit: 'oz'
        },
        {
          name: 'Oil (WTI)',
          symbol: 'CL',
          price: 78.45,
          change: 1.23,
          changePercent: 1.59,
          unit: 'barrel'
        },
        {
          name: 'Natural Gas',
          symbol: 'NG',
          price: 2.456,
          change: -0.034,
          changePercent: -1.37,
          unit: 'MMBtu'
        }
      ],
      bonds: [
        {
          name: 'US 10Y Treasury',
          symbol: 'TNX',
          yield: 4.567,
          change: 0.023,
          changePercent: 0.51
        },
        {
          name: 'US 2Y Treasury',
          symbol: 'TU',
          yield: 4.234,
          change: -0.012,
          changePercent: -0.28
        },
        {
          name: 'Brazil 10Y',
          symbol: 'BRA10Y',
          yield: 11.234,
          change: 0.045,
          changePercent: 0.40
        }
      ]
    };
  } catch (error) {
    console.error('Erro ao buscar dados tradicionais:', error);
    return getFallbackTraditionalData();
  }
}

// Get crypto categories performance
async function getCryptoCategoriesData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/categories');
    const categories = await response.json();
    
    return categories.slice(0, 8).map(cat => ({
      id: cat.id,
      name: cat.name,
      marketCap: cat.market_cap,
      marketCapChange24h: cat.market_cap_change_24h,
      volume24h: cat.volume_24h,
      topCoins: cat.top_3_coins || []
    }));
  } catch (error) {
    console.error('Erro ao buscar categorias crypto:', error);
    return [];
  }
}

// Combined metrics for crypto and traditional markets
function getCombinedMetrics(cryptoData, traditionalData) {
  const totalCryptoMarketCap = cryptoData.global?.totalMarketCap || 0;
  const sp500MarketCap = 45000000000000; // ~$45T estimate
  const globalStockMarketCap = 105000000000000; // ~$105T estimate
  
  return {
    cryptoToStocksRatio: ((totalCryptoMarketCap / globalStockMarketCap) * 100).toFixed(2),
    cryptoToSP500Ratio: ((totalCryptoMarketCap / sp500MarketCap) * 100).toFixed(2),
    correlations: {
      btcToSP500: 0.23, // Example correlation coefficient
      btcToGold: 0.15,
      btcToNasdaq: 0.31
    },
    summary: {
      totalCryptoMarketCap,
      cryptoMarketCapTrillion: (totalCryptoMarketCap / 1000000000000).toFixed(2),
      dominantAsset: cryptoData.global?.btcDominance > 50 ? 'Bitcoin' : 'Altcoins',
      marketSentiment: getFearGreedSentiment(cryptoData.fearGreed?.value || 50)
    }
  };
}

// Helper functions
function getFearGreedSentiment(value) {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

function getFallbackCryptoData() {
  return {
    global: {
      totalMarketCap: 1750000000000,
      totalVolume24h: 45000000000,
      marketCapChange24h: 2.34,
      btcDominance: 52.1,
      ethDominance: 17.8,
      activeCryptocurrencies: 12500
    },
    topCoins: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        rank: 1,
        price: 43256.78,
        marketCap: 846000000000,
        volume24h: 15600000000,
        priceChange1h: 0.12,
        priceChange24h: 2.34,
        priceChange7d: 5.67,
        sparkline: []
      }
    ],
    trending: [],
    fearGreed: { value: 50, classification: 'Neutral' },
    categories: []
  };
}

function getFallbackTraditionalData() {
  return {
    indices: [],
    forex: [],
    commodities: [],
    bonds: []
  };
}