// Current price API for Vercel
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
  
  const { exchange, symbol } = req.query;
  
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
  
  const priceData = prices[symbol.toUpperCase()] || {
    price: '1.00',
    change24h: '0.0%',
    volume: '0'
  };
  
  return res.status(200).json({
    success: true,
    data: {
      exchange,
      symbol: symbol.toUpperCase(),
      price: priceData.price,
      change24h: priceData.change24h,
      volume: priceData.volume,
      timestamp: new Date().toISOString()
    }
  });
}