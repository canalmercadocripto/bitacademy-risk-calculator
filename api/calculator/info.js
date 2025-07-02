// Calculator info API for Vercel
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
  
  return res.status(200).json({
    success: true,
    data: {
      name: 'BitAcademy Risk Calculator',
      version: '1.0.0',
      description: 'Calculadora profissional de gerenciamento de risco para trading',
      features: [
        'Cálculo de position sizing',
        'Risk/Reward ratio',
        'Stop loss e take profit',
        'Múltiplas exchanges',
        'Histórico de trades',
        'Análise de performance'
      ],
      supportedExchanges: [
        'Binance',
        'Bybit', 
        'BingX',
        'Bitget'
      ],
      riskLevels: {
        conservative: { min: 0.5, max: 1.5, description: 'Conservador' },
        moderate: { min: 1.5, max: 3.0, description: 'Moderado' },
        aggressive: { min: 3.0, max: 5.0, description: 'Agressivo' },
        extreme: { min: 5.0, max: 10.0, description: 'Extremo' }
      },
      calculations: {
        positionSize: 'Tamanho da posição baseado no risco',
        riskAmount: 'Valor total em risco',
        rewardAmount: 'Lucro potencial',
        riskRewardRatio: 'Razão risco/recompensa',
        marginRequired: 'Margem necessária',
        fees: 'Estimativa de taxas'
      },
      lastUpdated: new Date().toISOString()
    }
  });
}