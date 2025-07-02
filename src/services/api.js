import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Erro com resposta do servidor
      throw new Error(error.response.data.message || 'Erro na requisição');
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão com o servidor');
    } else {
      // Erro de configuração
      throw new Error('Erro interno da aplicação');
    }
  }
);

export const exchangeApi = {
  // Buscar exchanges disponíveis
  getExchanges: async () => {
    const response = await api.get('/exchanges');
    return response.data;
  },

  // Buscar símbolos de uma exchange
  getSymbols: async (exchange, search = '', limit = 50) => {
    const response = await api.get(`/exchanges/${exchange}/symbols`, {
      params: { search, limit }
    });
    return response.data;
  },

  // Buscar preço atual de um símbolo
  getCurrentPrice: async (exchange, symbol) => {
    const response = await api.get(`/exchanges/${exchange}/price/${symbol}`);
    return response.data;
  },

  // Buscar múltiplos preços
  getMultiplePrices: async (exchange, symbols) => {
    const response = await api.post(`/exchanges/${exchange}/prices`, { symbols });
    return response.data;
  }
};

export const calculatorApi = {
  // Calcular risk management
  calculateRisk: async (params) => {
    const response = await api.post('/calculator/calculate', params);
    return response.data;
  },

  // Calcular múltiplos cenários
  calculateScenarios: async (baseParams, scenarios) => {
    const response = await api.post('/calculator/scenarios', {
      baseParams,
      scenarios
    });
    return response.data;
  },

  // Validar trade
  validateTrade: async (params) => {
    const response = await api.post('/calculator/validate', params);
    return response.data;
  },

  // Informações da calculadora
  getInfo: async () => {
    const response = await api.get('/calculator/info');
    return response.data;
  }
};

export default api;