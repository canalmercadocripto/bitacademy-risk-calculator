const ExchangeService = require('../services/ExchangeService');

class ExchangeController {
  async getExchanges(req, res) {
    try {
      const exchanges = ExchangeService.getAvailableExchanges();
      res.json({
        success: true,
        data: exchanges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar exchanges disponíveis',
        message: error.message
      });
    }
  }

  async getSymbols(req, res) {
    try {
      const { exchange } = req.params;
      const { search, limit = 500 } = req.query;

      let symbols = await ExchangeService.getSymbols(exchange);

      // Aplicar filtro de busca se fornecido
      if (search) {
        const searchTerm = search.toUpperCase();
        
        // Busca inteligente: primeiro exact match, depois contains
        const exactMatches = symbols.filter(symbol => 
          symbol.baseAsset === searchTerm || 
          symbol.symbol === searchTerm + 'USDT'
        );
        
        const partialMatches = symbols.filter(symbol => 
          (symbol.symbol.includes(searchTerm) || 
           symbol.baseAsset.includes(searchTerm)) &&
          !exactMatches.includes(symbol)
        );
        
        symbols = [...exactMatches, ...partialMatches];
      }

      // Limitar resultados
      symbols = symbols.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          exchange,
          symbols,
          total: symbols.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Erro ao buscar símbolos',
        message: error.message
      });
    }
  }

  async getCurrentPrice(req, res) {
    try {
      const { exchange, symbol } = req.params;

      const price = await ExchangeService.getCurrentPrice(exchange, symbol);

      res.json({
        success: true,
        data: {
          exchange,
          symbol,
          price,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Erro ao buscar preço atual',
        message: error.message
      });
    }
  }

  async getMultiplePrices(req, res) {
    try {
      const { exchange } = req.params;
      const { symbols } = req.body;

      if (!Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Lista de símbolos é obrigatória'
        });
      }

      if (symbols.length > 10) {
        return res.status(400).json({
          success: false,
          error: 'Máximo 10 símbolos por requisição'
        });
      }

      const prices = await Promise.allSettled(
        symbols.map(async (symbol) => {
          try {
            const price = await ExchangeService.getCurrentPrice(exchange, symbol);
            return { symbol, price, success: true };
          } catch (error) {
            return { symbol, error: error.message, success: false };
          }
        })
      );

      const results = prices.map(result => result.value);

      res.json({
        success: true,
        data: {
          exchange,
          prices: results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar múltiplos preços',
        message: error.message
      });
    }
  }
}

module.exports = new ExchangeController();