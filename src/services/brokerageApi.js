import api from './api';

/**
 * Brokerage API Integration Service
 * Handles connection and data sync with multiple brokerage platforms
 */

// Mock data for development/testing
const mockSupportedBrokerages = [
  {
    id: 'binance',
    name: 'Binance',
    description: 'Maior exchange de criptomoedas do mundo',
    logo: 'https://cryptoicons.org/api/icon/bnb/32',
    features: ['Spot Trading', 'Futures', 'Margin', 'API v3'],
    requiredFields: ['apiKey', 'secretKey']
  },
  {
    id: 'bybit',
    name: 'Bybit',
    description: 'Exchange focada em derivativos',
    logo: 'https://cryptoicons.org/api/icon/bybit/32',
    features: ['Futures', 'Perpetual', 'Options', 'API v5'],
    requiredFields: ['apiKey', 'secretKey']
  },
  {
    id: 'bitget',
    name: 'BitGet',
    description: 'Exchange com copy trading',
    logo: 'https://cryptoicons.org/api/icon/bgb/32',
    features: ['Spot', 'Futures', 'Copy Trading', 'API v2'],
    requiredFields: ['apiKey', 'secretKey', 'passphrase']
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    description: 'Exchange profissional da Coinbase',
    logo: 'https://cryptoicons.org/api/icon/cb/32',
    features: ['Spot Trading', 'Advanced Orders', 'API v2'],
    requiredFields: ['apiKey', 'secretKey', 'passphrase']
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    description: 'Exchange com muitas altcoins',
    logo: 'https://cryptoicons.org/api/icon/kcs/32',
    features: ['Spot', 'Futures', 'Margin', 'Trading Bot'],
    requiredFields: ['apiKey', 'secretKey', 'passphrase']
  }
];

