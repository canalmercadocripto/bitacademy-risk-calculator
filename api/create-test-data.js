const { supabase } = require('../lib/supabase');

// API endpoint para criar dados de teste
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  try {
    console.log('🚀 Criando dados de teste...');
    
    // Primeiro, verificar se já existem usuários
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      throw new Error(`Erro ao verificar usuários: ${usersError.message}`);
    }
    
    console.log('Usuários existentes:', existingUsers.length);
    
    let testUserId = null;
    let adminUserId = null;
    
    // Criar usuários se não existirem
    if (existingUsers.length === 0) {
      console.log('Criando usuários de teste...');
      
      // Criar admin
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          name: 'Admin BitAcademy',
          email: 'admin@bitacademy.com',
          phone: '+5511999999999',
          password: 'Admin123456!',
          role: 'admin'
        })
        .select()
        .single();
      
      if (adminError) {
        throw new Error(`Erro ao criar admin: ${adminError.message}`);
      }
      
      adminUserId = adminUser.id;
      console.log('Admin criado:', adminUser.id);
      
      // Criar usuário teste
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .insert({
          name: 'Usuário Teste',
          email: 'teste@bitacademy.com',
          phone: '+5511888888888',
          password: 'teste123',
          role: 'user'
        })
        .select()
        .single();
      
      if (testError) {
        throw new Error(`Erro ao criar usuário teste: ${testError.message}`);
      }
      
      testUserId = testUser.id;
      console.log('Usuário teste criado:', testUser.id);
      
    } else {
      // Usar usuários existentes
      const adminUser = existingUsers.find(u => u.role === 'admin');
      const regularUser = existingUsers.find(u => u.role === 'user');
      
      adminUserId = adminUser ? adminUser.id : existingUsers[0].id;
      testUserId = regularUser ? regularUser.id : existingUsers[0].id;
      
      console.log('Usando usuários existentes:', { adminUserId, testUserId });
    }
    
    // Verificar se já existem trades
    const { data: existingTrades, error: tradesError } = await supabase
      .from('trades')
      .select('id')
      .limit(5);
    
    if (tradesError) {
      throw new Error(`Erro ao verificar trades: ${tradesError.message}`);
    }
    
    console.log('Trades existentes:', existingTrades.length);
    
    // Criar trades de teste se não existirem
    if (existingTrades.length === 0) {
      console.log('Criando trades de teste...');
      
      const testTrades = [
        {
          user_id: testUserId,
          exchange: 'binance',
          symbol: 'BTCUSDT',
          account_size: 1000,
          risk_percentage: 2,
          entry_price: 45000,
          stop_loss: 43000,
          take_profit: 49000,
          position_size: 0.00044,
          risk_amount: 20,
          reward_amount: 80,
          risk_reward_ratio: 4,
          trade_type: 'long',
          status: 'active',
          notes: 'Trade de teste - BTC Long',
          created_at: new Date().toISOString()
        },
        {
          user_id: testUserId,
          exchange: 'bybit',
          symbol: 'ETHUSDT',
          account_size: 500,
          risk_percentage: 1.5,
          entry_price: 2500,
          stop_loss: 2400,
          take_profit: 2700,
          position_size: 0.003,
          risk_amount: 7.5,
          reward_amount: 15,
          risk_reward_ratio: 2,
          trade_type: 'long',
          status: 'closed',
          notes: 'Trade de teste - ETH Long fechado',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          user_id: adminUserId,
          exchange: 'binance',
          symbol: 'ADAUSDT',
          account_size: 2000,
          risk_percentage: 1,
          entry_price: 0.5,
          stop_loss: 0.45,
          take_profit: 0.6,
          position_size: 40,
          risk_amount: 20,
          reward_amount: 40,
          risk_reward_ratio: 2,
          trade_type: 'long',
          status: 'active',
          notes: 'Trade admin - ADA Long',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      const { data: insertedTrades, error: insertError } = await supabase
        .from('trades')
        .insert(testTrades)
        .select();
      
      if (insertError) {
        throw new Error(`Erro ao inserir trades: ${insertError.message}`);
      }
      
      console.log('Trades criados:', insertedTrades.length);
    }
    
    // Verificar o resultado final
    const { data: finalTrades, error: finalError } = await supabase
      .from('trades')
      .select(`
        id,
        user_id,
        exchange,
        symbol,
        account_size,
        risk_percentage,
        entry_price,
        position_size,
        risk_amount,
        reward_amount,
        risk_reward_ratio,
        trade_type,
        status,
        notes,
        created_at,
        users(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (finalError) {
      throw new Error(`Erro ao verificar resultado final: ${finalError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Dados de teste criados com sucesso!',
      data: {
        usersCreated: existingUsers.length === 0 ? 2 : 0,
        tradesCreated: existingTrades.length === 0 ? 3 : 0,
        totalTrades: finalTrades.length,
        sampleTrades: finalTrades.map(trade => ({
          id: trade.id,
          userName: trade.users?.name,
          userEmail: trade.users?.email,
          exchange: trade.exchange,
          symbol: trade.symbol,
          status: trade.status,
          createdAt: trade.created_at
        }))
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar dados de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar dados de teste',
      error: error.message
    });
  }
}