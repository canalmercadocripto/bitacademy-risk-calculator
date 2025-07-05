// Binance API Test Configuration
// Add your real API credentials here for testing

export const BINANCE_TEST_CONFIG = {
  // Get API credentials from environment variables
  apiKey: process.env.REACT_APP_BINANCE_API_KEY || '0k8fuw36SR2kyke48kOu8cxx7Z03TfUxpByECagAEz434XoKK3ZtKQ7MTlJrvFL0',
  
  // Get secret key from environment variables
  secretKey: process.env.REACT_APP_BINANCE_SECRET_KEY || 'v0c4dXjcqSCKOzyGcArx1i4rTMNgRNUWVOA1G9iDbBXuStmoFEADdB2XNpZqiKvy',
  
  // Test mode settings from environment
  testMode: process.env.REACT_APP_BINANCE_TEST_MODE === 'true',
  
  // Enable real API testing based on environment
  enabled: process.env.REACT_APP_USE_REAL_API === 'true'
};

// Test function to verify API connection
export const testBinanceConnection = async () => {
  if (!BINANCE_TEST_CONFIG.enabled) {
    console.log('Binance API testing disabled. Enable in config file.');
    return false;
  }
  
  if (!BINANCE_TEST_CONFIG.secretKey) {
    console.log('Secret key required for Binance API testing.');
    return false;
  }
  
  try {
    const { default: BinanceAPI } = await import('../services/binanceApi');
    const api = new BinanceAPI(
      BINANCE_TEST_CONFIG.apiKey,
      BINANCE_TEST_CONFIG.secretKey,
      BINANCE_TEST_CONFIG.testMode
    );
    
    console.log('Testing Binance API connection...');
    const result = await api.testConnection();
    
    if (result.success) {
      console.log('✅ Binance API connection successful!');
      console.log('Account Type:', result.accountType);
      console.log('Permissions:', result.permissions);
      return true;
    } else {
      console.log('❌ Binance API connection failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Binance API test error:', error);
    return false;
  }
};

// Test data retrieval functions
export const testBinanceData = async () => {
  if (!BINANCE_TEST_CONFIG.enabled || !BINANCE_TEST_CONFIG.secretKey) {
    console.log('Binance API not configured for testing.');
    return;
  }
  
  try {
    const { default: BinanceAPI } = await import('../services/binanceApi');
    const api = new BinanceAPI(
      BINANCE_TEST_CONFIG.apiKey,
      BINANCE_TEST_CONFIG.secretKey,
      BINANCE_TEST_CONFIG.testMode
    );
    
    console.log('Testing Binance API data retrieval...');
    
    // Test account balances
    console.log('📊 Getting account balances...');
    const balances = await api.getBalances();
    console.log(`Found ${balances.length} assets with balances`);
    
    // Test trading history
    console.log('📈 Getting trading history...');
    const trades = await api.getTradingHistory();
    console.log(`Found ${trades.length} recent trades`);
    
    // Test fee analysis
    console.log('💰 Getting trading costs...');
    const costs = await api.getTradingCosts(30);
    console.log(`Total fees (30 days): ${costs.totalFees}`);
    console.log(`Total trades: ${costs.totalTrades}`);
    
    return {
      balances,
      trades,
      costs
    };
  } catch (error) {
    console.error('❌ Binance API data test error:', error);
    return null;
  }
};