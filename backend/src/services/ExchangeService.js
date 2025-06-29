const axios = require('axios');
const NodeCache = require('node-cache');

class ExchangeService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: process.env.CACHE_TTL || 300 }); // 5 minutos
    this.exchanges = {
      bingx: {
        name: 'BingX',
        baseUrl: 'https://open-api.bingx.com',
        endpoints: {
          symbols: '/openApi/swap/v2/quote/contracts',
          price: '/openApi/swap/v2/quote/price'
        }
      },
      bybit: {
        name: 'Bybit',
        baseUrl: 'https://api.bybit.com',
        endpoints: {
          symbols: '/v5/market/instruments-info',
          price: '/v5/market/tickers'
        }
      },
      binance: {
        name: 'Binance',
        baseUrl: 'https://fapi.binance.com',
        endpoints: {
          symbols: '/fapi/v1/exchangeInfo',
          price: '/fapi/v1/ticker/price'
        }
      },
      bitget: {
        name: 'Bitget',
        baseUrl: 'https://api.bitget.com',
        endpoints: {
          symbols: '/api/mix/v1/market/contracts',
          price: '/api/mix/v1/market/ticker'
        }
      }
    };
  }

  async getSymbols(exchangeName) {
    const cacheKey = `symbols_${exchangeName}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let symbols = [];
      
      switch (exchangeName.toLowerCase()) {
        case 'bingx':
          symbols = await this.getBingxSymbols();
          break;
        case 'bybit':
          symbols = await this.getBybitSymbols();
          break;
        case 'binance':
          symbols = await this.getBinanceSymbols();
          break;
        case 'bitget':
          symbols = await this.getBitgetSymbols();
          break;
        default:
          throw new Error(`Exchange ${exchangeName} não suportado`);
      }

      // Cache por 5 minutos
      this.cache.set(cacheKey, symbols);
      return symbols;
      
    } catch (error) {
      console.error(`Erro ao buscar símbolos da ${exchangeName}:`, error.message);
      throw new Error(`Falha ao buscar dados da ${exchangeName}`);
    }
  }

  async getCurrentPrice(exchangeName, symbol) {
    const cacheKey = `price_${exchangeName}_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let price = null;
      
      switch (exchangeName.toLowerCase()) {
        case 'bingx':
          price = await this.getBingxPrice(symbol);
          break;
        case 'bybit':
          price = await this.getBybitPrice(symbol);
          break;
        case 'binance':
          price = await this.getBinancePrice(symbol);
          break;
        case 'bitget':
          price = await this.getBitgetPrice(symbol);
          break;
        default:
          throw new Error(`Exchange ${exchangeName} não suportado`);
      }

      // Cache por 30 segundos
      this.cache.set(cacheKey, price, 30);
      return price;
      
    } catch (error) {
      console.error(`Erro ao buscar preço da ${exchangeName}:`, error.message);
      throw new Error(`Falha ao buscar preço da ${exchangeName}`);
    }
  }

  async getBinanceSymbols() {
    const response = await axios.get(`${this.exchanges.binance.baseUrl}${this.exchanges.binance.endpoints.symbols}`);
    
    return response.data.symbols
      .filter(s => {
        // Filtros básicos
        if (s.status !== 'TRADING' || s.quoteAsset !== 'USDT') return false;
        
        // Excluir contratos com data de vencimento (formato: BTCUSDT_251226)
        if (s.symbol.includes('_')) return false;
        
        // Excluir contratos de delivery mensal
        if (s.contractType === 'CURRENT_MONTH' || s.contractType === 'NEXT_MONTH') return false;
        
        // Manter apenas perpetual contracts
        return s.contractType === 'PERPETUAL' || !s.contractType;
      })
      .map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        exchange: 'binance',
        contractType: s.contractType || 'PERPETUAL'
      }))
      .sort((a, b) => {
        // Priorizar principais moedas
        const priorities = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT'];
        const aIndex = priorities.indexOf(a.symbol);
        const bIndex = priorities.indexOf(b.symbol);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });
  }

  async getBybitSymbols() {
    const response = await axios.get(`${this.exchanges.bybit.baseUrl}${this.exchanges.bybit.endpoints.symbols}`, {
      params: {
        category: 'linear'
      }
    });
    
    return response.data.result.list
      .filter(s => {
        // Filtros básicos
        if (s.status !== 'Trading' || s.quoteCoin !== 'USDT') return false;
        
        // Excluir contratos com data de vencimento (formato: BTCUSDT-25JUL25)
        if (s.symbol.includes('-') && /\d{2}[A-Z]{3}\d{2}/.test(s.symbol)) return false;
        
        // Manter apenas perpetual contracts
        return !s.symbol.includes('-') || s.symbol.includes('USDT');
      })
      .map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseCoin,
        quoteAsset: s.quoteCoin,
        exchange: 'bybit'
      }))
      .sort((a, b) => {
        // Priorizar principais moedas
        const priorities = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT'];
        const aIndex = priorities.indexOf(a.symbol);
        const bIndex = priorities.indexOf(b.symbol);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });
  }

  async getBingxSymbols() {
    const response = await axios.get(`${this.exchanges.bingx.baseUrl}${this.exchanges.bingx.endpoints.symbols}`);
    
    return response.data.data
      .filter(s => {
        // Filtros básicos
        if (!s.symbol.endsWith('-USDT')) return false;
        
        // Excluir contratos inativos (status deve ser 1 para ativo)
        if (s.status !== undefined && s.status !== 1) return false;
        
        return true;
      })
      .map(s => ({
        symbol: s.symbol.replace('-', ''),
        baseAsset: s.symbol.split('-')[0],
        quoteAsset: 'USDT',
        exchange: 'bingx'
      }))
      .sort((a, b) => {
        // Priorizar principais moedas
        const priorities = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT'];
        const aIndex = priorities.indexOf(a.symbol);
        const bIndex = priorities.indexOf(b.symbol);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });
  }

  async getBinancePrice(symbol) {
    const response = await axios.get(`${this.exchanges.binance.baseUrl}${this.exchanges.binance.endpoints.price}`, {
      params: { symbol }
    });
    return parseFloat(response.data.price);
  }

  async getBybitPrice(symbol) {
    const response = await axios.get(`${this.exchanges.bybit.baseUrl}${this.exchanges.bybit.endpoints.price}`, {
      params: {
        category: 'linear',
        symbol
      }
    });
    return parseFloat(response.data.result.list[0].lastPrice);
  }

  async getBingxPrice(symbol) {
    const bingxSymbol = symbol.replace('USDT', '-USDT');
    const response = await axios.get(`${this.exchanges.bingx.baseUrl}${this.exchanges.bingx.endpoints.price}`, {
      params: { symbol: bingxSymbol }
    });
    return parseFloat(response.data.data.price);
  }

  async getBitgetSymbols() {
    const response = await axios.get(`${this.exchanges.bitget.baseUrl}${this.exchanges.bitget.endpoints.symbols}`, {
      params: {
        productType: 'umcbl'
      }
    });
    
    return response.data.data
      .filter(s => {
        // Filtros básicos - Bitget usa quoteCoin para USDT
        if (s.quoteCoin !== 'USDT') return false;
        
        // Manter apenas perpetual contracts
        if (s.symbolType !== 'perpetual') return false;
        
        // Verificar se está ativo
        if (s.symbolStatus !== 'normal') return false;
        
        // Manter apenas contratos UMCBL (perpetual USDT)
        return s.symbol.endsWith('_UMCBL');
      })
      .map(s => ({
        symbol: s.symbolName, // usar symbolName que é BTCUSDT em vez de symbol que é BTCUSDT_UMCBL
        baseAsset: s.baseCoin,
        quoteAsset: s.quoteCoin,
        exchange: 'bitget'
      }))
      .sort((a, b) => {
        // Priorizar principais moedas
        const priorities = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'SOLUSDT'];
        const aIndex = priorities.indexOf(a.symbol);
        const bIndex = priorities.indexOf(b.symbol);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });
  }

  async getBitgetPrice(symbol) {
    // Converter BTCUSDT para BTCUSDT_UMCBL para a API da Bitget
    const bitgetSymbol = symbol + '_UMCBL';
    const response = await axios.get(`${this.exchanges.bitget.baseUrl}${this.exchanges.bitget.endpoints.price}`, {
      params: {
        symbol: bitgetSymbol
      }
    });
    return parseFloat(response.data.data.last);
  }

  getAvailableExchanges() {
    return Object.keys(this.exchanges).map(key => ({
      id: key,
      name: this.exchanges[key].name
    }));
  }
}

module.exports = new ExchangeService();