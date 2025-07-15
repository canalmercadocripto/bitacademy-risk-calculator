import { useState, useEffect } from 'react';

export const useCalculationHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem('calculationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  const addCalculation = (calculation, symbol, exchange) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      symbol: symbol?.symbol || 'N/A',
      exchange: exchange?.name || 'N/A',
      calculation,
      formData: {
        entryPrice: calculation.entryPrice,
        stopLoss: calculation.stopLoss,
        targetPrice: calculation.targetPrice,
        accountSize: calculation.accountSize,
        riskPercent: calculation.riskPercent,
        direction: calculation.direction
      }
    };

    const updatedHistory = [newEntry, ...history].slice(0, 100); // Manter apenas os últimos 100
    setHistory(updatedHistory);
    
    try {
      localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calculationHistory');
  };

  const removeCalculation = (id) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
  };

  const exportToCSV = () => {
    if (history.length === 0) return null;

    const headers = [
      'Data/Hora',
      'Exchange',
      'Symbol',
      'Direção',
      'Entrada',
      'Stop Loss',
      'Target',
      'Conta (USD)',
      'Risco %',
      'Posição (Qtd)',
      'Posição (USD)',
      'Lucro/Prejuízo',
      'R/R Ratio',
      'Avaliação'
    ];

    const csvData = history.map(entry => [
      new Date(entry.timestamp).toLocaleString('pt-BR'),
      entry.exchange,
      entry.symbol,
      entry.calculation.position.direction,
      entry.formData.entryPrice,
      entry.formData.stopLoss,
      entry.formData.targetPrice,
      entry.formData.accountSize,
      entry.formData.riskPercent,
      entry.calculation.position.size.toFixed(6),
      entry.calculation.position.value.toFixed(2),
      entry.calculation.profit.amount.toFixed(2),
      entry.calculation.analysis.riskRewardRatio.toFixed(2),
      entry.calculation.analysis.riskLevel
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csv;
  };

  return {
    history,
    addCalculation,
    clearHistory,
    removeCalculation,
    exportToCSV
  };
};