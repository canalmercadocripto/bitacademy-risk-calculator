// Binance Datafeed para TradingView Advanced Charts
// Usa dados reais da API da Binance

class BinanceDatafeed {
  constructor() {
    this.baseUrl = 'https://api.binance.com';
    this.configuration = {
      supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', '1D', '3D', '1W', '1M'],
      exchanges: [
        { value: 'BINANCE', name: 'Binance', desc: 'Binance Spot' }
      ],
      symbols_types: [
        { name: 'crypto', value: 'crypto' }
      ],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
      supports_search: true,
      supports_group_request: false
    };
    
    // Mapeamento de intervalos do TradingView para Binance
    this.intervalMap = {
      '1': '1m',
      '3': '3m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '120': '2h',
      '240': '4h',
      '360': '6h',
      '480': '8h',
      '720': '12h',
      '1D': '1d',
      '3D': '3d',
      '1W': '1w',
      '1M': '1M'
    };
    
    this.wsConnections = new Map();
  }

  onReady(callback) {
    console.log('✅ Binance Datafeed onReady called');
    setTimeout(() => callback(this.configuration), 0);
  }

  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    console.log('🔍 Binance Datafeed searchSymbols called:', userInput);
    
    // Buscar símbolos da Binance
    fetch(`${this.baseUrl}/api/v3/exchangeInfo`)
      .then(response => response.json())
      .then(data => {
        const symbols = data.symbols
          .filter(s => s.status === 'TRADING' && s.quoteAsset === 'USDT')
          .filter(s => s.symbol.toLowerCase().includes(userInput.toLowerCase()))
          .slice(0, 10) // Limitar a 10 resultados
          .map(s => ({
            symbol: s.symbol,
            full_name: `BINANCE:${s.symbol}`,
            description: `${s.baseAsset} / ${s.quoteAsset}`,
            exchange: 'BINANCE',
            ticker: s.symbol,
            type: 'crypto'
          }));
        
        setTimeout(() => onResultReadyCallback(symbols), 0);
      })
      .catch(error => {
        console.error('❌ Error searching symbols:', error);
        setTimeout(() => onResultReadyCallback([]), 0);
      });
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    console.log('📊 Binance Datafeed resolveSymbol called:', symbolName);
    
    // Extrair símbolo (remover exchange prefix se existir)
    const symbol = symbolName.replace('BINANCE:', '').replace(':', '');
    
    // Buscar informações do símbolo
    fetch(`${this.baseUrl}/api/v3/exchangeInfo?symbol=${symbol}`)
      .then(response => response.json())
      .then(data => {
        if (data.symbols && data.symbols.length > 0) {
          const symbolInfo = data.symbols[0];
          
          // Encontrar precision
          const priceFilter = symbolInfo.filters.find(f => f.filterType === 'PRICE_FILTER');
          const tickSize = parseFloat(priceFilter.tickSize);
          const pricescale = Math.round(1 / tickSize);
          
          const resolvedSymbol = {
            ticker: symbol,
            name: symbol,
            description: `${symbolInfo.baseAsset} / ${symbolInfo.quoteAsset}`,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: 'BINANCE',
            minmov: 1,
            pricescale: pricescale,
            has_intraday: true,
            has_no_volume: false,
            has_weekly_and_monthly: true,
            supported_resolutions: this.configuration.supported_resolutions,
            volume_precision: 2,
            data_status: 'streaming',
            expired: false,
            format: 'price'
          };
          
          setTimeout(() => onSymbolResolvedCallback(resolvedSymbol), 0);
        } else {
          setTimeout(() => onResolveErrorCallback('Symbol not found'), 0);
        }
      })
      .catch(error => {
        console.error('❌ Error resolving symbol:', error);
        setTimeout(() => onResolveErrorCallback(error.message), 0);
      });
  }

  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    console.log('📈 Binance Datafeed getBars called:', symbolInfo.name, resolution);
    
    const { from, to, firstDataRequest } = periodParams;
    const symbol = symbolInfo.name;
    const interval = this.intervalMap[resolution] || '1m';
    
    // Construir URL da API Binance
    const url = `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${from * 1000}&endTime=${to * 1000}&limit=1000`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          const bars = data.map(kline => ({
            time: kline[0], // Open time
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5])
          }));
          
          console.log('✅ Binance Datafeed returning', bars.length, 'bars for', symbol);
          setTimeout(() => onHistoryCallback(bars, { noData: bars.length === 0 }), 0);
        } else {
          console.error('❌ Invalid data format from Binance API:', data);
          setTimeout(() => onErrorCallback('Invalid data format'), 0);
        }
      })
      .catch(error => {
        console.error('❌ Error fetching bars from Binance:', error);
        setTimeout(() => onErrorCallback(error.message), 0);
      });
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    console.log('🔔 Binance Datafeed subscribeBars called:', symbolInfo.name);
    
    const symbol = symbolInfo.name.toLowerCase();
    const interval = this.intervalMap[resolution] || '1m';
    
    // Conectar ao WebSocket da Binance
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ Binance WebSocket connected for', symbol);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const kline = data.k;
        
        if (kline) {
          const bar = {
            time: kline.t, // Open time
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v)
          };
          
          onRealtimeCallback(bar);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ Binance WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('🔕 Binance WebSocket closed for', symbol);
      };
      
      // Armazenar conexão para cleanup
      this.wsConnections.set(subscriberUID, ws);
      
    } catch (error) {
      console.error('❌ Error creating Binance WebSocket:', error);
    }
  }

  unsubscribeBars(subscriberUID) {
    console.log('🔕 Binance Datafeed unsubscribeBars called:', subscriberUID);
    
    const ws = this.wsConnections.get(subscriberUID);
    if (ws) {
      ws.close();
      this.wsConnections.delete(subscriberUID);
    }
  }

  getMarks(symbolInfo, from, to, onDataCallback, resolution) {
    console.log('📍 Binance Datafeed getMarks called');
    setTimeout(() => onDataCallback([]), 0);
  }

  getTimescaleMarks(symbolInfo, from, to, onDataCallback, resolution) {
    console.log('⏰ Binance Datafeed getTimescaleMarks called');
    setTimeout(() => onDataCallback([]), 0);
  }

  getServerTime(callback) {
    console.log('🕐 Binance Datafeed getServerTime called');
    
    fetch(`${this.baseUrl}/api/v3/time`)
      .then(response => response.json())
      .then(data => {
        const serverTime = Math.floor(data.serverTime / 1000);
        setTimeout(() => callback(serverTime), 0);
      })
      .catch(error => {
        console.error('❌ Error getting server time:', error);
        setTimeout(() => callback(Math.floor(Date.now() / 1000)), 0);
      });
  }

  // Cleanup method
  cleanup() {
    this.wsConnections.forEach((ws, uid) => {
      ws.close();
    });
    this.wsConnections.clear();
  }
}

export default BinanceDatafeed;