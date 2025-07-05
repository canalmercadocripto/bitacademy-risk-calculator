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
            apiKey: process.env.REACT_APP_BINANCE_API_KEY || '',
            secret: process.env.REACT_APP_BINANCE_SECRET_KEY || '',
            sandbox: false,
            enableRateLimit: true,
            timeout: 15000,
            options: {
              defaultType: 'spot',
              adjustForTimeDifference: true
            }
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
    
    // Fallback para exchanges bloqueadas geograficamente
    const getMockSymbols = (exchangeName) => {
      const mockSymbols = {
        binance: [
          { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', price: '67453.21' },
          { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', price: '3542.89' },
          { symbol: 'BNB/USDT', baseAsset: 'BNB', quoteAsset: 'USDT', status: 'TRADING', price: '692.14' },
          { symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING', price: '1.0234' },
          { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING', price: '198.76' },
          { symbol: 'XRP/USDT', baseAsset: 'XRP', quoteAsset: 'USDT', status: 'TRADING', price: '2.4512' },
          { symbol: 'DOGE/USDT', baseAsset: 'DOGE', quoteAsset: 'USDT', status: 'TRADING', price: '0.3876' },
          { symbol: 'MATIC/USDT', baseAsset: 'MATIC', quoteAsset: 'USDT', status: 'TRADING', price: '0.4512' },
          { symbol: 'DOT/USDT', baseAsset: 'DOT', quoteAsset: 'USDT', status: 'TRADING', price: '7.8923' },
          { symbol: 'AVAX/USDT', baseAsset: 'AVAX', quoteAsset: 'USDT', status: 'TRADING', price: '42.67' }
        ],
        bybit: [
          { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', price: '67451.89' },
          { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', price: '3541.23' },
          { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING', price: '198.45' },
          { symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING', price: '1.0198' },
          { symbol: 'DOGE/USDT', baseAsset: 'DOGE', quoteAsset: 'USDT', status: 'TRADING', price: '0.3854' },
          { symbol: 'XRP/USDT', baseAsset: 'XRP', quoteAsset: 'USDT', status: 'TRADING', price: '2.4487' },
          { symbol: 'NEAR/USDT', baseAsset: 'NEAR', quoteAsset: 'USDT', status: 'TRADING', price: '5.67' },
          { symbol: 'SUI/USDT', baseAsset: 'SUI', quoteAsset: 'USDT', status: 'TRADING', price: '4.23' },
          { symbol: 'TRX/USDT', baseAsset: 'TRX', quoteAsset: 'USDT', status: 'TRADING', price: '0.2456' },
          { symbol: 'LTC/USDT', baseAsset: 'LTC', quoteAsset: 'USDT', status: 'TRADING', price: '104.56' }
        ]
      };
      return mockSymbols[exchangeName.toLowerCase()] || [];
    };
    
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
      
      // FORÇAR uso da API real - sem fallback para mocks
      console.log(`⚠️ ERRO NA API REAL: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: `Erro ao conectar com ${exchange}: ${error.message}`,
        error: 'API_CONNECTION_FAILED',
        source: 'real_api_only'
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
      
      // FORÇAR uso da API real - sem fallback
      return res.status(500).json({
        success: false,
        message: `Erro ao buscar preço real de ${symbol}: ${error.message}`,
        error: 'PRICE_API_FAILED',
        source: 'real_api_only'
      });
    }
  }
  
  // List all exchanges (ordem: Bingx, Bybit, Binance, Bitget)
  const exchanges = [
    { id: 'bingx', name: 'BingX', status: 'active', symbols: 800, description: 'Exchange com foco em copy trading' },
    { id: 'bybit', name: 'Bybit', status: 'active', symbols: 1500, description: 'Exchange focada em derivativos' },
    { id: 'binance', name: 'Binance', status: 'active', symbols: 2000, description: 'Maior exchange de criptomoedas do mundo' },
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