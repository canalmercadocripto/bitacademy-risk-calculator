import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useExchangeData } from '../hooks/useExchangeData';
import { useCalculationHistory } from '../hooks/useCalculationHistory';
import { usePriceUpdater } from '../hooks/usePriceUpdater';
import { calculatorApi } from '../services/api';
import { tradeApi } from '../services/authApi';
import Header from './Header';
import Instructions from './Instructions';
import CalculatorForm from './CalculatorForm';
import EnhancedResults from './EnhancedResults';
import ExchangeSelector from './ExchangeSelector';
import AuthModal from './AuthModal';
import './RiskCalculator.css';

const RiskCalculator = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();

  // Se ainda está carregando autenticação, mostrar loading
  if (authLoading) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '3rem' }}>⏳</div>
          <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login será feito no App.js
  const {
    exchanges,
    symbols,
    currentPrice,
    loading,
    loadSymbols,
    fetchCurrentPrice,
    filterSymbols
  } = useExchangeData();
  
  const {
    history,
    addCalculation,
    clearHistory,
    removeCalculation,
    exportToCSV
  } = useCalculationHistory();

  const [selectedExchange, setSelectedExchange] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [formData, setFormData] = useState({
    entryPrice: '',
    stopLoss: '',
    targetPrice: '',
    accountSize: '',
    riskPercent: '2',
    direction: 'LONG'
  });
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [priceUpdateEnabled, setPriceUpdateEnabled] = useState(true);
  const [liveCurrentPrice, setLiveCurrentPrice] = useState(currentPrice);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  
  // States dos modais
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Callback para atualização de preço - MANTÉM cotação atual, MAS NÃO altera entrada
  const handlePriceUpdate = useCallback((newPrice) => {
    // Atualizar APENAS o currentPrice para exibição e monitoramento
    // NÃO tocar no campo entryPrice (entrada manual)
    console.log('💡 Cotação atual atualizada para:', newPrice, '(Entrada permanece manual)');
    
    // Atualizar o preço atual para exibição
    setLiveCurrentPrice(newPrice);
  }, []);

  // Hook para auto-atualização de preços - apenas para monitoramento
  usePriceUpdater(selectedExchange, selectedSymbol, handlePriceUpdate, priceUpdateEnabled);

  // Atualizar símbolos quando exchange muda
  useEffect(() => {
    if (selectedExchange) {
      loadSymbols(selectedExchange.id);
      setSelectedSymbol(null);
      setFormData(prev => ({ ...prev, entryPrice: '' }));
    }
  }, [selectedExchange, loadSymbols]);

  // Buscar preço quando símbolo muda - ATUALIZAR cotação atual, NÃO entrada
  useEffect(() => {
    if (selectedExchange && selectedSymbol) {
      const exchangeId = selectedExchange?.id || selectedExchange;
      const symbolSymbol = selectedSymbol?.symbol || selectedSymbol;
      
      fetchCurrentPrice(exchangeId, symbolSymbol).then(price => {
        if (price) {
          // Converter para número e atualizar o preço atual para exibição (NÃO o entryPrice)
          const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
          setLiveCurrentPrice(numericPrice);
        }
      }).catch(error => {
        console.error('Erro ao buscar preço:', error);
      });
    }
  }, [selectedExchange, selectedSymbol, fetchCurrentPrice]);

  // Sincronizar liveCurrentPrice com currentPrice do hook
  useEffect(() => {
    if (currentPrice) {
      setLiveCurrentPrice(currentPrice);
    }
  }, [currentPrice]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Marcar campo como "tocado" para mostrar validação
    setFieldTouched(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Validação em tempo real
    validateField(field, value);
  };

  const handleDirectionChange = (direction) => {
    setFormData(prev => ({
      ...prev,
      direction
    }));
    
    // Revalidar preços quando direção muda
    if (formData.entryPrice && formData.stopLoss && formData.targetPrice) {
      setTimeout(() => {
        validateField('entryPrice', formData.entryPrice);
        validateField('stopLoss', formData.stopLoss);
        validateField('targetPrice', formData.targetPrice);
      }, 0);
    }
  };

  const handleCalculate = async () => {
    if (!validateForm()) return;

    setCalculating(true);
    try {
      const params = {
        exchange: selectedExchange?.id || selectedExchange || 'manual',
        symbol: selectedSymbol?.symbol || selectedSymbol || 'MANUAL/USDT',
        direction: formData.direction,
        entryPrice: parseFloat(formData.entryPrice),
        stopLoss: parseFloat(formData.stopLoss),
        targetPrice: parseFloat(formData.targetPrice),
        accountSize: parseFloat(formData.accountSize),
        riskPercent: parseFloat(formData.riskPercent),
        currentPrice: liveCurrentPrice || parseFloat(formData.entryPrice)
      };

      const response = await calculatorApi.calculateRisk(params);
      setResults(response.data);
      
      // Adicionar ao histórico local
      addCalculation(response.data, selectedSymbol, selectedExchange);
      
      // Se usuário logado, salvar no backend também
      if (isAuthenticated && token) {
        try {
          const calculatedData = response.data;
          
          const tradeData = {
            exchange: selectedExchange?.name || 'Manual',
            symbol: selectedSymbol?.symbol || 'CUSTOM',
            accountSize: parseFloat(calculatedData.accountSize),
            riskPercentage: parseFloat(calculatedData.riskPercent),
            entryPrice: parseFloat(calculatedData.entryPrice),
            stopLoss: parseFloat(calculatedData.stopLoss),
            takeProfit: parseFloat(calculatedData.targetPrice),
            positionSize: parseFloat(calculatedData.positionSize),
            riskAmount: parseFloat(calculatedData.riskAmount),
            rewardAmount: parseFloat(calculatedData.rewardAmount),
            riskRewardRatio: parseFloat(calculatedData.riskRewardRatio),
            currentPrice: parseFloat(calculatedData.currentPrice || calculatedData.entryPrice),
            tradeType: calculatedData.direction?.toLowerCase() || 'long',
            notes: `R/R: ${calculatedData.riskRewardRatio.toFixed(2)}:1 - Calculado automaticamente em ${new Date().toLocaleString('pt-BR')}`
          };
          
          await tradeApi.saveCalculation(tradeData, token);
          toast.success('Cálculo salvo no seu histórico!');
        } catch (error) {
          console.error('Erro ao salvar no backend:', error);
          toast.success('Cálculo realizado! (Erro ao salvar no histórico)');
        }
      } else {
        toast.success('Cálculo realizado com sucesso!');
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao calcular');
      console.error('Erro no cálculo:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Validação em tempo real
  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'entryPrice':
        if (!value || value.trim() === '') {
          errors.entryPrice = 'Preço de entrada é obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.entryPrice = 'Preço deve ser um número positivo';
        } else {
          delete errors.entryPrice;
          // Validar lógica com outros campos se disponíveis
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'stopLoss':
        if (!value || value.trim() === '') {
          errors.stopLoss = 'Stop Loss é obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.stopLoss = 'Stop Loss deve ser um número positivo';
        } else {
          delete errors.stopLoss;
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'targetPrice':
        if (!value || value.trim() === '') {
          errors.targetPrice = 'Target é obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.targetPrice = 'Target deve ser um número positivo';
        } else {
          delete errors.targetPrice;
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'accountSize':
        if (!value || value.trim() === '') {
          errors.accountSize = 'Tamanho da conta é obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.accountSize = 'Tamanho da conta deve ser positivo';
        } else if (parseFloat(value) < 100) {
          errors.accountSize = 'Valor mínimo recomendado: $100';
        } else {
          delete errors.accountSize;
        }
        break;
        
      case 'riskPercent':
        if (!value || value.trim() === '') {
          errors.riskPercent = 'Porcentagem de risco é obrigatória';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.riskPercent = 'Risco deve ser um número positivo';
        } else if (parseFloat(value) > 10) {
          errors.riskPercent = 'Cuidado! Risco muito alto (máx. 10%)';
        } else {
          delete errors.riskPercent;
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  const validatePriceLogic = (changedField, changedValue, errors) => {
    const entryPrice = changedField === 'entryPrice' ? changedValue : parseFloat(formData.entryPrice);
    const stopLoss = changedField === 'stopLoss' ? changedValue : parseFloat(formData.stopLoss);
    const targetPrice = changedField === 'targetPrice' ? changedValue : parseFloat(formData.targetPrice);
    
    if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(targetPrice)) return;
    
    if (formData.direction === 'LONG') {
      if (stopLoss >= entryPrice) {
        errors.stopLoss = 'Para LONG: Stop Loss deve ser menor que entrada';
      }
      if (targetPrice <= entryPrice) {
        errors.targetPrice = 'Para LONG: Target deve ser maior que entrada';
      }
    } else {
      if (stopLoss <= entryPrice) {
        errors.stopLoss = 'Para SHORT: Stop Loss deve ser maior que entrada';
      }
      if (targetPrice >= entryPrice) {
        errors.targetPrice = 'Para SHORT: Target deve ser menor que entrada';
      }
    }
  };

  // Handlers dos modais
  const handleShowAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const validateForm = () => {
    // Validar seleção de exchange
    if (!selectedExchange) {
      toast.error('Por favor, selecione uma exchange antes de calcular');
      return false;
    }
    
    // Validar seleção de par/símbolo
    if (!selectedSymbol) {
      toast.error('Por favor, selecione um par de moedas antes de calcular');
      return false;
    }
    
    const requiredFields = ['entryPrice', 'stopLoss', 'targetPrice', 'accountSize', 'riskPercent'];
    
    for (const field of requiredFields) {
      const rawValue = formData[field];
      if (!rawValue || rawValue.trim() === '') {
        toast.error(`Por favor, preencha corretamente: ${getFieldLabel(field)}`);
        return false;
      }
      
      const value = parseFloat(rawValue);
      if (isNaN(value) || value <= 0) {
        toast.error(`Por favor, preencha corretamente: ${getFieldLabel(field)}`);
        return false;
      }
    }

    // Validar lógica de stop loss
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const targetPrice = parseFloat(formData.targetPrice);

    if (formData.direction === 'LONG') {
      if (stopLoss >= entryPrice) {
        toast.error('Para LONG: Stop Loss deve ser menor que o preço de entrada');
        return false;
      }
      if (targetPrice <= entryPrice) {
        toast.error('Para LONG: Target deve ser maior que o preço de entrada');
        return false;
      }
    } else {
      if (stopLoss <= entryPrice) {
        toast.error('Para SHORT: Stop Loss deve ser maior que o preço de entrada');
        return false;
      }
      if (targetPrice >= entryPrice) {
        toast.error('Para SHORT: Target deve ser menor que o preço de entrada');
        return false;
      }
    }

    return true;
  };

  const getFieldLabel = (field) => {
    const labels = {
      entryPrice: 'Preço de Entrada',
      stopLoss: 'Stop Loss',
      targetPrice: 'Target Price',
      accountSize: 'Tamanho da Conta',
      riskPercent: 'Risco por Trade'
    };
    return labels[field] || field;
  };

  const copyToClipboard = async () => {
    if (!results) return;

    const symbol = selectedSymbol ? selectedSymbol.symbol : 'N/A';
    const exchange = selectedExchange ? selectedExchange.name : 'N/A';
    
    const resultText = `📊 RESULTADO DO CÁLCULO
Corretora: ${exchange}
Símbolo: ${symbol}
Direção: ${formData.direction}

🪙 Quantidade: ${results.positionSize?.toFixed(6)} moedas
💵 Valor da Posição: $${results.positionValue?.toFixed(2)}
🛑 Risco Máximo: $${results.riskAmount?.toFixed(2)}
🎯 Lucro Potencial: $${results.rewardAmount?.toFixed(2)}
⚖️ Risk/Reward: ${results.riskRewardRatio?.toFixed(2)}:1

Generated by BitAcademy Risk Calculator`;

    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('Resultado copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar resultado');
      console.error('Erro ao copiar:', err);
    }
  };

  const handleLoadCalculation = (historyEntry) => {
    // Carregar dados do histórico no formulário
    const { formData: savedData } = historyEntry;
    
    setFormData({
      entryPrice: savedData.entryPrice.toString(),
      stopLoss: savedData.stopLoss.toString(),
      targetPrice: savedData.targetPrice.toString(),
      accountSize: savedData.accountSize.toString(),
      riskPercent: savedData.riskPercent.toString(),
      direction: savedData.direction
    });
    
    // Buscar e definir exchange e symbol se possível
    const exchange = exchanges.find(ex => ex.name === historyEntry.exchange);
    if (exchange) {
      setSelectedExchange(exchange);
      // Note: seria ideal buscar o symbol também, mas requer async
    }
    
    toast.success('Cálculo carregado do histórico!');
  };

  const formatExchangeOptions = () => {
    return exchanges.map(exchange => ({
      value: exchange,
      label: exchange.name,
      id: exchange.id
    }));
  };

  const formatSymbolOptions = () => {
    return symbols.map(symbol => ({
      value: symbol,
      label: `${symbol.symbol} (${symbol.baseAsset}/${symbol.quoteAsset})`,
      symbol: symbol.symbol
    }));
  };

  const getExchangeIcon = (exchangeId) => {
    const icons = {
      'binance': '🟡',
      'bybit': '🟠', 
      'bingx': '🔵',
      'bitget': '🟢',
      'manual': '⚙️'
    };
    return icons[exchangeId] || '🏢';
  };

  return (
    <div className="risk-calculator-container">
      {/* Header */}
      <header className="calculator-header">
        <h1 className="calculator-title">⚡ Risk Calculator Pro</h1>
        <p className="calculator-subtitle">
          Calculadora profissional de gerenciamento de risco para traders. 
          Maximize seus ganhos e minimize suas perdas com precisão matemática.
        </p>
      </header>

      {/* Main Layout */}
      <div className="calculator-layout">
        {/* Left Column - Forms */}
        <div className="calculator-forms">
          {/* Exchange Selection Card */}
          <div className="calculator-card">
            <div className="exchange-selector">
              <h2 className="exchange-title">🏢 Selecionar Exchange</h2>
              
              <div className="exchange-grid">
                {exchanges.map(exchange => (
                  <div
                    key={exchange.id}
                    className={`exchange-option ${selectedExchange?.id === exchange.id ? 'selected' : ''}`}
                    onClick={() => setSelectedExchange(exchange)}
                  >
                    <div className="exchange-icon">{getExchangeIcon(exchange.id)}</div>
                    <div className="exchange-name">{exchange.name}</div>
                  </div>
                ))}
              </div>

              {/* Symbol Selector */}
              {selectedExchange && (
                <div className="symbol-selector">
                  <label className="symbol-label">Par de Moedas</label>
                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Selecione um par de moedas..."
                    options={formatSymbolOptions()}
                    value={selectedSymbol ? { 
                      value: selectedSymbol, 
                      label: `${selectedSymbol.symbol} (${selectedSymbol.baseAsset}/${selectedSymbol.quoteAsset})` 
                    } : null}
                    onChange={(option) => setSelectedSymbol(option?.value || null)}
                    isLoading={loading.symbols}
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "Nenhum par encontrado"}
                    loadingMessage={() => "Carregando pares..."}
                  />
                  
                  {/* Price Info */}
                  {selectedSymbol && (
                    <div className="price-info">
                      <span className="current-price-reference">
                        📊 Cotação atual: {loading.price ? "Carregando..." : liveCurrentPrice ? `$${Number(liveCurrentPrice).toFixed(4)}` : "N/A"}
                      </span>
                      {!loading.price && liveCurrentPrice && (
                        <div className="price-update-indicator">
                          <div className="price-update-dot"></div>
                          Atualiza a cada 5s
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calculator Form Card */}
          <div className="calculator-card">
            <h2 className="section-title">⚙️ Parâmetros de Risco</h2>
            
            <form className="calculator-form" onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>
              {/* Direction Toggle */}
              <div className="direction-toggle">
                <button
                  type="button"
                  className={`direction-option ${formData.direction === 'LONG' ? 'active' : ''}`}
                  onClick={() => handleDirectionChange('LONG')}
                >
                  📈 LONG (Compra)
                </button>
                <button
                  type="button"
                  className={`direction-option ${formData.direction === 'SHORT' ? 'active' : ''}`}
                  onClick={() => handleDirectionChange('SHORT')}
                >
                  📉 SHORT (Venda)
                </button>
              </div>

              {/* Price Fields */}
              <div className="form-section">
                <h3 className="section-title">💰 Preços</h3>
                
                <div className="form-field half">
                  <div className="field-group">
                    <label className="field-label">Preço de Entrada</label>
                    <div className="currency-input">
                      <input
                        type="number"
                        step="any"
                        className="field-input"
                        placeholder="0.00"
                        value={formData.entryPrice}
                        onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                        disabled={calculating}
                      />
                    </div>
                    {fieldTouched.entryPrice && validationErrors.entryPrice && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.entryPrice}
                      </div>
                    )}
                  </div>
                  
                  <div className="field-group">
                    <label className="field-label">Stop Loss</label>
                    <div className="currency-input">
                      <input
                        type="number"
                        step="any"
                        className="field-input"
                        placeholder="0.00"
                        value={formData.stopLoss}
                        onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                        disabled={calculating}
                      />
                    </div>
                    {fieldTouched.stopLoss && validationErrors.stopLoss && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.stopLoss}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <div className="field-group">
                    <label className="field-label">Target Price</label>
                    <div className="currency-input">
                      <input
                        type="number"
                        step="any"
                        className="field-input"
                        placeholder="0.00"
                        value={formData.targetPrice}
                        onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                        disabled={calculating}
                      />
                    </div>
                    {fieldTouched.targetPrice && validationErrors.targetPrice && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.targetPrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account & Risk Fields */}
              <div className="form-section">
                <h3 className="section-title">💼 Conta & Risco</h3>
                
                <div className="form-field half">
                  <div className="field-group">
                    <label className="field-label">Tamanho da Conta</label>
                    <div className="currency-input">
                      <input
                        type="number"
                        step="any"
                        className="field-input"
                        placeholder="1000.00"
                        value={formData.accountSize}
                        onChange={(e) => handleInputChange('accountSize', e.target.value)}
                        disabled={calculating}
                      />
                    </div>
                    {fieldTouched.accountSize && validationErrors.accountSize && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.accountSize}
                      </div>
                    )}
                  </div>
                  
                  <div className="field-group">
                    <label className="field-label">Risco por Trade</label>
                    <div className="percentage-input">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="100"
                        className="field-input"
                        placeholder="2.0"
                        value={formData.riskPercent}
                        onChange={(e) => handleInputChange('riskPercent', e.target.value)}
                        disabled={calculating}
                      />
                    </div>
                    {fieldTouched.riskPercent && validationErrors.riskPercent && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.riskPercent}
                      </div>
                    )}
                    {!validationErrors.riskPercent && formData.riskPercent && parseFloat(formData.riskPercent) <= 3 && (
                      <div className="field-success">
                        <span>✅</span> Risco conservador
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                type="submit"
                className="calculate-button"
                disabled={calculating || Object.keys(validationErrors).length > 0 || !selectedExchange || !selectedSymbol}
              >
                {calculating && <span className="loading-spinner"></span>}
                {calculating ? 'Calculando...' : '🚀 Calcular Risco'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Instructions & Results */}
        <div className="calculator-results">
          {/* Instructions */}
          <div className="calculator-card instructions-panel">
            <h2 className="instructions-title">📋 Como usar</h2>
            <ol className="instructions-list">
              <li className="instruction-item">
                <div className="instruction-number">1</div>
                <div className="instruction-text">Selecione a exchange e o par de moedas</div>
              </li>
              <li className="instruction-item">
                <div className="instruction-number">2</div>
                <div className="instruction-text">Escolha a direção: LONG (compra) ou SHORT (venda)</div>
              </li>
              <li className="instruction-item">
                <div className="instruction-number">3</div>
                <div className="instruction-text">Defina os preços de entrada, stop loss e target</div>
              </li>
              <li className="instruction-item">
                <div className="instruction-number">4</div>
                <div className="instruction-text">Configure o tamanho da conta e % de risco</div>
              </li>
              <li className="instruction-item">
                <div className="instruction-number">5</div>
                <div className="instruction-text">Clique em "Calcular Risco" para ver os resultados</div>
              </li>
            </ol>
          </div>

          {/* Results */}
          {results && (
            <div className="calculator-card results-panel">
              <h2 className="results-title">📊 Resultado do Cálculo</h2>
              
              <div className="simple-results">
                <div className="result-summary">
                  <div className="summary-line">
                    <span className="summary-label">🪙 Quantidade:</span>
                    <span className="summary-value">{results.positionSize?.toFixed(6)} moedas</span>
                  </div>
                  
                  <div className="summary-line">
                    <span className="summary-label">💵 Valor da Posição:</span>
                    <span className="summary-value">${results.positionValue?.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-line">
                    <span className="summary-label">🛑 Risco Máximo:</span>
                    <span className="summary-value risk">${results.riskAmount?.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-line">
                    <span className="summary-label">🎯 Lucro Potencial:</span>
                    <span className="summary-value profit">${results.rewardAmount?.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-line">
                    <span className="summary-label">⚖️ Risk/Reward:</span>
                    <span className="summary-value ratio">{results.riskRewardRatio?.toFixed(2)}:1</span>
                  </div>
                </div>

                <div className="result-actions">
                  <button 
                    className="btn btn--secondary"
                    onClick={() => copyToClipboard()}
                  >
                    📋 Copiar Resultado
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default RiskCalculator;