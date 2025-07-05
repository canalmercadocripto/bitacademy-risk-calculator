// Quick test script for Binance API connection
// Run with: node test-binance-api.js

const crypto = require('crypto');
// Using built-in fetch in Node.js 22+

const API_KEY = '0k8fuw36SR2kyke48kOu8cxx7Z03TfUxpByECagAEz434XoKK3ZtKQ7MTlJrvFL0';
const SECRET_KEY = 'v0c4dXjcqSCKOzyGcArx1i4rTMNgRNUWVOA1G9iDbBXuStmoFEADdB2XNpZqiKvy';
const BASE_URL = 'https://api.binance.com';

function generateSignature(queryString) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

async function testBinanceAPI() {
  console.log('🧪 Testing Binance API Connection...\n');
  
  try {
    // Test 1: Server Time (No auth required)
    console.log('📡 Testing server connectivity...');
    const timeResponse = await fetch(`${BASE_URL}/api/v3/time`);
    const timeData = await timeResponse.json();
    console.log('✅ Server time:', new Date(timeData.serverTime).toISOString());
    
    // Test 2: Account Info (Auth required)
    console.log('\n🔐 Testing authenticated request...');
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = generateSignature(queryString);
    
    const accountResponse = await fetch(`${BASE_URL}/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': API_KEY
      }
    });
    
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('✅ Authentication successful!');
      console.log('📊 Account Type:', accountData.accountType);
      console.log('🔑 Permissions:', accountData.permissions);
      console.log('💰 Non-zero balances:', accountData.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0).length);
      
      // Test 3: Get some ticker data
      console.log('\n📈 Testing market data...');
      const tickerResponse = await fetch(`${BASE_URL}/api/v3/ticker/24hr?symbol=BTCUSDT`);
      const tickerData = await tickerResponse.json();
      console.log('✅ BTC/USDT Price:', tickerData.lastPrice);
      
      console.log('\n🎉 All tests passed! API integration is working correctly.');
      console.log('\n💡 Next steps:');
      console.log('1. Start your React app: npm start');
      console.log('2. Login as admin');
      console.log('3. Go to "Teste API Binance" in the sidebar');
      console.log('4. Click "Testar Conexão API" to test in the browser');
      
    } else {
      const errorData = await accountResponse.json();
      console.error('❌ Authentication failed:', errorData.msg);
      console.error('🔍 Check your API key and secret key');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testBinanceAPI();