import React, { useState, useEffect } from 'react';
import { brokerageApi } from '../services/brokerageApi';
import { useAuth } from '../hooks/useAuth';
import './BrokerageSettings.css';

const BrokerageSettings = () => {
  const { user, token } = useAuth();
  const [supportedBrokerages, setSupportedBrokerages] = useState([]);
  const [connectedBrokerages, setConnectedBrokerages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [selectedBrokerage, setSelectedBrokerage] = useState(null);
  const [connectionForm, setConnectionForm] = useState({
    brokerage: '',
    apiKey: '',
    secretKey: '',
    passphrase: '',
    subAccount: '',
    testMode: true
  });
  const [syncStatus, setSyncStatus] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBrokerageData();
  }, []);

  const loadBrokerageData = async () => {
    try {
      setLoading(true);
      const [supported, connected] = await Promise.all([
        brokerageApi.getSupportedBrokerages(),
        token ? brokerageApi.getConnectedBrokerages(token) : Promise.resolve([])
      ]);
      setSupportedBrokerages(supported);
      setConnectedBrokerages(connected);
    } catch (err) {
      setError('Erro ao carregar dados das corretoras');
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerageSelect = (brokerage) => {
    setSelectedBrokerage(brokerage);
    setConnectionForm({
      brokerage: brokerage.id,
      apiKey: '',
      secretKey: '',
      passphrase: '',
      subAccount: '',
      testMode: true
    });
    setError('');
    setSuccess('');
  };

  const handleFormChange = (field, value) => {
    setConnectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { brokerage, apiKey, secretKey } = connectionForm;
    if (!brokerage || !apiKey || !secretKey) {
      setError('API Key e Secret Key são obrigatórios');
      return false;
    }

    // Validações específicas por corretora
    if (['bitget', 'coinbase', 'kucoin'].includes(brokerage) && !connectionForm.passphrase) {
      setError('Passphrase é obrigatória para esta corretora');
      return false;
    }

    return true;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;

    try {
      setConnecting(true);
      setError('');
      
      const connectionData = {
        brokerage: connectionForm.brokerage,
        credentials: {
          apiKey: connectionForm.apiKey,
          secretKey: connectionForm.secretKey,
          ...(connectionForm.passphrase && { passphrase: connectionForm.passphrase }),
          ...(connectionForm.subAccount && { subAccount: connectionForm.subAccount })
        },
        testMode: connectionForm.testMode
      };

      await brokerageApi.connectBrokerage(connectionData, token);
      setSuccess('Corretora conectada com sucesso!');
      setSelectedBrokerage(null);
      setConnectionForm({
        brokerage: '',
        apiKey: '',
        secretKey: '',
        passphrase: '',
        subAccount: '',
        testMode: true
      });
      
      // Recarregar dados
      await loadBrokerageData();
    } catch (err) {
      setError(err.message || 'Erro ao conectar corretora');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    try {
      await brokerageApi.disconnectBrokerage(connectionId, token);
      setSuccess('Corretora desconectada');
      await loadBrokerageData();
    } catch (err) {
      setError('Erro ao desconectar corretora');
    }
  };

  const handleTestConnection = async (connectionId) => {
    try {
      const result = await brokerageApi.testConnection(connectionId, token);
      if (result.success) {
        setSuccess('Conexão testada com sucesso!');
      } else {
        setError('Falha no teste de conexão');
      }
    } catch (err) {
      setError('Erro ao testar conexão');
    }
  };

  const handleManualSync = async (connectionId) => {
    try {
      setSyncStatus(prev => ({ ...prev, [connectionId]: 'syncing' }));
      await brokerageApi.syncTradingHistory(connectionId, {}, token);
      setSuccess('Sincronização iniciada');
      
      // Verificar status periodicamente
      const checkStatus = setInterval(async () => {
        try {
          const status = await brokerageApi.getSyncStatus(connectionId, token);
          setSyncStatus(prev => ({ ...prev, [connectionId]: status.status }));
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(checkStatus);
            if (status.status === 'completed') {
              setSuccess('Sincronização concluída');
            } else {
              setError('Falha na sincronização');
            }
          }
        } catch (err) {
          clearInterval(checkStatus);
          setError('Erro ao verificar status');
        }
      }, 2000);
    } catch (err) {
      setError('Erro ao iniciar sincronização');
    }
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

  if (loading) {
    return (
      <div className="brokerage-settings">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brokerage-settings">
      <div className="brokerage-header">
        <h2>🏢 Configurações de Corretoras</h2>
        <p>Conecte suas corretoras para importar automaticamente seu histórico de trading</p>
      </div>

      {error && (
        <div className="alert alert--error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert--success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      {/* Corretoras Conectadas */}
      {connectedBrokerages.length > 0 && (
        <div className="connected-brokerages">
          <h3>Corretoras Conectadas</h3>
          <div className="connected-list">
            {connectedBrokerages.map(connection => (
              <div key={connection.id} className="connected-item">
                <div className="connected-info">
                  <div className="connected-name">
                    <img 
                      src={connection.brokerage.logo} 
                      alt={connection.brokerage.name}
                      className="brokerage-logo"
                    />
                    <span>{connection.brokerage.name}</span>
                  </div>
                  <div className={`connection-status status--${getStatusColor(connection.status)}`}>
                    {connection.status}
                  </div>
                </div>
                
                <div className="connected-actions">
                  <button 
                    className="btn btn--sm btn--ghost"
                    onClick={() => handleTestConnection(connection.id)}
                  >
                    Testar
                  </button>
                  <button 
                    className="btn btn--sm btn--primary"
                    onClick={() => handleManualSync(connection.id)}
                    disabled={syncStatus[connection.id] === 'syncing'}
                  >
                    {syncStatus[connection.id] === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  <button 
                    className="btn btn--sm btn--danger"
                    onClick={() => handleDisconnect(connection.id)}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar Nova Corretora */}
      <div className="add-brokerage">
        <h3>Adicionar Nova Corretora</h3>
        
        {!selectedBrokerage ? (
          <div className="brokerage-grid">
            {supportedBrokerages.map(brokerage => (
              <div 
                key={brokerage.id}
                className="brokerage-card"
                onClick={() => handleBrokerageSelect(brokerage)}
              >
                <img 
                  src={brokerage.logo} 
                  alt={brokerage.name}
                  className="brokerage-logo"
                />
                <h4>{brokerage.name}</h4>
                <p>{brokerage.description}</p>
                <div className="brokerage-features">
                  {brokerage.features.map(feature => (
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
              <h4>Conectar {selectedBrokerage.name}</h4>
              <button 
                className="btn btn--ghost btn--sm"
                onClick={() => setSelectedBrokerage(null)}
              >
                Cancelar
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  className="input"
                  value={connectionForm.apiKey}
                  onChange={(e) => handleFormChange('apiKey', e.target.value)}
                  placeholder="Sua API Key"
                />
              </div>

              <div className="form-group">
                <label>Secret Key</label>
                <input
                  type="password"
                  className="input"
                  value={connectionForm.secretKey}
                  onChange={(e) => handleFormChange('secretKey', e.target.value)}
                  placeholder="Sua Secret Key"
                />
              </div>

              {['bitget', 'coinbase', 'kucoin'].includes(selectedBrokerage.id) && (
                <div className="form-group">
                  <label>Passphrase</label>
                  <input
                    type="password"
                    className="input"
                    value={connectionForm.passphrase}
                    onChange={(e) => handleFormChange('passphrase', e.target.value)}
                    placeholder="Sua Passphrase"
                  />
                </div>
              )}

              {selectedBrokerage.id === 'ftx' && (
                <div className="form-group">
                  <label>Sub Account (opcional)</label>
                  <input
                    type="text"
                    className="input"
                    value={connectionForm.subAccount}
                    onChange={(e) => handleFormChange('subAccount', e.target.value)}
                    placeholder="Nome da sub-conta"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={connectionForm.testMode}
                    onChange={(e) => handleFormChange('testMode', e.target.checked)}
                  />
                  Modo de teste (sandbox)
                </label>
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn--primary"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? 'Conectando...' : 'Conectar Corretora'}
                </button>
              </div>
            </div>

            <div className="connection-help">
              <h5>Como obter suas credenciais:</h5>
              <ol>
                <li>Acesse sua conta na {selectedBrokerage.name}</li>
                <li>Vá para as configurações de API</li>
                <li>Crie uma nova API Key</li>
                <li>Configure apenas permissões de leitura</li>
                <li>Copie as credenciais e cole aqui</li>
              </ol>
              <p className="security-note">
                <strong>Segurança:</strong> Suas credenciais são criptografadas e nunca compartilhadas. 
                Recomendamos usar apenas permissões de leitura.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerageSettings;