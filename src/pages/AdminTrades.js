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

  useEffect(() => {
    fetchAllTrades();
  }, []);

  const fetchAllTrades = async () => {
    try {
      setLoading(true);
      
      // Mock data de todos os trades do sistema
      const mockTrades = [
        {
          id: 1,
          userId: 2,
          userName: 'João Silva',
          userEmail: 'joao@email.com',
          exchange: 'Binance',
          symbol: 'BTC/USDT',
          accountSize: 10000.00,
          riskPercentage: 2.0,
          entryPrice: 67500.00,
          stopLoss: 66000.00,
          takeProfit: 70000.00,
          positionSize: 0.148,
          riskAmount: 200.00,
          rewardAmount: 370.00,
          riskRewardRatio: 1.85,
          currentPrice: 67450.00,
          tradeType: 'long',
          status: 'active',
          notes: 'Trade baseado em suporte técnico forte',
          createdAt: '2024-12-02T10:30:00Z'
        },
        {
          id: 2,
          userId: 3,
          userName: 'Maria Santos',
          userEmail: 'maria@email.com',
          exchange: 'Bybit',
          symbol: 'ETH/USDT',
          accountSize: 5000.00,
          riskPercentage: 1.5,
          entryPrice: 2800.00,
          stopLoss: 2750.00,
          takeProfit: 2900.00,
          positionSize: 1.07,
          riskAmount: 75.00,
          rewardAmount: 107.00,
          riskRewardRatio: 1.43,
          currentPrice: 2795.00,
          tradeType: 'long',
          status: 'closed',
          notes: 'Rompimento de resistência confirmado',
          createdAt: '2024-12-01T14:15:00Z'
        },
        {
          id: 3,
          userId: 4,
          userName: 'Carlos Lima',
          userEmail: 'carlos@email.com',
          exchange: 'BingX',
          symbol: 'ADA/USDT',
          accountSize: 3000.00,
          riskPercentage: 3.0,
          entryPrice: 0.52,
          stopLoss: 0.49,
          takeProfit: 0.58,
          positionSize: 1846.15,
          riskAmount: 90.00,
          rewardAmount: 110.77,
          riskRewardRatio: 1.23,
          currentPrice: 0.51,
          tradeType: 'long',
          status: 'active',
          notes: 'Entrada em zona de acumulação',
          createdAt: '2024-12-01T09:20:00Z'
        }
      ];
      
      setTrades(mockTrades);
    } catch (error) {
      console.error('Erro ao carregar trades:', error);
    } finally {
      setLoading(false);
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

  const stats = {
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
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Trades Fechados</h3>
            <div className="stat-number">{stats.closedTrades}</div>
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
            onChange={(e) => setFilterExchange(e.target.value)}
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="closed">Fechados</option>
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
              <div className="value-entry">Entrada: R$ {trade.entryPrice.toFixed(2)}</div>
              <div className="value-position">Posição: {trade.positionSize.toFixed(4)}</div>
              <div className="value-account">Conta: R$ {trade.accountSize.toFixed(2)}</div>
            </div>
            
            <div className="col-risk">
              <div className="risk-amount">Risco: R$ {trade.riskAmount.toFixed(2)}</div>
              <div className="reward-amount">Reward: R$ {trade.rewardAmount.toFixed(2)}</div>
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
                <p><strong>Tamanho da Conta:</strong> R$ {selectedTrade.accountSize.toFixed(2)}</p>
                <p><strong>Risco (%):</strong> {selectedTrade.riskPercentage}%</p>
                <p><strong>Preço de Entrada:</strong> R$ {selectedTrade.entryPrice.toFixed(8)}</p>
                <p><strong>Stop Loss:</strong> R$ {selectedTrade.stopLoss?.toFixed(8) || 'N/A'}</p>
                <p><strong>Take Profit:</strong> R$ {selectedTrade.takeProfit?.toFixed(8) || 'N/A'}</p>
              </div>
              
              <div className="details-section">
                <h3>⚖️ Cálculos de Risco</h3>
                <p><strong>Tamanho da Posição:</strong> {selectedTrade.positionSize.toFixed(8)}</p>
                <p><strong>Valor do Risco:</strong> R$ {selectedTrade.riskAmount.toFixed(2)}</p>
                <p><strong>Valor do Reward:</strong> R$ {selectedTrade.rewardAmount.toFixed(2)}</p>
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
    </div>
  );
};

export default AdminTrades;