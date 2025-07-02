// Symbols by exchange API for Vercel
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
  
  const { exchange } = req.query;
  const { search = '', limit = 50 } = req.query;
  
  // Mock symbols data for all exchanges
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
  
  // Filter symbols based on search
  let filteredSymbols = allSymbols;
  
  if (search) {
    const searchUpper = search.toUpperCase();
    filteredSymbols = allSymbols.filter(symbol => 
      symbol.symbol.includes(searchUpper) || 
      symbol.baseAsset.includes(searchUpper) ||
      symbol.quoteAsset.includes(searchUpper)
    );
  }
  
  // Apply limit
  const limitedSymbols = filteredSymbols.slice(0, parseInt(limit));
  
  return res.status(200).json({
    success: true,
    data: limitedSymbols,
    meta: {
      exchange,
      total: filteredSymbols.length,
      limit: parseInt(limit),
      search
    }
  });
}