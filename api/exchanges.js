// Consolidated exchanges API for Vercel
export default function handler(req, res) {
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
  
  // Mock symbols for all exchanges
  const allSymbols = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: '42500.00', status: 'TRADING' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: '2800.00', status: 'TRADING' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: '320.00', status: 'TRADING' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: '0.45', status: 'TRADING' },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', price: '0.08', status: 'TRADING' },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: '98.50', status: 'TRADING' },
    { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', price: '0.85', status: 'TRADING' },
    { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', price: '6.20', status: 'TRADING' },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', price: '15.30', status: 'TRADING' },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', price: '28.50', status: 'TRADING' },
    { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', price: '7.80', status: 'TRADING' },
    { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', price: '75.20', status: 'TRADING' },
    { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT', price: '245.60', status: 'TRADING' },
    { symbol: 'XLMUSDT', baseAsset: 'XLM', quoteAsset: 'USDT', price: '0.12', status: 'TRADING' },
    { symbol: 'VETUSDT', baseAsset: 'VET', quoteAsset: 'USDT', price: '0.025', status: 'TRADING' },
    { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT', price: '4.50', status: 'TRADING' },
    { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT', price: '0.105', status: 'TRADING' },
    { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT', price: '18.90', status: 'TRADING' },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: '0.52', status: 'TRADING' },
    { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', price: '8.30', status: 'TRADING' }
  ];
  
  // Mock price data
  const prices = {
    'BTCUSDT': { price: '42500.00', change24h: '+2.5%', volume: '1.2B' },
    'ETHUSDT': { price: '2800.00', change24h: '+1.8%', volume: '800M' },
    'BNBUSDT': { price: '320.00', change24h: '-0.5%', volume: '150M' },
    'ADAUSDT': { price: '0.45', change24h: '+3.2%', volume: '90M' },
    'DOGEUSDT': { price: '0.08', change24h: '+5.1%', volume: '200M' },
    'SOLUSDT': { price: '98.50', change24h: '+4.3%', volume: '120M' },
    'MATICUSDT': { price: '0.85', change24h: '+2.1%', volume: '85M' },
    'DOTUSDT': { price: '6.20', change24h: '-1.2%', volume: '65M' },
    'LINKUSDT': { price: '15.30', change24h: '+1.5%', volume: '45M' },
    'AVAXUSDT': { price: '28.50', change24h: '+3.8%', volume: '70M' },
    'UNIUSDT': { price: '7.80', change24h: '+0.9%', volume: '35M' },
    'LTCUSDT': { price: '75.20', change24h: '+1.2%', volume: '55M' },
    'BCHUSDT': { price: '245.60', change24h: '-0.8%', volume: '40M' },
    'XLMUSDT': { price: '0.12', change24h: '+2.7%', volume: '25M' },
    'VETUSDT': { price: '0.025', change24h: '+4.5%', volume: '15M' },
    'FILUSDT': { price: '4.50', change24h: '+1.8%', volume: '30M' },
    'TRXUSDT': { price: '0.105', change24h: '+2.3%', volume: '50M' },
    'ETCUSDT': { price: '18.90', change24h: '+0.7%', volume: '20M' },
    'XRPUSDT': { price: '0.52', change24h: '+1.9%', volume: '180M' },
    'ATOMUSDT': { price: '8.30', change24h: '+3.1%', volume: '25M' }
  };
  
  // Get symbols for exchange
  if (action === 'symbols') {
    const { search = '', limit = 50 } = req.query;
    
    let filteredSymbols = allSymbols;
    if (search) {
      const searchUpper = search.toUpperCase();
      filteredSymbols = allSymbols.filter(s => 
        s.symbol.includes(searchUpper) || 
        s.baseAsset.includes(searchUpper) ||
        s.quoteAsset.includes(searchUpper)
      );
    }
    
    const limitedSymbols = filteredSymbols.slice(0, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: limitedSymbols,
      meta: { exchange, total: filteredSymbols.length, limit: parseInt(limit), search }
    });
  }
  
  // Get price for symbol
  if (action === 'price' && symbol) {
    const priceData = prices[symbol.toUpperCase()] || {
      price: '1.00', change24h: '0.0%', volume: '0'
    };
    
    return res.status(200).json({
      success: true,
      data: {
        exchange, symbol: symbol.toUpperCase(),
        price: priceData.price, change24h: priceData.change24h,
        volume: priceData.volume, timestamp: new Date().toISOString()
      }
    });
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