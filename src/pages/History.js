import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { tradeApi } from '../services/authApi';
import toast from 'react-hot-toast';
import './History.css';

const History = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    exchange: 'all',
    direction: 'all',
    status: 'all',
    period: '30'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      loadHistory();
    }
  }, [isAuthenticated, token, pagination.page, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await tradeApi.getHistory(token, pagination.page, pagination.limit);
      if (response.success) {
        setTrades(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.meta?.total || 0,
          totalPages: response.meta?.totalPages || 0
        }));
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getRiskLevelColor = (ratio) => {
    if (ratio >= 3) return '#22c55e'; // Verde
    if (ratio >= 2) return '#3b82f6'; // Azul
    if (ratio >= 1.5) return '#f59e0b'; // Amarelo
    if (ratio >= 1) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  };

  const exportData = async (format) => {
    try {
      const response = await tradeApi.exportData(token, format);
      if (response.success) {
        // Criar download do arquivo
        const blob = new Blob([response.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades-history.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Dados exportados em ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="history-container">
        <div className="not-authenticated">
          <h2>Acesso Restrito</h2>
          <p>Faça login para ver seu histórico de cálculos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📊 Meu Histórico de Cálculos</h1>
        <div className="user-info">
          <span>👤 {user?.name || user?.email}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
          <select 
            value={filters.exchange}
            onChange={(e) => setFilters(prev => ({ ...prev, exchange: e.target.value }))}
          >
            <option value="all">Todas as Exchanges</option>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
            <option value="bingx">BingX</option>
            <option value="bitget">Bitget</option>
          </select>

          <select 
            value={filters.direction}
            onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
          >
            <option value="all">Todas as Direções</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>

          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Todos os Status</option>
            <option value="CALCULATED">Calculado</option>
            <option value="ACTIVE">Ativo</option>
            <option value="CLOSED">Fechado</option>
          </select>

          <select 
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último ano</option>
            <option value="all">Todo o período</option>
          </select>
        </div>

        <div className="export-buttons">
          <button onClick={() => exportData('csv')} className="export-btn csv">
            📊 Exportar CSV
          </button>
          <button onClick={() => exportData('json')} className="export-btn json">
            📄 Exportar JSON
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Cálculos</h3>
          <div className="stat-value">{trades.length}</div>
        </div>
        <div className="stat-card">
          <h3>Risk/Reward Médio</h3>
          <div className="stat-value">
            {trades.length > 0 
              ? (trades.reduce((sum, t) => sum + (t.riskRewardRatio || 0), 0) / trades.length).toFixed(2)
              : '0.00'
            }:1
          </div>
        </div>
        <div className="stat-card">
          <h3>Risco Total</h3>
          <div className="stat-value">
            {formatCurrency(trades.reduce((sum, t) => sum + (t.riskAmount || 0), 0))}
          </div>
        </div>
        <div className="stat-card">
          <h3>Potencial Total</h3>
          <div className="stat-value">
            {formatCurrency(trades.reduce((sum, t) => sum + (t.rewardAmount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Lista de Trades */}
      <div className="trades-section">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="empty-state">
            <h3>📭 Nenhum cálculo encontrado</h3>
            <p>Realize seus primeiros cálculos para ver o histórico aqui</p>
          </div>
        ) : (
          <>
            <div className="trades-list">
              {trades.map((trade) => (
                <div key={trade.id} className="trade-card">
                  <div className="trade-header">
                    <div className="trade-info">
                      <span className="exchange">{trade.exchange}</span>
                      <span className="symbol">{trade.symbol}</span>
                      <span className={`direction ${trade.direction?.toLowerCase()}`}>
                        {trade.direction} {trade.direction === 'LONG' ? '📈' : '📉'}
                      </span>
                    </div>
                    <div className="trade-date">
                      {formatDate(trade.createdAt)}
                    </div>
                  </div>

                  <div className="trade-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Entrada:</label>
                        <span>{formatCurrency(trade.entryPrice)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Stop Loss:</label>
                        <span>{formatCurrency(trade.stopLoss)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Target:</label>
                        <span>{formatCurrency(trade.targetPrice)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Tamanho:</label>
                        <span>{trade.positionSize?.toFixed(6)} moedas</span>
                      </div>
                      <div className="detail-item">
                        <label>Risco:</label>
                        <span>{formatCurrency(trade.riskAmount)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Potencial:</label>
                        <span>{formatCurrency(trade.rewardAmount)}</span>
                      </div>
                    </div>

                    <div className="trade-ratio">
                      <div className="ratio-display">
                        <span 
                          className="ratio-value" 
                          style={{ color: getRiskLevelColor(trade.riskRewardRatio) }}
                        >
                          {trade.riskRewardRatio?.toFixed(2)}:1
                        </span>
                        <label>Risk/Reward</label>
                      </div>
                    </div>

                    {trade.notes && (
                      <div className="trade-notes">
                        <label>Observações:</label>
                        <p>{trade.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  ← Anterior
                </button>
                
                <span className="page-info">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;