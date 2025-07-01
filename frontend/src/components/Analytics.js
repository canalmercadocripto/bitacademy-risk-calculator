import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    exchanges: [],
    symbols: [],
    dailyActivity: [],
    userMetrics: [],
    realtimeStats: {}
  });

  const [customFilters, setCustomFilters] = useState({
    startDate: '',
    endDate: '',
    exchange: '',
    minRisk: '',
    maxRisk: ''
  });

  useEffect(() => {
    if (token) {
      loadAnalytics();
      loadRealtimeStats();
      
      // Atualizar stats em tempo real a cada 30 segundos
      const interval = setInterval(loadRealtimeStats, 30000);
      return () => clearInterval(interval);
    }
  }, [timeframe, token]);

  const loadAnalytics = async () => {
    if (!token) {
      console.warn('Token não disponível para carregar analytics');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Carregando dados analytics...');
      
      const [dashboardRes, activityRes, realtimeRes] = await Promise.all([
        api.get('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/admin/reports/activity?days=${timeframe}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/stats/realtime', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      console.log('📊 Dashboard response:', dashboardRes.data);
      console.log('📈 Activity response:', activityRes.data);
      console.log('⚡ Realtime response:', realtimeRes.data);

      const dashboard = dashboardRes.data?.data || {};
      const activity = activityRes.data?.data || {};
      const realtime = realtimeRes.data?.data || {};

      setAnalyticsData({
        overview: dashboard.summary || {},
        exchanges: dashboard.exchanges || [],
        symbols: dashboard.topSymbols || [],
        dailyActivity: activity.dailyActivity || [],
        userMetrics: [],
        realtimeStats: realtime
      });

      console.log('✅ Analytics dados carregados com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Erro ao carregar dados de analytics');
      
      // Set empty data on error
      setAnalyticsData({
        overview: {},
        exchanges: [],
        symbols: [],
        dailyActivity: [],
        userMetrics: [],
        realtimeStats: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeStats = async () => {
    try {
      const response = await api.get('/admin/stats/realtime', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setAnalyticsData(prev => ({
        ...prev,
        realtimeStats: response.data?.data || {}
      }));
    } catch (error) {
      console.error('Erro ao carregar stats em tempo real:', error);
    }
  };

  const applyCustomFilters = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (customFilters.startDate) params.append('startDate', customFilters.startDate);
      if (customFilters.endDate) params.append('endDate', customFilters.endDate);
      if (customFilters.exchange) params.append('exchange', customFilters.exchange);
      
      const response = await api.get(`/admin/trades?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      toast.success('Filtros aplicados com sucesso!');
      // Processar dados filtrados aqui
      
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast.error('Erro ao aplicar filtros personalizados');
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format) => {
    try {
      const dataToExport = {
        timeframe,
        generated: new Date().toISOString(),
        overview: analyticsData.overview,
        exchanges: analyticsData.exchanges,
        symbols: analyticsData.symbols,
        dailyActivity: analyticsData.dailyActivity,
        realtimeStats: analyticsData.realtimeStats
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeframe}days-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Converter para CSV (simplificado)
        let csv = 'Data,Trades,Usuarios Ativos,Volume\n';
        analyticsData.dailyActivity.forEach(day => {
          csv += `${day.date},${day.trades},${day.active_users},${day.volume}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeframe}days-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Dados exportados em ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  if (loading && !analyticsData.overview.trades) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>📊 Analytics Avançado</h2>
        <p>Análise detalhada de dados e métricas personalizáveis</p>
      </div>

      {/* Controles de Timeframe */}
      <div className="analytics-controls">
        <div className="timeframe-selector">
          <label>Período de análise:</label>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <div className="export-controls">
          <button onClick={() => exportData('json')} className="export-btn json">
            📄 Exportar JSON
          </button>
          <button onClick={() => exportData('csv')} className="export-btn csv">
            📊 Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats em Tempo Real */}
      <div className="realtime-stats">
        <h3>🔴 Tempo Real</h3>
        <div className="realtime-grid">
          <div className="realtime-item">
            <div className="realtime-icon">⚡</div>
            <div className="realtime-data">
              <div className="realtime-value">{analyticsData.realtimeStats?.trades_last_hour ?? 0}</div>
              <div className="realtime-label">Trades na Última Hora</div>
            </div>
          </div>
          
          <div className="realtime-item">
            <div className="realtime-icon">📈</div>
            <div className="realtime-data">
              <div className="realtime-value">{analyticsData.realtimeStats?.trades_last_24h ?? 0}</div>
              <div className="realtime-label">Trades em 24h</div>
            </div>
          </div>
          
          <div className="realtime-item">
            <div className="realtime-icon">👥</div>
            <div className="realtime-data">
              <div className="realtime-value">{analyticsData.realtimeStats?.active_users_24h ?? 0}</div>
              <div className="realtime-label">Usuários Ativos 24h</div>
            </div>
          </div>
          
          <div className="realtime-item">
            <div className="realtime-icon">🟢</div>
            <div className="realtime-data">
              <div className="realtime-value">{analyticsData.realtimeStats?.online_users ?? 0}</div>
              <div className="realtime-label">Usuários Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Personalizados */}
      <div className="custom-filters">
        <h3>🎛️ Filtros Personalizados</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Data Inicial:</label>
            <input 
              type="date" 
              value={customFilters.startDate}
              onChange={(e) => setCustomFilters({...customFilters, startDate: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>Data Final:</label>
            <input 
              type="date" 
              value={customFilters.endDate}
              onChange={(e) => setCustomFilters({...customFilters, endDate: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>Exchange:</label>
            <select 
              value={customFilters.exchange}
              onChange={(e) => setCustomFilters({...customFilters, exchange: e.target.value})}
            >
              <option value="">Todas</option>
              <option value="binance">Binance</option>
              <option value="bybit">Bybit</option>
              <option value="bingx">BingX</option>
              <option value="bitget">Bitget</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Risco Mín (%):</label>
            <input 
              type="number" 
              step="0.1"
              value={customFilters.minRisk}
              onChange={(e) => setCustomFilters({...customFilters, minRisk: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>Risco Máx (%):</label>
            <input 
              type="number" 
              step="0.1"
              value={customFilters.maxRisk}
              onChange={(e) => setCustomFilters({...customFilters, maxRisk: e.target.value})}
            />
          </div>
          
          <button onClick={applyCustomFilters} className="apply-filters-btn">
            🔍 Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Principais Métricas */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Resumo Geral</h3>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Total de Trades:</span>
              <span className="metric-value">{analyticsData.overview.trades?.total || 0}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Volume Total:</span>
              <span className="metric-value">{formatCurrency(analyticsData.overview.trades?.total_volume)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Risco Médio:</span>
              <span className="metric-value">{formatPercentage(analyticsData.realtimeStats.avg_risk_24h)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Usuários Totais:</span>
              <span className="metric-value">{analyticsData.overview.users?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>🏢 Performance por Exchange</h3>
          <div className="exchanges-list">
            {analyticsData.exchanges.map((exchange, index) => (
              <div key={index} className="exchange-analytics-item">
                <div className="exchange-name">{exchange.exchange}</div>
                <div className="exchange-stats">
                  <span>{exchange.trade_count} trades</span>
                  <span>{exchange.unique_users} usuários</span>
                  <span>{formatPercentage(exchange.avg_risk)} risco médio</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>🎯 Top Símbolos</h3>
          <div className="symbols-list">
            {analyticsData.symbols.map((symbol, index) => (
              <div key={index} className="symbol-analytics-item">
                <div className="symbol-info">
                  <span className="symbol-name">{symbol.symbol}</span>
                  <span className="symbol-exchange">{symbol.exchange}</span>
                </div>
                <div className="symbol-stats">
                  <span>{symbol.trade_count} trades</span>
                  <span>{symbol.unique_users} usuários</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card full-width">
          <h3>📈 Atividade Diária</h3>
          <div className="activity-chart">
            {analyticsData.dailyActivity.length > 0 ? (
              <div className="daily-activity-grid">
                {analyticsData.dailyActivity.slice(0, 10).map((day, index) => (
                  <div key={index} className="daily-item">
                    <div className="daily-date">{new Date(day.date).toLocaleDateString('pt-BR')}</div>
                    <div className="daily-trades">{day.trades} trades</div>
                    <div className="daily-users">{day.active_users} usuários</div>
                    <div className="daily-volume">{formatCurrency(day.volume)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>📭 Nenhum dado de atividade disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;