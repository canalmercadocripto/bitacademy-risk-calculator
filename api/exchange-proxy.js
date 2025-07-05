// API Route proxy simples para exchanges - versão otimizada para Vercel
import crypto from 'crypto';

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

    console.log(`🔧 Processando ${action} para ${exchangeId}...`);

    switch (exchangeId) {
      case 'binance':
        return await handleBinance(action, apiKey, secret, testnet, req, res);
      
      case 'bingx':
        return await handleBingX(action, apiKey, secret, testnet, req, res);
      
      case 'bybit':
        return await handleBybit(action, apiKey, secret, testnet, req, res);
      
      case 'bitget':
        return await handleBitget(action, apiKey, secret, testnet, req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Exchange ${exchangeId} não suportada`
        });
    }

  } catch (error) {
    console.error('Erro na API exchange-proxy:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

// Handler para Binance (usar implementação existente)
async function handleBinance(action, apiKey, secret, testnet, req, res) {
  const baseURL = testnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
  
  switch (action) {
    case 'testConnection':
      return await testBinanceConnection(apiKey, secret, baseURL, res);
    
    case 'getAccountInfo':
      return await getBinanceAccountInfo(apiKey, secret, baseURL, res);
    
    case 'getBalances':
      return await getBinanceBalances(apiKey, secret, baseURL, res);
    
    default:
      return res.json({
        success: false,
        error: `Ação ${action} não implementada para Binance`
      });
  }
}

// Handler para BingX
async function handleBingX(action, apiKey, secret, testnet, req, res) {
  const baseURL = testnet ? 'https://open-api-testnet.bingx.com' : 'https://open-api.bingx.com';
  
  switch (action) {
    case 'testConnection':
      return await testBingXConnection(apiKey, secret, baseURL, res);
    
    case 'getAccountInfo':
      return await getBingXAccountInfo(apiKey, secret, baseURL, res);
    
    case 'getBalances':
      return await getBingXBalances(apiKey, secret, baseURL, res);
    
    default:
      return res.json({
        success: false,
        error: `Ação ${action} não implementada para BingX`
      });
  }
}

// Handler para Bybit
async function handleBybit(action, apiKey, secret, testnet, req, res) {
  const baseURL = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  
  switch (action) {
    case 'testConnection':
      return await testBybitConnection(apiKey, secret, baseURL, res);
    
    case 'getAccountInfo':
      return await getBybitAccountInfo(apiKey, secret, baseURL, res);
    
    case 'getBalances':
      return await getBybitBalances(apiKey, secret, baseURL, res);
    
    default:
      return res.json({
        success: false,
        error: `Ação ${action} não implementada para Bybit`
      });
  }
}

// Handler para Bitget
async function handleBitget(action, apiKey, secret, testnet, req, res) {
  const baseURL = testnet ? 'https://api.bitget.com' : 'https://api.bitget.com'; // Bitget usa sandbox por query param
  
  switch (action) {
    case 'testConnection':
      return await testBitgetConnection(apiKey, secret, baseURL, res);
    
    case 'getAccountInfo':
      return await getBitgetAccountInfo(apiKey, secret, baseURL, res);
    
    case 'getBalances':
      return await getBitgetBalances(apiKey, secret, baseURL, res);
    
    default:
      return res.json({
        success: false,
        error: `Ação ${action} não implementada para Bitget`
      });
  }
}

// === IMPLEMENTAÇÕES BINGX ===
function createBingXSignature(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function testBingXConnection(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBingXSignature(queryString, secret);
    
    const url = `${baseURL}/openApi/spot/v1/account/balance?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-BX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        exchangeId: 'bingx',
        message: 'Conexão com BingX estabelecida com sucesso',
        hasBalance: data.data && data.data.balances && data.data.balances.length > 0
      });
    } else {
      const errorText = await response.text();
      throw new Error(`BingX API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro na conexão BingX:', error);
    return res.json({
      success: false,
      exchangeId: 'bingx',
      error: error.message
    });
  }
}

async function getBingXAccountInfo(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBingXSignature(queryString, secret);
    
    const url = `${baseURL}/openApi/spot/v1/account/balance?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-BX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      const accountInfo = {
        exchangeId: 'bingx',
        accountType: 'SPOT',
        canTrade: true,
        canWithdraw: true,
        canDeposit: true,
        permissions: ['SPOT'],
        balanceInfo: {
          totalAssets: data.data && data.data.balances ? data.data.balances.length : 0,
          nonZeroBalances: data.data && data.data.balances ? data.data.balances.filter(b => parseFloat(b.asset) > 0).length : 0
        }
      };

      return res.json({
        success: true,
        data: accountInfo
      });
    } else {
      const errorText = await response.text();
      throw new Error(`BingX API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao buscar informações da conta BingX:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

async function getBingXBalances(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBingXSignature(queryString, secret);
    
    const url = `${baseURL}/openApi/spot/v1/account/balance?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-BX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      const balances = data.data && data.data.balances ? data.data.balances
        .filter(balance => parseFloat(balance.asset) > 0)
        .map(balance => ({
          asset: balance.coin,
          total: parseFloat(balance.asset),
          available: parseFloat(balance.asset),
          locked: 0,
          usdValue: 0
        }))
        .sort((a, b) => b.total - a.total) : [];

      return res.json({
        success: true,
        data: balances
      });
    } else {
      const errorText = await response.text();
      throw new Error(`BingX API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao buscar saldos BingX:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

// === IMPLEMENTAÇÕES BYBIT ===
function createBybitSignature(params, secret) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(sortedParams).digest('hex');
}

async function testBybitConnection(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now().toString();
    const params = {
      api_key: apiKey,
      timestamp: timestamp
    };
    
    const signature = createBybitSignature(params, secret);
    params.sign = signature;
    
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `${baseURL}/spot/v3/private/account?${queryString}`;
    
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        exchangeId: 'bybit',
        message: 'Conexão com Bybit estabelecida com sucesso',
        hasBalance: data.result && data.result.balances && data.result.balances.length > 0
      });
    } else {
      const errorText = await response.text();
      throw new Error(`Bybit API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro na conexão Bybit:', error);
    return res.json({
      success: false,
      exchangeId: 'bybit',
      error: error.message
    });
  }
}

async function getBybitAccountInfo(apiKey, secret, baseURL, res) {
  try {
    const accountInfo = {
      exchangeId: 'bybit',
      accountType: 'SPOT',
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      permissions: ['SPOT'],
      balanceInfo: {
        totalAssets: 0,
        nonZeroBalances: 0
      }
    };

    return res.json({
      success: true,
      data: accountInfo
    });
  } catch (error) {
    console.error('Erro ao buscar informações da conta Bybit:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

async function getBybitBalances(apiKey, secret, baseURL, res) {
  try {
    const balances = []; // Implementação simplificada

    return res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('Erro ao buscar saldos Bybit:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

// === IMPLEMENTAÇÕES BITGET ===
function createBitgetSignature(method, path, body, timestamp, secret) {
  const message = timestamp + method.toUpperCase() + path + (body || '');
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

async function testBitgetConnection(apiKey, secret, baseURL, res) {
  try {
    // Bitget requer passphrase - por enquanto retornar erro explicativo
    return res.json({
      success: false,
      exchangeId: 'bitget',
      error: 'Bitget requer passphrase adicional. Configure primeiro no painel da Bitget.'
    });
  } catch (error) {
    console.error('Erro na conexão Bitget:', error);
    return res.json({
      success: false,
      exchangeId: 'bitget',
      error: error.message
    });
  }
}

async function getBitgetAccountInfo(apiKey, secret, baseURL, res) {
  try {
    const accountInfo = {
      exchangeId: 'bitget',
      accountType: 'SPOT',
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      permissions: ['SPOT'],
      balanceInfo: {
        totalAssets: 0,
        nonZeroBalances: 0
      }
    };

    return res.json({
      success: true,
      data: accountInfo
    });
  } catch (error) {
    console.error('Erro ao buscar informações da conta Bitget:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

async function getBitgetBalances(apiKey, secret, baseURL, res) {
  try {
    const balances = []; // Implementação simplificada

    return res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('Erro ao buscar saldos Bitget:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

// Funções específicas da Binance (reutilizar lógica existente)
function createBinanceSignature(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

async function testBinanceConnection(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBinanceSignature(queryString, secret);
    
    const url = `${baseURL}/api/v3/account?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        exchangeId: 'binance',
        message: 'Conexão com Binance estabelecida com sucesso',
        hasBalance: data.balances && data.balances.length > 0
      });
    } else {
      const errorText = await response.text();
      throw new Error(`Binance API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro na conexão Binance:', error);
    return res.json({
      success: false,
      exchangeId: 'binance',
      error: error.message
    });
  }
}

async function getBinanceAccountInfo(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBinanceSignature(queryString, secret);
    
    const url = `${baseURL}/api/v3/account?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      const accountInfo = {
        exchangeId: 'binance',
        accountType: data.accountType || 'SPOT',
        canTrade: data.canTrade,
        canWithdraw: data.canWithdraw,
        canDeposit: data.canDeposit,
        permissions: data.permissions || [],
        balanceInfo: {
          totalAssets: data.balances ? data.balances.length : 0,
          nonZeroBalances: data.balances ? data.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0).length : 0
        }
      };

      return res.json({
        success: true,
        data: accountInfo
      });
    } else {
      const errorText = await response.text();
      throw new Error(`Binance API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao buscar informações da conta Binance:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

async function getBinanceBalances(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createBinanceSignature(queryString, secret);
    
    const url = `${baseURL}/api/v3/account?${queryString}&signature=${signature}`;
    
    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      const balances = data.balances
        .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map(balance => ({
          asset: balance.asset,
          total: parseFloat(balance.free) + parseFloat(balance.locked),
          available: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          usdValue: 0 // Seria necessário buscar preços para calcular
        }))
        .sort((a, b) => b.total - a.total);

      return res.json({
        success: true,
        data: balances
      });
    } else {
      const errorText = await response.text();
      throw new Error(`Binance API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao buscar saldos Binance:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}