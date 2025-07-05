import React, { useState, useEffect } from 'react';
import BinanceAPI from '../services/binanceApi';
import { useApiKeys } from '../hooks/useApiKeys';
import toast from 'react-hot-toast';

const ApiConfiguration = () => {
  const { 
    apiKeys, 
    saveApiKeys, 
    clearApiKeys, 
    hasValidKeys, 
    isConfigured,
    connectionStatus,
    isConnectionValid,
    saveConnectionStatus,
    invalidateConnection
  } = useApiKeys();
  
  const [apiConfig, setApiConfig] = useState({
    binanceApiKey: '',
    binanceSecret: '',
    useTestnet: false,
    useProxy: true
  });
  
  const [localConnectionStatus, setLocalConnectionStatus] = useState({
    connected: false,
    testing: false,
    accountInfo: null,
    error: null
  });

  const [savedConfigs, setSavedConfigs] = useState([]);

  useEffect(() => {
    // Carregar configurações do contexto global apenas uma vez
    if (apiKeys.binanceApiKey && apiKeys.binanceSecret) {
      setApiConfig(prevConfig => ({
        ...prevConfig,
        binanceApiKey: apiKeys.binanceApiKey,
        binanceSecret: apiKeys.binanceSecret
      }));
    }

    // Carregar configurações salvas localmente
    const saved = localStorage.getItem('api_configurations');
    if (saved) {
      setSavedConfigs(JSON.parse(saved));
    }
  }, []); // Executar apenas uma vez

  // Effect separado para gerenciar conexão
  useEffect(() => {
    if (!isConfigured || !apiKeys.binanceApiKey || !apiKeys.binanceSecret) {
      return;
    }

    // Usar cache de conexão se válido
    if (isConnectionValid()) {
      console.log('📱 Usando cache de conexão válido');
      setLocalConnectionStatus({
        connected: connectionStatus.success,
        testing: false,
        accountInfo: connectionStatus.accountInfo || null,
        error: connectionStatus.error || null
      });
    } else {
      // Cache inválido ou inexistente - definir status como desconectado
      // NÃO testar automaticamente para evitar loops
      console.log('⏸️ Cache inválido - aguardando teste manual');
      setLocalConnectionStatus({
        connected: false,
        testing: false,
        accountInfo: null,
        error: null
      });
    }
  }, [isConfigured]); // Executar apenas quando isConfigured mudar

  const testConnection = async (isManual = false) => {
    // Se não é manual e já está testando, ignorar
    if (!isManual && localConnectionStatus.testing) {
      console.log('⏸️ Teste já em andamento, ignorando');
      return;
    }
    
    // Se não é manual e o cache ainda é válido, ignorar
    if (!isManual && isConnectionValid()) {
      console.log('⏸️ Cache ainda válido, ignorando teste automático');
      return;
    }
    
    setLocalConnectionStatus(prev => ({ ...prev, testing: true, error: null }));
    
    try {
      console.log('🔧 Testando conexão com a API...');
      
      const binanceApi = new BinanceAPI(
        apiConfig.binanceApiKey,
        apiConfig.binanceSecret,
        apiConfig.useTestnet,
        apiConfig.useProxy
      );

      // Testar conexão
      const result = await binanceApi.testConnection();
      
      if (result.success) {
        // Buscar informações da conta
        const accountData = await binanceApi.getAccountInfo();
        const balances = await binanceApi.getBalances();
        
        const accountInfo = {
          accountType: accountData.accountType,
          canTrade: accountData.canTrade,
          canWithdraw: accountData.canWithdraw,
          canDeposit: accountData.canDeposit,
          permissions: accountData.permissions,
          totalAssets: balances.length,
          totalBalanceUSD: balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0),
          mainAssets: balances.slice(0, 5).map(b => ({
            asset: b.asset,
            total: parseFloat(b.total),
            usdValue: b.usdValue
          })),
          lastUpdate: new Date().toISOString()
        };

        const connectionResult = {
          success: true,
          accountInfo,
          error: null
        };

        setLocalConnectionStatus({
          connected: true,
          testing: false,
          accountInfo,
          error: null
        });

        // Salvar status de conexão no cache global
        saveConnectionStatus(connectionResult);

        toast.success('✅ API Binance conectada com sucesso!');
        
        // Salvar chaves no contexto global
        saveApiKeys({
          binanceApiKey: apiConfig.binanceApiKey,
          binanceSecret: apiConfig.binanceSecret
        });
        
        // Salvar configuração automaticamente se funcionou
        saveConfiguration('Configuração Atual', true);

      } else {
        throw new Error(result.error || 'Falha na conexão');
      }

    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      
      const connectionResult = {
        success: false,
        accountInfo: null,
        error: error.message
      };

      setLocalConnectionStatus({
        connected: false,
        testing: false,
        accountInfo: null,
        error: error.message
      });

      // Salvar status de erro no cache global
      saveConnectionStatus(connectionResult);
      
      toast.error(`Erro: ${error.message}`);
    }
  };

  const saveConfiguration = (name, isAuto = false) => {
    const config = {
      id: Date.now(),
      name: name || `Config ${new Date().toLocaleDateString()}`,
      apiKey: apiConfig.binanceApiKey,
      secret: apiConfig.binanceSecret,
      useTestnet: apiConfig.useTestnet,
      useProxy: apiConfig.useProxy,
      isConnected: localConnectionStatus.connected,
      savedAt: new Date().toISOString(),
      isAutoSaved: isAuto
    };

    const updated = [...savedConfigs.filter(c => !c.isAutoSaved), config];
    setSavedConfigs(updated);
    localStorage.setItem('api_configurations', JSON.stringify(updated));
    
    if (!isAuto) {
      toast.success('Configuração salva!');
    }
  };

  const loadConfiguration = (config) => {
    setApiConfig({
      binanceApiKey: config.apiKey,
      binanceSecret: config.secret,
      useTestnet: config.useTestnet,
      useProxy: config.useProxy
    });
    
    // Salvar no contexto global também
    saveApiKeys({
      binanceApiKey: config.apiKey,
      binanceSecret: config.secret
    });
    
    toast.info('Configuração carregada');
  };

  const deleteConfiguration = (configId) => {
    const updated = savedConfigs.filter(c => c.id !== configId);
    setSavedConfigs(updated);
    localStorage.setItem('api_configurations', JSON.stringify(updated));
    toast.success('Configuração removida');
  };

  return (
    <div className="api-configuration">
      <div className="config-header">
        <h2>🔧 Configuração da API</h2>
        <p>Gerencie suas conexões com as APIs das exchanges</p>
        
        {/* Status das Chaves Permanentes */}
        {hasValidKeys() && (
          <div className="permanent-keys-status">
            <span className="status-icon">🔐</span>
            <span className="status-text">
              Chaves API configuradas permanentemente
              {isConnectionValid() && (
                <small> • Conexão válida (cache ativo)</small>
              )}
              {!isConnectionValid() && apiKeys.lastSaved && (
                <small> • Salvo em {new Date(apiKeys.lastSaved).toLocaleString('pt-BR')}</small>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Status da Conexão */}
      <div className={`connection-status ${localConnectionStatus.connected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          {localConnectionStatus.testing && <span className="loading">🔄</span>}
          {!localConnectionStatus.testing && localConnectionStatus.connected && <span className="success">✅</span>}
          {!localConnectionStatus.testing && !localConnectionStatus.connected && <span className="error">❌</span>}
        </div>
        <div className="status-info">
          <h3>
            {localConnectionStatus.testing && 'Testando conexão...'}
            {!localConnectionStatus.testing && localConnectionStatus.connected && 'API Conectada'}
            {!localConnectionStatus.testing && !localConnectionStatus.connected && 'API Desconectada'}
          </h3>
          {localConnectionStatus.error && (
            <p className="error-message">{localConnectionStatus.error}</p>
          )}
        </div>
      </div>

      {/* Informações da Conta */}
      {localConnectionStatus.accountInfo && (
        <div className="account-summary">
          <h3>📊 Informações da Conta</h3>
          <div className="account-grid">
            <div className="account-item">
              <span className="label">Tipo:</span>
              <span className="value">{localConnectionStatus.accountInfo.accountType}</span>
            </div>
            <div className="account-item">
              <span className="label">Trading:</span>
              <span className={`value ${localConnectionStatus.accountInfo.canTrade ? 'enabled' : 'disabled'}`}>
                {localConnectionStatus.accountInfo.canTrade ? '✅ Habilitado' : '❌ Desabilitado'}
              </span>
            </div>
            <div className="account-item">
              <span className="label">Total Assets:</span>
              <span className="value">{localConnectionStatus.accountInfo.totalAssets}</span>
            </div>
            <div className="account-item">
              <span className="label">Valor Total:</span>
              <span className="value">${localConnectionStatus.accountInfo.totalBalanceUSD.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="main-assets">
            <h4>💰 Principais Assets</h4>
            <div className="assets-list">
              {localConnectionStatus.accountInfo.mainAssets.map((asset, index) => (
                <div key={index} className="asset-item">
                  <span className="asset-name">{asset.asset}</span>
                  <span className="asset-amount">{asset.total.toFixed(8)}</span>
                  <span className="asset-value">${asset.usdValue?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuração Manual */}
      <div className="config-form">
        <h3>⚙️ Configuração Binance</h3>
        
        <div className="form-group">
          <label>API Key:</label>
          <input
            type="password"
            value={apiConfig.binanceApiKey}
            onChange={(e) => setApiConfig(prev => ({ ...prev, binanceApiKey: e.target.value }))}
            placeholder="Sua API Key da Binance"
          />
        </div>

        <div className="form-group">
          <label>Secret Key:</label>
          <input
            type="password"
            value={apiConfig.binanceSecret}
            onChange={(e) => setApiConfig(prev => ({ ...prev, binanceSecret: e.target.value }))}
            placeholder="Sua Secret Key da Binance"
          />
        </div>

        <div className="form-options">
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={apiConfig.useTestnet}
              onChange={(e) => setApiConfig(prev => ({ ...prev, useTestnet: e.target.checked }))}
            />
            <span>Usar Testnet (para testes)</span>
          </label>

          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={apiConfig.useProxy}
              onChange={(e) => setApiConfig(prev => ({ ...prev, useProxy: e.target.checked }))}
            />
            <span>Usar Proxy (recomendado)</span>
          </label>
        </div>

        <div className="form-actions">
          <button 
            className="test-button"
            onClick={() => testConnection(true)}
            disabled={localConnectionStatus.testing || !apiConfig.binanceApiKey || !apiConfig.binanceSecret}
          >
            {localConnectionStatus.testing ? '🔄 Testando...' : '🧪 Testar Conexão'}
          </button>

          <button 
            className="save-button"
            onClick={() => {
              // Salvar no contexto global primeiro
              const saved = saveApiKeys({
                binanceApiKey: apiConfig.binanceApiKey,
                binanceSecret: apiConfig.binanceSecret
              });
              
              if (saved) {
                const name = prompt('Nome para esta configuração (opcional):');
                if (name) saveConfiguration(name);
                toast.success('✅ Chaves salvas permanentemente!');
              }
            }}
            disabled={!apiConfig.binanceApiKey || !apiConfig.binanceSecret}
          >
            💾 Salvar Permanente
          </button>

          {hasValidKeys() && (
            <button 
              className="clear-button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar as chaves API?')) {
                  clearApiKeys();
                  setApiConfig({
                    binanceApiKey: '',
                    binanceSecret: '',
                    useTestnet: false,
                    useProxy: true
                  });
                  setLocalConnectionStatus({
                    connected: false,
                    testing: false,
                    accountInfo: null,
                    error: null
                  });
                  // Invalidar cache de conexão
                  invalidateConnection();
                  toast.success('🗑️ Chaves removidas');
                }
              }}
            >
              🗑️ Limpar Chaves
            </button>
          )}
        </div>
      </div>

      {/* Configurações Salvas */}
      {savedConfigs.length > 0 && (
        <div className="saved-configs">
          <h3>📋 Configurações Salvas</h3>
          <div className="configs-list">
            {savedConfigs.map(config => (
              <div key={config.id} className={`config-item ${config.isConnected ? 'connected' : ''}`}>
                <div className="config-info">
                  <div className="config-name">{config.name}</div>
                  <div className="config-details">
                    {config.useTestnet ? 'Testnet' : 'Mainnet'} • 
                    {config.useProxy ? ' Proxy' : ' Direto'} • 
                    {new Date(config.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="config-actions">
                  <button onClick={() => loadConfiguration(config)}>📥 Carregar</button>
                  <button onClick={() => deleteConfiguration(config.id)} className="delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="instructions">
        <h3>📖 Como Configurar</h3>
        <ol>
          <li>Acesse sua conta Binance → API Management</li>
          <li>Crie uma nova API Key com permissões de leitura</li>
          <li>Cole a API Key e Secret Key nos campos acima</li>
          <li>Mantenha "Usar Proxy" marcado (recomendado)</li>
          <li>Clique em "Testar Conexão"</li>
          <li>Se conectar com sucesso, salve a configuração</li>
        </ol>
        
        <div className="security-note">
          <h4>🔒 Segurança</h4>
          <p>Suas chaves são armazenadas apenas no seu navegador e usadas somente para conectar à API oficial da Binance. Nunca compartilhe suas chaves com terceiros.</p>
        </div>
      </div>

      <style jsx>{`
        .api-configuration {
          max-width: 1000px;
          margin: 20px auto;
          padding: 20px;
        }

        .config-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .config-header h2 {
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          border: 2px solid;
        }

        .connection-status.connected {
          background: rgba(40, 167, 69, 0.1);
          border-color: var(--success-color);
        }

        .connection-status.disconnected {
          background: rgba(220, 53, 69, 0.1);
          border-color: var(--error-color);
        }

        .status-indicator {
          font-size: 2em;
        }

        .loading {
          animation: spin 1s linear infinite;
        }

        .account-summary {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .account-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .assets-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .asset-item {
          display: flex;
          flex-direction: column;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          text-align: center;
        }

        .asset-name {
          font-weight: 600;
          color: var(--accent-color);
        }

        .config-form {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text-primary);
        }

        .form-options {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 15px;
        }

        .test-button, .save-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .test-button {
          background: var(--accent-color);
          color: white;
        }

        .save-button {
          background: var(--success-color);
          color: white;
        }

        .clear-button {
          background: var(--error-color);
          color: white;
        }

        .permanent-keys-status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
          padding: 12px 16px;
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid rgba(40, 167, 69, 0.3);
          border-radius: 8px;
          color: var(--success-color);
        }

        .permanent-keys-status .status-icon {
          font-size: 1.2em;
        }

        .permanent-keys-status .status-text {
          font-weight: 500;
        }

        .permanent-keys-status small {
          display: block;
          font-size: 0.8em;
          opacity: 0.8;
          margin-top: 2px;
        }

        .test-button:disabled, .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .saved-configs {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .configs-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
        }

        .config-item.connected {
          border-color: var(--success-color);
          background: rgba(40, 167, 69, 0.1);
        }

        .config-actions {
          display: flex;
          gap: 10px;
        }

        .config-actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .config-actions button.delete {
          background: var(--error-color);
          color: white;
        }

        .instructions {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
        }

        .security-note {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid var(--warning-color);
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
        }

        .security-note h4 {
          margin: 0 0 10px 0;
          color: var(--warning-color);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-options {
            flex-direction: column;
            gap: 10px;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .config-item {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ApiConfiguration;