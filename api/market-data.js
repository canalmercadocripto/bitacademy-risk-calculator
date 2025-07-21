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
  
  // Market data is public - no token validation required
  
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
    const API_KEY = 'CG-wW7zVyYNt4zzQ7uo3iVk5u5A';
    const headers = {
      'accept': 'application/json',
      'x-cg-demo-api-key': API_KEY
    };
    
    console.log('🔍 Buscando dados completos do CoinGecko...');
    
    // Parallel API calls for all data
    const [
      globalResponse,
      coinsResponse,
      gainersResponse,
      losersResponse,
      exchangesResponse,
      btcCompaniesResponse,
      ethCompaniesResponse,
      newCoinsResponse,
      exchangeRatesResponse
    ] = await Promise.allSettled([
      // Global crypto market data
      fetch('https://api.coingecko.com/api/v3/global', { headers }),
      
      // Top cryptocurrencies with extended data
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d%2C200d%2C1y', { headers }),
      
      // Top gainers (24h)
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=10&page=1&price_change_percentage=24h', { headers }),
      
      // Top losers (24h)
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_asc&per_page=10&page=1&price_change_percentage=24h', { headers }),
      
      // Top exchanges
      fetch('https://api.coingecko.com/api/v3/exchanges?per_page=20', { headers }),
      
      // Bitcoin company holdings
      fetch('https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin', { headers }),
      
      // Ethereum company holdings
      fetch('https://api.coingecko.com/api/v3/companies/public_treasury/ethereum', { headers }),
      
      // Recently added coins
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=id_asc&per_page=10&page=1', { headers }),
      
      // Exchange rates
      fetch('https://api.coingecko.com/api/v3/exchange_rates', { headers })
    ]);

    // Process Global Data
    const globalData = globalResponse.status === 'fulfilled' && globalResponse.value.ok ? 
      await globalResponse.value.json() : null;
    console.log('✅ Global data:', globalData?.data ? 'OK' : 'FAILED');

    // Process all API responses
    const gainersData = gainersResponse.status === 'fulfilled' && gainersResponse.value.ok ? 
      await gainersResponse.value.json() : [];
    console.log('✅ Gainers data:', gainersData.length, 'coins');

    const losersData = losersResponse.status === 'fulfilled' && losersResponse.value.ok ? 
      await losersResponse.value.json() : [];
    console.log('✅ Losers data:', losersData.length, 'coins');

    const exchangesData = exchangesResponse.status === 'fulfilled' && exchangesResponse.value.ok ? 
      await exchangesResponse.value.json() : [];
    console.log('✅ Exchanges data:', exchangesData.length, 'exchanges');

    const btcCompaniesData = btcCompaniesResponse.status === 'fulfilled' && btcCompaniesResponse.value.ok ? 
      await btcCompaniesResponse.value.json() : { companies: [] };
    console.log('✅ BTC Companies data:', btcCompaniesData.companies?.length || 0, 'companies');

    const ethCompaniesData = ethCompaniesResponse.status === 'fulfilled' && ethCompaniesResponse.value.ok ? 
      await ethCompaniesResponse.value.json() : { companies: [] };
    console.log('✅ ETH Companies data:', ethCompaniesData.companies?.length || 0, 'companies');

    const newCoinsData = newCoinsResponse.status === 'fulfilled' && newCoinsResponse.value.ok ? 
      await newCoinsResponse.value.json() : [];
    console.log('✅ New Coins data:', newCoinsData.length, 'coins');

    const exchangeRatesData = exchangeRatesResponse.status === 'fulfilled' && exchangeRatesResponse.value.ok ? 
      await exchangeRatesResponse.value.json() : { rates: {} };
    console.log('✅ Exchange Rates data:', Object.keys(exchangeRatesData.rates || {}).length, 'rates');
    
    // Get trending coins
    const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending', { headers });
    
    if (!trendingResponse.ok) {
      throw new Error(`Trending API failed: ${trendingResponse.status} ${trendingResponse.statusText}`);
    }
    
    const trendingData = await trendingResponse.json();
    console.log('✅ Trending data received:', trendingData.coins ? trendingData.coins.length : 0, 'coins');
    
    // Get fear & greed index (no API key needed)
    const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
    let fearGreedData = null;
    
    if (fearGreedResponse.ok) {
      fearGreedData = await fearGreedResponse.json();
      console.log('✅ Fear & Greed data received:', fearGreedData.data ? 'OK' : 'EMPTY');
    } else {
      console.warn('⚠️ Fear & Greed API failed, using fallback');
    }
    
    // Process and format data
    const processedData = {
      global: {
        totalMarketCap: globalData?.data?.total_market_cap?.usd || 0,
        totalVolume24h: globalData?.data?.total_volume?.usd || 0,
        marketCapChange24h: globalData?.data?.market_cap_change_percentage_24h_usd || 0,
        btcDominance: globalData?.data?.market_cap_percentage?.btc || 0,
        ethDominance: globalData?.data?.market_cap_percentage?.eth || 0,
        activeCryptocurrencies: globalData?.data?.active_cryptocurrencies || 0,
        activeMarkets: globalData?.data?.markets || 0,
        endedIcos: globalData?.data?.ended_icos || 0,
        upcomingIcos: globalData?.data?.upcoming_icos || 0,
        ongoingIcos: globalData?.data?.ongoing_icos || 0
      },
      topCoins: coinsData.slice(0, 20).map(coin => ({
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
        priceChange14d: coin.price_change_percentage_14d_in_currency || 0,
        priceChange30d: coin.price_change_percentage_30d_in_currency || 0,
        priceChange200d: coin.price_change_percentage_200d_in_currency || 0,
        priceChange1y: coin.price_change_percentage_1y_in_currency || 0,
        image: coin.image,
        sparkline: coin.sparkline_in_7d?.price || [],
        ath: coin.ath,
        athDate: coin.ath_date,
        atl: coin.atl,
        atlDate: coin.atl_date,
        maxSupply: coin.max_supply,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply
      })),
      
      // Top Gainers (24h)
      topGainers: gainersData.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        rank: coin.market_cap_rank,
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h || 0,
        image: coin.image,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume
      })),

      // Top Losers (24h)
      topLosers: losersData.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        rank: coin.market_cap_rank,
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h || 0,
        image: coin.image,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume
      })),

      // Top Exchanges
      topExchanges: exchangesData.slice(0, 15).map(exchange => ({
        id: exchange.id,
        name: exchange.name,
        image: exchange.image,
        trustScore: exchange.trust_score,
        trustScoreRank: exchange.trust_score_rank,
        tradeVolume24hBtc: exchange.trade_volume_24h_btc,
        tradeVolume24hBtcNormalized: exchange.trade_volume_24h_btc_normalized,
        yearEstablished: exchange.year_established,
        country: exchange.country,
        description: exchange.description?.slice(0, 100) + '...' || '',
        url: exchange.url,
        hasTradingIncentive: exchange.has_trading_incentive
      })),

      // Company Holdings
      companyHoldings: {
        bitcoin: {
          totalHoldings: btcCompaniesData.total_holdings || 0,
          totalValueUsd: btcCompaniesData.total_value_usd || 0,
          marketCapDominance: btcCompaniesData.market_cap_dominance || 0,
          companies: btcCompaniesData.companies?.slice(0, 10).map(company => ({
            name: company.name,
            symbol: company.symbol,
            country: company.country,
            totalHoldings: company.total_holdings,
            totalEntryValueUsd: company.total_entry_value_usd,
            totalCurrentValueUsd: company.total_current_value_usd,
            percentageOfTotalSupply: company.percentage_of_total_supply
          })) || []
        },
        ethereum: {
          totalHoldings: ethCompaniesData.total_holdings || 0,
          totalValueUsd: ethCompaniesData.total_value_usd || 0,
          marketCapDominance: ethCompaniesData.market_cap_dominance || 0,
          companies: ethCompaniesData.companies?.slice(0, 10).map(company => ({
            name: company.name,
            symbol: company.symbol,
            country: company.country,
            totalHoldings: company.total_holdings,
            totalEntryValueUsd: company.total_entry_value_usd,
            totalCurrentValueUsd: company.total_current_value_usd,
            percentageOfTotalSupply: company.percentage_of_total_supply
          })) || []
        }
      },

      // Recently Added Coins
      newCoins: newCoinsData.slice(0, 10).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        rank: coin.market_cap_rank,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_percentage_24h || 0,
        image: coin.image,
        addedDate: coin.atl_date // Approximation
      })),

      // Exchange Rates (Major Fiat)
      exchangeRates: {
        btcToUsd: exchangeRatesData.rates?.usd?.value || 0,
        btcToEur: exchangeRatesData.rates?.eur?.value || 0,
        btcToBrl: exchangeRatesData.rates?.brl?.value || 0,
        btcToJpy: exchangeRatesData.rates?.jpy?.value || 0,
        btcToGbp: exchangeRatesData.rates?.gbp?.value || 0,
        rates: Object.keys(exchangeRatesData.rates || {}).slice(0, 20).map(key => ({
          currency: key.toUpperCase(),
          name: exchangeRatesData.rates[key]?.name || key,
          value: exchangeRatesData.rates[key]?.value || 0,
          type: exchangeRatesData.rates[key]?.type || 'fiat'
        }))
      },
      trending: trendingData.coins?.slice(0, 5).map(trend => ({
        id: trend.item.id,
        name: trend.item.name,
        symbol: trend.item.symbol,
        rank: trend.item.market_cap_rank,
        image: trend.item.large,
        score: trend.item.score
      })) || [],
      fearGreed: fearGreedData ? {
        value: parseInt(fearGreedData.data?.[0]?.value || 50),
        classification: fearGreedData.data?.[0]?.value_classification || 'Neutral',
        timestamp: fearGreedData.data?.[0]?.timestamp || Date.now()
      } : {
        value: 50,
        classification: 'Neutral',
        timestamp: Date.now()
      },

      // Advanced Market Metrics
      marketMetrics: {
        // Volatility Analysis
        volatility: {
          high: coinsData.filter(coin => Math.abs(coin.price_change_percentage_24h || 0) > 20).length,
          medium: coinsData.filter(coin => {
            const change = Math.abs(coin.price_change_percentage_24h || 0);
            return change > 10 && change <= 20;
          }).length,
          low: coinsData.filter(coin => Math.abs(coin.price_change_percentage_24h || 0) <= 10).length,
          avgVolatility: coinsData.length > 0 ? 
            coinsData.reduce((sum, coin) => sum + Math.abs(coin.price_change_percentage_24h || 0), 0) / coinsData.length : 0
        },
        
        // Supply Metrics
        supply: {
          totalMarketSupply: coinsData.reduce((sum, coin) => sum + (coin.circulating_supply || 0), 0),
          inflationaryCoins: coinsData.filter(coin => !coin.max_supply).length,
          deflationaryCoins: coinsData.filter(coin => coin.max_supply && coin.circulating_supply >= coin.max_supply * 0.9).length,
          distributedCoins: coinsData.filter(coin => coin.circulating_supply && coin.total_supply && 
            coin.circulating_supply / coin.total_supply > 0.8).length
        },

        // Performance Rankings
        performance: {
          topPerformers1h: coinsData
            .filter(coin => coin.price_change_percentage_1h_in_currency)
            .sort((a, b) => (b.price_change_percentage_1h_in_currency || 0) - (a.price_change_percentage_1h_in_currency || 0))
            .slice(0, 5)
            .map(coin => ({
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              change: coin.price_change_percentage_1h_in_currency,
              image: coin.image
            })),
          
          topPerformers7d: coinsData
            .filter(coin => coin.price_change_percentage_7d_in_currency)
            .sort((a, b) => (b.price_change_percentage_7d_in_currency || 0) - (a.price_change_percentage_7d_in_currency || 0))
            .slice(0, 5)
            .map(coin => ({
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              change: coin.price_change_percentage_7d_in_currency,
              image: coin.image
            })),

          topPerformers30d: coinsData
            .filter(coin => coin.price_change_percentage_30d_in_currency)
            .sort((a, b) => (b.price_change_percentage_30d_in_currency || 0) - (a.price_change_percentage_30d_in_currency || 0))
            .slice(0, 5)
            .map(coin => ({
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              change: coin.price_change_percentage_30d_in_currency,
              image: coin.image
            }))
        },

        // Market Health
        health: {
          bullishCoins: coinsData.filter(coin => (coin.price_change_percentage_24h || 0) > 5).length,
          bearishCoins: coinsData.filter(coin => (coin.price_change_percentage_24h || 0) < -5).length,
          stableCoins: coinsData.filter(coin => Math.abs(coin.price_change_percentage_24h || 0) <= 5).length,
          marketSentiment: coinsData.filter(coin => (coin.price_change_percentage_24h || 0) > 0).length > coinsData.length / 2 ? 'Bullish' : 'Bearish',
          athProximity: coinsData
            .filter(coin => coin.ath && coin.current_price)
            .map(coin => (coin.current_price / coin.ath) * 100)
            .reduce((sum, ratio) => sum + ratio, 0) / coinsData.filter(coin => coin.ath).length || 0
        }
      },

      categories: await getCryptoCategoriesData(headers)
    };
    
    return processedData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados crypto:', error.message);
    throw new Error(`Falha ao buscar dados de criptomoedas: ${error.message}`);
  }
}

