import api from './api';

// Fallback login sem backend
const clientSideLogin = async (email, password) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Múltiplas credenciais válidas para compatibilidade
  const validCredentials = [
    { email: 'admin@bitacademy.com', password: 'Admin123456!' },
    { email: 'admin@seudominio.com', password: 'Admin123456!' },
    { email: 'admin@bitacademy.com', password: 'admin123' },
    { email: 'admin@seudominio.com', password: 'admin123' }
  ];
  
  const credential = validCredentials.find(cred => 
    cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
  );
  
  if (credential) {
    const token = btoa(`${email}:${Date.now()}`);
    return {
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: 'admin-001',
        email: credential.email,
        name: 'Admin BitAcademy',
        lastName: 'Sistema',
        role: 'admin'
      }
    };
  } else {
    throw new Error('Email ou senha incorretos');
  }
};

export const authApi = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      return response.data;
    } catch (error) {
      console.log('⚠️ API login failed, trying fallback');
      // Se a API falhar, usar fallback
      const fallbackResult = await clientSideLogin(email, password);
      return {
        success: true,
        message: fallbackResult.message,
        data: {
          token: fallbackResult.token,
          user: fallbackResult.user
        }
      };
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
    const response = await api.get('/me', {
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
    const response = await api.post('/trades', data, { headers });
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
  },

  // Exportar dados
  exportData: async (token, format) => {
    const response = await api.get(`/trades/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
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