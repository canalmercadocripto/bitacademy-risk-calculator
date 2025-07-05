import React, { useState, useEffect } from 'react';
import { brokerageApi } from '../services/brokerageApi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './ApiManager.css';

const ApiManager = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('connections');
  const [supportedBrokerages, setSupportedBrokerages] = useState([]);
  const [connectedBrokerages, setConnectedBrokerages] = useState([]);
  const [tradingHistory, setTradingHistory] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);
  const [tradingFees, setTradingFees] = useState([]);
  const [loading, setLoading] = useState({
    connections: false,
    history: false,
    balances: false,
    fees: false
  });
  
  // Connection Management States
  const [selectedBrokerage, setSelectedBrokerage] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [connectionForm, setConnectionForm] = useState({
    brokerage: '',
    apiKey: '',
    secretKey: '',
    passphrase: '',
    subAccount: '',
    testMode: true,
    name: ''
  });
  
  // History & Analytics States
  const [historyFilters, setHistoryFilters] = useState({
    brokerage: '',
    symbol: '',
    dateFrom: '',
    dateTo: '',
    limit: 100
  });
  
  const [connectionStatus, setConnectionStatus] = useState({});
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  useEffect(() => {
    loadInitialData();
    if (monitoringEnabled) {
      const interval = setInterval(checkConnectionStatus, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [monitoringEnabled]);

  const loadInitialData = async () => {
    try {
      setLoading(prev => ({ ...prev, connections: true }));
      const [supported, connected] = await Promise.all([
        brokerageApi.getSupportedBrokerages(),
        token ? brokerageApi.getConnectedBrokerages(token) : Promise.resolve([])
      ]);
      setSupportedBrokerages(supported);
      setConnectedBrokerages(connected);
      
      // Load initial status for connected brokerages
      if (connected.length > 0) {
        checkConnectionStatus();
      }
    } catch (err) {
      toast.error('Erro ao carregar dados das corretoras');
    } finally {
      setLoading(prev => ({ ...prev, connections: false }));
    }
  };

  const checkConnectionStatus = async () => {
    if (!connectedBrokerages.length) return;
    
    const statusPromises = connectedBrokerages.map(async (connection) => {
      try {
        const result = await brokerageApi.testConnection(connection.id, token);
        return { [connection.id]: result.status };
      } catch (err) {
        return { [connection.id]: 'error' };
      }
    });
    
    const statuses = await Promise.all(statusPromises);
    const statusMap = statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
    setConnectionStatus(statusMap);
  };

  // ========== CONNECTION MANAGEMENT ==========

  const handleAddConnection = (brokerage) => {
    setSelectedBrokerage(brokerage);
    setEditingConnection(null);
    setConnectionForm({
      brokerage: brokerage.id,
      apiKey: '',
      secretKey: '',
      passphrase: '',
      subAccount: '',
      testMode: true,
      name: `${brokerage.name} - ${user?.email || 'Main'}`
    });
  };

  const handleEditConnection = (connection) => {
    setSelectedBrokerage(supportedBrokerages.find(b => b.id === connection.brokerage_id));
    setEditingConnection(connection);
    setConnectionForm({
      brokerage: connection.brokerage_id,
      apiKey: connection.api_key_masked || '',
      secretKey: '',
      passphrase: '',
      subAccount: connection.sub_account || '',
      testMode: connection.test_mode || false,
      name: connection.name || ''
    });
  };

  const handleSaveConnection = async () => {
    try {
      const connectionData = {
        brokerage: connectionForm.brokerage,
        name: connectionForm.name,
        credentials: {
          apiKey: connectionForm.apiKey,
          secretKey: connectionForm.secretKey,
          ...(connectionForm.passphrase && { passphrase: connectionForm.passphrase }),
          ...(connectionForm.subAccount && { subAccount: connectionForm.subAccount })
        },
        testMode: connectionForm.testMode
      };

      if (editingConnection) {
        await brokerageApi.updateConnection(editingConnection.id, connectionData, token);
        toast.success('Conexão atualizada com sucesso!');
      } else {
        await brokerageApi.connectBrokerage(connectionData, token);
        toast.success('Corretora conectada com sucesso!');
      }

      setSelectedBrokerage(null);
      setEditingConnection(null);
      loadInitialData();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar conexão');
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!window.confirm('Tem certeza que deseja remover esta conexão?')) return;
    
    try {
      await brokerageApi.disconnectBrokerage(connectionId, token);
      toast.success('Conexão removida com sucesso!');
      loadInitialData();
    } catch (err) {
      toast.error('Erro ao remover conexão');
    }
  };

  const handleTestConnection = async (connectionId) => {
    try {
      const result = await brokerageApi.testConnection(connectionId, token);
      if (result.success) {
        toast.success('Conexão testada com sucesso!');
        setConnectionStatus(prev => ({ ...prev, [connectionId]: 'connected' }));
      } else {
        toast.error('Falha no teste de conexão');
        setConnectionStatus(prev => ({ ...prev, [connectionId]: 'error' }));
      }
    } catch (err) {
      toast.error('Erro ao testar conexão');
    }
  };

  // ========== TRADING HISTORY ==========

  const loadTradingHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      const history = await brokerageApi.getConsolidatedHistory(historyFilters, token);
      setTradingHistory(history.trades || []);
    } catch (err) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  const loadAccountBalances = async () => {
    try {
      setLoading(prev => ({ ...prev, balances: true }));
      const balances = await brokerageApi.getAccountBalances(token);
      setAccountBalances(balances || []);
    } catch (err) {
      toast.error('Erro ao carregar saldos');
    } finally {
      setLoading(prev => ({ ...prev, balances: false }));
    }
  };

  const loadTradingFees = async () => {
    try {
      setLoading(prev => ({ ...prev, fees: true }));
      const feesPromises = connectedBrokerages.map(async (connection) => {
        const fees = await brokerageApi.getTradingCosts(connection.id, '30d', token);
        return { ...fees, brokerageName: connection.brokerage_name };
      });
      const allFees = await Promise.all(feesPromises);
      setTradingFees(allFees);
    } catch (err) {
      toast.error('Erro ao carregar fees');
    } finally {
      setLoading(prev => ({ ...prev, fees: false }));
    }
  };

  const handleSyncAll = async () => {
    try {
      await brokerageApi.syncAllBrokerages(token);
      toast.success('Sincronização iniciada para todas as corretoras');
      loadTradingHistory();
      loadAccountBalances();
    } catch (err) {
      toast.error('Erro ao sincronizar');
    }
  };

  const exportHistory = async () => {
    try {
      const exportConfig = {
        format: 'csv',
        filters: historyFilters,
        includeMetrics: true
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
      toast.success('Histórico exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar dados');
    }
  };

  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status) => {
    const colors = {
      'connected': 'success',
      'connecting': 'warning',
      'disconnected': 'error',
      'syncing': 'info',
      'error': 'error'
    };
    return colors[status] || 'secondary';
  };

  const getAvailableBrokerages = () => {
    const connectedIds = connectedBrokerages.map(c => c.brokerage_id);
    return supportedBrokerages.filter(b => !connectedIds.includes(b.id));
  };

  if (loading.connections) {
    return (
      <div className="api-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando gerenciador de APIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-manager">
      <div className="api-manager-header">
        <h1>🔑 Gerenciador de APIs</h1>
        <p>Gerencie suas conexões com corretoras, monitore status e analise seu histórico completo</p>
        
        <div className="header-actions">
          <button 
            className="btn btn--primary"
            onClick={handleSyncAll}
            disabled={connectedBrokerages.length === 0}
          >
            🔄 Sincronizar Tudo
          </button>
          <label className="monitoring-toggle">
            <input
              type="checkbox"
              checked={monitoringEnabled}
              onChange={(e) => setMonitoringEnabled(e.target.checked)}
            />
            📡 Monitoramento Ativo
          </label>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          🔗 Conexões
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            if (tradingHistory.length === 0) loadTradingHistory();
          }}
        >
          📊 Histórico
        </button>
        <button 
          className={`tab-button ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('balances');
            if (accountBalances.length === 0) loadAccountBalances();
          }}
        >
          💰 Saldos
        </button>
        <button 
          className={`tab-button ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('fees');
            if (tradingFees.length === 0) loadTradingFees();
          }}
        >
          💸 Fees
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'connections' && (
          <div className="connections-tab">
            {/* Connected Brokerages */}
            {connectedBrokerages.length > 0 && (
              <div className="connected-section">
                <h2>Corretoras Conectadas</h2>
                <div className="connected-grid">
                  {connectedBrokerages.map(connection => (
                    <div key={connection.id} className="connection-card">
                      <div className="connection-header">
                        <div className="connection-info">
                          <img 
                            src={connection.brokerage_logo} 
                            alt={connection.brokerage_name}
                            className="brokerage-logo"
                          />
                          <div>
                            <h3>{connection.name || connection.brokerage_name}</h3>
                            <p>{connection.brokerage_name}</p>
                          </div>
                        </div>
                        <div className={`status-badge ${getStatusColor(connectionStatus[connection.id] || connection.status)}`}>
                          {connectionStatus[connection.id] || connection.status || 'unknown'}
                        </div>
                      </div>
                      
                      <div className="connection-details">
                        <div className="detail-row">
                          <span>API Key:</span>
                          <span>{connection.api_key_masked}</span>
                        </div>
                        <div className="detail-row">
                          <span>Modo:</span>
                          <span>{connection.test_mode ? 'Teste' : 'Produção'}</span>
                        </div>
                        {connection.sub_account && (
                          <div className="detail-row">
                            <span>Sub-conta:</span>
                            <span>{connection.sub_account}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="connection-actions">
                        <button 
                          className="btn btn--sm btn--ghost"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          🔍 Testar
                        </button>
                        <button 
                          className="btn btn--sm btn--secondary"
                          onClick={() => handleEditConnection(connection)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn--sm btn--danger"
                          onClick={() => handleDeleteConnection(connection.id)}
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Connection */}
            <div className="add-connection-section">
              <h2>Adicionar Nova Corretora</h2>
              
              {!selectedBrokerage ? (
                <div className="brokerages-grid">
                  {getAvailableBrokerages().map(brokerage => (
                    <div 
                      key={brokerage.id}
                      className="brokerage-option"
                      onClick={() => handleAddConnection(brokerage)}
                    >
                      <img 
                        src={brokerage.logo} 
                        alt={brokerage.name}
                        className="brokerage-logo"
                      />
                      <h3>{brokerage.name}</h3>
                      <p>{brokerage.description}</p>
                      <div className="brokerage-features">
                        {brokerage.features?.map(feature => (
                          <span key={feature} className="feature-tag">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="connection-form">
                  <div className="form-header">
                    <img 
                      src={selectedBrokerage.logo} 
                      alt={selectedBrokerage.name}
                      className="brokerage-logo"
                    />
                    <h3>
                      {editingConnection ? 'Editar' : 'Conectar'} {selectedBrokerage.name}
                    </h3>
                    <button 
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setSelectedBrokerage(null);
                        setEditingConnection(null);
                      }}
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  <div className="form-content">
                    <div className="form-row">
                      <label>Nome da Conexão</label>
                      <input
                        type="text"
                        className="input"
                        value={connectionForm.name}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Binance Principal"
                      />
                    </div>

                    <div className="form-row">
                      <label>API Key</label>
                      <input
                        type="password"
                        className="input"
                        value={connectionForm.apiKey}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Sua API Key"
                      />
                    </div>

                    <div className="form-row">
                      <label>Secret Key</label>
                      <input
                        type="password"
                        className="input"
                        value={connectionForm.secretKey}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Sua Secret Key"
                      />
                    </div>

                    {['bitget', 'coinbase', 'kucoin'].includes(selectedBrokerage.id) && (
                      <div className="form-row">
                        <label>Passphrase</label>
                        <input
                          type="password"
                          className="input"
                          value={connectionForm.passphrase}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, passphrase: e.target.value }))}
                          placeholder="Sua Passphrase"
                        />
                      </div>
                    )}

                    {selectedBrokerage.id === 'ftx' && (
                      <div className="form-row">
                        <label>Sub Account (opcional)</label>
                        <input
                          type="text"
                          className="input"
                          value={connectionForm.subAccount}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, subAccount: e.target.value }))}
                          placeholder="Nome da sub-conta"
                        />
                      </div>
                    )}

                    <div className="form-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={connectionForm.testMode}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, testMode: e.target.checked }))}
                        />
                        Modo de teste (sandbox)
                      </label>
                    </div>

                    <div className="form-actions">
                      <button 
                        className="btn btn--primary"
                        onClick={handleSaveConnection}
                      >
                        {editingConnection ? '💾 Salvar Alterações' : '🔗 Conectar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="tab-header">
              <h2>📊 Histórico de Trading</h2>
              <div className="header-actions">
                <button 
                  className="btn btn--secondary"
                  onClick={loadTradingHistory}
                  disabled={loading.history}
                >
                  {loading.history ? 'Carregando...' : '🔄 Atualizar'}
                </button>
                <button 
                  className="btn btn--primary"
                  onClick={exportHistory}
                  disabled={tradingHistory.length === 0}
                >
                  📤 Exportar
                </button>
              </div>
            </div>

            {/* History Filters */}
            <div className="filters-section">
              <div className="filters-grid">
                <select
                  value={historyFilters.brokerage}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, brokerage: e.target.value }))}
                  className="input"
                >
                  <option value="">Todas as corretoras</option>
                  {connectedBrokerages.map(b => (
                    <option key={b.id} value={b.id}>{b.brokerage_name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Símbolo (ex: BTCUSDT)"
                  value={historyFilters.symbol}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, symbol: e.target.value }))}
                  className="input"
                />
                <input
                  type="date"
                  value={historyFilters.dateFrom}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="input"
                />
                <input
                  type="date"
                  value={historyFilters.dateTo}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="input"
                />
                <button 
                  className="btn btn--secondary"
                  onClick={loadTradingHistory}
                >
                  🔍 Filtrar
                </button>
              </div>
            </div>

            {/* Trading History Table */}
            {loading.history ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando histórico...</p>
              </div>
            ) : (
              <div className="history-table-container">
                {tradingHistory.length > 0 ? (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Corretora</th>
                        <th>Símbolo</th>
                        <th>Lado</th>
                        <th>Quantidade</th>
                        <th>Preço</th>
                        <th>P&L</th>
                        <th>Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingHistory.map(trade => (
                        <tr key={trade.id}>
                          <td>{formatDate(trade.timestamp)}</td>
                          <td>{trade.brokerage}</td>
                          <td className="symbol-cell">{trade.symbol}</td>
                          <td>
                            <span className={`side-badge ${trade.side.toLowerCase()}`}>
                              {trade.side}
                            </span>
                          </td>
                          <td>{trade.quantity?.toFixed(6)}</td>
                          <td>{formatCurrency(trade.price)}</td>
                          <td>
                            <span className={`pnl-value ${trade.pnl > 0 ? 'profit' : trade.pnl < 0 ? 'loss' : 'neutral'}`}>
                              {formatCurrency(trade.pnl)}
                            </span>
                          </td>
                          <td>{formatCurrency(trade.fees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>Nenhum histórico encontrado</p>
                    <button 
                      className="btn btn--primary"
                      onClick={handleSyncAll}
                    >
                      🔄 Sincronizar Histórico
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="balances-tab">
            <div className="tab-header">
              <h2>💰 Saldos das Contas</h2>
              <button 
                className="btn btn--secondary"
                onClick={loadAccountBalances}
                disabled={loading.balances}
              >
                {loading.balances ? 'Carregando...' : '🔄 Atualizar'}
              </button>
            </div>

            {loading.balances ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando saldos...</p>
              </div>
            ) : (
              <div className="balances-grid">
                {accountBalances.map((balance, index) => (
                  <div key={index} className="balance-card">
                    <div className="balance-header">
                      <h3>{balance.brokerageName}</h3>
                      <div className="balance-total">
                        {formatCurrency(balance.totalUSD)}
                      </div>
                    </div>
                    <div className="balance-details">
                      {balance.assets?.map(asset => (
                        <div key={asset.asset} className="asset-row">
                          <span className="asset-name">{asset.asset}</span>
                          <div className="asset-amounts">
                            <span className="asset-free">{asset.free}</span>
                            <span className="asset-usd">{formatCurrency(asset.usdValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="fees-tab">
            <div className="tab-header">
              <h2>💸 Análise de Fees</h2>
              <button 
                className="btn btn--secondary"
                onClick={loadTradingFees}
                disabled={loading.fees}
              >
                {loading.fees ? 'Carregando...' : '🔄 Atualizar'}
              </button>
            </div>

            {loading.fees ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando fees...</p>
              </div>
            ) : (
              <div className="fees-grid">
                {tradingFees.map((fee, index) => (
                  <div key={index} className="fee-card">
                    <div className="fee-header">
                      <h3>{fee.brokerageName}</h3>
                      <div className="fee-period">Últimos 30 dias</div>
                    </div>
                    <div className="fee-metrics">
                      <div className="fee-metric">
                        <label>Total em Fees</label>
                        <span className="fee-value">{formatCurrency(fee.totalFees)}</span>
                      </div>
                      <div className="fee-metric">
                        <label>Volume Total</label>
                        <span className="fee-value">{formatCurrency(fee.totalVolume)}</span>
                      </div>
                      <div className="fee-metric">
                        <label>Fee Rate Médio</label>
                        <span className="fee-value">{(fee.averageFeeRate * 100).toFixed(3)}%</span>
                      </div>
                      <div className="fee-metric">
                        <label>Trades Executados</label>
                        <span className="fee-value">{fee.totalTrades}</span>
                      </div>
                    </div>
                    <div className="fee-breakdown">
                      <h4>Breakdown por Tipo</h4>
                      {fee.feesByType?.map(type => (
                        <div key={type.type} className="fee-type-row">
                          <span>{type.type}</span>
                          <span>{formatCurrency(type.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiManager;