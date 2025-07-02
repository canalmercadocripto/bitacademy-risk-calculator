import { useState, useEffect, useCallback } from 'react';
import { exchangeApi } from '../services/api';
import toast from 'react-hot-toast';

export const useExchangeData = () => {
  const [exchanges, setExchanges] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState({
    exchanges: false,
    symbols: false,
    price: false
  });

  // Carregar exchanges disponíveis
  const loadExchanges = useCallback(async () => {
    setLoading(prev => ({ ...prev, exchanges: true }));
    try {
      const response = await exchangeApi.getExchanges();
      setExchanges(response.data);
    } catch (error) {
      toast.error('Erro ao carregar exchanges');
      console.error('Erro ao carregar exchanges:', error);
    } finally {
      setLoading(prev => ({ ...prev, exchanges: false }));
    }
  }, []);

  // Carregar símbolos de uma exchange
  const loadSymbols = useCallback(async (exchange, search = '') => {
    if (!exchange) {
      setSymbols([]);
      return;
    }

    setLoading(prev => ({ ...prev, symbols: true }));
    try {
      // Carregar todos os símbolos disponíveis
      const response = await exchangeApi.getSymbols(exchange, search, 1000);
      setSymbols(response.data);
    } catch (error) {
      toast.error(`Erro ao carregar símbolos da ${exchange}`);
      console.error('Erro ao carregar símbolos:', error);
      setSymbols([]);
    } finally {
      setLoading(prev => ({ ...prev, symbols: false }));
    }
  }, []);

  // Buscar preço atual
  const fetchCurrentPrice = useCallback(async (exchange, symbol) => {
    console.log('🔍 fetchCurrentPrice chamado:', { exchange, symbol });
    
    if (!exchange || !symbol) {
      console.log('❌ Exchange ou symbol não fornecido');
      setCurrentPrice(null);
      return;
    }

    setLoading(prev => ({ ...prev, price: true }));
    try {
      console.log('📡 Buscando preço via API...', { exchange, symbol });
      const response = await exchangeApi.getCurrentPrice(exchange, symbol);
      console.log('✅ Resposta da API de preço:', response);
      
      const price = response.data?.price;
      console.log('💰 Preço extraído:', price);
      
      setCurrentPrice(price);
      return price;
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar preço:', error);
      toast.error(`Erro ao buscar preço de ${symbol}`);
      setCurrentPrice(null);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, price: false }));
    }
  }, []);

  // Filtrar símbolos localmente
  const filterSymbols = useCallback((searchTerm) => {
    if (!searchTerm) return symbols;
    
    const term = searchTerm.toUpperCase();
    return symbols.filter(symbol => 
      symbol.symbol.includes(term) || 
      symbol.baseAsset.includes(term)
    );
  }, [symbols]);

  // Carregar exchanges no início
  useEffect(() => {
    loadExchanges();
  }, [loadExchanges]);

  return {
    exchanges,
    symbols,
    currentPrice,
    loading,
    loadSymbols,
    fetchCurrentPrice,
    filterSymbols,
    refreshExchanges: loadExchanges
  };
};