const { supabase } = require('../lib/supabase');

// API endpoint para debugar o banco de dados
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET'
    },
    tests: {}
  };
  
  try {
    // Teste 1: Verificar se o cliente Supabase foi criado
    results.tests.supabaseClient = 'OK';
    
    // Teste 2: Verificar tabela users
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .limit(5);
      
      if (usersError) {
        results.tests.usersTable = { error: usersError.message };
      } else {
        results.tests.usersTable = { 
          status: 'OK', 
          count: users.length,
          sample: users.length > 0 ? users[0] : null
        };
      }
    } catch (error) {
      results.tests.usersTable = { error: error.message };
    }
    
    // Teste 3: Verificar tabela trades
    try {
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('id, user_id, exchange, symbol, status')
        .limit(5);
      
      if (tradesError) {
        results.tests.tradesTable = { error: tradesError.message };
      } else {
        results.tests.tradesTable = { 
          status: 'OK', 
          count: trades.length,
          sample: trades.length > 0 ? trades[0] : null
        };
      }
    } catch (error) {
      results.tests.tradesTable = { error: error.message };
    }
    
    // Teste 4: Verificar join trades + users
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('trades')
        .select(`
          id,
          user_id,
          exchange,
          symbol,
          users(name, email)
        `)
        .limit(3);
      
      if (joinError) {
        results.tests.joinQuery = { error: joinError.message };
      } else {
        results.tests.joinQuery = { 
          status: 'OK', 
          count: joinData.length,
          sample: joinData.length > 0 ? joinData[0] : null
        };
      }
    } catch (error) {
      results.tests.joinQuery = { error: error.message };
    }
    
    // Teste 5: Verificar usuários admin
    try {
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', 'admin');
      
      if (adminsError) {
        results.tests.adminUsers = { error: adminsError.message };
      } else {
        results.tests.adminUsers = { 
          status: 'OK', 
          count: admins.length,
          admins: admins.map(a => ({ id: a.id, name: a.name, email: a.email }))
        };
      }
    } catch (error) {
      results.tests.adminUsers = { error: error.message };
    }
    
    // Teste 6: Simular query do admin-trades
    try {
      const { data: adminTradesData, error: adminTradesError } = await supabase
        .from('trades')
        .select(`
          id,
          user_id,
          exchange,
          symbol,
          account_size,
          risk_percentage,
          entry_price,
          stop_loss,
          take_profit,
          position_size,
          risk_amount,
          reward_amount,
          risk_reward_ratio,
          current_price,
          trade_type,
          status,
          notes,
          created_at,
          updated_at,
          users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (adminTradesError) {
        results.tests.adminTradesQuery = { error: adminTradesError.message };
      } else {
        const formattedTrades = adminTradesData?.map(trade => ({
          id: trade.id,
          userId: trade.user_id,
          userName: trade.users?.name || 'Usuário Desconhecido',
          userEmail: trade.users?.email || 'email@desconhecido.com',
          exchange: trade.exchange,
          symbol: trade.symbol,
          accountSize: parseFloat(trade.account_size || 0),
          status: trade.status || 'active',
          createdAt: trade.created_at
        })) || [];
        
        results.tests.adminTradesQuery = { 
          status: 'OK', 
          count: adminTradesData.length,
          formattedCount: formattedTrades.length,
          sample: formattedTrades.length > 0 ? formattedTrades[0] : null
        };
      }
    } catch (error) {
      results.tests.adminTradesQuery = { error: error.message };
    }
    
    return res.status(200).json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Debug database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao debugar banco de dados',
      error: error.message,
      results: results
    });
  }
}