export const brokerageApi = {
  // ========== CONNECTION MANAGEMENT ==========

  /**
   * Get list of supported brokerages
   */
  getSupportedBrokerages: async () => {
    // For development, return mock data
    // const response = await api.get('/brokerage/supported');
    // return response.data;
    return mockSupportedBrokerages;
  },

  /**
   * Get user's connected brokerages
   */
  getConnectedBrokerages: async (token) => {
    // Mock data for development
    const mockConnectedBrokerages = [
      {
        id: 'conn_1',
        brokerage_id: 'binance',
        brokerage_name: 'Binance',
        brokerage_logo: 'https://cryptoicons.org/api/icon/bnb/32',
        name: 'Binance Principal',
        api_key_masked: 'bN***************Kx',
        status: 'connected',
        test_mode: false,
        created_at: '2024-01-15T10:30:00Z',
        last_sync: '2024-01-16T08:15:00Z'
      },
      {
        id: 'conn_2',
        brokerage_id: 'bybit',
        brokerage_name: 'Bybit',
        brokerage_logo: 'https://cryptoicons.org/api/icon/bybit/32',
        name: 'Bybit Futures',
        api_key_masked: 'by***************7s',
        status: 'connected',
        test_mode: true,
        sub_account: 'futures_account',
        created_at: '2024-01-14T14:20:00Z',
        last_sync: '2024-01-16T07:45:00Z'
      }
    ];
    
    // const response = await api.get('/brokerage/connections', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return response.data;
    return mockConnectedBrokerages;
  },

  /**
   * Connect a new brokerage account
   */
  connectBrokerage: async (brokerageData, token) => {
    const response = await api.post('/brokerage/connect', brokerageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update brokerage connection (refresh credentials)
   */
  updateConnection: async (connectionId, updateData, token) => {
    const response = await api.put(`/brokerage/connections/${connectionId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Disconnect a brokerage
   */
  disconnectBrokerage: async (connectionId, token) => {
    const response = await api.delete(`/brokerage/connections/${connectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Test brokerage connection
   */
  testConnection: async (connectionId, token) => {
    const response = await api.post(`/brokerage/connections/${connectionId}/test`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== DATA SYNCHRONIZATION ==========

  /**
   * Manually sync trading history from a brokerage
   */
  syncTradingHistory: async (connectionId, options = {}, token) => {
    const response = await api.post(`/brokerage/connections/${connectionId}/sync`, options, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Sync all connected brokerages
   */
  syncAllBrokerages: async (token) => {
    const response = await api.post('/brokerage/sync-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get sync status for a connection
   */
  getSyncStatus: async (connectionId, token) => {
    const response = await api.get(`/brokerage/connections/${connectionId}/sync-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Cancel ongoing sync
   */
  cancelSync: async (connectionId, token) => {
    const response = await api.post(`/brokerage/connections/${connectionId}/cancel-sync`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== TRADING HISTORY ==========

  /**
   * Get consolidated trading history from all brokerages
   */
  getConsolidatedHistory: async (filters = {}, token) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/brokerage/history?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get trading history from specific brokerage
   */
  getBrokerageHistory: async (connectionId, filters = {}, token) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/brokerage/connections/${connectionId}/history?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get trade details by ID
   */
  getTradeDetails: async (tradeId, token) => {
    const response = await api.get(`/brokerage/trades/${tradeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update trade (add notes, categories, etc.)
   */
  updateTrade: async (tradeId, updateData, token) => {
    const response = await api.put(`/brokerage/trades/${tradeId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Delete imported trade
   */
  deleteTrade: async (tradeId, token) => {
    const response = await api.delete(`/brokerage/trades/${tradeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== PORTFOLIO TRACKING ==========

  /**
   * Get current portfolio from all brokerages
   */
  getCurrentPortfolio: async (token) => {
    const response = await api.get('/brokerage/portfolio', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get portfolio history/snapshots
   */
  getPortfolioHistory: async (timeframe = '30d', token) => {
    const response = await api.get(`/brokerage/portfolio/history?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get portfolio analytics
   */
  getPortfolioAnalytics: async (token) => {
    const response = await api.get('/brokerage/portfolio/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== RISK MANAGEMENT ==========

  /**
   * Get risk metrics from real trading history
   */
  getRiskMetrics: async (timeframe = '30d', token) => {
    const response = await api.get(`/brokerage/risk-metrics?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Compare calculated vs actual risk
   */
  compareRiskCalculations: async (calculationIds, token) => {
    const response = await api.post('/brokerage/risk-comparison', { calculationIds }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis: async (filters = {}, token) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/brokerage/performance?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== ACCOUNT MANAGEMENT ==========

  /**
   * Get account balances from all brokerages
   */
  getAccountBalances: async (token) => {
    const response = await api.get('/brokerage/balances', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get account information
   */
  getAccountInfo: async (connectionId, token) => {
    const response = await api.get(`/brokerage/connections/${connectionId}/account`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get trading fees and costs
   */
  getTradingCosts: async (connectionId, timeframe = '30d', token) => {
    const response = await api.get(`/brokerage/connections/${connectionId}/costs?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== REAL-TIME DATA ==========

  /**
   * Get real-time positions
   */
  getRealTimePositions: async (token) => {
    const response = await api.get('/brokerage/positions/realtime', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get real-time P&L
   */
  getRealTimePnL: async (token) => {
    const response = await api.get('/brokerage/pnl/realtime', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Subscribe to real-time updates (WebSocket)
   */
  subscribeToUpdates: async (subscriptions, token) => {
    const response = await api.post('/brokerage/subscribe', subscriptions, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== REPORTS & EXPORT ==========

  /**
   * Generate trading report
   */
  generateReport: async (reportConfig, token) => {
    const response = await api.post('/brokerage/reports/generate', reportConfig, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Export trading data
   */
  exportTradingData: async (exportConfig, token) => {
    const response = await api.post('/brokerage/export', exportConfig, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get available reports
   */
  getAvailableReports: async (token) => {
    const response = await api.get('/brokerage/reports', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Download report file
   */
  downloadReport: async (reportId, token) => {
    const response = await api.get(`/brokerage/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    return response.data;
  },

  // ========== AUTOMATION ==========

  /**
   * Set up automated sync schedule
   */
  setupAutoSync: async (connectionId, schedule, token) => {
    const response = await api.post(`/brokerage/connections/${connectionId}/auto-sync`, schedule, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get automation settings
   */
  getAutomationSettings: async (connectionId, token) => {
    const response = await api.get(`/brokerage/connections/${connectionId}/automation`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update automation settings
   */
  updateAutomationSettings: async (connectionId, settings, token) => {
    const response = await api.put(`/brokerage/connections/${connectionId}/automation`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ========== WEBHOOKS ==========

  /**
   * Set up webhook for trade notifications
   */
  setupWebhook: async (webhookConfig, token) => {
    const response = await api.post('/brokerage/webhooks', webhookConfig, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get webhook configurations
   */
  getWebhooks: async (token) => {
    const response = await api.get('/brokerage/webhooks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update webhook
   */
  updateWebhook: async (webhookId, config, token) => {
    const response = await api.put(`/brokerage/webhooks/${webhookId}`, config, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Delete webhook
   */
  deleteWebhook: async (webhookId, token) => {
    const response = await api.delete(`/brokerage/webhooks/${webhookId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Format trade data for display
 */
export const formatTradeData = (trade) => {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side?.toUpperCase() || 'UNKNOWN',
    quantity: parseFloat(trade.quantity || 0),
    price: parseFloat(trade.price || 0),
    timestamp: new Date(trade.timestamp),
    pnl: parseFloat(trade.pnl || 0),
    pnlPercentage: parseFloat(trade.pnl_percentage || 0),
    fees: parseFloat(trade.fees || 0),
    brokerage: trade.brokerage_name,
    status: trade.status || 'completed',
    notes: trade.notes || '',
    category: trade.category || 'uncategorized'
  };
};

/**
 * Calculate portfolio metrics
 */
export const calculatePortfolioMetrics = (trades, balances) => {
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0);
  const totalVolume = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0).length;
  const totalTrades = trades.length;
  
  return {
    totalPnL,
    totalFees,
    totalVolume,
    netPnL: totalPnL - totalFees,
    winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    totalTrades,
    winningTrades,
    losingTrades,
    avgWin: winningTrades > 0 ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades : 0,
    avgLoss: losingTrades > 0 ? trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / losingTrades : 0,
    profitFactor: totalTrades > 0 ? Math.abs(trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)) : 0
  };
};

/**
 * Validate brokerage credentials
 */
export const validateCredentials = (brokerage, credentials) => {
  const validationRules = {
    binance: ['apiKey', 'secretKey'],
    bybit: ['apiKey', 'secretKey'],
    bingx: ['apiKey', 'secretKey'],
    bitget: ['apiKey', 'secretKey', 'passphrase'],
    kraken: ['apiKey', 'secretKey'],
    coinbase: ['apiKey', 'secretKey', 'passphrase'],
    ftx: ['apiKey', 'secretKey', 'subAccount'],
    kucoin: ['apiKey', 'secretKey', 'passphrase']
  };

  const requiredFields = validationRules[brokerage.toLowerCase()] || ['apiKey', 'secretKey'];
  const missingFields = requiredFields.filter(field => !credentials[field] || credentials[field].trim() === '');

  return {
    isValid: missingFields.length === 0,
    missingFields,
    requiredFields
  };
};

/**
 * Get brokerage connection status color
 */
export const getConnectionStatusColor = (status) => {
  const statusColors = {
    'connected': 'success',
    'connecting': 'warning', 
    'disconnected': 'error',
    'syncing': 'info',
    'error': 'error',
    'pending': 'warning'
  };
  
  return statusColors[status.toLowerCase()] || 'secondary';
};

export default brokerageApi;