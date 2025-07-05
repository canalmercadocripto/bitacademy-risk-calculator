// Using Web Crypto API for signature generation

/**
 * Binance API Integration Service
 * Real API calls to Binance with proper authentication
 */

const BINANCE_API_BASE = 'https://api.binance.com';
const BINANCE_TESTNET_BASE = 'https://testnet.binance.vision';

// Use Vercel API Route as proxy (works on Vercel hosting)
const getVercelApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side - use current domain
    return `${window.location.origin}/api/binance`;
  }
  // Server side or fallback
  return '/api/binance';
};

class BinanceAPI {
  constructor(apiKey, secretKey, testMode = false, useProxy = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.testMode = testMode;
    this.useProxy = useProxy; // Default to true for Vercel
    
    if (useProxy) {
      this.baseURL = getVercelApiUrl();
    } else {
      this.baseURL = testMode ? BINANCE_TESTNET_BASE : BINANCE_API_BASE;
    }
  }

  // Generate signature for authenticated requests using Web Crypto API
  async generateSignature(queryString) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Create authenticated request headers
  getHeaders() {
    return {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Make authenticated API request using Vercel API Route
  async makeRequest(endpoint, params = {}, method = 'GET') {
    if (this.useProxy) {
      // Using Vercel API Route - no CORS issues
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      }).toString();
      
      const url = `${this.baseURL}?${queryParams}`;
      
      try {
        console.log(`🔗 Making request via Vercel API Route: ${endpoint}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'X-Secret-Key': this.secretKey
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Success via Vercel API Route: ${endpoint}`);
        return data;
        
      } catch (error) {
        console.error('Vercel API Route Error:', error);
        throw error;
      }
    } else {
      // Direct API call (for Node.js environments)
      const timestamp = Date.now();
      const queryParams = {
        ...params,
        timestamp
      };

      // Create query string
      const queryString = new URLSearchParams(queryParams).toString();
      
      // Add signature (now async)
      const signature = await this.generateSignature(queryString);
      const finalQueryString = `${queryString}&signature=${signature}`;

      const url = `${this.baseURL}${endpoint}?${finalQueryString}`;

      try {
        const response = await fetch(url, {
          method,
          headers: this.getHeaders()
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Binance API Error: ${errorData.msg || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Binance API Request Error:', error);
        throw error;
      }
    }
  }

  // Test API connection
  async testConnection() {
    try {
      const accountInfo = await this.makeRequest('/api/v3/account');
      return {
        success: true,
        status: 'connected',
        accountType: accountInfo.accountType,
        canTrade: accountInfo.canTrade,
        canWithdraw: accountInfo.canWithdraw,
        canDeposit: accountInfo.canDeposit,
        permissions: accountInfo.permissions
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }

  // Get account information
  async getAccountInfo() {
    return await this.makeRequest('/api/v3/account');
  }

  // Get account balances
  async getBalances() {
    const accountInfo = await this.getAccountInfo();
    const balances = accountInfo.balances.filter(balance => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    );

    // Get current prices for USD conversion
    const tickerPrices = await this.getTickerPrices();
    const priceMap = tickerPrices.reduce((acc, ticker) => {
      acc[ticker.symbol] = parseFloat(ticker.price);
      return acc;
    }, {});

    return balances.map(balance => {
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;
      
      // Calculate USD value
      let usdValue = 0;
      if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
        usdValue = total;
      } else if (balance.asset === 'BTC') {
        usdValue = total * (priceMap['BTCUSDT'] || 0);
      } else if (balance.asset === 'ETH') {
        usdValue = total * (priceMap['ETHUSDT'] || 0);
      } else if (balance.asset === 'BNB') {
        usdValue = total * (priceMap['BNBUSDT'] || 0);
      } else {
        // Try to find price against USDT
        const symbol = `${balance.asset}USDT`;
        usdValue = total * (priceMap[symbol] || 0);
      }

      return {
        asset: balance.asset,
        free: free.toFixed(8),
        locked: locked.toFixed(8),
        total: total.toFixed(8),
        usdValue: usdValue
      };
    }).filter(balance => balance.usdValue > 0.01); // Filter out very small amounts
  }

  // Get ticker prices (public endpoint, no auth needed)
  async getTickerPrices() {
    if (this.useProxy) {
      // Use Vercel API Route for consistency
      const url = `${this.baseURL}?endpoint=/api/v3/ticker/price`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch ticker prices');
        return await response.json();
      } catch (error) {
        // Fallback to direct call for public endpoint
        console.log('Fallback to direct ticker prices call');
        const directUrl = `${BINANCE_API_BASE}/api/v3/ticker/price`;
        const response = await fetch(directUrl);
        return await response.json();
      }
    } else {
      const url = `${BINANCE_API_BASE}/api/v3/ticker/price`;
      const response = await fetch(url);
      return await response.json();
    }
  }

  // Get trading history - OPTIMIZED for complete history
  async getTradingHistory(symbol = null, limit = 1000, startTime = null, endTime = null) {
    const params = { limit };
    
    if (symbol) params.symbol = symbol;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    try {
      if (symbol) {
        // Get trades for specific symbol with pagination support
        let allTrades = [];
        let fromId = null;
        const maxRequests = 10; // Limit to prevent infinite loops
        let requestCount = 0;

        while (requestCount < maxRequests) {
          const requestParams = { ...params };
          if (fromId) {
            requestParams.fromId = fromId;
            delete requestParams.startTime; // Can't use both fromId and startTime
          }

          const trades = await this.makeRequest('/api/v3/myTrades', requestParams);
          
          if (!trades || trades.length === 0) break;
          
          allTrades = allTrades.concat(trades.map(trade => ({
            ...trade,
            symbol
          })));

          // If we got less than requested, we've reached the end
          if (trades.length < limit) break;

          // Set fromId for next request (last trade ID + 1)
          fromId = trades[trades.length - 1].id + 1;
          requestCount++;

          // Rate limit delay
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Retrieved ${allTrades.length} trades for ${symbol}`);
        return allTrades;

      } else {
        // Get comprehensive trading history for all symbols
        const popularSymbols = [
          'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
          'XRPUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'AVAXUSDT',
          'LTCUSDT', 'LINKUSDT', 'UNIUSDT', 'BCHUSDT', 'FILUSDT',
          'ATOMUSDT', 'NEARUSDT', 'ICPUSDT', 'APTUSDT', 'ARBUSDT'
        ];
        
        let allTrades = [];
        
        for (const symbolName of popularSymbols) {
          try {
            console.log(`🔍 Fetching trades for ${symbolName}...`);
            
            const symbolTrades = await this.getTradingHistory(
              symbolName, 
              500, // Moderate limit per symbol
              startTime,
              endTime
            );
            
            if (symbolTrades && symbolTrades.length > 0) {
              allTrades = allTrades.concat(symbolTrades);
              console.log(`✅ ${symbolTrades.length} trades found for ${symbolName}`);
            }

            // Rate limiting between symbols
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            console.log(`⚠️ No trades for ${symbolName}: ${error.message}`);
            continue;
          }
        }

        console.log(`🎉 Total trades retrieved: ${allTrades.length}`);
        return allTrades;
      }
    } catch (error) {
      console.error('Error getting trading history:', error);
      throw error; // Re-throw to handle in UI
    }
  }

  // Get all trading symbols
  async getAllSymbols() {
    if (this.useProxy) {
      // Use Vercel API Route for consistency
      const url = `${this.baseURL}?endpoint=/api/v3/exchangeInfo`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch exchange info');
        const data = await response.json();
        return data.symbols.map(s => s.symbol);
      } catch (error) {
        // Fallback to direct call for public endpoint
        console.log('Fallback to direct exchange info call');
        const directUrl = `${BINANCE_API_BASE}/api/v3/exchangeInfo`;
        const response = await fetch(directUrl);
        const data = await response.json();
        return data.symbols.map(s => s.symbol);
      }
    } else {
      const url = `${BINANCE_API_BASE}/api/v3/exchangeInfo`;
      const response = await fetch(url);
      const data = await response.json();
      return data.symbols.map(s => s.symbol);
    }
  }

  // Get order history
  async getOrderHistory(symbol = null, limit = 500) {
    const params = { limit };
    if (symbol) params.symbol = symbol;

    if (symbol) {
      return await this.makeRequest('/api/v3/allOrders', params);
    } else {
      // Get orders for popular symbols
      const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
      let allOrders = [];
      
      for (const symbol of popularSymbols) {
        try {
          const orders = await this.makeRequest('/api/v3/allOrders', { 
            symbol, 
            limit: 100 
          });
          allOrders = allOrders.concat(orders.map(order => ({
            ...order,
            symbol
          })));
        } catch (error) {
          continue;
        }
      }

      return allOrders;
    }
  }

  // Get 24hr ticker statistics
  async get24hrStats(symbol = null) {
    const endpoint = '/api/v3/ticker/24hr';
    const params = symbol ? { symbol } : {};
    
    if (this.useProxy) {
      // Use Vercel API Route
      return await this.makeRequest(endpoint, params);
    } else {
      const url = `${this.baseURL}${endpoint}${symbol ? `?symbol=${symbol}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    }
  }

  // Calculate trading fees and costs
  async getTradingCosts(days = 30) {
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    const trades = await this.getTradingHistory(null, 1000, startTime, endTime);
    
    let totalFees = 0;
    let totalVolume = 0;
    const feesByAsset = {};
    
    trades.forEach(trade => {
      const commission = parseFloat(trade.commission);
      const quoteQty = parseFloat(trade.quoteQty);
      
      totalFees += commission;
      totalVolume += quoteQty;
      
      if (!feesByAsset[trade.commissionAsset]) {
        feesByAsset[trade.commissionAsset] = 0;
      }
      feesByAsset[trade.commissionAsset] += commission;
    });

    return {
      totalFees,
      totalVolume,
      averageFeeRate: totalVolume > 0 ? totalFees / totalVolume : 0,
      totalTrades: trades.length,
      feesByAsset,
      feesByType: [
        { type: 'Trading Fees', amount: totalFees },
        { type: 'Spot Trading', amount: totalFees }
      ]
    };
  }

  // Format trade data for consistent display
  formatTradeData(trade) {
    return {
      id: trade.id,
      symbol: trade.symbol,
      side: trade.isBuyer ? 'BUY' : 'SELL',
      quantity: parseFloat(trade.qty),
      price: parseFloat(trade.price),
      timestamp: new Date(trade.time),
      pnl: 0, // Would need to calculate based on buy/sell pairs
      pnlPercentage: 0,
      fees: parseFloat(trade.commission),
      brokerage: 'Binance',
      status: 'completed',
      notes: '',
      category: 'spot'
    };
  }
}

export default BinanceAPI;