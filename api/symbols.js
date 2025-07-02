// Mock symbols API for Vercel
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
  
  // Mock symbols data
  const symbols = [
    {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: '42500.00',
      status: 'TRADING'
    },
    {
      symbol: 'ETHUSDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      price: '2800.00',
      status: 'TRADING'
    },
    {
      symbol: 'BNBUSDT',
      baseAsset: 'BNB',
      quoteAsset: 'USDT',
      price: '320.00',
      status: 'TRADING'
    },
    {
      symbol: 'ADAUSDT',
      baseAsset: 'ADA',
      quoteAsset: 'USDT',
      price: '0.45',
      status: 'TRADING'
    },
    {
      symbol: 'DOGEUSDT',
      baseAsset: 'DOGE',
      quoteAsset: 'USDT',
      price: '0.08',
      status: 'TRADING'
    },
    {
      symbol: 'SOLUSDT',
      baseAsset: 'SOL',
      quoteAsset: 'USDT',
      price: '98.50',
      status: 'TRADING'
    },
    {
      symbol: 'MATICUSDT',
      baseAsset: 'MATIC',
      quoteAsset: 'USDT',
      price: '0.85',
      status: 'TRADING'
    },
    {
      symbol: 'DOTUSDT',
      baseAsset: 'DOT',
      quoteAsset: 'USDT',
      price: '6.20',
      status: 'TRADING'
    }
  ];
  
  return res.status(200).json({
    success: true,
    data: symbols
  });
}