// Utilitário para formatação inteligente de números baseada na moeda

export const formatPrice = (value, symbol = '') => {
  if (!value || isNaN(value)) return '0.00';
  
  const numValue = parseFloat(value);
  const cleanSymbol = symbol.replace(/^[A-Z]+:/, '').toUpperCase(); // Remove exchange prefix
  
  // Moedas com alta precisão (muitas casas decimais)
  if (cleanSymbol.includes('SHIB') || cleanSymbol.includes('PEPE') || 
      cleanSymbol.includes('FLOKI') || cleanSymbol.includes('DOGE')) {
    // Para moedas de valor muito baixo, mostrar até 8 casas decimais significativas
    if (numValue < 0.001) return numValue.toFixed(8);
    if (numValue < 0.1) return numValue.toFixed(6);
    return numValue.toFixed(4);
  }
  
  // Moedas de baixo valor (entre $0.01 e $10)
  if (cleanSymbol.includes('XRP') || cleanSymbol.includes('ADA') || 
      cleanSymbol.includes('MATIC') || cleanSymbol.includes('DOT') ||
      cleanSymbol.includes('CARDANO') || cleanSymbol.includes('POLYGON')) {
    if (numValue < 0.01) return numValue.toFixed(6);
    if (numValue < 1) return numValue.toFixed(4);
    if (numValue < 10) return numValue.toFixed(3);
    return numValue.toFixed(2);
  }
  
  // Bitcoin e moedas de alto valor (acima de $100)
  if (cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH') ||
      cleanSymbol.includes('BITCOIN') || cleanSymbol.includes('ETHEREUM')) {
    if (numValue > 10000) return numValue.toFixed(0);
    if (numValue > 1000) return numValue.toFixed(1);
    return numValue.toFixed(2);
  }
  
  // Moedas de valor médio ($1 - $100)
  if (numValue < 0.01) return numValue.toFixed(6);
  if (numValue < 0.1) return numValue.toFixed(4);
  if (numValue < 1) return numValue.toFixed(3);
  if (numValue < 100) return numValue.toFixed(2);
  if (numValue < 10000) return numValue.toFixed(1);
  
  // Valores muito altos
  return numValue.toFixed(0);
};

export const formatCurrency = (value, currency = 'USD') => {
  if (!value || isNaN(value)) return '$0.00';
  
  const numValue = parseFloat(value);
  
  if (currency === 'BRL' || currency === 'R$') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }
  
  // Para USD e outras moedas
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export const formatPercentage = (value, decimals = 2) => {
  if (!value || isNaN(value)) return '0.00%';
  
  const numValue = parseFloat(value);
  return `${numValue.toFixed(decimals)}%`;
};

export const formatQuantity = (value, decimals = 4) => {
  if (!value || isNaN(value)) return '0.0000';
  
  const numValue = parseFloat(value);
  
  // Para quantidades muito pequenas
  if (numValue < 0.0001) return numValue.toFixed(8);
  if (numValue < 0.001) return numValue.toFixed(6);
  if (numValue < 0.01) return numValue.toFixed(5);
  if (numValue < 1) return numValue.toFixed(4);
  if (numValue < 100) return numValue.toFixed(3);
  if (numValue < 10000) return numValue.toFixed(2);
  
  return numValue.toFixed(1);
};

// Função para obter o número de casas decimais baseado na moeda
export const getDecimalPlaces = (symbol = '') => {
  const cleanSymbol = symbol.replace(/^[A-Z]+:/, '').toUpperCase();
  
  if (cleanSymbol.includes('SHIB') || cleanSymbol.includes('PEPE') || 
      cleanSymbol.includes('FLOKI') || cleanSymbol.includes('DOGE')) {
    return 8;
  }
  
  if (cleanSymbol.includes('XRP') || cleanSymbol.includes('ADA') || 
      cleanSymbol.includes('MATIC') || cleanSymbol.includes('DOT')) {
    return 4;
  }
  
  if (cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH')) {
    return 2;
  }
  
  return 3;
};