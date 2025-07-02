// Real exchanges API using CCXT
const ccxt = require('ccxt');

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
  
  // Função para criar exchange instance
  const createExchange = (exchangeName) => {
    try {
      switch (exchangeName.toLowerCase()) {
        case 'binance':
          return new ccxt.binance({
            apiKey: '',
            secret: '',
            sandbox: false,
            enableRateLimit: true,
            timeout: 10000,
          });
        case 'bybit':
          return new ccxt.bybit({
            apiKey: '',
            secret: '',
            sandbox: false,
            enableRateLimit: true,
            timeout: 10000,
          });
        case 'bingx':
          return new ccxt.bingx({
            apiKey: '',
            secret: '',
            sandbox: false,
            enableRateLimit: true,
            timeout: 10000,
          });
        case 'bitget':
          return new ccxt.bitget({
            apiKey: '',
            secret: '',
            sandbox: false,
            enableRateLimit: true,
            timeout: 10000,
          });
        default:
          return null;
      }
    } catch (error) {
      console.error(`Erro ao criar exchange ${exchangeName}:`, error);
      return null;
    }
  };
  
  // Get symbols for exchange
  if (action === 'symbols') {
    const { search = '', limit = 500 } = req.query;
    
    try {
      const exchangeInstance = createExchange(exchange);
      if (!exchangeInstance) {
        return res.status(400).json({
          success: false,
          message: `Exchange ${exchange} não suportada`
        });
      }
      
      console.log(`🔍 Buscando símbolos da ${exchange}...`);
      
      // Carregar mercados
      await exchangeInstance.loadMarkets();
      const markets = exchangeInstance.markets;
      
      console.log(`📊 Total de mercados carregados: ${Object.keys(markets).length}`);
      
      // Filtrar apenas pares USDT ativos
      let symbols = Object.values(markets)
        .filter(market => 
          market.active && 
          market.spot && 
          market.quote === 'USDT'
        )
        .map(market => ({
          symbol: market.symbol,
          baseAsset: market.base,
          quoteAsset: market.quote,
          status: 'TRADING',
          price: '0.00'
        }));
      
      console.log(`💰 Pares USDT encontrados: ${symbols.length}`);
      
      // Filtrar por busca se fornecida
      if (search) {
        const searchUpper = search.toUpperCase();
        symbols = symbols.filter(s => 
          s.symbol.includes(searchUpper) || 
          s.baseAsset.includes(searchUpper)
        );
      }
      
      // Limitar resultados
      const limitedSymbols = symbols.slice(0, parseInt(limit));
      
      return res.status(200).json({
        success: true,
        data: limitedSymbols,
        meta: { 
          exchange, 
          total: symbols.length, 
          limit: parseInt(limit), 
          search,
          source: 'real_ccxt',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao buscar símbolos da ${exchange}:`, error);
      
      // Fallback mínimo
      const fallbackSymbols = [
        { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', price: '0.00' },
        { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', price: '0.00' },
        { symbol: 'BNB/USDT', baseAsset: 'BNB', quoteAsset: 'USDT', status: 'TRADING', price: '0.00' },
        { symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING', price: '0.00' },
        { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING', price: '0.00' }
      ];
      
      return res.status(200).json({
        success: true,
        data: fallbackSymbols,
        meta: { 
          exchange, 
          total: fallbackSymbols.length, 
          limit: parseInt(limit), 
          search,
          source: 'fallback',
          error: error.message
        }
      });
    }
  }
  
  // Get price for symbol
  if (action === 'price' && symbol) {
    try {
      const exchangeInstance = createExchange(exchange);
      if (!exchangeInstance) {
        return res.status(400).json({
          success: false,
          message: `Exchange ${exchange} não suportada`
        });
      }
      
      console.log(`💰 Buscando preço de ${symbol} na ${exchange}...`);
      
      // Normalizar símbolo (BTCUSDT -> BTC/USDT)
      let normalizedSymbol = symbol;
      if (!symbol.includes('/') && symbol.includes('USDT')) {
        const base = symbol.replace('USDT', '');
        normalizedSymbol = `${base}/USDT`;
      }
      
      console.log(`🔄 Símbolo normalizado: ${normalizedSymbol}`);
      
      // Buscar ticker (preço atual)
      const ticker = await exchangeInstance.fetchTicker(normalizedSymbol);
      
      console.log(`✅ Ticker recebido:`, {
        last: ticker.last,
        change: ticker.change,
        percentage: ticker.percentage,
        volume: ticker.baseVolume
      });
      
      return res.status(200).json({
        success: true,
        data: {
          exchange,
          symbol: normalizedSymbol,
          price: ticker.last.toFixed(8),
          change24h: `${ticker.percentage >= 0 ? '+' : ''}${ticker.percentage.toFixed(2)}%`,
          volume: ticker.baseVolume ? ticker.baseVolume.toFixed(0) : '0',
          high24h: ticker.high ? ticker.high.toFixed(8) : ticker.last.toFixed(8),
          low24h: ticker.low ? ticker.low.toFixed(8) : ticker.last.toFixed(8),
          timestamp: new Date().toISOString(),
          source: 'real_ccxt'
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao buscar preço de ${symbol}:`, error);
      
      // Fallback com preço mock
      return res.status(200).json({
        success: true,
        data: {
          exchange,
          symbol: symbol,
          price: '1.00000000',
          change24h: '0.00%',
          volume: '0',
          high24h: '1.00000000',
          low24h: '1.00000000',
          timestamp: new Date().toISOString(),
          source: 'fallback',
          error: error.message
        }
      });
    }
  }
  
  // List all exchanges
  const exchanges = [
    { id: 'binance', name: 'Binance', status: 'active', symbols: 2000, description: 'Maior exchange de criptomoedas do mundo' },
    { id: 'bybit', name: 'Bybit', status: 'active', symbols: 1500, description: 'Exchange focada em derivativos' },
    { id: 'bingx', name: 'BingX', status: 'active', symbols: 800, description: 'Exchange com foco em copy trading' },
    { id: 'bitget', name: 'Bitget', status: 'active', symbols: 1000, description: 'Exchange global com trading social' }
  ];
  
  return res.status(200).json({
    success: true,
    data: exchanges,
    meta: {
      total: exchanges.length,
      source: 'ccxt_supported'
    }
  });
};