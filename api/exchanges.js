// Consolidated exchanges API for Vercel
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  const { action, exchange, symbol } = req.query;
  
  // Função para buscar dados reais da Binance com timeout
  const fetchBinanceData = async (endpoint, timeoutMs = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(`https://api.binance.com/api/v3/${endpoint}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BitAcademy-Calculator/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados da Binance:', error.message);
      return null;
    }
  };
  
  // Função para buscar dados reais da Bybit com timeout
  const fetchBybitData = async (endpoint, timeoutMs = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(`https://api.bybit.com/v5/${endpoint}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BitAcademy-Calculator/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados da Bybit:', error.message);
      return null;
    }
  };
  
  // Mock symbols como fallback
  const allSymbols = [
    // Top cryptocurrencies
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: '42500.00', status: 'TRADING' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: '2800.00', status: 'TRADING' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: '320.00', status: 'TRADING' },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: '0.52', status: 'TRADING' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: '0.45', status: 'TRADING' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: '98.50', status: 'TRADING' },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', price: '0.08', status: 'TRADING' },
    { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', price: '0.85', status: 'TRADING' },
    { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', price: '75.20', status: 'TRADING' },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', price: '28.50', status: 'TRADING' },
    
    // DeFi tokens
    { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', price: '7.80', status: 'TRADING' },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', price: '15.30', status: 'TRADING' },
    { symbol: 'AAVEUSDT', baseAsset: 'AAVE', quoteAsset: 'USDT', price: '85.40', status: 'TRADING' },
    { symbol: 'SUSHIUSDT', baseAsset: 'SUSHI', quoteAsset: 'USDT', price: '1.25', status: 'TRADING' },
    { symbol: 'COMPUSDT', baseAsset: 'COMP', quoteAsset: 'USDT', price: '45.80', status: 'TRADING' },
    { symbol: 'MKRUSDT', baseAsset: 'MKR', quoteAsset: 'USDT', price: '1580.50', status: 'TRADING' },
    { symbol: 'CRVUSDT', baseAsset: 'CRV', quoteAsset: 'USDT', price: '0.95', status: 'TRADING' },
    { symbol: '1INCHUSDT', baseAsset: '1INCH', quoteAsset: 'USDT', price: '0.42', status: 'TRADING' },
    
    // Layer 1 & Layer 2
    { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', price: '6.20', status: 'TRADING' },
    { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', price: '8.30', status: 'TRADING' },
    { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT', price: '2.15', status: 'TRADING' },
    { symbol: 'ALGOUSDT', baseAsset: 'ALGO', quoteAsset: 'USDT', price: '0.18', status: 'TRADING' },
    { symbol: 'FTMUSDT', baseAsset: 'FTM', quoteAsset: 'USDT', price: '0.35', status: 'TRADING' },
    { symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT', price: '2.45', status: 'TRADING' },
    { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', price: '1.85', status: 'TRADING' },
    
    // Gaming & Metaverse
    { symbol: 'AXSUSDT', baseAsset: 'AXS', quoteAsset: 'USDT', price: '6.80', status: 'TRADING' },
    { symbol: 'MANAUSDT', baseAsset: 'MANA', quoteAsset: 'USDT', price: '0.48', status: 'TRADING' },
    { symbol: 'SANDUSDT', baseAsset: 'SAND', quoteAsset: 'USDT', price: '0.52', status: 'TRADING' },
    { symbol: 'ENJUSDT', baseAsset: 'ENJ', quoteAsset: 'USDT', price: '0.38', status: 'TRADING' },
    { symbol: 'GALAUSDT', baseAsset: 'GALA', quoteAsset: 'USDT', price: '0.025', status: 'TRADING' },
    
    // Meme coins
    { symbol: 'SHIBUSDT', baseAsset: 'SHIB', quoteAsset: 'USDT', price: '0.000012', status: 'TRADING' },
    { symbol: 'PEPEUSDT', baseAsset: 'PEPE', quoteAsset: 'USDT', price: '0.00000085', status: 'TRADING' },
    { symbol: 'FLOKIUSDT', baseAsset: 'FLOKI', quoteAsset: 'USDT', price: '0.000185', status: 'TRADING' },
    
    // Traditional coins
    { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT', price: '245.60', status: 'TRADING' },
    { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT', price: '18.90', status: 'TRADING' },
    { symbol: 'XLMUSDT', baseAsset: 'XLM', quoteAsset: 'USDT', price: '0.12', status: 'TRADING' },
    { symbol: 'VETUSDT', baseAsset: 'VET', quoteAsset: 'USDT', price: '0.025', status: 'TRADING' },
    { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT', price: '4.50', status: 'TRADING' },
    { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', price: '0.105', status: 'TRADING' },
    
    // AI & Tech
    { symbol: 'FETUSDT', baseAsset: 'FET', quoteAsset: 'USDT', price: '1.25', status: 'TRADING' },
    { symbol: 'AGIXUSDT', baseAsset: 'AGIX', quoteAsset: 'USDT', price: '0.48', status: 'TRADING' },
    { symbol: 'OCEANUSDT', baseAsset: 'OCEAN', quoteAsset: 'USDT', price: '0.58', status: 'TRADING' },
    { symbol: 'RENDERUSDT', baseAsset: 'RENDER', quoteAsset: 'USDT', price: '7.85', status: 'TRADING' },
    
    // Storage & Infrastructure
    { symbol: 'ARUSDT', baseAsset: 'AR', quoteAsset: 'USDT', price: '12.50', status: 'TRADING' },
    { symbol: 'STORJUSDT', baseAsset: 'STORJ', quoteAsset: 'USDT', price: '0.65', status: 'TRADING' },
    
    // Privacy coins
    { symbol: 'XMRUSDT', baseAsset: 'XMR', quoteAsset: 'USDT', price: '158.50', status: 'TRADING' },
    { symbol: 'ZECUSDT', baseAsset: 'ZEC', quoteAsset: 'USDT', price: '28.40', status: 'TRADING' },
    
    // Stablecoins pairs
    { symbol: 'BTCBUSD', baseAsset: 'BTC', quoteAsset: 'BUSD', price: '42500.00', status: 'TRADING' },
    { symbol: 'ETHBUSD', baseAsset: 'ETH', quoteAsset: 'BUSD', price: '2800.00', status: 'TRADING' },
    { symbol: 'BTCUSDC', baseAsset: 'BTC', quoteAsset: 'USDC', price: '42500.00', status: 'TRADING' },
    { symbol: 'ETHUSDC', baseAsset: 'ETH', quoteAsset: 'USDC', price: '2800.00', status: 'TRADING' },
    
    // Cross pairs
    { symbol: 'ETHBTC', baseAsset: 'ETH', quoteAsset: 'BTC', price: '0.0658', status: 'TRADING' },
    { symbol: 'BNBBTC', baseAsset: 'BNB', quoteAsset: 'BTC', price: '0.00752', status: 'TRADING' },
    { symbol: 'ADABTC', baseAsset: 'ADA', quoteAsset: 'BTC', price: '0.00001058', status: 'TRADING' },
    
    // Additional popular pairs
    { symbol: 'APTUSDT', baseAsset: 'APT', quoteAsset: 'USDT', price: '8.45', status: 'TRADING' },
    { symbol: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT', price: '1.85', status: 'TRADING' },
    { symbol: 'INJUSDT', baseAsset: 'INJ', quoteAsset: 'USDT', price: '28.50', status: 'TRADING' },
    { symbol: 'THETAUSDT', baseAsset: 'THETA', quoteAsset: 'USDT', price: '1.45', status: 'TRADING' },
    { symbol: 'ICPUSDT', baseAsset: 'ICP', quoteAsset: 'USDT', price: '12.85', status: 'TRADING' },
    { symbol: 'HBARUSDT', baseAsset: 'HBAR', quoteAsset: 'USDT', price: '0.085', status: 'TRADING' },
    { symbol: 'QNTUSDT', baseAsset: 'QNT', quoteAsset: 'USDT', price: '125.50', status: 'TRADING' },
    { symbol: 'LDOUSDT', baseAsset: 'LDO', quoteAsset: 'USDT', price: '2.85', status: 'TRADING' },
    { symbol: 'RPLUTUSDT', baseAsset: 'RPL', quoteAsset: 'USDT', price: '28.50', status: 'TRADING' },
    { symbol: 'IMXUSDT', baseAsset: 'IMX', quoteAsset: 'USDT', price: '1.65', status: 'TRADING' }
  ];
  
  // Mock price data - Expandido para corresponder aos símbolos
  const prices = {};
  
  // Gerar preços automaticamente para todos os símbolos
  allSymbols.forEach(symbolData => {
    const basePrice = parseFloat(symbolData.price);
    const variation = (Math.random() - 0.5) * 0.1; // Variação de -5% a +5%
    const currentPrice = (basePrice * (1 + variation)).toFixed(8);
    const change24h = `${variation >= 0 ? '+' : ''}${(variation * 100).toFixed(2)}%`;
    const volume = Math.random() < 0.1 ? `${(Math.random() * 5 + 0.5).toFixed(1)}B` : 
                  Math.random() < 0.3 ? `${(Math.random() * 900 + 100).toFixed(0)}M` : 
                  `${(Math.random() * 90 + 10).toFixed(0)}M`;
    
    prices[symbolData.symbol] = {
      price: currentPrice,
      change24h,
      volume
    };
  });
  
  // Get symbols for exchange
  if (action === 'symbols') {
    const { search = '', limit = 200 } = req.query;
    
    try {
      let symbols = [];
      
      // SEMPRE buscar dados reais primeiro
      if (exchange.toLowerCase() === 'binance') {
        const binanceData = await fetchBinanceData('exchangeInfo', 8000); // Timeout maior
        if (binanceData && binanceData.symbols) {
          symbols = binanceData.symbols
            .filter(s => s.status === 'TRADING' && s.symbol.includes('USDT'))
            .map(s => ({
              symbol: s.symbol,
              baseAsset: s.baseAsset,
              quoteAsset: s.quoteAsset,
              status: s.status,
              price: '0.00'
            }));
        }
      } else if (exchange.toLowerCase() === 'bybit') {
        const bybitData = await fetchBybitData('market/instruments-info?category=spot', 8000);
        if (bybitData && bybitData.result && bybitData.result.list) {
          symbols = bybitData.result.list
            .filter(s => s.status === 'Trading' && s.symbol.includes('USDT'))
            .map(s => ({
              symbol: s.symbol,
              baseAsset: s.baseCoin,
              quoteAsset: s.quoteCoin,
              status: 'TRADING',
              price: '0.00'
            }));
        }
      }
      
      // Usar mock data como padrão ou fallback
      if (symbols.length === 0) {
        symbols = allSymbols;
      }
      
      // Filtrar por busca
      if (search) {
        const searchUpper = search.toUpperCase();
        symbols = symbols.filter(s => 
          s.symbol.includes(searchUpper) || 
          s.baseAsset.includes(searchUpper) ||
          s.quoteAsset.includes(searchUpper)
        );
      }
      
      const limitedSymbols = symbols.slice(0, parseInt(limit));
      
      return res.status(200).json({
        success: true,
        data: limitedSymbols,
        meta: { 
          exchange, 
          total: symbols.length, 
          limit: parseInt(limit), 
          search, 
          source: symbols === allSymbols ? 'mock' : 'real'
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar símbolos:', error);
      // Fallback garantido para dados mock
      let symbols = allSymbols;
      
      if (search) {
        const searchUpper = search.toUpperCase();
        symbols = symbols.filter(s => 
          s.symbol.includes(searchUpper) || 
          s.baseAsset.includes(searchUpper) ||
          s.quoteAsset.includes(searchUpper)
        );
      }
      
      const limitedSymbols = symbols.slice(0, parseInt(limit));
      return res.status(200).json({
        success: true,
        data: limitedSymbols,
        meta: { exchange, total: symbols.length, limit: parseInt(limit), search, source: 'mock_error_fallback' }
      });
    }
  }
  
  // Get price for symbol
  if (action === 'price' && symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    try {
      let priceData = null;
      
      // SEMPRE buscar dados reais primeiro com timeout maior
      if (exchange.toLowerCase() === 'binance') {
        const tickerData = await fetchBinanceData(`ticker/24hr?symbol=${symbolUpper}`, 8000);
        if (tickerData) {
          priceData = {
            price: parseFloat(tickerData.lastPrice).toFixed(8),
            change24h: `${parseFloat(tickerData.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(tickerData.priceChangePercent).toFixed(2)}%`,
            volume: parseFloat(tickerData.volume).toFixed(0),
            high24h: parseFloat(tickerData.highPrice).toFixed(8),
            low24h: parseFloat(tickerData.lowPrice).toFixed(8)
          };
        }
      } else if (exchange.toLowerCase() === 'bybit') {
        const tickerData = await fetchBybitData(`market/tickers?category=spot&symbol=${symbolUpper}`, 8000);
        if (tickerData && tickerData.result && tickerData.result.list && tickerData.result.list[0]) {
          const ticker = tickerData.result.list[0];
          priceData = {
            price: parseFloat(ticker.lastPrice).toFixed(8),
            change24h: `${parseFloat(ticker.price24hPcnt) >= 0 ? '+' : ''}${(parseFloat(ticker.price24hPcnt) * 100).toFixed(2)}%`,
            volume: parseFloat(ticker.volume24h).toFixed(0),
            high24h: parseFloat(ticker.highPrice24h).toFixed(8),
            low24h: parseFloat(ticker.lowPrice24h).toFixed(8)
          };
        }
      }
      
      // Fallback para dados mock se API falhar
      if (!priceData) {
        const mockPrice = prices[symbolUpper] || {
          price: '1.00', change24h: '0.0%', volume: '0'
        };
        priceData = {
          ...mockPrice,
          high24h: mockPrice.price,
          low24h: mockPrice.price
        };
      }
      
      const isRealData = priceData && priceData.high24h && priceData.low24h;
      
      return res.status(200).json({
        success: true,
        data: {
          exchange, symbol: symbolUpper,
          price: priceData.price,
          change24h: priceData.change24h,
          volume: priceData.volume,
          high24h: priceData.high24h,
          low24h: priceData.low24h,
          timestamp: new Date().toISOString(),
          source: isRealData ? 'real' : 'mock'
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar preço:', error);
      // Fallback para dados mock
      const mockPrice = prices[symbolUpper] || {
        price: '1.00', change24h: '0.0%', volume: '0'
      };
      
      return res.status(200).json({
        success: true,
        data: {
          exchange, symbol: symbolUpper,
          price: mockPrice.price,
          change24h: mockPrice.change24h,
          volume: mockPrice.volume,
          timestamp: new Date().toISOString(),
          source: 'mock_fallback'
        }
      });
    }
  }
  
  // List all exchanges
  const exchanges = [
    { id: 'binance', name: 'Binance', status: 'active', symbols: 400, description: 'Maior exchange de criptomoedas do mundo' },
    { id: 'bybit', name: 'Bybit', status: 'active', symbols: 300, description: 'Exchange focada em derivativos' },
    { id: 'bingx', name: 'BingX', status: 'active', symbols: 250, description: 'Exchange com foco em copy trading' },
    { id: 'bitget', name: 'Bitget', status: 'active', symbols: 200, description: 'Exchange global com trading social' }
  ];
  
  return res.status(200).json({
    success: true,
    data: exchanges
  });
}