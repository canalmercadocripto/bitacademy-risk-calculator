const { supabase } = require('../lib/supabase');
const securityMiddleware = require('../middleware/security');

// API para verificar contagem real de trades no banco
module.exports = async function handler(req, res) {
  // Apply security headers
  securityMiddleware.corsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }
  
  // Apply rate limiting
  const rateLimitResult = securityMiddleware.apiRateLimit(req, res);
  if (rateLimitResult) return rateLimitResult;
  
  // Validate token and require admin
  const tokenResult = securityMiddleware.validateToken(req, res);
  if (tokenResult) return tokenResult;
  
  const adminResult = securityMiddleware.requireAdmin(req, res);
  if (adminResult) return adminResult;
  
  try {
    console.log('🔍 Verificando contagem real de trades no banco...');
    
    // 1. Contagem total de trades
    const { count: totalTrades, error: countError } = await supabase
      .from('trades')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Erro ao contar trades:', countError);
      throw countError;
    }
    
    // 2. Contagem de trades com usuários
    const { count: tradesWithUsers, error: withUsersError } = await supabase
      .from('trades')
      .select('id', { count: 'exact', head: true })
      .not('user_id', 'is', null);
    
    if (withUsersError) {
      console.error('Erro ao contar trades com usuários:', withUsersError);
      throw withUsersError;
    }
    
    // 3. Contagem de trades órfãos
    const { count: orphanedTrades, error: orphanError } = await supabase
      .from('trades')
      .select('id', { count: 'exact', head: true })
      .is('user_id', null);
    
    if (orphanError) {
      console.error('Erro ao contar trades órfãos:', orphanError);
      throw orphanError;
    }
    
    // 4. Contagem por exchange
    const { data: exchangeCounts, error: exchangeError } = await supabase
      .from('trades')
      .select('exchange')
      .not('exchange', 'is', null);
    
    if (exchangeError) {
      console.error('Erro ao contar por exchange:', exchangeError);
    }
    
    const exchangeStats = exchangeCounts?.reduce((acc, trade) => {
      acc[trade.exchange] = (acc[trade.exchange] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // 5. Contagem por status
    const { data: statusCounts, error: statusError } = await supabase
      .from('trades')
      .select('status')
      .not('status', 'is', null);
    
    if (statusError) {
      console.error('Erro ao contar por status:', statusError);
    }
    
    const statusStats = statusCounts?.reduce((acc, trade) => {
      acc[trade.status] = (acc[trade.status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // 6. Primeiro e último trade
    const { data: firstTrade, error: firstError } = await supabase
      .from('trades')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    const { data: lastTrade, error: lastError } = await supabase
      .from('trades')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const diagnostics = {
      totalTrades: totalTrades || 0,
      tradesWithUsers: tradesWithUsers || 0,
      orphanedTrades: orphanedTrades || 0,
      orphanedPercentage: totalTrades ? ((orphanedTrades / totalTrades) * 100).toFixed(2) : 0,
      exchangeStats,
      statusStats,
      firstTradeDate: firstTrade?.created_at || null,
      lastTradeDate: lastTrade?.created_at || null,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Diagnóstico completo:', diagnostics);
    
    return res.status(200).json({
      success: true,
      data: diagnostics,
      message: `Diagnóstico concluído: ${totalTrades} trades encontrados (${orphanedTrades} órfãos)`
    });
    
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};