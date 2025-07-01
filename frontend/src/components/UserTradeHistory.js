import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { tradeApi } from '../services/authApi';
import { useCalculationHistory } from '../hooks/useCalculationHistory';
import toast from 'react-hot-toast';

const UserTradeHistory = () => {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    exchange: '',
    direction: '',
    dateRange: '30'
  });
  
  // Hook para histórico local (sem login)
  const {
    history: localHistory,
    clearHistory,
    removeCalculation,
    exportToCSV
  } = useCalculationHistory();

  useEffect(() => {
    if (token) {
      loadTradeHistory();
      loadStats();
    } else {
      setLoading(false);
    }
  }, [token, filter]);

  const loadTradeHistory = async () => {
    try {
      setLoading(true);
      const response = await tradeApi.getTradeHistory(token);
      if (response.success) {
        setTrades(response.data.trades || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de trades');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await tradeApi.getUserStats(token);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const exportData = () => {
    try {
      const dataToExport = trades.map(trade => ({
        Data: formatDate(trade.created_at),
        Exchange: trade.exchange,
        Símbolo: trade.symbol,
        Direção: trade.direction.toUpperCase(),
        Entrada: trade.entry_price,
        'Stop Loss': trade.stop_loss,
        Target: trade.target_price,
        'Conta (USD)': trade.account_size,
        'Risco (%)': trade.risk_percent,
        'R/R': trade.risk_reward_ratio || 'N/A'
      }));

      const csv = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-trades-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Histórico exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (filter.exchange && trade.exchange !== filter.exchange) return false;
    if (filter.direction && trade.direction !== filter.direction) return false;
    return true;
  });

  const displayTrades = token ? filteredTrades : localHistory;

  return (
    <div className="trade-history-container">
      <div className="trade-history-header">
        <h2>📊 Meu Histórico de Trades</h2>
        <p>{token ? 'Histórico completo dos seus trades salvos' : 'Histórico da sessão atual'}</p>
      </div>

      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total_trades || 0}</div>
            <div className="stat-label">Total de Trades</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.exchanges_used || 0}</div>
            <div className="stat-label">Exchanges Usadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg_risk_percent?.toFixed(1) || 0}%</div>
            <div className="stat-label">Risco Médio</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.favorite_exchange || 'N/A'}</div>
            <div className="stat-label">Exchange Favorita</div>
          </div>
        </div>
      )}

      {/* Controles e Filtros */}
      <div className="trade-history-controls">
        <div className="filters">
          <select 
            value={filter.exchange} 
            onChange={(e) => setFilter({...filter, exchange: e.target.value})}
          >
            <option value="">Todas as Exchanges</option>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
            <option value="bingx">BingX</option>
            <option value="bitget">Bitget</option>
          </select>
          
          <select 
            value={filter.direction} 
            onChange={(e) => setFilter({...filter, direction: e.target.value})}
          >
            <option value="">Todas as Direções</option>
            <option value="long">LONG</option>
            <option value="short">SHORT</option>
          </select>
        </div>

        <div className="actions">
          <button onClick={exportData} className="export-btn">
            📥 Exportar CSV
          </button>
          {!token && (
            <button onClick={clearHistory} className="clear-btn">
              🗑️ Limpar Histórico
            </button>
          )}
        </div>
      </div>

      {/* Lista de Trades */}
      <div className="trades-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
        ) : displayTrades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Nenhum trade encontrado</h3>
            <p>
              {token 
                ? 'Você ainda não fez nenhum cálculo salvo.' 
                : 'Faça alguns cálculos para ver seu histórico aqui.'
              }
            </p>
          </div>
        ) : (
          displayTrades.map((trade, index) => (
            <div key={trade.id || index} className="trade-item">
              <div className="trade-header">
                <div className="trade-symbol">
                  <span className="symbol">{trade.symbol}</span>
                  <span className="exchange">{trade.exchange}</span>
                </div>
                <div className={`trade-direction ${trade.direction}`}>
                  {trade.direction?.toUpperCase() || 'N/A'}
                </div>
                <div className="trade-date">
                  {trade.created_at ? formatDate(trade.created_at) : formatDate(trade.timestamp)}
                </div>
              </div>

              <div className="trade-details">
                <div className="detail-group">
                  <div className="detail-item">
                    <span className="label">Entrada:</span>
                    <span className="value">{formatCurrency(trade.entry_price || trade.formData?.entryPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Stop Loss:</span>
                    <span className="value stop-loss">{formatCurrency(trade.stop_loss || trade.formData?.stopLoss)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Target:</span>
                    <span className="value target">{formatCurrency(trade.target_price || trade.formData?.targetPrice)}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <div className="detail-item">
                    <span className="label">Conta:</span>
                    <span className="value">{formatCurrency(trade.account_size || trade.formData?.accountSize)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Risco:</span>
                    <span className="value risk">{trade.risk_percent || trade.formData?.riskPercent}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">R/R:</span>
                    <span className="value rr">
                      {trade.risk_reward_ratio ? `1:${trade.risk_reward_ratio.toFixed(2)}` : 
                       trade.calculationResults?.riskRewardRatio ? `1:${trade.calculationResults.riskRewardRatio.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {!token && (
                <div className="trade-actions">
                  <button 
                    onClick={() => removeCalculation(index)}
                    className="remove-btn"
                  >
                    🗑️ Remover
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserTradeHistory;