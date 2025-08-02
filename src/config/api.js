// API Configuration for different environments

const getApiBaseUrl = () => {
  // Use relative URLs for all environments (proxy handles routing in dev)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  market: {
    coingecko: `${API_BASE_URL}/api/market/coingecko-professional`,
    sosovalue: `${API_BASE_URL}/api/market/sosovalue-advanced`,
    health: `${API_BASE_URL}/api/market/health`
  },
  // Existing endpoints
  auth: `${API_BASE_URL}/api/auth`,
  calculator: `${API_BASE_URL}/api/calculator`,
  marketData: `${API_BASE_URL}/api/market-data`
};

// Utility function to make API calls with error handling
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};