#!/usr/bin/env node

/**
 * Debug script to investigate database discrepancy
 * This script checks for potential causes of missing trades in admin interface
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://gxkqcmyhlpbpytdvuhvg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4a3FjbXlobHBicHl0ZHZ1aHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNjIzMjUsImV4cCI6MjA1MTczODMyNX0.qPGJGnhMPaHhFzOOvBKr7lsEoXvnZRKZJJCFPvgaYI0';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  try {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE DISCREPÂNCIA DE DADOS');
    console.log('='.repeat(60));
    
    // 1. Verificar estrutura das tabelas
    console.log('\n1. VERIFICANDO ESTRUTURA DAS TABELAS:');
    console.log('-'.repeat(40));
    
    // Verificar se tabela trades existe
    const { data: tradesStructure, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (tradesError) {
      console.log('❌ Erro ao acessar tabela trades:', tradesError.message);
      return;
    }
    
    console.log('✅ Tabela trades acessível');
    
    // Verificar se tabela trade_history existe
    const { data: tradeHistoryStructure, error: tradeHistoryError } = await supabase
      .from('trade_history')
      .select('*')
      .limit(1);
    
    if (tradeHistoryError) {
      console.log('⚠️ Tabela trade_history não encontrada:', tradeHistoryError.message);
    } else {
      console.log('✅ Tabela trade_history acessível');
    }
    
    // 2. Contagem total de trades
    console.log('\n2. CONTAGEM TOTAL DE TRADES:');
    console.log('-'.repeat(40));
    
    const { count: totalTrades, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Erro ao contar trades:', countError.message);
      return;
    }
    
    console.log(`📊 Total de trades no banco: ${totalTrades}`);
    
    // 3. Verificar trades por página (simulando admin interface)
    console.log('\n3. VERIFICANDO PAGINAÇÃO:');
    console.log('-'.repeat(40));
    
    const limit = 100;
    let page = 1;
    let totalRetrieved = 0;
    
    while (true) {
      const offset = (page - 1) * limit;
      
      const { data: pageData, error: pageError } = await supabase
        .from('trades')
        .select(`
          id,
          user_id,
          exchange,
          symbol,
          created_at,
          users(name, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (pageError) {
        console.log(`❌ Erro na página ${page}:`, pageError.message);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        console.log(`📄 Página ${page}: 0 trades (fim dos dados)`);
        break;
      }
      
      totalRetrieved += pageData.length;
      console.log(`📄 Página ${page}: ${pageData.length} trades`);
      
      // Verificar se há dados órfãos
      const orphanTrades = pageData.filter(trade => !trade.users);
      if (orphanTrades.length > 0) {
        console.log(`⚠️ Encontrados ${orphanTrades.length} trades órfãos na página ${page}`);
      }
      
      page++;
      
      // Limite de segurança para evitar loop infinito
      if (page > 50) break;
    }
    
    console.log(`📊 Total recuperado via paginação: ${totalRetrieved}`);
    console.log(`📊 Diferença: ${totalTrades - totalRetrieved}`);
    
    // 4. Verificar trades órfãos (sem usuário)
    console.log('\n4. VERIFICANDO TRADES ÓRFÃOS:');
    console.log('-'.repeat(40));
    
    const { data: orphanTrades, error: orphanError } = await supabase
      .from('trades')
      .select('id, user_id, exchange, symbol, created_at')
      .is('user_id', null);
    
    if (orphanError) {
      console.log('❌ Erro ao buscar trades órfãos:', orphanError.message);
    } else {
      console.log(`📊 Trades com user_id NULL: ${orphanTrades?.length || 0}`);
      if (orphanTrades?.length > 0) {
        console.log('Primeiros 5 trades órfãos:');
        orphanTrades.slice(0, 5).forEach(trade => {
          console.log(`  - ID: ${trade.id}, Exchange: ${trade.exchange}, Symbol: ${trade.symbol}`);
        });
      }
    }
    
    // 5. Verificar usuários inexistentes
    console.log('\n5. VERIFICANDO TRADES COM USUÁRIOS INEXISTENTES:');
    console.log('-'.repeat(40));
    
    const { data: tradesWithUsers, error: tradesUsersError } = await supabase
      .from('trades')
      .select('id, user_id, exchange, symbol, created_at')
      .not('user_id', 'is', null);
    
    if (tradesUsersError) {
      console.log('❌ Erro ao buscar trades com usuários:', tradesUsersError.message);
    } else {
      console.log(`📊 Trades com user_id preenchido: ${tradesWithUsers?.length || 0}`);
      
      // Verificar se os usuários existem
      const uniqueUserIds = [...new Set(tradesWithUsers?.map(t => t.user_id) || [])];
      console.log(`📊 Usuários únicos referenciados: ${uniqueUserIds.length}`);
      
      for (const userId of uniqueUserIds.slice(0, 10)) { // Verificar apenas primeiros 10
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.log(`⚠️ Usuário ID ${userId} não encontrado na tabela users`);
        } else {
          console.log(`✅ Usuário ID ${userId}: ${user.name} (${user.email})`);
        }
      }
    }
    
    // 6. Verificar RLS (Row Level Security)
    console.log('\n6. VERIFICANDO RLS POLICIES:');
    console.log('-'.repeat(40));
    
    // Tentar buscar dados com diferentes métodos
    const { data: directData, error: directError } = await supabase
      .from('trades')
      .select('count')
      .limit(1);
    
    if (directError) {
      console.log('❌ Erro ao acessar dados diretamente:', directError.message);
      if (directError.message.includes('RLS') || directError.message.includes('policy')) {
        console.log('⚠️ POSSÍVEL PROBLEMA: RLS pode estar bloqueando o acesso');
      }
    } else {
      console.log('✅ Acesso direto aos dados funcionando');
    }
    
    // 7. Verificar dados em períodos específicos
    console.log('\n7. VERIFICANDO DADOS POR PERÍODO:');
    console.log('-'.repeat(40));
    
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const periods = [
      { name: 'Hoje', date: today },
      { name: 'Última semana', date: lastWeek },
      { name: 'Último mês', date: lastMonth }
    ];
    
    for (const period of periods) {
      const { count: periodCount, error: periodError } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', period.date);
      
      if (periodError) {
        console.log(`❌ Erro ao contar trades desde ${period.name}:`, periodError.message);
      } else {
        console.log(`📊 Trades desde ${period.name}: ${periodCount}`);
      }
    }
    
    // 8. Verificar configurações de schema
    console.log('\n8. VERIFICANDO CONFIGURAÇÕES:');
    console.log('-'.repeat(40));
    
    console.log(`📊 Supabase URL: ${supabaseUrl}`);
    console.log(`📊 Usando chave: ${supabaseKey?.substring(0, 20)}...`);
    
    // 9. Teste de query exata do admin-trades.js
    console.log('\n9. TESTANDO QUERY EXATA DO ADMIN:');
    console.log('-'.repeat(40));
    
    const { data: adminQuery, error: adminError, count: adminCount } = await supabase
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 99);
    
    if (adminError) {
      console.log('❌ Erro na query do admin:', adminError.message);
    } else {
      console.log(`📊 Query do admin retornou: ${adminQuery?.length || 0} registros`);
      console.log(`📊 Count total: ${adminCount}`);
      
      if (adminQuery?.length > 0) {
        console.log('Primeira entrada:', {
          id: adminQuery[0].id,
          user_id: adminQuery[0].user_id,
          exchange: adminQuery[0].exchange,
          symbol: adminQuery[0].symbol,
          user_name: adminQuery[0].users?.name || 'N/A',
          created_at: adminQuery[0].created_at
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar diagnóstico
runDiagnostics();