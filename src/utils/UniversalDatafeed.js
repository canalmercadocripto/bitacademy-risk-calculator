// Universal Multi-Exchange Datafeed para TradingView Advanced Charts
// Suporta múltiplas exchanges com cache inteligente e rate limiting

class UniversalDatafeed {
  constructor() {
    this.configuration = {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      exchanges: [
        { value: 'BINANCE', name: 'Binance', desc: 'Binance Spot' },
        { value: 'BYBIT', name: 'Bybit', desc: 'Bybit Spot' },
        { value: 'BITGET', name: 'Bitget', desc: 'Bitget Spot' },
        { value: 'BINGX', name: 'BingX', desc: 'BingX Spot' }
      ],
      symbols_types: [{ name: 'crypto', value: 'crypto' }],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
      supports_search: true,
      supports_group_request: false
    };
    
    // Cache inteligente - evita requisições desnecessárias
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    
    // Rate limiting - máximo 10 req/min por exchange
    this.requestQueue = new Map();
    this.lastRequest = new Map();
    this.minInterval = 6000; // 6 segundos entre requests
    
    // WebSocket connections
    this.wsConnections = new Map();
    
    // Exchange configurations
    this.exchanges = {
      binance: {
        baseUrl: 'https://api.binance.com',
        wsUrl: 'wss://stream.binance.com:9443/ws',
        intervals: {
          '1': '1m', '5': '5m', '15': '15m', '30': '30m', 
          '60': '1h', '240': '4h', '1D': '1d'
        },
        endpoints: {
          klines: '/api/v3/klines',
          ticker: '/api/v3/ticker/24hr'
        }
      },
      bybit: {
        baseUrl: 'https://api.bybit.com',
        wsUrl: 'wss://stream.bybit.com/v5/public/spot',
        intervals: {
          '1': '1', '5': '5', '15': '15', '30': '30',
          '60': '60', '240': '240', '1D': 'D'
        },
        endpoints: {
          klines: '/v5/market/kline',
          ticker: '/v5/market/tickers'
        }
      },
      bitget: {
        baseUrl: 'https://api.bitget.com',
        intervals: {
          '1': '1min', '5': '5min', '15': '15min', '30': '30min',
          '60': '1h', '240': '4h', '1D': '1day'
        },
        endpoints: {
          klines: '/api/v2/spot/market/candles',
          ticker: '/api/v2/spot/market/tickers'
        }
      },
      bingx: {
        baseUrl: 'https://open-api.bingx.com',
        wsUrl: 'wss://open-api-ws.bingx.com/market',
        intervals: {
          '1': '1min', '5': '5min', '15': '15min', '30': '30min',
          '60': '1h', '240': '4h', '1D': '1d'
        },
        endpoints: {
          klines: '/openApi/spot/v1/market/kline',
          ticker: '/openApi/spot/v1/ticker/24hr'
        }
      }
    };
  }

  onReady(callback) {
    console.log('✅ Universal Datafeed Ready');
    setTimeout(() => callback(this.configuration), 0);
  }

  // Detectar exchange do símbolo ou usar padrão
  detectExchange(symbol) {
    if (symbol.includes(':')) {
      const [exchange] = symbol.split(':');
      return exchange.toLowerCase();
    }
    // Usar exchange selecionada no frontend ou Binance como padrão
    return window.selectedExchange?.toLowerCase() || 'binance';
  }