// Traditional Market Data (Stocks, Forex, Commodities)
async function getTraditionalMarketData() {
  try {
    console.log('🔍 Buscando dados reais do mercado tradicional...');
    
    // Using Yahoo Finance API (free alternative)
    const symbols = [
      '^GSPC', // S&P 500
      '^IXIC', // NASDAQ
      '^DJI',  // Dow Jones
      '^BVSP', // IBOVESPA
      'EURUSD=X', // EUR/USD
      'GBPUSD=X', // GBP/USD
      'USDJPY=X', // USD/JPY
      'USDBRL=X', // USD/BRL
      'GC=F',     // Gold Futures
      'SI=F',     // Silver Futures
      'CL=F',     // Crude Oil
      'NG=F'      // Natural Gas
    ];
    
    const promises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        );
        
        if (!response.ok) {
          throw new Error(`Yahoo Finance API failed for ${symbol}: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.chart?.result?.[0];
        const meta = result?.meta;
        const quote = result?.indicators?.quote?.[0];
        
        if (!meta || !quote) {
          throw new Error(`Invalid data for ${symbol}`);
        }
        
        const currentPrice = meta.regularMarketPrice || quote.close?.[quote.close.length - 1];
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          symbol,
          currentPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
          previousClose,
          marketCap: meta.marketCap,
          currency: meta.currency
        };
      } catch (error) {
        console.error(`❌ Erro ao buscar ${symbol}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);
    
    console.log(`✅ Yahoo Finance data received: ${validResults.length}/${symbols.length} símbolos`);
    
    // Helper function to find data by symbol
    const findBySymbol = (symbol) => validResults.find(r => r.symbol === symbol);
    
    // Process results into categories
    const processedData = {
      indices: [
        {
          name: 'S&P 500',
          symbol: 'SPX',
          ...(findBySymbol('^GSPC') || { price: 0, change: 0, changePercent: 0, volume: 0 })
        },
        {
          name: 'NASDAQ',
          symbol: 'IXIC', 
          ...(findBySymbol('^IXIC') || { price: 0, change: 0, changePercent: 0, volume: 0 })
        },
        {
          name: 'Dow Jones',
          symbol: 'DJI',
          ...(findBySymbol('^DJI') || { price: 0, change: 0, changePercent: 0, volume: 0 })
        },
        {
          name: 'IBOVESPA',
          symbol: 'IBOV',
          ...(findBySymbol('^BVSP') || { price: 0, change: 0, changePercent: 0, volume: 0 })
        }
      ].map(index => ({
        ...index,
        price: index.currentPrice || index.price,
        change: index.change || 0,
        changePercent: index.changePercent || 0,
        volume: index.volume || 0
      })),
      
      forex: [
        {
          pair: 'EUR/USD',
          ...(findBySymbol('EURUSD=X') || { currentPrice: 0, change: 0, changePercent: 0 }),
          bid: 0, // Yahoo doesn't provide bid/ask
          ask: 0
        },
        {
          pair: 'GBP/USD',
          ...(findBySymbol('GBPUSD=X') || { currentPrice: 0, change: 0, changePercent: 0 }),
          bid: 0,
          ask: 0
        },
        {
          pair: 'USD/JPY',
          ...(findBySymbol('USDJPY=X') || { currentPrice: 0, change: 0, changePercent: 0 }),
          bid: 0,
          ask: 0
        },
        {
          pair: 'USD/BRL',
          ...(findBySymbol('USDBRL=X') || { currentPrice: 0, change: 0, changePercent: 0 }),
          bid: 0,
          ask: 0
        }
      ].map(forex => ({
        ...forex,
        price: forex.currentPrice || 0,
        change: forex.change || 0,
        changePercent: forex.changePercent || 0
      })),
      
      commodities: [
        {
          name: 'Gold',
          symbol: 'GC=F',
          unit: 'oz',
          ...(findBySymbol('GC=F') || { currentPrice: 0, change: 0, changePercent: 0 })
        },
        {
          name: 'Silver', 
          symbol: 'SI=F',
          unit: 'oz',
          ...(findBySymbol('SI=F') || { currentPrice: 0, change: 0, changePercent: 0 })
        },
        {
          name: 'Oil (WTI)',
          symbol: 'CL=F',
          unit: 'barrel',
          ...(findBySymbol('CL=F') || { currentPrice: 0, change: 0, changePercent: 0 })
        },
        {
          name: 'Natural Gas',
          symbol: 'NG=F',
          unit: 'MMBtu',
          ...(findBySymbol('NG=F') || { currentPrice: 0, change: 0, changePercent: 0 })
        }
      ].map(commodity => ({
        ...commodity,
        price: commodity.currentPrice || 0,
        change: commodity.change || 0,
        changePercent: commodity.changePercent || 0
      })),
      
      bonds: [
        {
          name: 'US 10Y Treasury',
          symbol: 'TNX',
          yield: 4.567, // Yahoo doesn't provide bond yields in this endpoint
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
    
    return processedData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados tradicionais:', error.message);
    throw new Error(`Falha ao buscar dados de mercado tradicional: ${error.message}`);
  }
}

// Get crypto categories performance
async function getCryptoCategoriesData(headers) {
  try {
    
    const response = await fetch('https://api.coingecko.com/api/v3/coins/categories', { headers });
    
    if (!response.ok) {
      throw new Error(`Categories API failed: ${response.status} ${response.statusText}`);
    }
    
    const categories = await response.json();
    console.log('✅ Categories data received:', categories.length, 'categories');
    
    return categories.slice(0, 8).map(cat => ({
      id: cat.id,
      name: cat.name,
      marketCap: cat.market_cap,
      marketCapChange24h: cat.market_cap_change_24h,
      volume24h: cat.volume_24h,
      topCoins: cat.top_3_coins || []
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar categorias crypto:', error);
    throw new Error(`Falha ao buscar categorias: ${error.message}`);
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

