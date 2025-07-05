// Proxy alternativo específico para Bybit para contornar bloqueios de IP
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
    const { apiKey, secret, action = 'testConnection', testnet = false } = req.body;

    if (!apiKey || !secret) {
      return res.status(400).json({
        success: false,
        error: 'API Key e Secret são obrigatórios'
      });
    }

    const baseURL = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
    
    console.log(`🔧 Proxy Bybit: ${action} - ${baseURL}`);

    switch (action) {
      case 'testConnection':
        return await testBybitViaProxy(apiKey, secret, baseURL, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Ação ${action} não suportada neste proxy`
        });
    }

  } catch (error) {
    console.error('Erro no proxy Bybit:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

function createBybitV5Signature(timestamp, apiKey, recvWindow, queryParams, body, secret) {
  const param_str = timestamp + apiKey + recvWindow + (queryParams || '') + (body || '');
  return crypto.createHmac('sha256', secret).update(param_str).digest('hex');
}

async function testBybitViaProxy(apiKey, secret, baseURL, res) {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const queryParams = 'accountType=UNIFIED';
    
    const signature = createBybitV5Signature(timestamp, apiKey, recvWindow, queryParams, '', secret);
    
    // Lista de proxies públicos para tentar
    const proxyOptions = [
      // Tentar direto primeiro
      { type: 'direct', url: `${baseURL}/v5/account/wallet-balance?${queryParams}` },
      
      // Usar cors-anywhere como proxy
      { 
        type: 'cors-anywhere', 
        url: `https://cors-anywhere.herokuapp.com/${baseURL}/v5/account/wallet-balance?${queryParams}` 
      },
      
      // Usar proxy público simples
      { 
        type: 'allorigins', 
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`${baseURL}/v5/account/wallet-balance?${queryParams}`)}` 
      }
    ];

    for (let i = 0; i < proxyOptions.length; i++) {
      const option = proxyOptions[i];
      
      try {
        console.log(`🔄 Tentativa ${i + 1}/${proxyOptions.length}: ${option.type}`);
        
        const headers = {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoTrader/1.0)'
        };

        // Para cors-anywhere, adicionar header específico
        if (option.type === 'cors-anywhere') {
          headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        const response = await fetch(option.url, {
          method: 'GET',
          headers: headers,
          timeout: 10000 // 10 segundos timeout
        });

        console.log(`📊 ${option.type} response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          
          // Verificar se é uma resposta válida do Bybit
          if (data && (data.retCode !== undefined || data.result !== undefined)) {
            if (data.retCode === 0) {
              console.log(`✅ Sucesso com ${option.type}`);
              return res.json({
                success: true,
                exchangeId: 'bybit',
                message: `Conexão com Bybit estabelecida via ${option.type}`,
                hasBalance: data.result && data.result.list && data.result.list.length > 0,
                proxyUsed: option.type,
                accountData: data.result
              });
            } else {
              throw new Error(`Bybit API Error: ${data.retCode} - ${data.retMsg}`);
            }
          } else {
            console.log(`⚠️ ${option.type}: Resposta inválida`);
            continue;
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ ${option.type} falhou: ${response.status} - ${errorText.substring(0, 100)}`);
          
          // Se é o último proxy, lançar erro
          if (i === proxyOptions.length - 1) {
            throw new Error(`Todos os proxies falharam. Último erro: ${response.status} - ${errorText}`);
          }
          continue;
        }

      } catch (error) {
        console.log(`❌ ${option.type} erro: ${error.message}`);
        
        // Se é o último proxy, lançar erro
        if (i === proxyOptions.length - 1) {
          throw error;
        }
        continue;
      }
    }

    throw new Error('Todos os métodos de conexão falharam');

  } catch (error) {
    console.error('Erro final no proxy Bybit:', error);
    
    return res.json({
      success: false,
      exchangeId: 'bybit',
      error: error.message,
      suggestion: 'Tente novamente em alguns minutos ou verifique se sua API key tem as permissões corretas',
      proxiesAttempted: ['direct', 'cors-anywhere', 'allorigins']
    });
  }
}