  // Cache inteligente com TTL
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Cache hit:', key);
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log('💾 Cached:', key);
  }

  // Rate limiting inteligente
  async rateLimitedRequest(exchange, url) {
    const now = Date.now();
    const lastReq = this.lastRequest.get(exchange) || 0;
    const timeSinceLastReq = now - lastReq;
    
    if (timeSinceLastReq < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastReq;
      console.log(`⏳ Rate limit: waiting ${waitTime}ms for ${exchange}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest.set(exchange, Date.now());
    return fetch(url);
  }

  async resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    try {
      const exchange = this.detectExchange(symbolName);
      const cleanSymbol = symbolName.replace(/.*:/, '').toUpperCase();
      
      console.log(`🔍 Resolving symbol: ${cleanSymbol} on ${exchange}`);
      
      // Cache key para symbol info
      const cacheKey = `symbol_${exchange}_${cleanSymbol}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        onSymbolResolvedCallback(cached);
        return;
      }
      
      const symbolInfo = {
        name: cleanSymbol,
        full_name: `${exchange.toUpperCase()}:${cleanSymbol}`,
        description: `${cleanSymbol} on ${exchange.charAt(0).toUpperCase() + exchange.slice(1)}`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: exchange.toUpperCase(),
        minmov: 1,
        pricescale: 100000000, // 8 decimals
        has_intraday: true,
        supported_resolutions: this.configuration.supported_resolutions,
        volume_precision: 8,
        data_status: 'streaming'
      };
      
      this.setCachedData(cacheKey, symbolInfo);
      onSymbolResolvedCallback(symbolInfo);
      
    } catch (error) {
      console.error('❌ Symbol resolution error:', error);
      onResolveErrorCallback('Symbol not found');
    }
  }

  async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    try {
      const { from, to, firstDataRequest } = periodParams;
      const exchange = this.detectExchange(symbolInfo.full_name);
      const symbol = symbolInfo.name;
      
      console.log(`📊 Getting bars: ${symbol} on ${exchange}, ${resolution}, ${new Date(from * 1000)} to ${new Date(to * 1000)}`);
      
      // Cache key para dados históricos
      const cacheKey = `bars_${exchange}_${symbol}_${resolution}_${from}_${to}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log(`📋 Using cached data for ${exchange}:${symbol}`);
        onHistoryCallback(cached.bars, { noData: cached.noData });
        return;
      }
      
      const exchangeConfig = this.exchanges[exchange];
      if (!exchangeConfig) {
        console.error(`❌ Exchange ${exchange} not supported. Available: ${Object.keys(this.exchanges).join(', ')}`);
        throw new Error(`Exchange ${exchange} not supported`);
      }
      
      const interval = exchangeConfig.intervals[resolution];
      if (!interval) {
        console.error(`❌ Resolution ${resolution} not supported on ${exchange}. Available: ${Object.keys(exchangeConfig.intervals).join(', ')}`);
        throw new Error(`Resolution ${resolution} not supported on ${exchange}`);
      }
      
      console.log(`🔧 Using exchange config:`, { exchange, baseUrl: exchangeConfig.baseUrl, interval });
      
      let bars = [];
      let url, response;
      
      switch (exchange) {
        case 'binance':
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?symbol=${symbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
          console.log(`🌐 Binance URL: ${url}`);
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Binance data received: ${data.length} candles`);
            bars = data.map(kline => ({
              time: parseInt(kline[0]),
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
              volume: parseFloat(kline[5])
            }));
          } else {
            console.error(`❌ Binance API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`❌ Binance Error Details:`, errorText);
          }
          break;
          
        case 'bybit':
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?category=spot&symbol=${symbol}&interval=${interval}&start=${from * 1000}&end=${to * 1000}&limit=1000`;
          console.log(`🌐 Bybit URL: ${url}`);
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`🔍 Bybit API Response:`, data);
            
            if (data.result && data.result.list) {
              console.log(`✅ Bybit data received: ${data.result.list.length} candles`);
              bars = data.result.list.map(kline => ({
                time: parseInt(kline[0]),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
              }));
            } else {
              console.warn(`⚠️ Bybit: No data in expected format`, data);
            }
          } else {
            console.error(`❌ Bybit API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`❌ Bybit Error Details:`, errorText);
          }
          break;
          
        case 'bitget':
          // Bitget V2 API - formato correto
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?symbol=${symbol}&granularity=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
          console.log(`🌐 Bitget URL: ${url}`);
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Bitget API Response:', data);
            
            if (data.code === '00000' && data.data) {
              console.log(`✅ Bitget data received: ${data.data.length} candles`);
              bars = data.data.map(kline => ({
                time: parseInt(kline[0]),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
              }));
            } else {
              console.warn(`⚠️ Bitget: Unexpected response format or error code: ${data.code}`, data);
            }
          } else {
            console.error(`❌ Bitget API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`❌ Bitget Error Details:`, errorText);
          }
          break;
          
        case 'bingx':
          // BingX API nativo - endpoint correto baseado na documentação
          console.log(`🔄 BingX: Using native API for ${symbol}`);
          
          // Converter símbolo para formato BingX (BTC-USDT)
          const bingxSymbol = symbol.includes('USDT') ? 
            symbol.replace('USDT', '-USDT') : 
            symbol.replace('/', '-');
          
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?symbol=${bingxSymbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
          console.log(`🌐 BingX URL: ${url}`);
          
          try {
            response = await this.rateLimitedRequest(exchange, url);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`🔍 BingX API Response:`, data);
              
              if (data.code === 0 && data.data && Array.isArray(data.data)) {
                console.log(`✅ BingX data received: ${data.data.length} candles`);
                bars = data.data.map(kline => ({
                  time: parseInt(kline[0]),
                  open: parseFloat(kline[1]),
                  high: parseFloat(kline[2]),
                  low: parseFloat(kline[3]),
                  close: parseFloat(kline[4]),
                  volume: parseFloat(kline[5])
                }));
              } else {
                console.warn(`⚠️ BingX: Unexpected response format or error code: ${data.code}`, data);
                if (data.msg) {
                  console.warn(`⚠️ BingX Error Message: ${data.msg}`);
                }
              }
            } else {
              console.error(`❌ BingX API Error: ${response.status} ${response.statusText}`);
              const errorText = await response.text();
              console.error(`❌ BingX Error Details:`, errorText);
              
              // Se houver erro CORS, tentar com diferentes configurações
              if (response.status === 0 || errorText.includes('CORS')) {
                console.warn(`⚠️ BingX: Possível problema de CORS detectado`);
              }
            }
          } catch (error) {
            console.error(`💥 BingX Network Error:`, error.message);
            if (error.message.includes('CORS') || error.message.includes('fetch')) {
              console.warn(`⚠️ BingX: CORS ou problema de rede detectado - ${error.message}`);
            }
          }
          break;
      }
      
      // Filtrar e ordenar bars
      bars = bars
        .filter(bar => bar.time >= from * 1000 && bar.time <= to * 1000)
        .sort((a, b) => a.time - b.time);
      
      const result = {
        bars: bars.length > 0 ? bars : [],
        noData: bars.length === 0
      };
      
      // Cache apenas se temos dados
      if (bars.length > 0) {
        this.setCachedData(cacheKey, result);
      }
      
      console.log(`✅ Bars loaded: ${bars.length} bars from ${exchange}`);
      onHistoryCallback(result.bars, { noData: result.noData });
      
    } catch (error) {
      console.error(`❌ Error getting bars from ${exchange}:`, error);
      onErrorCallback(error.message);
    }
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    const exchange = this.detectExchange(symbolInfo.full_name);
    const symbol = symbolInfo.name;
    
    console.log(`🔄 Subscribing to real-time data: ${symbol} on ${exchange}`);
    
    // Implementar WebSocket por exchange
    if (!this.wsConnections.has(subscriberUID)) {
      let wsUrl, wsExchange;
      
      switch (exchange) {
        case 'binance':
          wsUrl = `${this.exchanges.binance.wsUrl}/${symbol.toLowerCase()}@kline_${this.exchanges.binance.intervals[resolution]}`;
          wsExchange = 'binance';
          break;
          
        case 'bybit':
          wsUrl = `${this.exchanges.bybit.wsUrl}`;
          wsExchange = 'bybit';
          break;
          
        case 'bingx':
          // BingX WebSocket nativo
          console.log(`🔄 BingX: Using native WebSocket for ${symbol}`);
          const bingxSymbol = symbol.includes('USDT') ? 
            symbol.replace('USDT', '-USDT') : 
            symbol.replace('/', '-');
          wsUrl = `${this.exchanges.bingx.wsUrl}`;
          wsExchange = 'bingx';
          break;
          
        default:
          // Fallback padrão para Binance
          wsUrl = `${this.exchanges.binance.wsUrl}/${symbol.toLowerCase()}@kline_${this.exchanges.binance.intervals[resolution]}`;
          wsExchange = 'binance';
      }
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log(`✅ WebSocket connected: ${wsExchange} for ${symbol}`);
          
          // Enviar mensagem de subscrição específica por exchange
          if (wsExchange === 'bingx') {
            const bingxSymbol = symbol.includes('USDT') ? 
              symbol.replace('USDT', '-USDT') : 
              symbol.replace('/', '-');
            
            // BingX WebSocket usa formato: market.kline.SYMBOL.INTERVAL
            const subscribeMessage = {
              id: Date.now().toString(),
              reqType: 'sub',
              dataType: `market.kline.${bingxSymbol}.${this.exchanges.bingx.intervals[resolution]}`
            };
            
            ws.send(JSON.stringify(subscribeMessage));
            console.log(`📡 BingX WebSocket subscription sent:`, subscribeMessage);
          }
        };
        
        ws.onmessage = async (event) => {
          try {
            let data;
            
            if (wsExchange === 'bingx') {
              // BingX usa compressão GZIP - dados vêm como Blob
              if (event.data instanceof Blob) {
                console.log(`📦 BingX Blob received (size: ${event.data.size} bytes)`);
                
                const arrayBuffer = await event.data.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Verificar se é GZIP (magic bytes: 1f 8b)
                if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
                  console.log('🗜️ GZIP compression detected');
                  
                  // Descomprimir GZIP usando DecompressionStream
                  if (typeof DecompressionStream !== 'undefined') {
                    try {
                      const stream = new DecompressionStream('gzip');
                      const writer = stream.writable.getWriter();
                      const reader = stream.readable.getReader();
                      
                      writer.write(uint8Array);
                      writer.close();
                      
                      const result = await reader.read();
                      const decompressed = new TextDecoder().decode(result.value);
                      data = JSON.parse(decompressed);
                      console.log('✅ GZIP decompression successful');
                    } catch (error) {
                      console.error('❌ GZIP decompression failed:', error);
                      // Fallback: tentar interpretar diretamente
                      const text = new TextDecoder().decode(uint8Array);
                      data = JSON.parse(text);
                    }
                  } else {
                    console.warn('⚠️ DecompressionStream not available - using fallback');
                    // Importar pako dinamicamente se disponível
                    if (typeof pako !== 'undefined') {
                      const decompressed = pako.inflate(uint8Array, { to: 'string' });
                      data = JSON.parse(decompressed);
                    } else {
                      throw new Error('GZIP decompression not available');
                    }
                  }
                } else {
                  // Não é GZIP - tentar interpretar diretamente
                  const text = new TextDecoder().decode(uint8Array);
                  data = JSON.parse(text);
                }
              } else {
                // Dados já em texto
                data = JSON.parse(event.data);
              }
              
              console.log('📊 BingX WebSocket data:', data);
              
              // Processar dados do kline BingX - múltiplos formatos possíveis
              if (data && data.data) {
                // Formato 1: { data: { K: {...} } }
                if (data.data.K) {
                  const kline = data.data.K;
                  const bar = {
                    time: parseInt(kline.t),
                    open: parseFloat(kline.o),
                    high: parseFloat(kline.h),
                    low: parseFloat(kline.l),
                    close: parseFloat(kline.c),
                    volume: parseFloat(kline.v)
                  };
                  onRealtimeCallback(bar);
                  console.log('✅ BingX kline processed (format K)');
                }
                // Formato 2: { data: [...] } - array format
                else if (Array.isArray(data.data) && data.data.length >= 6) {
                  const kline = data.data;
                  const bar = {
                    time: parseInt(kline[0]),
                    open: parseFloat(kline[1]),
                    high: parseFloat(kline[2]),
                    low: parseFloat(kline[3]),
                    close: parseFloat(kline[4]),
                    volume: parseFloat(kline[5])
                  };
                  onRealtimeCallback(bar);
                  console.log('✅ BingX kline processed (array format)');
                }
                // Formato 3: { dataType: "...", data: {...} }
                else if (data.dataType && data.dataType.includes('kline')) {
                  if (Array.isArray(data.data) && data.data.length >= 6) {
                    const kline = data.data;
                    const bar = {
                      time: parseInt(kline[0]),
                      open: parseFloat(kline[1]),
                      high: parseFloat(kline[2]),
                      low: parseFloat(kline[3]),
                      close: parseFloat(kline[4]),
                      volume: parseFloat(kline[5])
                    };
                    onRealtimeCallback(bar);
                    console.log('✅ BingX kline processed (dataType format)');
                  }
                }
              }
              // Formato direto sem wrapper
              else if (data.k) {
                const bar = {
                  time: parseInt(data.k.t),
                  open: parseFloat(data.k.o),
                  high: parseFloat(data.k.h),
                  low: parseFloat(data.k.l),
                  close: parseFloat(data.k.c),
                  volume: parseFloat(data.k.v)
                };
                onRealtimeCallback(bar);
                console.log('✅ BingX kline processed (direct format)');
              }
            } else {
              // Binance e outros exchanges (dados em texto)
              data = JSON.parse(event.data);
              
              if (wsExchange === 'binance') {
                // Formato Binance
                if (data.k) {
                  const bar = {
                    time: data.k.t,
                    open: parseFloat(data.k.o),
                    high: parseFloat(data.k.h),
                    low: parseFloat(data.k.l),
                    close: parseFloat(data.k.c),
                    volume: parseFloat(data.k.v)
                  };
                  onRealtimeCallback(bar);
                }
              } else if (wsExchange === 'bybit') {
                // Formato Bybit - implementar quando necessário
                console.log('📊 Bybit WebSocket data:', data);
              }
            }
          } catch (error) {
            console.error(`❌ WebSocket message parse error (${wsExchange}):`, error);
            if (wsExchange === 'bingx') {
              console.warn('⚠️ BingX WebSocket: Error processing data - raw event:', event);
            }
          }
        };
        
        ws.onerror = (error) => {
          console.error(`❌ WebSocket error (${wsExchange}):`, error);
        };
        
        ws.onclose = () => {
          console.log(`🔕 WebSocket closed (${wsExchange}) for ${symbol}`);
        };
        
        this.wsConnections.set(subscriberUID, ws);
        
      } catch (error) {
        console.error(`💥 WebSocket creation failed (${wsExchange}):`, error);
      }
    }
  }

  unsubscribeBars(subscriberUID) {
    const ws = this.wsConnections.get(subscriberUID);
    if (ws) {
      ws.close();
      this.wsConnections.delete(subscriberUID);
      console.log(`❌ Unsubscribed: ${subscriberUID}`);
    }
  }
}

export default UniversalDatafeed;