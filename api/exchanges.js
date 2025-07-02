// Mock exchanges API for Vercel
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
  
  // Mock exchanges data
  const exchanges = [
    {
      id: 'binance',
      name: 'Binance',
      active: true,
      description: 'Maior exchange de criptomoedas do mundo'
    },
    {
      id: 'bybit',
      name: 'Bybit',
      active: true,
      description: 'Exchange focada em derivativos'
    },
    {
      id: 'bingx',
      name: 'BingX',
      active: true,
      description: 'Exchange com foco em copy trading'
    },
    {
      id: 'bitget',
      name: 'Bitget',
      active: true,
      description: 'Exchange global com trading social'
    }
  ];
  
  return res.status(200).json({
    success: true,
    data: exchanges
  });
}