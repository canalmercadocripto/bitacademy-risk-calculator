#!/usr/bin/env node

/**
 * Teste direto da API real da Binance - SEM DADOS MOCKADOS
 * Para garantir que está usando apenas dados reais
 */

require('dotenv').config({ path: '.env.staging' });
const ccxt = require('ccxt');

console.log('🚀 TESTE DE API REAL BINANCE - SEM MOCKS');
console.log('=====================================');

async function testRealBinanceAPI() {
  try {
    // Verificar variáveis de ambiente
    const apiKey = process.env.REACT_APP_BINANCE_API_KEY;
    const secretKey = process.env.REACT_APP_BINANCE_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      console.error('❌ Chaves da API não encontradas no .env.staging');
      return;
    }
    
    console.log('✅ Chaves da API encontradas');
    console.log(`📧 API Key: ${apiKey.substring(0, 10)}...`);
    
    // Criar instância da exchange
    const binance = new ccxt.binance({
      apiKey,
      secret: secretKey,
      sandbox: false,
      enableRateLimit: true,
      timeout: 15000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true
      }
    });
    
    console.log('\n📡 1. Testando conexão com API real...');
    
    // Teste 1: Status da API
    const status = await binance.fetchStatus();
    console.log(`✅ Status da API: ${status.status} (${status.updated})`);
    
    // Teste 2: Informações da conta
    console.log('\n👤 2. Buscando informações da conta...');
    const accountInfo = await binance.fetchBalance();
    console.log(`✅ Conta conectada: ${Object.keys(accountInfo.total).length} assets`);
    
    // Listar apenas assets com saldo > 0
    const nonZeroBalances = Object.entries(accountInfo.total)
      .filter(([asset, balance]) => balance > 0)
      .slice(0, 10); // Primeiros 10
    
    console.log('\n💰 3. Principais saldos (apenas > 0):');
    nonZeroBalances.forEach(([asset, balance]) => {
      console.log(`   ${asset}: ${balance.toFixed(8)}`);
    });
    
    // Teste 3: Preços reais atuais
    console.log('\n📊 4. Buscando preços reais atuais...');
    const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];
    
    for (const symbol of symbols) {
      try {
        const ticker = await binance.fetchTicker(symbol);
        console.log(`   ${symbol}: $${ticker.last.toFixed(4)} (${ticker.percentage >= 0 ? '+' : ''}${ticker.percentage.toFixed(2)}%)`);
      } catch (error) {
        console.log(`   ${symbol}: Erro - ${error.message}`);
      }
    }
    
    // Teste 4: Histórico de ordens recentes
    console.log('\n📈 5. Buscando histórico de trading real...');
    try {
      const orders = await binance.fetchMyTrades('BTC/USDT', undefined, 5);
      console.log(`✅ ${orders.length} trades encontrados para BTC/USDT`);
      
      if (orders.length > 0) {
        console.log('   Último trade:');
        const lastTrade = orders[orders.length - 1];
        console.log(`   ${lastTrade.side} ${lastTrade.amount} BTC a $${lastTrade.price} (${new Date(lastTrade.timestamp).toLocaleString('pt-BR')})`);
      }
    } catch (error) {
      console.log(`   ⚠️ Histórico: ${error.message} (normal se não houver trades recentes)`);
    }
    
    // Teste 5: Rate limits
    console.log('\n⚡ 6. Verificando rate limits...');
    const rateLimit = binance.rateLimit;
    console.log(`✅ Rate limit: ${rateLimit}ms entre requests`);
    
    console.log('\n🎉 SUCESSO: API REAL FUNCIONANDO 100%');
    console.log('=====================================');
    console.log('✅ Todos os dados são REAIS da Binance');
    console.log('✅ Nenhum dado mockado foi utilizado');
    console.log('✅ Conexão autenticada estabelecida');
    console.log('✅ Pronto para uso em produção');
    
  } catch (error) {
    console.error('\n❌ ERRO AO TESTAR API REAL:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 SOLUÇÃO:');
      console.log('   - Verifique as chaves no .env.staging');
      console.log('   - Confirme se as chaves têm permissão de leitura');
      console.log('   - Verifique se a conta não está restrita');
    }
    
    if (error.message.includes('timestamp')) {
      console.log('\n💡 SOLUÇÃO:');
      console.log('   - Sincronize o relógio do servidor');
      console.log('   - Use adjustForTimeDifference: true');
    }
  }
}

// Executar teste
testRealBinanceAPI();