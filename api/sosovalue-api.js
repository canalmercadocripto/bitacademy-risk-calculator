const securityMiddleware = require('../middleware/security');

// SoSoValue API Integration - Real API endpoints discovery
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  // Apply rate limiting (SoSoValue has 20 calls/min limit)
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  try {
    const { endpoint = 'test' } = req.query;
    const API_KEY = 'SOSO-740b8b46230b4f84bc575e0e13b3985b';
    
    console.log(`🔍 Testando SoSoValue endpoint: ${endpoint}`);
    
    // Discover working endpoints
    const discoveryResult = await discoverSoSoValueEndpoints(API_KEY);
    
    return res.status(200).json({
      success: true,
      data: discoveryResult,
      timestamp: new Date().toISOString(),
      source: 'SoSoValue API Discovery',
      note: 'Descobrindo endpoints funcionais da API SoSoValue'
    });
    
  } catch (error) {
    console.error('SoSoValue API Discovery error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro na descoberta da API SoSoValue',
      error: error.message,
      suggestion: 'A API da SoSoValue pode ainda estar em desenvolvimento ou requer documentação técnica específica'
    });
  }
};

// Discover SoSoValue API endpoints systematically
async function discoverSoSoValueEndpoints(apiKey) {
  console.log('🔍 Iniciando descoberta sistemática da API SoSoValue...');
  
  // Official API domain from documentation
  const possibleDomains = [
    'https://openapi.sosovalue.com',
    'https://open-api.sosovalue.com', 
    'https://api.sosovalue.com'
  ];
  
  const possibleEndpoints = [
    // Currency endpoints
    '/v1/currencies',
    '/v1/currencies/list',
    '/currencies',
    '/currencies/all',
    '/api/v1/currencies',
    
    // ETF endpoints  
    '/v1/etf',
    '/v1/etf/current',
    '/v1/etf/bitcoin',
    '/v1/etf/ethereum',
    '/v1/etf/historical',
    '/v1/etf/inflow',
    '/etf',
    '/etf/data',
    '/etf/metrics',
    '/api/v1/etf',
    
    // News endpoints
    '/v1/news',
    '/v1/news/featured',
    '/v1/news/crypto',
    '/v1/feed',
    '/news',
    '/news/featured',
    '/feed/news',
    '/api/v1/news',
    
    // Market data
    '/v1/market',
    '/v1/market/data',
    '/v1/data',
    '/market',
    '/data',
    '/api/v1/market'
  ];
  
  const authHeaders = [
    { 'X-API-KEY': apiKey },
    { 'Authorization': `Bearer ${apiKey}` },
    { 'Authorization': `API-Key ${apiKey}` },
    { 'API-Key': apiKey },
    { 'X-Auth-Token': apiKey },
    { 'Authentication': apiKey }
  ];
  
  const discoveryResults = {
    workingEndpoints: [],
    failedDomains: [],
    testedCombinations: 0,
    errors: [],
    summary: {},
    apiKeyValid: false,
    recommendedAction: ''
  };
  
  // Test domain resolution first
  for (const domain of possibleDomains) {
    try {
      const baseUrl = new URL(domain);
      console.log(`🔍 Testing domain: ${baseUrl.hostname}`);
      
      // Try basic connectivity
      for (const endpoint of possibleEndpoints.slice(0, 3)) { // Test only first 3 endpoints per domain
        for (const headers of authHeaders.slice(0, 2)) { // Test only first 2 auth methods
          try {
            discoveryResults.testedCombinations++;
            
            const response = await fetch(`${domain}${endpoint}`, {
              method: 'GET',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'BitAcademy-SoSoValue-Discovery/1.0'
              },
              timeout: 5000
            });
            
            const contentType = response.headers.get('content-type');
            
            if (response.status !== 404 && response.status !== 502 && response.status !== 503) {
              let responseData = null;
              
              try {
                if (contentType && contentType.includes('application/json')) {
                  responseData = await response.json();
                } else {
                  const textData = await response.text();
                  responseData = textData.substring(0, 200) + (textData.length > 200 ? '...' : '');
                }
              } catch (e) {
                responseData = 'Could not parse response';
              }
              
              discoveryResults.workingEndpoints.push({
                url: `${domain}${endpoint}`,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(headers),
                contentType,
                hasData: !!responseData,
                dataPreview: typeof responseData === 'string' ? responseData : JSON.stringify(responseData).substring(0, 200),
                potentialSuccess: response.status >= 200 && response.status < 300,
                authenticationIssue: response.status === 401 || response.status === 403,
                serverError: response.status >= 500
              });
              
              if (response.status >= 200 && response.status < 300) {
                console.log(`✅ Potential working endpoint: ${domain}${endpoint} (${response.status})`);
                discoveryResults.apiKeyValid = true;
              } else if (response.status === 401 || response.status === 403) {
                console.log(`🔑 Auth issue: ${domain}${endpoint} (${response.status})`);
              } else {
                console.log(`⚠️ Response: ${domain}${endpoint} (${response.status})`);
              }
            }
          } catch (error) {
            if (error.code !== 'ENOTFOUND' && error.code !== 'ECONNREFUSED') {
              discoveryResults.errors.push({
                url: `${domain}${endpoint}`,
                error: error.message,
                code: error.code
              });
            }
          }
        }
      }
    } catch (error) {
      discoveryResults.failedDomains.push({
        domain,
        error: error.message
      });
    }
  }
  
  // Analyze results
  discoveryResults.summary = {
    totalEndpointsTested: discoveryResults.testedCombinations,
    workingEndpointsFound: discoveryResults.workingEndpoints.length,
    successfulRequests: discoveryResults.workingEndpoints.filter(e => e.potentialSuccess).length,
    authenticationErrors: discoveryResults.workingEndpoints.filter(e => e.authenticationIssue).length,
    serverErrors: discoveryResults.workingEndpoints.filter(e => e.serverError).length,
    uniqueDomainsTested: possibleDomains.length,
    failedDomains: discoveryResults.failedDomains.length
  };
  
  if (discoveryResults.workingEndpoints.length === 0) {
    discoveryResults.recommendedAction = 'A API da SoSoValue pode ainda não estar disponível publicamente. Recomendações: 1) Verificar com suporte se API está ativa, 2) Confirmar se chave de API é válida, 3) Verificar se há whitelist de IPs, 4) Aguardar documentação oficial.';
  } else if (discoveryResults.summary.authenticationErrors > 0) {
    discoveryResults.recommendedAction = 'Endpoints encontrados mas problemas de autenticação. Verificar formato correto da API key ou método de autenticação.';
  } else if (discoveryResults.summary.successfulRequests > 0) {
    discoveryResults.recommendedAction = 'Endpoints funcionais encontrados! Implementar integração usando os URLs que retornaram status 200.';
  } else {
    discoveryResults.recommendedAction = 'Endpoints parcialmente funcionais encontrados. Investigar respostas específicas para implementação.';
  }
  
  console.log(`📊 Descoberta concluída: ${discoveryResults.summary.workingEndpointsFound} endpoints encontrados de ${discoveryResults.summary.totalEndpointsTested} testados`);
  
  return discoveryResults;
}

// Additional utility function to test specific endpoint
async function testSpecificEndpoint(baseUrl, endpoint, apiKey, authMethod = 'X-API-KEY') {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'BitAcademy-SoSoValue-Test/1.0'
  };
  
  headers[authMethod] = apiKey;
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      timeout: 10000
    });
    
    const data = await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data.substring(0, 500),
      fullUrl: `${baseUrl}${endpoint}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fullUrl: `${baseUrl}${endpoint}`
    };
  }
}