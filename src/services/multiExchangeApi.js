// Serviço unificado para conectar com múltiplas exchanges
class MultiExchangeAPI {
  constructor(exchangeId, apiKey, secret, testnet = false) {
    this.exchangeId = exchangeId;
    this.apiKey = apiKey;
    this.secret = secret;
    this.testnet = testnet;
    this.baseUrl = '/api/multi-exchange';
  }

  // Método genérico para fazer requests
  async makeRequest(action, additionalParams = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          exchangeId: this.exchangeId,
          apiKey: this.apiKey,
          secret: this.secret,
          testnet: this.testnet,
          ...additionalParams
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Erro na requisição ${action} para ${this.exchangeId}:`, error);
      throw error;
    }
  }

  // Testar conexão
  async testConnection() {
    try {
      console.log(`🔧 Testando conexão ${this.exchangeId}...`);
      const result = await this.makeRequest('testConnection');
      
      return {
        success: result.success,
        error: result.error || null,
        exchangeId: this.exchangeId,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        exchangeId: this.exchangeId
      };
    }
  }

  // Obter informações da conta
  async getAccountInfo() {
    try {
      console.log(`📊 Buscando informações da conta ${this.exchangeId}...`);
      const result = await this.makeRequest('getAccountInfo');
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar informações da conta ${this.exchangeId}:`, error);
      throw error;
    }
  }

  // Obter saldos
  async getBalances() {
    try {
      console.log(`💰 Buscando saldos ${this.exchangeId}...`);
      const result = await this.makeRequest('getBalances');
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar saldos ${this.exchangeId}:`, error);
      throw error;
    }
  }

  // Obter histórico de trades
  async getTradingHistory(symbol, limit = 500, startTime = null, endTime = null) {
    try {
      console.log(`📈 Buscando histórico de trades ${this.exchangeId} para ${symbol}...`);
      const result = await this.makeRequest('getTradingHistory', {
        symbol,
        limit,
        startTime,
        endTime
      });
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar histórico ${this.exchangeId}:`, error);
      throw error;
    }
  }

  // Método para formatar dados de trade (compatibilidade com código existente)
  formatTradeData(trade) {
    return {
      id: trade.id,
      timestamp: new Date(trade.timestamp).toISOString(),
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.amount,
      price: trade.price,
      fees: trade.fee?.cost || 0,
      feeAsset: trade.fee?.currency || 'UNKNOWN',
      total: trade.cost,
      exchangeId: trade.exchangeId
    };
  }

  // Obter nome da exchange
  getExchangeName() {
    const names = {
      binance: 'Binance',
      bingx: 'BingX',
      bybit: 'Bybit',
      bitget: 'Bitget'
    };
    return names[this.exchangeId] || this.exchangeId;
  }

  // Verificar se a exchange está implementada
  static isExchangeSupported(exchangeId) {
    const supportedExchanges = ['binance', 'bingx', 'bybit', 'bitget'];
    return supportedExchanges.includes(exchangeId);
  }

  // Obter lista de exchanges suportadas
  static getSupportedExchanges() {
    return [
      { id: 'binance', name: 'Binance', icon: '🟡' },
      { id: 'bingx', name: 'BingX', icon: '🔥' },
      { id: 'bybit', name: 'Bybit', icon: '🟠' },
      { id: 'bitget', name: 'Bitget', icon: '🟢' }
    ];
  }
}

export default MultiExchangeAPI;