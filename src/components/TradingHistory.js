import React, { useState, useEffect, useCallback } from 'react';
import { brokerageApi, formatTradeData, calculatePortfolioMetrics } from '../services/brokerageApi';
import { useAuth } from '../hooks/useAuth';
import './TradingHistory.css';

const TradingHistory = () => {
  const { user, token } = useAuth();
  const [tradingHistory, setTradingHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    brokerage: '',
    symbol: '',
    side: '',
    dateFrom: '',
    dateTo: '',
    minPnL: '',
    maxPnL: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (token) {
      loadTradingHistory();
    }
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [tradingHistory, filters, sortBy, sortOrder]);

  const loadTradingHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await brokerageApi.getConsolidatedHistory({}, token);
      const formattedTrades = response.trades.map(formatTradeData);
      
      setTradingHistory(formattedTrades);
      
      // Calcular métricas do portfolio
      const metrics = calculatePortfolioMetrics(formattedTrades, response.balances || []);
      setPortfolioMetrics(metrics);
      
    } catch (err) {
      setError('Erro ao carregar histórico de trading');
      console.error('Trading history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...tradingHistory];

    // Aplicar filtros
    if (filters.brokerage) {
      filtered = filtered.filter(trade => 
        trade.brokerage.toLowerCase().includes(filters.brokerage.toLowerCase())
      );
    }

    if (filters.symbol) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    if (filters.side) {
      filtered = filtered.filter(trade => trade.side === filters.side);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(trade => trade.timestamp >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(trade => trade.timestamp <= toDate);
    }

    if (filters.minPnL) {
      filtered = filtered.filter(trade => trade.pnl >= parseFloat(filters.minPnL));
    }

    if (filters.maxPnL) {
      filtered = filtered.filter(trade => trade.pnl <= parseFloat(filters.maxPnL));
    }

    if (filters.status) {
      filtered = filtered.filter(trade => trade.status === filters.status);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [tradingHistory, filters, sortBy, sortOrder]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
    setShowModal(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'success';
    if (pnl < 0) return 'error';
    return 'secondary';
  };

  const clearFilters = () => {
    setFilters({
      brokerage: '',
      symbol: '',
      side: '',
      dateFrom: '',
      dateTo: '',
      minPnL: '',
      maxPnL: '',
      status: ''
    });
  };

  const exportData = async () => {
    try {
      const exportConfig = {
        format: 'csv',
        filters: filters,
        data: filteredHistory
      };
      
      const blob = await brokerageApi.exportTradingData(exportConfig, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao exportar dados');
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = filteredHistory.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="trading-history">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando histórico de trading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-history">
      <div className="history-header">
        <h2>📊 Histórico de Trading</h2>
        <div className="header-actions">
          <button className="btn btn--primary" onClick={loadTradingHistory}>
            🔄 Atualizar
          </button>
          <button className="btn btn--secondary" onClick={exportData}>
            📤 Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Métricas do Portfolio */}
      <div className="portfolio-metrics">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">P&L Total</div>
            <div className={`metric-value ${getPnLColor(portfolioMetrics.totalPnL)}`}>
              {formatCurrency(portfolioMetrics.totalPnL || 0)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Taxa de Acerto</div>
            <div className="metric-value">
              {(portfolioMetrics.winRate || 0).toFixed(1)}%
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total de Trades</div>
            <div className="metric-value">
              {portfolioMetrics.totalTrades || 0}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Profit Factor</div>
            <div className="metric-value">
              {(portfolioMetrics.profitFactor || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Corretora</label>
            <input
              type="text"
              className="input"
              placeholder="Filtrar por corretora..."
              value={filters.brokerage}
              onChange={(e) => handleFilterChange('brokerage', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Símbolo</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: BTCUSDT"
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Lado</label>
            <select
              className="input"
              value={filters.side}
              onChange={(e) => handleFilterChange('side', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Data De</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Data Até</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button className="btn btn--ghost" onClick={clearFilters}>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Trades */}
      <div className="trades-table-container">
        <table className="trades-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')}>
                Data {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('symbol')}>
                Símbolo {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('side')}>
                Lado {sortBy === 'side' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('quantity')}>
                Quantidade {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('price')}>
                Preço {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('pnl')}>
                P&L {sortBy === 'pnl' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('brokerage')}>
                Corretora {sortBy === 'brokerage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentTrades.map(trade => (
              <tr key={trade.id} className="trade-row">
                <td>{formatDate(trade.timestamp)}</td>
                <td className="symbol-cell">{trade.symbol}</td>
                <td>
                  <span className={`side-badge ${trade.side.toLowerCase()}`}>
                    {trade.side}
                  </span>
                </td>
                <td>{trade.quantity.toFixed(6)}</td>
                <td>{formatCurrency(trade.price)}</td>
                <td>
                  <span className={`pnl-value ${getPnLColor(trade.pnl)}`}>
                    {formatCurrency(trade.pnl)}
                  </span>
                </td>
                <td>{trade.brokerage}</td>
                <td>
                  <button 
                    className="btn btn--sm btn--ghost"
                    onClick={() => handleTradeClick(trade)}
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn--ghost"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="page-info">
            Página {currentPage} de {totalPages}
          </span>
          <button 
            className="btn btn--ghost"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showModal && selectedTrade && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes do Trade</h3>
              <button 
                className="btn btn--ghost btn--sm"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="trade-details">
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedTrade.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Símbolo:</span>
                  <span className="detail-value">{selectedTrade.symbol}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Lado:</span>
                  <span className={`side-badge ${selectedTrade.side.toLowerCase()}`}>
                    {selectedTrade.side}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantidade:</span>
                  <span className="detail-value">{selectedTrade.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Preço:</span>
                  <span className="detail-value">{formatCurrency(selectedTrade.price)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">P&L:</span>
                  <span className={`pnl-value ${getPnLColor(selectedTrade.pnl)}`}>
                    {formatCurrency(selectedTrade.pnl)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Taxas:</span>
                  <span className="detail-value">{formatCurrency(selectedTrade.fees)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Corretora:</span>
                  <span className="detail-value">{selectedTrade.brokerage}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Data:</span>
                  <span className="detail-value">{formatDate(selectedTrade.timestamp)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{selectedTrade.status}</span>
                </div>
                {selectedTrade.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notas:</span>
                    <span className="detail-value">{selectedTrade.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingHistory;