// API Route para conectar com múltiplas exchanges usando CCXT
import ccxt from 'ccxt';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, exchangeId, apiKey, secret, testnet = false } = req.body;

    if (!action || !exchangeId || !apiKey || !secret) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: action, exchangeId, apiKey, secret'
      });
    }

    // Configurações das exchanges
    const exchangeConfigs = {
      binance: {
        class: ccxt.binance,
        testnet: testnet ? 'https://testnet.binance.vision' : undefined
      },
      bingx: {
        class: ccxt.bingx,
        testnet: testnet ? 'https://open-api-testnet.bingx.com' : undefined
      },
      bybit: {
        class: ccxt.bybit,
        testnet: testnet ? true : false,
        // Configurações específicas do Bybit
        options: {
          defaultType: 'spot', // Usar spot por padrão
          adjustForTimeDifference: true
        }
      },
      bitget: {
        class: ccxt.bitget,
        testnet: testnet ? true : false,
        // Configurações específicas do Bitget
        options: {
          defaultType: 'spot'
        }
      }
    };

    const config = exchangeConfigs[exchangeId];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `Exchange ${exchangeId} não suportada. Exchanges disponíveis: ${Object.keys(exchangeConfigs).join(', ')}`
      });
    }

    // Inicializar exchange
    const exchangeOptions = {
      apiKey,
      secret,
      timeout: 30000,
      enableRateLimit: true,
      ...config.options // Aplicar configurações específicas da exchange
    };

    if (config.testnet) {
      if (typeof config.testnet === 'string') {
        exchangeOptions.urls = { api: config.testnet };
      } else {
        exchangeOptions.sandbox = config.testnet;
      }
    }

    console.log(`🏗️ Inicializando ${exchangeId} com opções:`, {
      ...exchangeOptions,
      apiKey: apiKey ? 'configurada' : 'não configurada',
      secret: secret ? 'configurada' : 'não configurada'
    });

    const exchange = new config.class(exchangeOptions);

    switch (action) {
      case 'testConnection':
        return await testConnection(exchange, exchangeId, res);
      
      case 'getAccountInfo':
        return await getAccountInfo(exchange, exchangeId, res);
      
      case 'getBalances':
        return await getBalances(exchange, exchangeId, res);
      
      case 'getTradingHistory':
        const { symbol, limit = 500, startTime, endTime } = req.body;
        return await getTradingHistory(exchange, exchangeId, symbol, limit, startTime, endTime, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Ação ${action} não suportada`
        });
    }

  } catch (error) {
    console.error('Erro na API multi-exchange:', error);
    
    // Log detalhado do erro para debug
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      exchangeId: req.body?.exchangeId
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      errorType: error.name || 'UnknownError'
    });
  }
}

// Testar conexão
async function testConnection(exchange, exchangeId, res) {
  try {
    console.log(`🔧 Testando conexão ${exchangeId}...`);
    
    // Log da configuração da exchange
    console.log(`📋 Configuração ${exchangeId}:`, {
      id: exchange.id,
      sandbox: exchange.sandbox,
      apiKey: exchange.apiKey ? 'configurada' : 'não configurada',
      secret: exchange.secret ? 'configurada' : 'não configurada'
    });
    
    // Testar conexão básica primeiro
    console.log(`📡 Carregando markets ${exchangeId}...`);
    await exchange.loadMarkets();
    console.log(`✅ Markets carregados para ${exchangeId}`);
    
    // Verificar se as credenciais funcionam tentando buscar saldo
    console.log(`💰 Buscando saldo ${exchangeId}...`);
    const balance = await exchange.fetchBalance();
    console.log(`✅ Saldo obtido para ${exchangeId}:`, Object.keys(balance.total).length, 'ativos');
    
    return res.json({
      success: true,
      exchangeId,
      message: `Conexão com ${exchangeId} estabelecida com sucesso`,
      hasBalance: Object.keys(balance.total).length > 0
    });
    
  } catch (error) {
    console.error(`❌ Erro na conexão ${exchangeId}:`, error);
    
    // Log detalhado do erro específico
    console.error(`❌ Detalhes do erro ${exchangeId}:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0] // Primeira linha do stack
    });
    
    return res.json({
      success: false,
      exchangeId,
      error: error.message || 'Erro desconhecido na conexão',
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
}

// Obter informações da conta
async function getAccountInfo(exchange, exchangeId, res) {
  try {
    console.log(`📊 Buscando informações da conta ${exchangeId}...`);
    
    const balance = await exchange.fetchBalance();
    const status = await exchange.fetchStatus();
    
    const accountInfo = {
      exchangeId,
      accountType: 'SPOT', // Default, pode ser customizado por exchange
      canTrade: status?.status === 'ok',
      canWithdraw: true, // Default, pode verificar permissões específicas
      canDeposit: true,
      status: status?.status || 'unknown',
      balanceInfo: {
        totalAssets: Object.keys(balance.total).length,
        nonZeroBalances: Object.entries(balance.total).filter(([asset, amount]) => amount > 0).length
      }
    };

    // Informações específicas por exchange
    if (exchangeId === 'binance') {
      try {
        const account = await exchange.fapiPrivateGetAccount(); // Binance específico
        accountInfo.accountType = account.accountType || 'SPOT';
        accountInfo.canTrade = account.canTrade || false;
        accountInfo.canWithdraw = account.canWithdraw || false;
        accountInfo.canDeposit = account.canDeposit || false;
        accountInfo.permissions = account.permissions || [];
      } catch (binanceError) {
        console.log('Informações específicas da Binance não disponíveis:', binanceError.message);
      }
    }
    
    return res.json({
      success: true,
      data: accountInfo
    });
    
  } catch (error) {
    console.error(`❌ Erro ao buscar informações da conta ${exchangeId}:`, error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

// Obter saldos
async function getBalances(exchange, exchangeId, res) {
  try {
    console.log(`💰 Buscando saldos ${exchangeId}...`);
    
    const balance = await exchange.fetchBalance();
    const tickers = await exchange.fetchTickers();
    
    const balances = [];
    
    for (const [asset, amounts] of Object.entries(balance.total)) {
      if (amounts > 0) {
        const total = amounts;
        let usdValue = 0;
        
        // Tentar calcular valor em USD
        const usdtPair = `${asset}/USDT`;
        const usdPair = `${asset}/USD`;
        const btcPair = `${asset}/BTC`;
        
        if (asset === 'USDT' || asset === 'USD' || asset === 'BUSD') {
          usdValue = total;
        } else if (tickers[usdtPair]) {
          usdValue = total * tickers[usdtPair].last;
        } else if (tickers[usdPair]) {
          usdValue = total * tickers[usdPair].last;
        } else if (tickers[btcPair] && tickers['BTC/USDT']) {
          usdValue = total * tickers[btcPair].last * tickers['BTC/USDT'].last;
        }
        
        balances.push({
          asset,
          total: total,
          available: balance.free[asset] || 0,
          locked: balance.used[asset] || 0,
          usdValue
        });
      }
    }
    
    // Ordenar por valor USD decrescente
    balances.sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
    
    return res.json({
      success: true,
      data: balances
    });
    
  } catch (error) {
    console.error(`❌ Erro ao buscar saldos ${exchangeId}:`, error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

// Obter histórico de trades
async function getTradingHistory(exchange, exchangeId, symbol, limit, startTime, endTime, res) {
  try {
    console.log(`📈 Buscando histórico de trades ${exchangeId} para ${symbol}...`);
    
    const params = {};
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    
    const trades = await exchange.fetchMyTrades(symbol, undefined, limit, params);
    
    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      timestamp: trade.timestamp,
      symbol: trade.symbol,
      side: trade.side.toUpperCase(),
      amount: trade.amount,
      price: trade.price,
      cost: trade.cost,
      fee: {
        cost: trade.fee?.cost || 0,
        currency: trade.fee?.currency || 'UNKNOWN'
      },
      exchangeId,
      rawData: trade
    }));
    
    return res.json({
      success: true,
      data: formattedTrades
    });
    
  } catch (error) {
    console.error(`❌ Erro ao buscar histórico ${exchangeId}:`, error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}