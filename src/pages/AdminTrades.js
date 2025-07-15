import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const AdminTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExchange, setFilterExchange] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewCredentials, setRenewCredentials] = useState({ email: '', password: '' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState(null);

  // Função para formatar valores em USD
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value || 0);
  };

  useEffect(() => {
    fetchAllTrades();
  }, [currentPage, itemsPerPage, filterExchange, filterStatus]);

  const fetchAllTrades = async () => {
    try {
      setLoading(true);
      
      // Fetch trades with pagination
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams({
        action: 'list',
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (filterExchange && filterExchange !== 'all') {
        params.append('exchange', filterExchange);
      }
      
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      console.log(`🔍 Buscando trades admin - Página ${currentPage}, Limite ${itemsPerPage}...`);
      console.log('Token:', token ? 'PRESENTE' : 'AUSENTE');
      console.log('Filtros:', { exchange: filterExchange, status: filterStatus });
      
      const response = await fetch(`/api/admin-trades?${params.toString()}`, { headers });
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', {
        success: data.success,
        tradesCount: data.data?.length,
        pagination: data.pagination,
        stats: data.stats
      });
      
      if (data.success) {
        console.log('✅ Dados recebidos:', data.data.length, 'trades');
        setTrades(data.data || []);
        
        // Update pagination info
        if (data.pagination) {
          setPagination(data.pagination);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      } else {
        console.error('❌ Erro ao buscar trades:', data.message);
        
        // Se o token expirou, mostrar modal de renovação
        if (data.message === 'Token expirado') {
          setShowRenewModal(true);
          return;
        }
        
        alert(`Erro: ${data.message}`);
        setTrades([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar trades:', error);
      alert(`Erro de conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewToken = async () => {
    try {
      if (!renewCredentials.email || !renewCredentials.password) {
        alert('Por favor, preencha email e senha');
        return;
      }
      
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(renewCredentials)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Salvar novo token
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Fechar modal
        setShowRenewModal(false);
        setRenewCredentials({ email: '', password: '' });
        
        // Tentar carregar trades novamente
        fetchAllTrades();
        
        alert('Token renovado com sucesso!');
      } else {
        alert(`Erro ao renovar token: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      alert('Erro de conexão ao renovar token');
    }
  };

  const handleExportTrades = async (format = 'csv') => {
    try {
      const exportData = filteredTrades.map(trade => ({
        ID: trade.id,
        Usuario: trade.userName,
        Email: trade.userEmail,
        Exchange: trade.exchange,
        Par: trade.symbol,
        'Tamanho da Conta': trade.accountSize,
        'Risco %': trade.riskPercentage,
        'Preço de Entrada': trade.entryPrice,
        'Stop Loss': trade.stopLoss,
        'Take Profit': trade.takeProfit,
        'Tamanho da Posição': trade.positionSize,
        'Valor do Risco': trade.riskAmount,
        'Valor do Reward': trade.rewardAmount,
        'Risk/Reward': trade.riskRewardRatio,
        'Tipo': trade.tradeType,
        Status: trade.status,
        'Data de Criação': new Date(trade.createdAt).toLocaleDateString('pt-BR'),
        Notas: trade.notes
      }));

      if (format === 'csv') {
        const csvHeaders = Object.keys(exportData[0]).join(',');
        const csvRows = exportData.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          ).join(',')
        ).join('\n');
        
        const csvContent = csvHeaders + '\n' + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trades_admin_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trades_admin_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      alert(`Dados exportados com sucesso em formato ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExchange = filterExchange === 'all' || trade.exchange.toLowerCase() === filterExchange.toLowerCase();
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;
    return matchesSearch && matchesExchange && matchesStatus;
  });

  // Use API stats if available, otherwise calculate from current page
  const stats = pagination ? {
    totalTrades: totalRecords,
    activeTrades: trades.filter(t => t.status === 'active').length,
    closedTrades: trades.filter(t => t.status === 'closed').length,
    totalVolume: trades.reduce((sum, t) => sum + t.accountSize, 0),
    avgRiskReward: trades.length > 0 ? 
      trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / trades.length : 0
  } : {
    totalTrades: trades.length,
    activeTrades: trades.filter(t => t.status === 'active').length,
    closedTrades: trades.filter(t => t.status === 'closed').length,
    totalVolume: trades.reduce((sum, t) => sum + t.accountSize, 0),
    avgRiskReward: trades.length > 0 ? 
      trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / trades.length : 0
  };

  if (loading) {
    return (
      <div className="admin-trades-loading">
        <div className="loading-spinner"></div>
        <p>Carregando histórico de trades...</p>
      </div>
    );
  }

  return (
    <div className="admin-trades-container">
      <div className="admin-trades-header">
        <h1>💰 Histórico de Trades - Todos os Usuários</h1>
        <p>Visualize e gerencie todos os trades do sistema</p>
      </div>

      {/* Estatísticas */}
      <div className="trades-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total de Trades</h3>
            <div className="stat-number">{stats.totalTrades}</div>
            {pagination && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Total no sistema
              </div>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>Página Atual</h3>
            <div className="stat-number">{currentPage} / {totalPages}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {trades.length} registros
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Trades Ativos</h3>
            <div className="stat-number">{stats.activeTrades}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3>R/R Médio</h3>
            <div className="stat-number">{stats.avgRiskReward.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="trades-controls">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="🔍 Buscar por usuário, par ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterExchange}
            onChange={(e) => {
              setFilterExchange(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="filter-select"
          >
            <option value="all">Todas as Exchanges</option>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
            <option value="bingx">BingX</option>
            <option value="bitget">Bitget</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="filter-select"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="closed">Fechados</option>
          </select>
          
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1); // Reset to first page when limit changes
            }}
            className="filter-select"
          >
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
            <option value="200">200 por página</option>
            <option value="500">500 por página</option>
          </select>
        </div>
        
        <div className="export-actions">
          <button
            className="export-btn"
            onClick={() => handleExportTrades('csv')}
          >
            📄 Exportar CSV
          </button>
          <button
            className="export-btn"
            onClick={() => handleExportTrades('json')}
          >
            📋 Exportar JSON
          </button>
        </div>
      </div>

      {/* Lista de Trades */}
      <div className="trades-table">
        <div className="table-header">
          <div className="col-user">Usuário</div>
          <div className="col-trade">Trade</div>
          <div className="col-values">Valores</div>
          <div className="col-risk">Risk/Reward</div>
          <div className="col-status">Status</div>
          <div className="col-date">Data</div>
          <div className="col-actions">Ações</div>
        </div>
        
        {filteredTrades.length === 0 ? (
          <div className="no-trades-message" style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            <div>📊 Nenhum trade encontrado</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Total de trades carregados: {trades.length}
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Filtros aplicados: {searchTerm ? `Busca: "${searchTerm}"` : ''} 
              {filterExchange !== 'all' ? ` Exchange: ${filterExchange}` : ''}
              {filterStatus !== 'all' ? ` Status: ${filterStatus}` : ''}
            </div>
          </div>
        ) : null}
        
        {/* Pagination Controls */}
        {pagination && totalPages > 1 && (
          <div className="pagination-controls" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            margin: '20px 0',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === 1 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ⏮️ Primeira
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === 1 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ⏪ Anterior
            </button>
            
            <span style={{ margin: '0 15px', fontWeight: 'bold' }}>
              Página {currentPage} de {totalPages} ({totalRecords} total)
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === totalPages ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Próxima ⏩
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === totalPages ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Última ⏭️
            </button>
          </div>
        )}
        
        {filteredTrades.map(trade => (
          <div key={trade.id} className="trade-row">
            <div className="col-user">
              <div className="user-info">
                <div className="user-name">{trade.userName}</div>
                <div className="user-email">{trade.userEmail}</div>
              </div>
            </div>
            
            <div className="col-trade">
              <div className="trade-info">
                <div className="trade-symbol">{trade.symbol}</div>
                <div className="trade-exchange">{trade.exchange}</div>
                <div className="trade-type">{trade.tradeType.toUpperCase()}</div>
              </div>
            </div>
            
            <div className="col-values">
              <div className="value-entry">Entrada: {formatCurrency(trade.entryPrice)}</div>
              <div className="value-position">Posição: {trade.positionSize.toFixed(4)}</div>
              <div className="value-account">Conta: {formatCurrency(trade.accountSize)}</div>
            </div>
            
            <div className="col-risk">
              <div className="risk-amount">Risco: {formatCurrency(trade.riskAmount)}</div>
              <div className="reward-amount">Reward: {formatCurrency(trade.rewardAmount)}</div>
              <div className="rr-ratio">R/R: {trade.riskRewardRatio.toFixed(2)}</div>
            </div>
            
            <div className="col-status">
              <span className={`status-badge ${trade.status}`}>
                {trade.status === 'active' ? '🟢 Ativo' : '✅ Fechado'}
              </span>
            </div>
            
            <div className="col-date">
              {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
            </div>
            
            <div className="col-actions">
              <button
                className="view-details-btn"
                onClick={() => {
                  setSelectedTrade(trade);
                  setShowDetails(true);
                }}
              >
                👁️ Ver
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalhes */}
      {showDetails && selectedTrade && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>📊 Detalhes do Trade #{selectedTrade.id}</h2>
              <button 
                className="close-modal"
                onClick={() => setShowDetails(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="trade-details">
              <div className="details-section">
                <h3>👤 Informações do Usuário</h3>
                <p><strong>Nome:</strong> {selectedTrade.userName}</p>
                <p><strong>Email:</strong> {selectedTrade.userEmail}</p>
                <p><strong>ID:</strong> {selectedTrade.userId}</p>
              </div>
              
              <div className="details-section">
                <h3>💰 Informações do Trade</h3>
                <p><strong>Exchange:</strong> {selectedTrade.exchange}</p>
                <p><strong>Par:</strong> {selectedTrade.symbol}</p>
                <p><strong>Tipo:</strong> {selectedTrade.tradeType.toUpperCase()}</p>
                <p><strong>Status:</strong> {selectedTrade.status}</p>
              </div>
              
              <div className="details-section">
                <h3>📈 Dados de Entrada</h3>
                <p><strong>Tamanho da Conta:</strong> {formatCurrency(selectedTrade.accountSize)}</p>
                <p><strong>Risco (%):</strong> {selectedTrade.riskPercentage}%</p>
                <p><strong>Preço de Entrada:</strong> {formatCurrency(selectedTrade.entryPrice)}</p>
                <p><strong>Stop Loss:</strong> {selectedTrade.stopLoss ? formatCurrency(selectedTrade.stopLoss) : 'N/A'}</p>
                <p><strong>Take Profit:</strong> {selectedTrade.takeProfit ? formatCurrency(selectedTrade.takeProfit) : 'N/A'}</p>
              </div>
              
              <div className="details-section">
                <h3>⚖️ Cálculos de Risco</h3>
                <p><strong>Tamanho da Posição:</strong> {selectedTrade.positionSize.toFixed(8)}</p>
                <p><strong>Valor do Risco:</strong> {formatCurrency(selectedTrade.riskAmount)}</p>
                <p><strong>Valor do Reward:</strong> {formatCurrency(selectedTrade.rewardAmount)}</p>
                <p><strong>Risk/Reward Ratio:</strong> {selectedTrade.riskRewardRatio.toFixed(2)}</p>
              </div>
              
              {selectedTrade.notes && (
                <div className="details-section">
                  <h3>📝 Observações</h3>
                  <p>{selectedTrade.notes}</p>
                </div>
              )}
              
              <div className="details-section">
                <h3>📅 Data de Criação</h3>
                <p>{new Date(selectedTrade.createdAt).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renovação de Token */}
      {showRenewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>🔄 Renovar Sessão</h2>
              <p>Sua sessão expirou. Por favor, faça login novamente.</p>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '15px' }}>
                <label>Email:</label>
                <input
                  type="email"
                  value={renewCredentials.email}
                  onChange={(e) => setRenewCredentials({
                    ...renewCredentials,
                    email: e.target.value
                  })}
                  placeholder="Digite seu email"
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label>Senha:</label>
                <input
                  type="password"
                  value={renewCredentials.password}
                  onChange={(e) => setRenewCredentials({
                    ...renewCredentials,
                    password: e.target.value
                  })}
                  placeholder="Digite sua senha"
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenewToken();
                    }
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRenewModal(false);
                    window.location.href = '/';
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ccc',
                    color: '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Voltar ao Login
                </button>
                <button
                  onClick={handleRenewToken}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Renovar Sessão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrades;