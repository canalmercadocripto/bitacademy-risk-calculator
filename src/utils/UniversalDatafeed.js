// Universal Multi-Exchange Datafeed para TradingView Advanced Charts
// Suporta múltiplas exchanges com cache inteligente e rate limiting

class UniversalDatafeed {
  constructor() {
    this.configuration = {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      exchanges: [
        { value: 'BINANCE', name: 'Binance', desc: 'Binance Spot' },
        { value: 'BYBIT', name: 'Bybit', desc: 'Bybit Spot' },
        { value: 'BITGET', name: 'Bitget', desc: 'Bitget Spot' }
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
          '1': '1m', '5': '5m', '15': '15m', '30': '30m',
          '60': '1h', '240': '4h', '1D': '1d'
        },
        endpoints: {
          klines: '/api/spot/v1/market/candles',
          ticker: '/api/spot/v1/market/ticker'
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
        onHistoryCallback(cached.bars, { noData: cached.noData });
        return;
      }
      
      const exchangeConfig = this.exchanges[exchange];
      if (!exchangeConfig) {
        throw new Error(`Exchange ${exchange} not supported`);
      }
      
      const interval = exchangeConfig.intervals[resolution];
      if (!interval) {
        throw new Error(`Resolution ${resolution} not supported on ${exchange}`);
      }
      
      let bars = [];
      let url, response;
      
      switch (exchange) {
        case 'binance':
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?symbol=${symbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            bars = data.map(kline => ({
              time: parseInt(kline[0]),
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
              volume: parseFloat(kline[5])
            }));
          }
          break;
          
        case 'bybit':
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?category=spot&symbol=${symbol}&interval=${interval}&start=${from * 1000}&end=${to * 1000}&limit=1000`;
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.list) {
              bars = data.result.list.map(kline => ({
                time: parseInt(kline[0]),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
              }));
            }
          }
          break;
          
        case 'bitget':
          // Implementação similar para Bitget...
          url = `${exchangeConfig.baseUrl}${exchangeConfig.endpoints.klines}?symbol=${symbol}&period=${interval}&after=${from}&before=${to}`;
          response = await this.rateLimitedRequest(exchange, url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              bars = data.data.map(kline => ({
                time: parseInt(kline[0]),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5])
              }));
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
    if (exchange === 'binance' && !this.wsConnections.has(subscriberUID)) {
      const ws = new WebSocket(`${this.exchanges.binance.wsUrl}/${symbol.toLowerCase()}@kline_${this.exchanges.binance.intervals[resolution]}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
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
      };
      
      this.wsConnections.set(subscriberUID, ws);
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