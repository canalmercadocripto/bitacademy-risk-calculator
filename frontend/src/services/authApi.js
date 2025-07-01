import api from './api';

export const authApi = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Registro
  register: async (name, lastName, email, password, phone, countryCode) => {
    const response = await api.post('/auth/register', { 
      name, 
      lastName, 
      email, 
      password, 
      phone, 
      countryCode 
    });
    return response.data;
  },

  // Obter dados do usuário atual
  me: async (token) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (token) => {
    const response = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Logout
  logout: async (token) => {
    const response = await api.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export const tradeApi = {
  // Salvar cálculo
  saveCalculation: async (data, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post('/trades/calculate', data, { headers });
    return response.data;
  },

  // Obter histórico
  getHistory: async (token, page = 1, limit = 50) => {
    const response = await api.get('/trades/history', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });
    return response.data;
  },

  // Obter estatísticas
  getStats: async (token) => {
    const response = await api.get('/trades/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obter estatísticas do usuário
  getUserStats: async (token) => {
    const response = await api.get('/trades/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Obter histórico de trades
  getTradeHistory: async (token, page = 1, limit = 20) => {
    const response = await api.get('/trades/history', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });
    return response.data;
  }
};