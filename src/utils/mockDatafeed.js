// Mock Datafeed para TradingView Advanced Charts
// Baseado no exemplo oficial da TradingView

class MockDatafeed {
  constructor() {
    this.configuration = {
      supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
      exchanges: [
        { value: 'BINANCE', name: 'Binance', desc: 'Binance' },
        { value: 'BYBIT', name: 'Bybit', desc: 'Bybit' },
        { value: 'BITGET', name: 'Bitget', desc: 'Bitget' },
        { value: 'BINGX', name: 'BingX', desc: 'BingX' }
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
  }

  onReady(callback) {
    console.log('✅ Mock Datafeed onReady called');
    setTimeout(() => callback(this.configuration), 0);
  }

  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    console.log('🔍 Mock Datafeed searchSymbols called');
    const symbols = [
      {
        symbol: 'BTCUSDT',
        full_name: 'BINANCE:BTCUSDT',
        description: 'Bitcoin / Tether',
        exchange: 'BINANCE',
        ticker: 'BTCUSDT',
        type: 'crypto'
      },
      {
        symbol: 'ETHUSDT',
        full_name: 'BINANCE:ETHUSDT',
        description: 'Ethereum / Tether',
        exchange: 'BINANCE',
        ticker: 'ETHUSDT',
        type: 'crypto'
      }
    ];
    
    const filteredSymbols = symbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(userInput.toLowerCase())
    );
    
    setTimeout(() => onResultReadyCallback(filteredSymbols), 0);
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    console.log('📊 Mock Datafeed resolveSymbol called:', symbolName);
    
    // Configuração básica do símbolo
    const symbolInfo = {
      ticker: symbolName,
      name: symbolName,
      description: symbolName.replace(':', ' '),
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'BINANCE',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_no_volume: false,
      has_weekly_and_monthly: true,
      supported_resolutions: this.configuration.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
      expired: false,
      format: 'price'
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  }

  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    console.log('📈 Mock Datafeed getBars called:', symbolInfo.name, resolution);
    
    const { from, to, firstDataRequest } = periodParams;
    
    // Gerar dados mock para o Bitcoin (preço base ~43000)
    const bars = [];
    const basePrice = 43000;
    const timeFrame = this.getTimeFrameMs(resolution);
    
    let currentTime = from * 1000;
    const endTime = to * 1000;
    
    while (currentTime <= endTime) {
      // Gerar variação de preço realista
      const variation = (Math.random() - 0.5) * 1000; // Variação de ±500
      const open = basePrice + variation;
      const close = open + (Math.random() - 0.5) * 200; // Variação de ±100
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      bars.push({
        time: currentTime,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume
      });
      
      currentTime += timeFrame;
    }
    
    console.log('✅ Mock Datafeed returning', bars.length, 'bars');
    
    setTimeout(() => {
      onHistoryCallback(bars, { noData: false });
    }, 100);
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    console.log('🔔 Mock Datafeed subscribeBars called');
    
    // Simular dados em tempo real
    this.realtimeInterval = setInterval(() => {
      const now = Date.now();
      const basePrice = 43000;
      const variation = (Math.random() - 0.5) * 200;
      const price = basePrice + variation;
      
      const bar = {
        time: now,
        open: parseFloat(price.toFixed(2)),
        high: parseFloat((price + Math.random() * 50).toFixed(2)),
        low: parseFloat((price - Math.random() * 50).toFixed(2)),
        close: parseFloat((price + (Math.random() - 0.5) * 20).toFixed(2)),
        volume: Math.floor(Math.random() * 10000) + 1000
      };
      
      onRealtimeCallback(bar);
    }, 5000); // Atualizar a cada 5 segundos
  }

  unsubscribeBars(subscriberUID) {
    console.log('🔕 Mock Datafeed unsubscribeBars called');
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
    }
  }

  getTimeFrameMs(resolution) {
    const timeFrames = {
      '1': 60 * 1000,
      '5': 5 * 60 * 1000,
      '15': 15 * 60 * 1000,
      '30': 30 * 60 * 1000,
      '60': 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    
    return timeFrames[resolution] || 60 * 1000;
  }

  getMarks(symbolInfo, from, to, onDataCallback, resolution) {
    console.log('📍 Mock Datafeed getMarks called');
    setTimeout(() => onDataCallback([]), 0);
  }

  getTimescaleMarks(symbolInfo, from, to, onDataCallback, resolution) {
    console.log('⏰ Mock Datafeed getTimescaleMarks called');
    setTimeout(() => onDataCallback([]), 0);
  }

  getServerTime(callback) {
    console.log('🕐 Mock Datafeed getServerTime called');
    setTimeout(() => callback(Math.floor(Date.now() / 1000)), 0);
  }
}

export default MockDatafeed;