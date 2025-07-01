import { useEffect, useRef } from 'react';

export const usePriceUpdater = (exchange, symbol, onPriceUpdate, enabled = true) => {
  const intervalRef = useRef(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!enabled || !exchange || !symbol) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fetchPrice = async () => {
      // Evitar múltiplas chamadas simultâneas
      const now = Date.now();
      if (now - lastFetchRef.current < 4000) {
        return;
      }
      lastFetchRef.current = now;

      try {
        const response = await fetch(`/api/exchanges/${exchange.id}/price/${symbol.symbol}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            onPriceUpdate(data.data.price);
          }
        }
      } catch (error) {
        console.log('Erro na atualização automática de preço:', error.message);
        // Não mostrar toast para não incomodar o usuário
      }
    };

    // Primeira busca imediata
    fetchPrice();

    // Configurar intervalo de 5 segundos
    intervalRef.current = setInterval(fetchPrice, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [exchange?.id, symbol?.symbol, enabled, onPriceUpdate]);

  const stopUpdating = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startUpdating = () => {
    if (!intervalRef.current && enabled && exchange && symbol) {
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/exchanges/${exchange.id}/price/${symbol.symbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              onPriceUpdate(data.data.price);
            }
          }
        } catch (error) {
          console.log('Erro na atualização automática:', error.message);
        }
      }, 5000);
    }
  };

  return { stopUpdating, startUpdating };
};