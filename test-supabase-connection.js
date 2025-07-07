#!/usr/bin/env node

// Test script to verify Supabase connection and database structure
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection and Database Structure');
  console.log('===================================================');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables not set:');
    console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');
    console.log('\n🔧 Please set these environment variables:');
    console.log('export SUPABASE_URL="your-supabase-url"');
    console.log('export SUPABASE_ANON_KEY="your-supabase-anon-key"');
    return;
  }
  
  console.log('✅ Environment variables are set');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_ANON_KEY:', supabaseKey.substring(0, 20) + '...');
  console.log('');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test 1: Check if we can connect to the database
    console.log('\n📊 Testing Database Connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Check users table structure
    console.log('\n👥 Testing Users Table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('Sample users:', usersData?.length || 0, 'records');
      if (usersData && usersData.length > 0) {
        console.log('First user example:', usersData[0]);
      }
    }
    
    // Test 3: Check trades table structure
    console.log('\n💰 Testing Trades Table...');
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select(`
        id, user_id, exchange, symbol, account_size, risk_percentage,
        entry_price, stop_loss, take_profit, position_size, risk_amount,
        reward_amount, risk_reward_ratio, current_price, trade_type,
        status, notes, created_at, updated_at
      `)
      .limit(5);
    
    if (tradesError) {
      console.error('❌ Trades table error:', tradesError.message);
    } else {
      console.log('✅ Trades table accessible');
      console.log('Sample trades:', tradesData?.length || 0, 'records');
      if (tradesData && tradesData.length > 0) {
        console.log('First trade example:', tradesData[0]);
      }
    }
    
    // Test 4: Check trades with users join
    console.log('\n🔗 Testing Trades with Users Join...');
    const { data: joinData, error: joinError } = await supabase
      .from('trades')
      .select(`
        id, user_id, exchange, symbol, account_size,
        users(name, email)
      `)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Trades-Users join error:', joinError.message);
    } else {
      console.log('✅ Trades-Users join successful');
      console.log('Joined data:', joinData?.length || 0, 'records');
      if (joinData && joinData.length > 0) {
        console.log('First joined record:', joinData[0]);
      }
    }
    
    // Test 5: Check for admin users
    console.log('\n🔑 Testing Admin Users...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Admin users query error:', adminError.message);
    } else {
      console.log('✅ Admin users query successful');
      console.log('Admin users found:', adminData?.length || 0);
      if (adminData && adminData.length > 0) {
        console.log('Admin users:', adminData);
      }
    }
    
    // Test 6: Test RLS policies by trying to access all trades
    console.log('\n🔒 Testing RLS Policies...');
    const { data: allTradesData, error: allTradesError } = await supabase
      .from('trades')
      .select('id, user_id, exchange, symbol')
      .limit(10);
    
    if (allTradesError) {
      console.error('❌ RLS Policy error:', allTradesError.message);
      console.log('💡 This might indicate RLS policies are blocking access');
    } else {
      console.log('✅ RLS policies allow access to trades');
      console.log('Accessible trades:', allTradesData?.length || 0);
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('- Database connection:', testError ? '❌' : '✅');
    console.log('- Users table:', usersError ? '❌' : '✅');
    console.log('- Trades table:', tradesError ? '❌' : '✅');
    console.log('- Trades-Users join:', joinError ? '❌' : '✅');
    console.log('- Admin users:', adminError ? '❌' : '✅');
    console.log('- RLS policies:', allTradesError ? '❌' : '✅');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);