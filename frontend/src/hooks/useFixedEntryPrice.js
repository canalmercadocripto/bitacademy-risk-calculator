import { useState, useEffect } from 'react';

export const useFixedEntryPrice = (formData, results) => {
  const [fixedEntryPrice, setFixedEntryPrice] = useState(null);

  // Fixar preço de entrada quando o cálculo é feito
  useEffect(() => {
    if (results && formData && formData.entryPrice && !fixedEntryPrice) {
      const entryPrice = parseFloat(formData.entryPrice);
      if (!isNaN(entryPrice)) {
        setFixedEntryPrice(entryPrice);
      }
    }
  }, [results, formData, fixedEntryPrice]);

  // Reset quando não há resultados
  useEffect(() => {
    if (!results) {
      setFixedEntryPrice(null);
    }
  }, [results]);

  const resetFixedPrice = () => {
    setFixedEntryPrice(null);
  };

  const updateFixedPrice = (newPrice) => {
    setFixedEntryPrice(parseFloat(newPrice));
  };

  return {
    fixedEntryPrice,
    resetFixedPrice,
    updateFixedPrice
  };
};