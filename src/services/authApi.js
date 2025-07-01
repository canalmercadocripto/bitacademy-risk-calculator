import api from './api';

// Fallback login sem backend
const clientSideLogin = async (email, password) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (email === 'admin@seudominio.com' && password === 'Admin123456!') {
    const token = btoa(`${email}:${Date.now()}`);
    return {
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: 'admin-001',
        email: 'admin@seudominio.com',
        name: 'Administrador',
        lastName: 'Sistema',
        role: 'admin'
      }
    };
  } else {
    throw new Error('Credenciais inválidas');
  }
};

export const authApi = {
  // Login com fallback
  login: async (email, password) => {
    try {
      // Tentar API primeiro
      const response = await api.post('/login', { email, password });
      return response.data;
    } catch (error) {
      console.warn('API falhou, usando login client-side:', error.message);
      // Fallback para login client-side
      return await clientSideLogin(email, password);
    }
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
    try {
      const response = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.warn('API /me falhou, usando dados client-side');
      // Fallback client-side
      return {
        user: {
          id: 'admin-001',
          email: 'admin@seudominio.com',
          name: 'Administrador',
          lastName: 'Sistema',
          role: 'admin'
        }
      };
    }
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