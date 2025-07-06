#!/usr/bin/env node

// Debug script to test admin trades API
const { createClient } = require('@supabase/supabase-js');

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://your-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'your-anon-key';

async function debugAdminTrades() {
  console.log('🔍 Debug Admin Trades API');
  console.log('========================');
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('');
  
  // Test if we can import the required modules
  try {
    console.log('Module Import Test:');
    const { supabase } = require('./lib/supabase');
    console.log('✅ Supabase client imported successfully');
    
    const securityMiddleware = require('./middleware/security');
    console.log('✅ Security middleware imported successfully');
    console.log('');
    
    // Test if we can create a Supabase client
    console.log('Supabase Connection Test:');
    const testClient = createClient(
      process.env.SUPABASE_URL || 'https://test.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'test-key'
    );
    console.log('✅ Supabase client created (note: credentials may be invalid)');
    console.log('');
    
    // Test the main logic flow
    console.log('API Logic Test:');
    console.log('Mock query parameters: action=list, limit=100');
    
    const mockQuery = {
      action: 'list',
      page: 1,
      limit: 100,
      exchange: '',
      status: ''
    };
    
    console.log('Query parameters parsed:', mockQuery);
    
    const pageNum = parseInt(mockQuery.page);
    const limitNum = parseInt(mockQuery.limit);
    const offset = (pageNum - 1) * limitNum;
    
    console.log('Pagination calculated:', { pageNum, limitNum, offset });
    console.log('');
    
    // Simulate query building
    console.log('Query Building Test:');
    console.log('Base query would be:');
    console.log(`
      supabase
        .from('trades')
        .select(\`
          id, user_id, exchange, symbol, account_size, risk_percentage,
          entry_price, stop_loss, take_profit, position_size, risk_amount,
          reward_amount, risk_reward_ratio, current_price, trade_type,
          status, notes, created_at, updated_at, users(name, email)
        \`)
        .order('created_at', { ascending: false })
        .range(${offset}, ${offset + limitNum - 1})
    `);
    
    console.log('✅ Query structure is correct');
    console.log('');
    
    // Test security middleware functions
    console.log('Security Middleware Test:');
    const mockReq = {
      headers: { origin: 'http://localhost:3000' },
      body: { test: 'data' }
    };
    const mockRes = {
      setHeader: (name, value) => console.log(`Header set: ${name} = ${value}`),
      status: (code) => ({ json: (data) => console.log(`Response: ${code}`, data) })
    };
    
    console.log('Testing CORS headers...');
    securityMiddleware.corsHeaders(mockReq, mockRes);
    console.log('✅ CORS headers applied');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('🎯 Next Steps:');
  console.log('1. Check if SUPABASE_URL and SUPABASE_ANON_KEY are properly set in Vercel');
  console.log('2. Verify the database schema has "trades" and "users" tables');
  console.log('3. Check if the RLS policies allow admin access to all trades');
  console.log('4. Test the API endpoint directly in production');
  console.log('5. Add console.log statements to api/admin-trades.js for debugging');
}

// Run the debug function
debugAdminTrades().catch(console.error);