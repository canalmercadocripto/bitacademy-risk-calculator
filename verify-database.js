#!/usr/bin/env node

// Script para verificar o banco de dados diretamente
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (você precisa preencher com as suas credenciais)
const SUPABASE_URL = 'https://gxkqcmyhlpbpytdvuhvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4a3FjbXlobHBicHl0ZHZ1aHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNjIzMjUsImV4cCI6MjA1MTczODMyNX0.qPGJGnhMPaHhFzOOvBKr7lsEoXvnZRKZJJCFPvgaYI0';

async function verifyDatabase() {
  console.log('🔍 Verificando Banco de Dados BitAcademy');
  console.log('=====================================');
  
  try {
    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Cliente Supabase criado');
    
    // Teste 1: Verificar se as tabelas existem
    console.log('\n📋 Verificando estrutura das tabelas...');
    
    // Verificar tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users OK - Registros:', users.length);
      if (users.length > 0) {
        console.log('Exemplo de usuário:', {
          id: users[0].id,
          name: users[0].name,
          email: users[0].email,
          role: users[0].role
        });
      }
    }
    
    // Verificar tabela trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(5);
    
    if (tradesError) {
      console.error('❌ Erro na tabela trades:', tradesError.message);
    } else {
      console.log('✅ Tabela trades OK - Registros:', trades.length);
      if (trades.length > 0) {
        console.log('Exemplo de trade:', {
          id: trades[0].id,
          user_id: trades[0].user_id,
          exchange: trades[0].exchange,
          symbol: trades[0].symbol,
          status: trades[0].status
        });
      }
    }
    
    // Teste 2: Verificar usuários admin
    console.log('\n👑 Verificando usuários admin...');
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'admin');
    
    if (adminsError) {
      console.error('❌ Erro ao buscar admins:', adminsError.message);
    } else {
      console.log('✅ Admins encontrados:', admins.length);
      admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email})`);
      });
    }
    
    // Teste 3: Testar join trades + users
    console.log('\n🔗 Testando join trades + users...');
    const { data: joinedData, error: joinError } = await supabase
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
        created_at,
        users(name, email)
      `)
      .limit(10);
    
    if (joinError) {
      console.error('❌ Erro no join:', joinError.message);
    } else {
      console.log('✅ Join trades + users OK - Registros:', joinedData.length);
      if (joinedData.length > 0) {
        console.log('Exemplo de trade com usuário:', {
          id: joinedData[0].id,
          user_id: joinedData[0].user_id,
          userName: joinedData[0].users?.name,
          userEmail: joinedData[0].users?.email,
          exchange: joinedData[0].exchange,
          symbol: joinedData[0].symbol,
          status: joinedData[0].status
        });
      }
    }
    
    // Teste 4: Criar dados de teste se não existirem
    if (trades.length === 0) {
      console.log('\n🔨 Criando dados de teste...');
      
      // Primeiro, vamos encontrar um usuário para usar
      let testUserId = null;
      if (users.length > 0) {
        testUserId = users[0].id;
      }
      
      if (testUserId) {
        // Inserir trades de teste
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
            notes: 'Trade de teste criado automaticamente'
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
            notes: 'Trade de teste - fechado'
          }
        ];
        
        const { error: insertError } = await supabase
          .from('trades')
          .insert(testTrades);
        
        if (insertError) {
          console.error('❌ Erro ao inserir trades de teste:', insertError.message);
        } else {
          console.log('✅ Trades de teste criados com sucesso!');
        }
      }
    }
    
    // Teste 5: Executar query similar ao admin-trades.js
    console.log('\n🎯 Testando query do admin-trades...');
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
      .limit(100);
    
    if (adminTradesError) {
      console.error('❌ Erro na query admin-trades:', adminTradesError.message);
    } else {
      console.log('✅ Query admin-trades OK - Registros:', adminTradesData.length);
      
      // Simular formatação dos dados
      const formattedTrades = adminTradesData?.map(trade => ({
        id: trade.id,
        userId: trade.user_id,
        userName: trade.users?.name || 'Usuário Desconhecido',
        userEmail: trade.users?.email || 'email@desconhecido.com',
        exchange: trade.exchange,
        symbol: trade.symbol,
        accountSize: parseFloat(trade.account_size || 0),
        riskPercentage: parseFloat(trade.risk_percentage || 0),
        entryPrice: parseFloat(trade.entry_price || 0),
        stopLoss: parseFloat(trade.stop_loss || 0),
        takeProfit: parseFloat(trade.take_profit || 0),
        positionSize: parseFloat(trade.position_size || 0),
        riskAmount: parseFloat(trade.risk_amount || 0),
        rewardAmount: parseFloat(trade.reward_amount || 0),
        riskRewardRatio: parseFloat(trade.risk_reward_ratio || 0),
        currentPrice: parseFloat(trade.current_price || 0),
        tradeType: trade.trade_type || 'long',
        status: trade.status || 'active',
        notes: trade.notes || '',
        createdAt: trade.created_at,
        updatedAt: trade.updated_at
      })) || [];
      
      console.log('✅ Dados formatados:', formattedTrades.length, 'trades');
      if (formattedTrades.length > 0) {
        console.log('Primeiro trade formatado:', formattedTrades[0]);
      }
    }
    
    console.log('\n🎉 Verificação concluída!');
    console.log('============================');
    console.log('Resumo:');
    console.log('- Usuários:', users?.length || 0);
    console.log('- Trades:', adminTradesData?.length || 0);
    console.log('- Admins:', admins?.length || 0);
    console.log('- Join funcionando:', joinError ? 'NÃO' : 'SIM');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
verifyDatabase().catch(console.error);