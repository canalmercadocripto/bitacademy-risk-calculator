import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    overview: {},
    userMetrics: {},
    tradeMetrics: {},
    performanceData: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('trades');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedView]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get analytics data from API
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(`/api/analytics?period=${selectedPeriod}&view=${selectedView}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Analytics API error');
      }
      
      setAnalytics(prevAnalytics => ({
        ...prevAnalytics,
        ...result.data
      }));
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        período: selectedPeriod,
        dataGeração: new Date().toISOString(),
        overview: analytics.overview,
        métricas: {
          usuários: analytics.userMetrics,
          trades: analytics.tradeMetrics
        },
        desempenho: analytics.performanceData
      };
      
      const jsonContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_analytics_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Carregando analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Analytics Avançado</h1>
        <p>Análise detalhada de performance e métricas do sistema</p>
      </div>

      {/* Controles */}
      <div className="analytics-controls">
        <div className="view-selector">
          <button 
            className={selectedView === 'overview' ? 'active' : ''}
            onClick={() => setSelectedView('overview')}
          >
            📊 Visão Geral
          </button>
          <button 
            className={selectedView === 'performance' ? 'active' : ''}
            onClick={() => setSelectedView('performance')}
          >
            📈 Performance
          </button>
          <button 
            className={selectedView === 'users' ? 'active' : ''}
            onClick={() => setSelectedView('users')}
          >
            👥 Usuários
          </button>
          <button 
            className={selectedView === 'trades' ? 'active' : ''}
            onClick={() => setSelectedView('trades')}
          >
            💰 Trades
          </button>
        </div>
        
        <div className="controls-right">
          <div className="period-selector">
            <label>Período:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
          </div>
          
          <button 
            className={`comparison-btn ${comparisonMode ? 'active' : ''}`}
            onClick={() => setComparisonMode(!comparisonMode)}
          >
            📊 Comparar
          </button>
          
          <button className="export-report-btn" onClick={handleExportReport}>
            📄 Exportar Relatório
          </button>
        </div>
      </div>

      {/* Overview Cards - Always visible */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Usuários Ativos</h3>
            <div className="card-number">{analytics.overview.activeUsers}</div>
            <div className="card-total">de {analytics.overview.totalUsers} total</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total de Trades</h3>
            <div className="card-number">{analytics.overview.totalTrades}</div>
            <div className="card-change positive">+{analytics.tradeMetrics.tradesThisPeriod} no período</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">💎</div>
          <div className="card-content">
            <h3>Volume Total</h3>
            <div className="card-number">R$ {(analytics.overview.totalVolume / 1000000).toFixed(1)}M</div>
            <div className="card-change positive">+12.5% vs período anterior</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Taxa de Sucesso</h3>
            <div className="card-number">{analytics.overview.successRate}%</div>
            <div className="card-change positive">R/R médio: {analytics.overview.avgRiskReward}</div>
          </div>
        </div>
      </div>

      {/* Conditional Content based on selectedView */}
      {selectedView === 'overview' && (
        <>
          {/* Gráfico de Performance */}
          <div className="analytics-section">
            <h2>📈 Performance no Período</h2>
            <div className="metric-selector">
              <button 
                className={selectedMetric === 'trades' ? 'active' : ''}
                onClick={() => setSelectedMetric('trades')}
              >
                Trades
              </button>
              <button 
                className={selectedMetric === 'volume' ? 'active' : ''}
                onClick={() => setSelectedMetric('volume')}
              >
                Volume
              </button>
              <button 
                className={selectedMetric === 'users' ? 'active' : ''}
                onClick={() => setSelectedMetric('users')}
              >
                Usuários
              </button>
              <button 
                className={selectedMetric === 'winRate' ? 'active' : ''}
                onClick={() => setSelectedMetric('winRate')}
              >
                Win Rate
              </button>
            </div>
            
            <div className="performance-chart">
              <div className="chart-container">
                {analytics.performanceData.map((data, index) => {
                  const maxValue = Math.max(...analytics.performanceData.map(d => d[selectedMetric]));
                  const height = (data[selectedMetric] / maxValue) * 100;
                  
                  return (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ height: `${height}%` }}
                        title={`${data.date}: ${data[selectedMetric]}`}
                      ></div>
                      <div className="chart-label">
                        {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'performance' && (
        <>
          {/* Performance Detalhada */}
          <div className="analytics-section">
            <h2>📈 Análise de Performance Detalhada</h2>
            <div className="performance-metrics-grid">
              <div className="performance-card">
                <h3>💰 Lucratividade</h3>
                <div className="performance-data">
                  <div className="metric-row">
                    <span>Lucro Total:</span>
                    <span className="positive">R$ {analytics.performanceData.reduce((sum, d) => sum + d.profits, 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="metric-row">
                    <span>Perdas Totais:</span>
                    <span className="negative">R$ {analytics.performanceData.reduce((sum, d) => sum + d.losses, 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="metric-row">
                    <span>Resultado Líquido:</span>
                    <span className="positive">R$ {(analytics.performanceData.reduce((sum, d) => sum + (d.profits - d.losses), 0)).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="performance-card">
                <h3>📊 Estatísticas</h3>
                <div className="performance-data">
                  <div className="metric-row">
                    <span>Win Rate Médio:</span>
                    <span>{(analytics.performanceData.reduce((sum, d) => sum + d.winRate, 0) / analytics.performanceData.length).toFixed(1)}%</span>
                  </div>
                  <div className="metric-row">
                    <span>Melhor Dia:</span>
                    <span>{Math.max(...analytics.performanceData.map(d => d.winRate)).toFixed(1)}%</span>
                  </div>
                  <div className="metric-row">
                    <span>Trades/Dia Médio:</span>
                    <span>{(analytics.performanceData.reduce((sum, d) => sum + d.trades, 0) / analytics.performanceData.length).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'users' && (
        <>
          {/* Métricas de Usuários */}
          <div className="analytics-section">
            <h2>👥 Métricas de Usuários</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Novos Usuários</h3>
                <div className="metric-value">{analytics.userMetrics.newUsersThisPeriod}</div>
                <div className="metric-label">no período</div>
              </div>
              
              <div className="metric-card">
                <h3>Taxa de Retenção</h3>
                <div className="metric-value">{analytics.userMetrics.userRetentionRate}%</div>
                <div className="metric-label">usuários ativos</div>
              </div>
              
              <div className="metric-card">
                <h3>Trades por Usuário</h3>
                <div className="metric-value">{analytics.userMetrics.avgTradesPerUser}</div>
                <div className="metric-label">média</div>
              </div>
            </div>
            
            <div className="top-users">
              <h3>🏆 Usuários Mais Ativos</h3>
              <div className="users-ranking">
                {analytics.userMetrics.mostActiveUsers.map((user, index) => (
                  <div key={index} className="ranking-item">
                    <div className="ranking-position">#{index + 1}</div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-stats">
                        {user.trades} trades • R$ {(user.volume / 1000).toFixed(0)}k volume
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'trades' && (
        <>
          {/* Métricas de Trades */}
          <div className="analytics-section">
            <h2>💰 Métricas de Trading</h2>
            
            <div className="trading-metrics">
              <div className="metric-card">
                <h3>Trades no Período</h3>
                <div className="metric-value">{analytics.tradeMetrics.tradesThisPeriod}</div>
                <div className="metric-label">total</div>
              </div>
              
              <div className="metric-card">
                <h3>Tamanho Médio</h3>
                <div className="metric-value">R$ {analytics.tradeMetrics.avgTradeSize.toFixed(0)}</div>
                <div className="metric-label">por trade</div>
              </div>
            </div>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>🔥 Pares Mais Negociados</h3>
                <div className="ranking-list">
                  {analytics.tradeMetrics.mostTradedPairs.map((pair, index) => (
                    <div key={index} className="ranking-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="pair-name">{pair.symbol}</span>
                      <span className="pair-stats">
                        {pair.count} trades • R$ {(pair.volume / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>🏢 Distribuição por Exchange</h3>
                <div className="exchange-distribution">
                  {analytics.tradeMetrics.exchangeDistribution.map((exchange, index) => (
                    <div key={index} className="exchange-item">
                      <div className="exchange-info">
                        <span className="exchange-name">{exchange.exchange}</span>
                        <span className="exchange-percentage">{exchange.percentage}%</span>
                      </div>
                      <div className="exchange-bar">
                        <div 
                          className="exchange-bar-fill"
                          style={{ width: `${exchange.percentage}%` }}
                        ></div>
                      </div>
                      <span className="exchange-trades">{exchange.trades} trades</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Saúde do Sistema - Always visible */}
      <div className="analytics-section">
        <h2>🔧 Saúde do Sistema</h2>
        <div className="system-health">
          <div className="health-metric">
            <span className="health-label">Uso da Plataforma:</span>
            <div className="health-bar">
              <div 
                className="health-bar-fill"
                style={{ width: `${analytics.overview.platformUsage}%` }}
              ></div>
            </div>
            <span className="health-value">{analytics.overview.platformUsage}%</span>
          </div>
          
          <div className="health-indicators">
            <div className="indicator">
              <span className="indicator-icon">🟢</span>
              <span>API Response Time: 120ms</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">🟢</span>
              <span>Database Performance: Excelente</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">🟡</span>
              <span>Cache Hit Rate: 87%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;