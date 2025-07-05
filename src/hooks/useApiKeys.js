import { useState, useEffect, useContext, createContext } from 'react';

// Context para gerenciar chaves API globalmente
const ApiKeysContext = createContext();

export const ApiKeysProvider = ({ children }) => {
  const [apiKeys, setApiKeys] = useState({
    binanceApiKey: '',
    binanceSecret: '',
    isConfigured: false,
    lastSaved: null,
    connectionStatus: null, // Cache do status da conexão
    lastTested: null // Quando foi testado pela última vez
  });

  // Carregar chaves do localStorage na inicialização
  useEffect(() => {
    const loadStoredKeys = () => {
      try {
        // Tentar carregar das variáveis de ambiente primeiro
        const envApiKey = process.env.REACT_APP_BINANCE_API_KEY;
        const envSecret = process.env.REACT_APP_BINANCE_SECRET_KEY;
        
        // Carregar do localStorage
        const storedKeys = localStorage.getItem('bitacademy_api_keys');
        
        if (storedKeys) {
          const parsed = JSON.parse(storedKeys);
          console.log('📱 Chaves carregadas do localStorage');
          setApiKeys({
            ...parsed,
            isConfigured: !!(parsed.binanceApiKey && parsed.binanceSecret)
          });
        } else if (envApiKey && envSecret) {
          // Usar variáveis de ambiente como fallback
          console.log('🔧 Usando chaves das variáveis de ambiente');
          const envKeys = {
            binanceApiKey: envApiKey,
            binanceSecret: envSecret,
            isConfigured: true,
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
  }, []);

  // Salvar chaves
  const saveApiKeys = (newKeys, connectionStatus = null) => {
    try {
      const keysToSave = {
        ...apiKeys, // Preservar dados existentes
        ...newKeys,
        isConfigured: !!(newKeys.binanceApiKey && newKeys.binanceSecret),
        lastSaved: new Date().toISOString(),
        connectionStatus, // Salvar status da conexão se fornecido
        lastTested: connectionStatus ? new Date().toISOString() : apiKeys.lastTested
      };
      
      setApiKeys(keysToSave);
      localStorage.setItem('bitacademy_api_keys', JSON.stringify(keysToSave));
      console.log('💾 Chaves API salvas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar chaves API:', error);
      return false;
    }
  };

  // Limpar chaves
  const clearApiKeys = () => {
    try {
      setApiKeys({
        binanceApiKey: '',
        binanceSecret: '',
        isConfigured: false,
        lastSaved: null
      });
      localStorage.removeItem('bitacademy_api_keys');
      console.log('🗑️ Chaves API removidas');
      return true;
    } catch (error) {
      console.error('Erro ao limpar chaves API:', error);
      return false;
    }
  };

  // Verificar se as chaves estão configuradas
  const hasValidKeys = () => {
    return !!(apiKeys.binanceApiKey && apiKeys.binanceSecret && apiKeys.isConfigured);
  };

  // Obter chaves para uso na API
  const getApiCredentials = () => {
    if (!hasValidKeys()) {
      throw new Error('Chaves API não configuradas. Configure primeiro em "Configuração API".');
    }
    
    return {
      apiKey: apiKeys.binanceApiKey,
      secretKey: apiKeys.binanceSecret
    };
  };

  // Verificar se a conexão ainda é válida (cache de 30 minutos)
  const isConnectionValid = () => {
    if (!apiKeys.connectionStatus || !apiKeys.lastTested) return false;
    
    const lastTestTime = new Date(apiKeys.lastTested).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    return (now - lastTestTime) < thirtyMinutes && apiKeys.connectionStatus.success;
  };

  // Salvar status de conexão
  const saveConnectionStatus = (status) => {
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
    saveApiKeys,
    clearApiKeys,
    hasValidKeys,
    getApiCredentials,
    isConfigured: apiKeys.isConfigured,
    connectionStatus: apiKeys.connectionStatus,
    isConnectionValid,
    saveConnectionStatus,
    invalidateConnection
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