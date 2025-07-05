import { useState, useEffect, useContext, createContext } from 'react';

// Context para gerenciar chaves API globalmente
const ApiKeysContext = createContext();

export const ApiKeysProvider = ({ children }) => {
  const [apiKeys, setApiKeys] = useState({
    exchanges: {
      binance: {
        apiKey: '',
        secret: '',
        connected: false,
        connectionStatus: null,
        lastTested: null,
        accountInfo: null,
        enabled: false
      },
      bingx: {
        apiKey: '',
        secret: '',
        connected: false,
        connectionStatus: null,
        lastTested: null,
        accountInfo: null,
        enabled: false
      },
      bybit: {
        apiKey: '',
        secret: '',
        connected: false,
        connectionStatus: null,
        lastTested: null,
        accountInfo: null,
        enabled: false
      },
      bitget: {
        apiKey: '',
        secret: '',
        connected: false,
        connectionStatus: null,
        lastTested: null,
        accountInfo: null,
        enabled: false
      }
    },
    lastSaved: null
  });

  // Carregar chaves do localStorage na inicialização (apenas uma vez)
  useEffect(() => {
    let hasLoaded = false;
    
    const loadStoredKeys = () => {
      if (hasLoaded) return; // Prevenir carregamentos múltiplos
      hasLoaded = true;
      
      console.log('🔑 Inicializando useApiKeys...');
      
      try {
        // Tentar carregar das variáveis de ambiente primeiro
        const envApiKey = process.env.REACT_APP_BINANCE_API_KEY;
        const envSecret = process.env.REACT_APP_BINANCE_SECRET_KEY;
        
        // Carregar do localStorage
        const storedKeys = localStorage.getItem('bitacademy_api_keys');
        
        if (storedKeys) {
          const parsed = JSON.parse(storedKeys);
          console.log('📱 Chaves carregadas do localStorage');
          
          // Verificar se tem estrutura nova ou antiga
          if (parsed.exchanges) {
            // Estrutura nova
            setApiKeys(parsed);
          } else {
            // Migrar estrutura antiga para nova
            console.log('🔄 Migrando estrutura antiga...');
            const migratedKeys = {
              exchanges: {
                binance: {
                  apiKey: parsed.binanceApiKey || '',
                  secret: parsed.binanceSecret || '',
                  connected: false,
                  connectionStatus: null,
                  lastTested: null,
                  accountInfo: null,
                  enabled: !!(parsed.binanceApiKey && parsed.binanceSecret)
                },
                bingx: {
                  apiKey: '',
                  secret: '',
                  connected: false,
                  connectionStatus: null,
                  lastTested: null,
                  accountInfo: null,
                  enabled: false
                },
                bybit: {
                  apiKey: '',
                  secret: '',
                  connected: false,
                  connectionStatus: null,
                  lastTested: null,
                  accountInfo: null,
                  enabled: false
                },
                bitget: {
                  apiKey: '',
                  secret: '',
                  connected: false,
                  connectionStatus: null,
                  lastTested: null,
                  accountInfo: null,
                  enabled: false
                }
              },
              lastSaved: parsed.lastSaved || new Date().toISOString()
            };
            setApiKeys(migratedKeys);
            // Salvar estrutura migrada
            localStorage.setItem('bitacademy_api_keys', JSON.stringify(migratedKeys));
          }
        } else if (envApiKey && envSecret) {
          // Usar variáveis de ambiente como fallback
          console.log('🔧 Usando chaves das variáveis de ambiente');
          const envKeys = {
            exchanges: {
              binance: {
                apiKey: envApiKey,
                secret: envSecret,
                connected: false,
                connectionStatus: null,
                lastTested: null,
                accountInfo: null,
                enabled: true
              },
              bingx: {
                apiKey: '',
                secret: '',
                connected: false,
                connectionStatus: null,
                lastTested: null,
                accountInfo: null,
                enabled: false
              },
              bybit: {
                apiKey: '',
                secret: '',
                connected: false,
                connectionStatus: null,
                lastTested: null,
                accountInfo: null,
                enabled: false
              },
              bitget: {
                apiKey: '',
                secret: '',
                connected: false,
                connectionStatus: null,
                lastTested: null,
                accountInfo: null,
                enabled: false
              }
            },
            lastSaved: new Date().toISOString(),
            source: 'environment'
          };
          setApiKeys(envKeys);
          // Salvar no localStorage para persistência
          localStorage.setItem('bitacademy_api_keys', JSON.stringify(envKeys));
        }
      } catch (error) {
        console.error('Erro ao carregar chaves API:', error);
      }
    };

    loadStoredKeys();
    console.log('🔑 useApiKeys inicializado com:', apiKeys);
  }, []); // Executar apenas uma vez na inicialização

  // Salvar chaves para uma exchange específica
  const saveExchangeKeys = (exchangeId, apiKey, secret) => {
    try {
      // Garantir que apiKeys.exchanges existe
      if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
        console.error('Estado de apiKeys não inicializado corretamente');
        return false;
      }
      
      const updatedKeys = {
        ...apiKeys,
        exchanges: {
          ...apiKeys.exchanges,
          [exchangeId]: {
            ...apiKeys.exchanges[exchangeId],
            apiKey,
            secret,
            enabled: !!(apiKey && secret)
          }
        },
        lastSaved: new Date().toISOString()
      };
      
      setApiKeys(updatedKeys);
      localStorage.setItem('bitacademy_api_keys', JSON.stringify(updatedKeys));
      console.log(`💾 Chaves ${exchangeId} salvas com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar chaves API:', error);
      return false;
    }
  };

  // Salvar status de conexão para uma exchange
  const saveExchangeConnectionStatus = (exchangeId, status, accountInfo = null) => {
    try {
      // Garantir que apiKeys.exchanges existe
      if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
        console.error('Estado de apiKeys não inicializado corretamente');
        return false;
      }
      
      const updatedKeys = {
        ...apiKeys,
        exchanges: {
          ...apiKeys.exchanges,
          [exchangeId]: {
            ...apiKeys.exchanges[exchangeId],
            connected: status.success,
            connectionStatus: status,
            lastTested: new Date().toISOString(),
            accountInfo
          }
        }
      };
      
      setApiKeys(updatedKeys);
      localStorage.setItem('bitacademy_api_keys', JSON.stringify(updatedKeys));
      console.log(`🔗 Status ${exchangeId}:`, status.success ? 'Conectado' : 'Falhou');
      return true;
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      return false;
    }
  };

  // Limpar chaves
  const clearApiKeys = () => {
    try {
      const clearedKeys = {
        exchanges: {
          binance: {
            apiKey: '',
            secret: '',
            connected: false,
            connectionStatus: null,
            lastTested: null,
            accountInfo: null,
            enabled: false
          },
          bingx: {
            apiKey: '',
            secret: '',
            connected: false,
            connectionStatus: null,
            lastTested: null,
            accountInfo: null,
            enabled: false
          },
          bybit: {
            apiKey: '',
            secret: '',
            connected: false,
            connectionStatus: null,
            lastTested: null,
            accountInfo: null,
            enabled: false
          },
          bitget: {
            apiKey: '',
            secret: '',
            connected: false,
            connectionStatus: null,
            lastTested: null,
            accountInfo: null,
            enabled: false
          }
        },
        lastSaved: null
      };
      
      setApiKeys(clearedKeys);
      localStorage.removeItem('bitacademy_api_keys');
      console.log('🗑️ Chaves API removidas');
      return true;
    } catch (error) {
      console.error('Erro ao limpar chaves API:', error);
      return false;
    }
  };

  // Verificar se uma exchange tem chaves válidas
  const hasValidKeys = (exchangeId = null) => {
    // Verificar se apiKeys.exchanges existe
    if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
      return false;
    }

    if (exchangeId) {
      const exchange = apiKeys.exchanges[exchangeId];
      return !!(exchange && exchange.apiKey && exchange.secret && exchange.enabled);
    }
    
    // Se não especificar exchange, verificar se alguma tem chaves válidas
    return Object.values(apiKeys.exchanges).some(exchange => 
      exchange && exchange.apiKey && exchange.secret && exchange.enabled
    );
  };

  // Obter chaves para uma exchange específica
  const getApiCredentials = (exchangeId) => {
    if (!exchangeId) {
      throw new Error('Exchange ID é obrigatório');
    }
    
    if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
      throw new Error('Sistema de chaves não inicializado. Recarregue a página.');
    }
    
    const exchange = apiKeys.exchanges[exchangeId];
    if (!exchange || !exchange.apiKey || !exchange.secret) {
      throw new Error(`Chaves ${exchangeId} não configuradas. Configure primeiro em "Configuração API".`);
    }
    
    return {
      apiKey: exchange.apiKey,
      secretKey: exchange.secret
    };
  };

  // Verificar se a conexão de uma exchange ainda é válida (cache de 30 minutos)
  const isConnectionValid = (exchangeId) => {
    if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
      return false;
    }
    
    const exchange = apiKeys.exchanges[exchangeId];
    if (!exchange || !exchange.connectionStatus || !exchange.lastTested) return false;
    
    const lastTestTime = new Date(exchange.lastTested).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    return (now - lastTestTime) < thirtyMinutes && exchange.connectionStatus.success;
  };

  // Obter exchanges conectadas
  const getConnectedExchanges = () => {
    if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
      return [];
    }
    
    return Object.entries(apiKeys.exchanges)
      .filter(([id, exchange]) => exchange && exchange.connected && exchange.enabled)
      .map(([id, exchange]) => ({ id, ...exchange }));
  };

  // Obter exchanges habilitadas (com chaves configuradas)
  const getEnabledExchanges = () => {
    if (!apiKeys || !apiKeys.exchanges || typeof apiKeys.exchanges !== 'object') {
      return [];
    }
    
    return Object.entries(apiKeys.exchanges)
      .filter(([id, exchange]) => exchange && exchange.enabled)
      .map(([id, exchange]) => ({ id, ...exchange }));
  };

  // Salvar status de conexão (apenas se diferente do atual)
  const saveConnectionStatus = (status) => {
    // Verificar se o status realmente mudou para evitar updates desnecessários
    const currentStatus = apiKeys.connectionStatus;
    if (currentStatus && 
        currentStatus.success === status.success && 
        currentStatus.error === status.error) {
      console.log('🔗 Status de conexão inalterado, ignorando update');
      return;
    }
    
    const updatedKeys = {
      ...apiKeys,
      connectionStatus: status,
      lastTested: new Date().toISOString()
    };
    
    setApiKeys(updatedKeys);
    localStorage.setItem('bitacademy_api_keys', JSON.stringify(updatedKeys));
    console.log('🔗 Status de conexão salvo:', status.success ? 'Conectado' : 'Falhou');
  };

  // Invalidar cache de conexão (forçar novo teste)
  const invalidateConnection = () => {
    const updatedKeys = {
      ...apiKeys,
      connectionStatus: null,
      lastTested: null
    };
    
    setApiKeys(updatedKeys);
    localStorage.setItem('bitacademy_api_keys', JSON.stringify(updatedKeys));
    console.log('🔄 Cache de conexão invalidado');
  };

  const value = {
    apiKeys,
    saveExchangeKeys,
    saveExchangeConnectionStatus,
    clearApiKeys,
    hasValidKeys,
    getApiCredentials,
    isConnectionValid,
    getConnectedExchanges,
    getEnabledExchanges,
    exchanges: apiKeys?.exchanges || {}
  };

  return (
    <ApiKeysContext.Provider value={value}>
      {children}
    </ApiKeysContext.Provider>
  );
};

// Hook para usar as chaves API
export const useApiKeys = () => {
  const context = useContext(ApiKeysContext);
  if (!context) {
    throw new Error('useApiKeys deve ser usado dentro de ApiKeysProvider');
  }
  return context;
};

export default useApiKeys;