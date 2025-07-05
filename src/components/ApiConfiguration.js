import React, { useState, useEffect } from 'react';
import BinanceAPI from '../services/binanceApi';
import MultiExchangeAPI from '../services/multiExchangeApi';
import { useApiKeys } from '../hooks/useApiKeys';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ApiConfiguration = () => {
  const { user } = useAuth();
  const { 
    apiKeys,
    exchanges,
    saveExchangeKeys,
    saveExchangeConnectionStatus,
    clearApiKeys, 
    hasValidKeys, 
    getApiCredentials,
    isConnectionValid,
    getConnectedExchanges,
    getEnabledExchanges
  } = useApiKeys();
  
  
  const [apiConfig, setApiConfig] = useState({
    selectedExchange: 'binance',
    apiKey: '',
    secret: '',
    useTestnet: false,
    useProxy: true
  });

  const exchangeList = [
    { id: 'binance', name: 'Binance', icon: '🟡' },
    { id: 'bingx', name: 'BingX', icon: '🔥' },
    { id: 'bybit', name: 'Bybit', icon: '🟠' },
    { id: 'bitget', name: 'Bitget', icon: '🟢' }
  ];
  
  const [testingStatus, setTestingStatus] = useState({});

  const [savedConfigs, setSavedConfigs] = useState([]);

  useEffect(() => {
    // Carregar campos do formulário para a exchange selecionada
    if (exchanges && typeof exchanges === 'object') {
      const selectedExchange = exchanges[apiConfig.selectedExchange];
      if (selectedExchange) {
        setApiConfig(prev => ({
          ...prev,
          apiKey: selectedExchange.apiKey || '',
          secret: selectedExchange.secret || ''
        }));
      }
    }

    // Carregar configurações salvas localmente
    const saved = localStorage.getItem('api_configurations');
    if (saved) {
      setSavedConfigs(JSON.parse(saved));
    }

    // Testar automaticamente exchanges que têm chaves mas cache expirado
    testEnabledExchanges();
  }, [apiConfig.selectedExchange]); // Executar quando trocar de exchange

  // Testar automaticamente exchanges habilitadas na inicialização
  useEffect(() => {
    const timer = setTimeout(() => {
      testEnabledExchanges();
    }, 1000); // Aguardar carregamento completo

    return () => clearTimeout(timer);
  }, []);

  // Função para testar exchanges habilitadas automaticamente
  const testEnabledExchanges = async () => {
    const enabledExchanges = getEnabledExchanges();
    const supportedExchanges = enabledExchanges.filter(ex => MultiExchangeAPI.isExchangeSupported(ex.id));
    
    console.log(`🔍 Verificando ${enabledExchanges.length} exchanges habilitadas (${supportedExchanges.length} com suporte implementado)...`);
    
    for (const exchange of supportedExchanges) {
      const cacheValid = isConnectionValid(exchange.id);
      console.log(`📊 ${exchange.id}: connected=${exchange.connected}, cacheValid=${cacheValid}`);
      
      // Testar se cache inválido ou não conectado
      if (!cacheValid || !exchange.connected) {
        console.log(`🔄 Testando automaticamente ${exchange.id}...`);
        await testExchangeConnection(exchange.id, false); // false = automático
        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`✅ ${exchange.id} já conectado com cache válido`);
      }
    }

    // Avisar sobre exchanges não suportadas
    const unsupportedExchanges = enabledExchanges.filter(ex => !MultiExchangeAPI.isExchangeSupported(ex.id));
    if (unsupportedExchanges.length > 0) {
      console.log(`⚠️ Exchanges com chaves mas sem implementação: ${unsupportedExchanges.map(ex => ex.id).join(', ')}`);
    }
  };

  // Função para salvar chaves no banco de dados de forma criptografada
  const saveKeysToDatabase = async (keys) => {
    try {
      const response = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          keys: keys,
          encrypt: true // Flag para criptografar no backend
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar no banco de dados');
      }

      console.log('🔐 Chaves salvas no banco de dados de forma criptografada');
    } catch (error) {
      console.error('Erro ao salvar no banco:', error);
      // Não mostrar erro para o usuário, pois o localStorage ainda funciona
    }
  };

  // Função para carregar chaves do banco de dados
  const loadKeysFromDatabase = async () => {
    try {
      const response = await fetch(`/api/user-api-keys?userId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.keys) {
          console.log('🔐 Chaves carregadas do banco de dados');
          return data.keys;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar do banco:', error);
    }
    return null;
  };

  const testExchangeConnection = async (exchangeId, isManual = true) => {
    // Se já está testando esta exchange, ignorar
    if (testingStatus[exchangeId]) {
      console.log(`⏸️ ${exchangeId} já está sendo testado, ignorando`);
      return;
    }
    
    // Se não é manual e o cache ainda é válido, ignorar
    if (!isManual && isConnectionValid(exchangeId)) {
      console.log(`⏸️ Cache ${exchangeId} ainda válido, ignorando teste automático`);
      return;
    }

    // Obter credenciais
    try {
      const { apiKey, secretKey } = getApiCredentials(exchangeId);
      
      setTestingStatus(prev => ({ ...prev, [exchangeId]: true }));
      
      console.log(`🔧 Testando conexão ${exchangeId}...`);
      
      // Verificar se a exchange é suportada
      if (!MultiExchangeAPI.isExchangeSupported(exchangeId)) {
        throw new Error(`A exchange ${exchangeList.find(e => e.id === exchangeId)?.name || exchangeId} não é suportada.`);
      }

      // Usar serviço unificado para todas as exchanges
      const exchangeApi = new MultiExchangeAPI(exchangeId, apiKey, secretKey, false);

      // Testar conexão
      let result = await exchangeApi.testConnection();
      
      // Se falhou e é Bybit, tentar proxy alternativo
      if (!result.success && exchangeId === 'bybit' && (result.error?.includes('IP') || result.error?.includes('network') || result.error?.includes('fetch'))) {
        console.log('🔄 Bybit falhou, tentando proxy alternativo...');
        
        try {
          const proxyResponse = await fetch('/api/proxy-bybit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiKey,
              secret: secretKey,
              action: 'testConnection',
              testnet: false
            })
          });

          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            if (proxyData.success) {
              result = proxyData;
              console.log(`✅ Bybit conectado via proxy: ${proxyData.proxyUsed}`);
              if (isManual) {
                toast.success(`✅ Bybit conectado via proxy ${proxyData.proxyUsed}!`);
              }
            }
          }
        } catch (proxyError) {
          console.log('❌ Proxy alternativo também falhou:', proxyError.message);
        }
      }
      
      if (result.success) {
        // Buscar informações da conta
        const accountData = await exchangeApi.getAccountInfo();
        const balances = await exchangeApi.getBalances();
        
        const accountInfo = {
          accountType: accountData.accountType || 'SPOT',
          canTrade: accountData.canTrade !== undefined ? accountData.canTrade : true,
          canWithdraw: accountData.canWithdraw !== undefined ? accountData.canWithdraw : true,
          canDeposit: accountData.canDeposit !== undefined ? accountData.canDeposit : true,
          permissions: accountData.permissions || [],
          totalAssets: balances.length,
          totalBalanceUSD: balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0),
          mainAssets: balances.slice(0, 5).map(b => ({
            asset: b.asset,
            total: parseFloat(b.total),
            usdValue: b.usdValue
          })),
          lastUpdate: new Date().toISOString(),
          exchangeId
        };

        const connectionResult = {
          success: true,
          accountInfo,
          error: null
        };

        // Salvar status de conexão no contexto global
        saveExchangeConnectionStatus(exchangeId, connectionResult, accountInfo);

        if (isManual) {
          toast.success(`✅ ${exchangeApi.getExchangeName()} conectada com sucesso!`);
        }

      } else {
        throw new Error(result.error || 'Falha na conexão');
      }

    } catch (error) {
      console.error(`❌ Erro na conexão ${exchangeId}:`, error);
      
      const connectionResult = {
        success: false,
        accountInfo: null,
        error: error.message
      };

      // Salvar status de erro no contexto global
      saveExchangeConnectionStatus(exchangeId, connectionResult);
      
      if (isManual) {
        toast.error(`Erro ${exchangeId}: ${error.message}`);
      }
    } finally {
      setTestingStatus(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const saveConfiguration = (name, isAuto = false) => {
    const config = {
      id: Date.now(),
      name: name || `Config ${new Date().toLocaleDateString()}`,
      apiKey: apiConfig.apiKey,
      secret: apiConfig.secret,
      useTestnet: apiConfig.useTestnet,
      useProxy: apiConfig.useProxy,
      isConnected: false, // Removido localConnectionStatus
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
      selectedExchange: 'binance',
      apiKey: config.apiKey,
      secret: config.secret,
      useTestnet: config.useTestnet,
      useProxy: config.useProxy
    });
    
    // Salvar no contexto global também
    saveExchangeKeys('binance', config.apiKey, config.secret);
    
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
              {!isConnectionValid() && apiKeys?.lastSaved && (
                <small> • Salvo em {new Date(apiKeys.lastSaved).toLocaleString('pt-BR')}</small>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Status da Conexão - Removido pois está usando localConnectionStatus que não existe */}

      {/* Informações da Conta - Movido para os cards individuais das exchanges */}

      {/* Status de Todas as Exchanges */}
      <div className="exchanges-overview">
        <h3>📊 Status das Exchanges</h3>
        <div className="exchanges-grid">
          {exchangeList.map(exchange => {
            const exchangeData = exchanges && typeof exchanges === 'object' ? exchanges[exchange.id] : null;
            const isConnected = exchangeData?.connected || false;
            const isTesting = testingStatus[exchange.id] || false;
            const hasKeys = exchangeData?.enabled || false;
            const isImplemented = MultiExchangeAPI.isExchangeSupported(exchange.id);
            
            return (
              <div key={exchange.id} className={`exchange-card ${isConnected ? 'connected' : hasKeys ? 'configured' : 'unconfigured'}`}>
                <div className="exchange-header">
                  <span className="exchange-icon">{exchange.icon}</span>
                  <span className="exchange-name">
                    {exchange.name}
                    {!isImplemented && <small className="not-implemented"> (Em breve)</small>}
                  </span>
                  <div className="exchange-status">
                    {isTesting && <span className="status-testing">🔄</span>}
                    {!isTesting && isConnected && <span className="status-connected">✅</span>}
                    {!isTesting && !isConnected && hasKeys && <span className="status-configured">⚙️</span>}
                    {!isTesting && !isConnected && !hasKeys && <span className="status-unconfigured">❌</span>}
                  </div>
                </div>
                
                <div className="exchange-info">
                  {isTesting && <span className="status-text">Testando...</span>}
                  {!isTesting && isConnected && <span className="status-text">Conectado</span>}
                  {!isTesting && !isConnected && hasKeys && <span className="status-text">Configurado</span>}
                  {!isTesting && !isConnected && !hasKeys && <span className="status-text">Não Configurado</span>}
                  
                  {exchangeData?.accountInfo && (
                    <div className="account-summary-mini">
                      <small>Tipo: {exchangeData.accountInfo.accountType}</small>
                      {exchangeData.accountInfo.totalBalanceUSD && (
                        <small>Saldo: ${exchangeData.accountInfo.totalBalanceUSD.toFixed(2)}</small>
                      )}
                    </div>
                  )}
                </div>

                <div className="exchange-actions">
                  {hasKeys && (
                    <button 
                      className="test-mini-button"
                      onClick={() => testExchangeConnection(exchange.id, true)}
                      disabled={isTesting}
                    >
                      {isTesting ? '🔄' : '🧪'}
                    </button>
                  )}
                  <button 
                    className="config-mini-button"
                    onClick={() => setApiConfig(prev => ({ ...prev, selectedExchange: exchange.id }))}
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuração Manual */}
      <div className="config-form">
        <h3>⚙️ Configurar {exchangeList.find(e => e.id === apiConfig.selectedExchange)?.name}</h3>
        
        {/* Seletor de Exchange */}
        <div className="form-group">
          <label>Exchange:</label>
          <div className="exchange-selector">
            {exchangeList.map(exchange => (
              <button
                key={exchange.id}
                className={`exchange-option ${apiConfig.selectedExchange === exchange.id ? 'active' : ''}`}
                onClick={() => setApiConfig(prev => ({ ...prev, selectedExchange: exchange.id }))}
              >
                <span className="exchange-icon">{exchange.icon}</span>
                <span className="exchange-name">{exchange.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Campos genéricos para qualquer exchange */}
        <div className="form-group">
          <label>{exchangeList.find(e => e.id === apiConfig.selectedExchange)?.name} API Key:</label>
          <input
            type="password"
            value={apiConfig.apiKey}
            onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder={`Sua API Key da ${exchangeList.find(e => e.id === apiConfig.selectedExchange)?.name}`}
          />
        </div>

        <div className="form-group">
          <label>{exchangeList.find(e => e.id === apiConfig.selectedExchange)?.name} Secret Key:</label>
          <input
            type="password"
            value={apiConfig.secret}
            onChange={(e) => setApiConfig(prev => ({ ...prev, secret: e.target.value }))}
            placeholder={`Sua Secret Key da ${exchangeList.find(e => e.id === apiConfig.selectedExchange)?.name}`}
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
            onClick={() => testExchangeConnection(apiConfig.selectedExchange, true)}
            disabled={testingStatus[apiConfig.selectedExchange] || !apiConfig.apiKey || !apiConfig.secret}
          >
            {testingStatus[apiConfig.selectedExchange] ? '🔄 Testando...' : '🧪 Testar Conexão'}
          </button>

          <button 
            className="save-button"
            onClick={async () => {
              if (!apiConfig.apiKey || !apiConfig.secret) {
                toast.error('Preencha API Key e Secret Key');
                return;
              }
              
              // Salvar no contexto global
              const saved = saveExchangeKeys(apiConfig.selectedExchange, apiConfig.apiKey, apiConfig.secret);
              
              if (saved) {
                // Salvar no banco de dados criptografado
                const keysToSave = {
                  [apiConfig.selectedExchange]: {
                    apiKey: apiConfig.apiKey,
                    secret: apiConfig.secret
                  }
                };
                await saveKeysToDatabase(keysToSave);
                toast.success('✅ Chaves salvas com segurança!');
                
                // Testar conexão automaticamente após salvar
                setTimeout(() => {
                  testExchangeConnection(apiConfig.selectedExchange, true);
                }, 1000);
              }
            }}
            disabled={!apiConfig.apiKey || !apiConfig.secret}
          >
            💾 Salvar
          </button>

          {hasValidKeys() && (
            <button 
              className="test-all-button"
              onClick={async () => {
                toast.info('🔄 Testando todas as exchanges...');
                await testEnabledExchanges();
              }}
              disabled={Object.values(testingStatus).some(testing => testing)}
            >
              {Object.values(testingStatus).some(testing => testing) ? '🔄 Testando...' : '🧪 Testar Todas'}
            </button>
          )}

          {hasValidKeys() && (
            <button 
              className="clear-button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todas as chaves API?')) {
                  clearApiKeys();
                  setApiConfig({
                    selectedExchange: 'binance',
                    apiKey: '',
                    secret: '',
                    useTestnet: false,
                    useProxy: true
                  });
                  setTestingStatus({});
                  toast.success('🗑️ Todas as chaves removidas');
                }
              }}
            >
              🗑️ Limpar Todas
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

        .test-button, .save-button, .test-all-button, .clear-button {
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

        .test-all-button {
          background: #17a2b8;
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

        .exchange-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .exchange-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 15px 10px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-input);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9em;
        }

        .exchange-option:hover {
          border-color: var(--accent-color);
          transform: translateY(-2px);
        }

        .exchange-option.active {
          border-color: var(--accent-color);
          background: rgba(var(--accent-color-rgb), 0.1);
          color: var(--accent-color);
        }

        .exchange-icon {
          font-size: 1.5em;
        }

        .exchange-name {
          font-weight: 600;
        }

        .exchanges-overview {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .exchanges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .exchange-card {
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 15px;
          background: var(--bg-input);
          transition: all 0.3s ease;
        }

        .exchange-card.connected {
          border-color: var(--success-color);
          background: rgba(40, 167, 69, 0.1);
        }

        .exchange-card.configured {
          border-color: var(--warning-color);
          background: rgba(255, 193, 7, 0.1);
        }

        .exchange-card.unconfigured {
          border-color: var(--border-color);
          opacity: 0.7;
        }

        .exchange-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .exchange-header .exchange-icon {
          font-size: 1.2em;
          margin-right: 8px;
        }

        .exchange-header .exchange-name {
          font-weight: 600;
          flex: 1;
        }

        .exchange-status {
          font-size: 1.2em;
        }

        .exchange-info {
          margin-bottom: 10px;
        }

        .status-text {
          font-size: 0.9em;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .account-summary-mini {
          margin-top: 5px;
        }

        .account-summary-mini small {
          display: block;
          font-size: 0.8em;
          color: var(--text-secondary);
          margin: 2px 0;
        }

        .exchange-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .test-mini-button, .config-mini-button {
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          transition: all 0.2s ease;
        }

        .test-mini-button {
          background: var(--accent-color);
          color: white;
        }

        .config-mini-button {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .test-mini-button:hover, .config-mini-button:hover {
          transform: translateY(-1px);
        }

        .test-mini-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .test-button:disabled, .save-button:disabled, .test-all-button:disabled {
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