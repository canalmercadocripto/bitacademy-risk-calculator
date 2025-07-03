import api from './api';

// NO FALLBACK - All authentication via database only

export const authApi = {
  // Login - Database only
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  // Registro
  register: async (name, lastName, email, password, phone, countryCode) => {
    const response = await api.post('/register', { 
      name, 
      lastName, 
      email, 
      password, 
      phone, 
      countryCode 
    });
    return response.data;
  },

  // Verificar token atual
  me: async (token) => {
    const response = await api.get(`/me?token=${token}`);
    return response.data;
  },

  // Logout
  logout: async (token) => {
    // Just a placeholder - logout is handled client-side
    return { success: true };
  }
};

export const tradeApi = {
  // Salvar cálculo
  saveCalculation: async (data, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post('/trades', data, { headers });
    return response.data;
  },

  // Obter histórico
  getHistory: async (token, page = 1, limit = 20) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`/trades?action=history&page=${page}&limit=${limit}`, { headers });
    return response.data;
  },

  // Obter estatísticas
  getStats: async (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get('/trades?action=history&page=1&limit=1000', { headers });
    return response.data;
  },

  // Exportar dados
  exportData: async (token, format = 'json') => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`/trades?action=export&format=${format}`, { headers });
    return response.data;
  }
};

export const userApi = {
  // Get profile
  getProfile: async (token) => {
    const response = await api.get('/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData, token) => {
    const response = await api.put('/user', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};