import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExchangeData } from '../hooks/useExchangeData';
import { useCalculationHistory } from '../hooks/useCalculationHistory';
import { usePriceUpdater } from '../hooks/usePriceUpdater';
import { useMobileTouchOptimization, usePullToRefresh, useTouchFeedback } from '../hooks/useMobileTouch';
import { calculatorApi } from '../services/api';
import { tradeApi } from '../services/authApi';
import toast from 'react-hot-toast';
import Select from 'react-select';
/* import '../styles/mobile-touch.css'; */ // Disabled - causing touch issues on tablets

const MobileRiskCalculator = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { isMobile, isTouch, isKeyboardOpen, orientation } = useMobileTouchOptimization();
  const { triggerHaptic } = useTouchFeedback();

  const {
    exchanges,
    symbols,
    currentPrice,
    loading,
    loadSymbols,
    fetchCurrentPrice
  } = useExchangeData();

  const {
    history,
    addCalculation,
    clearHistory
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
  const [liveCurrentPrice, setLiveCurrentPrice] = useState(currentPrice);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [activeSection, setActiveSection] = useState('exchange');

  // Pull to refresh functionality
  const handleRefresh = async () => {
    triggerHaptic('light');
    if (selectedExchange && selectedSymbol) {
      await fetchCurrentPrice(selectedExchange.id, selectedSymbol.symbol);
    }
  };

  const { pullHandlers, isPulling, isRefreshing, showIndicator, containerRef } = usePullToRefresh(handleRefresh);

  // Price updater with mobile optimizations
  const handlePriceUpdate = useCallback((newPrice) => {
    setLiveCurrentPrice(newPrice);
    if (isMobile) {
      triggerHaptic('light');
    }
  }, [isMobile, triggerHaptic]);

  usePriceUpdater(selectedExchange, selectedSymbol, handlePriceUpdate, true);

  // Exchange change handler
  const handleExchangeSelect = useCallback((exchange) => {
    setSelectedExchange(exchange);
    setSelectedSymbol(null);
    setFormData(prev => ({ ...prev, entryPrice: '' }));
    setActiveSection('symbol');
    
    if (isMobile) {
      triggerHaptic('medium');
    }
    
    loadSymbols(exchange.id);
  }, [isMobile, triggerHaptic, loadSymbols]);

  // Symbol change handler
  const handleSymbolSelect = useCallback((symbol) => {
    setSelectedSymbol(symbol);
    setActiveSection('form');
    
    if (isMobile) {
      triggerHaptic('medium');
    }
    
    if (selectedExchange) {
      fetchCurrentPrice(selectedExchange.id, symbol.symbol);
    }
  }, [selectedExchange, isMobile, triggerHaptic, fetchCurrentPrice]);

  // Input change with haptic feedback
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    if (isMobile && value) {
      triggerHaptic('light');
    }
    
    validateField(field, value);
  }, [isMobile, triggerHaptic]);

  // Direction change with haptic feedback
  const handleDirectionChange = useCallback((direction) => {
    setFormData(prev => ({ ...prev, direction }));
    
    if (isMobile) {
      triggerHaptic('medium');
    }
    
    // Revalidate prices when direction changes
    if (formData.entryPrice && formData.stopLoss && formData.targetPrice) {
      setTimeout(() => {
        validateField('entryPrice', formData.entryPrice);
        validateField('stopLoss', formData.stopLoss);
        validateField('targetPrice', formData.targetPrice);
      }, 0);
    }
  }, [formData, isMobile, triggerHaptic]);

  // Calculate with enhanced mobile feedback
  const handleCalculate = async () => {
    if (!validateForm()) {
      triggerHaptic('error');
      return;
    }

    setCalculating(true);
    triggerHaptic('medium');

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
      setShowResults(true);
      
      // Haptic success feedback
      triggerHaptic('success');
      
      // Add to history
      addCalculation(response.data, selectedSymbol, selectedExchange);
      
      // Save to backend if authenticated
      if (isAuthenticated && token) {
        try {
          const tradeData = {
            exchange: selectedExchange?.name || 'Manual',
            symbol: selectedSymbol?.symbol || 'CUSTOM',
            accountSize: parseFloat(response.data.accountSize),
            riskPercentage: parseFloat(response.data.riskPercent),
            entryPrice: parseFloat(response.data.entryPrice),
            stopLoss: parseFloat(response.data.stopLoss),
            takeProfit: parseFloat(response.data.targetPrice),
            positionSize: parseFloat(response.data.positionSize),
            riskAmount: parseFloat(response.data.riskAmount),
            rewardAmount: parseFloat(response.data.rewardAmount),
            riskRewardRatio: parseFloat(response.data.riskRewardRatio),
            currentPrice: parseFloat(response.data.currentPrice || response.data.entryPrice),
            tradeType: response.data.direction?.toLowerCase() || 'long',
            notes: `R/R: ${response.data.riskRewardRatio.toFixed(2)}:1 - Mobile calc ${new Date().toLocaleString('pt-BR')}`
          };
          
          await tradeApi.saveCalculation(tradeData, token);
          toast.success('✅ Cálculo salvo!');
        } catch (error) {
          console.error('Erro ao salvar:', error);
          toast.success('✅ Cálculo realizado!');
        }
      } else {
        toast.success('✅ Cálculo realizado!');
      }
    } catch (error) {
      triggerHaptic('error');
      toast.error(error.message || 'Erro ao calcular');
      console.error('Erro no cálculo:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Field validation
  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'entryPrice':
        if (!value || value.trim() === '') {
          errors.entryPrice = 'Preço de entrada obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.entryPrice = 'Digite um número positivo';
        } else {
          delete errors.entryPrice;
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'stopLoss':
        if (!value || value.trim() === '') {
          errors.stopLoss = 'Stop Loss obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.stopLoss = 'Digite um número positivo';
        } else {
          delete errors.stopLoss;
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'targetPrice':
        if (!value || value.trim() === '') {
          errors.targetPrice = 'Target obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.targetPrice = 'Digite um número positivo';
        } else {
          delete errors.targetPrice;
          validatePriceLogic(field, parseFloat(value), errors);
        }
        break;
        
      case 'accountSize':
        if (!value || value.trim() === '') {
          errors.accountSize = 'Tamanho da conta obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.accountSize = 'Digite um valor positivo';
        } else if (parseFloat(value) < 100) {
          errors.accountSize = 'Mínimo recomendado: $100';
        } else {
          delete errors.accountSize;
        }
        break;
        
      case 'riskPercent':
        if (!value || value.trim() === '') {
          errors.riskPercent = 'Risco obrigatório';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors.riskPercent = 'Digite um número positivo';
        } else if (parseFloat(value) > 10) {
          errors.riskPercent = 'Cuidado! Risco muito alto';
        } else {
          delete errors.riskPercent;
        }
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
        errors.stopLoss = 'LONG: Stop < Entrada';
      }
      if (targetPrice <= entryPrice) {
        errors.targetPrice = 'LONG: Target > Entrada';
      }
    } else {
      if (stopLoss <= entryPrice) {
        errors.stopLoss = 'SHORT: Stop > Entrada';
      }
      if (targetPrice >= entryPrice) {
        errors.targetPrice = 'SHORT: Target < Entrada';
      }
    }
  };

  const validateForm = () => {
    if (!selectedExchange) {
      toast.error('📱 Selecione uma exchange');
      return false;
    }
    
    if (!selectedSymbol) {
      toast.error('📱 Selecione um par de moedas');
      return false;
    }
    
    const requiredFields = ['entryPrice', 'stopLoss', 'targetPrice', 'accountSize', 'riskPercent'];
    
    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || value.trim() === '' || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
        toast.error(`📱 Preencha: ${getFieldLabel(field)}`);
        return false;
      }
    }

    // Validate price logic
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const targetPrice = parseFloat(formData.targetPrice);

    if (formData.direction === 'LONG') {
      if (stopLoss >= entryPrice) {
        toast.error('📱 LONG: Stop deve ser menor que entrada');
        return false;
      }
      if (targetPrice <= entryPrice) {
        toast.error('📱 LONG: Target deve ser maior que entrada');
        return false;
      }
    } else {
      if (stopLoss <= entryPrice) {
        toast.error('📱 SHORT: Stop deve ser maior que entrada');
        return false;
      }
      if (targetPrice >= entryPrice) {
        toast.error('📱 SHORT: Target deve ser menor que entrada');
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

  // Results modal for mobile
  const ResultsModal = () => (
    <div className={`mobile-modal ${showResults ? 'open' : ''}`}>
      <div className="mobile-modal-content">
        <div className="mobile-modal-handle"></div>
        
        <div className="mobile-center mb-6">
          <h2 className="text-2xl font-bold text-gradient mb-2">
            📊 Resultados do Cálculo
          </h2>
          <p className="text-sm text-secondary">
            {selectedSymbol?.symbol} • {formData.direction}
          </p>
        </div>

        {results && (
          <div className="mobile-card-list">
            <div className="mobile-card-item">
              <div className="mobile-card-header">
                <div className="mobile-card-title">Posição</div>
                <div className="text-2xl">💰</div>
              </div>
              <div className="mobile-card-content">
                <div className="mobile-metric">
                  <span className="mobile-metric-value">{results.positionSize?.toFixed(6)}</span>
                  <span className="mobile-metric-label">Tamanho</span>
                </div>
                <div className="mobile-metric">
                  <span className="mobile-metric-value">${results.positionValue?.toFixed(2)}</span>
                  <span className="mobile-metric-label">Valor</span>
                </div>
              </div>
            </div>

            <div className="mobile-card-item">
              <div className="mobile-card-header">
                <div className="mobile-card-title">Risco & Retorno</div>
                <div className="text-2xl">⚡</div>
              </div>
              <div className="mobile-card-content">
                <div className="mobile-metric">
                  <span className="mobile-metric-value text-error">${results.riskAmount?.toFixed(2)}</span>
                  <span className="mobile-metric-label">Risco</span>
                </div>
                <div className="mobile-metric">
                  <span className="mobile-metric-value text-success">${results.rewardAmount?.toFixed(2)}</span>
                  <span className="mobile-metric-label">Retorno</span>
                </div>
              </div>
            </div>

            <div className="mobile-card-item card--primary">
              <div className="mobile-center">
                <div className="text-4xl font-extrabold text-gradient mb-2">
                  {results.riskRewardRatio?.toFixed(2)}:1
                </div>
                <div className="text-lg font-semibold text-secondary mb-1">
                  Risk/Reward Ratio
                </div>
                <div className="text-sm text-placeholder">
                  {results.riskRewardRatio >= 2 ? '🚀 Excelente!' : 
                   results.riskRewardRatio >= 1.5 ? '✅ Bom ratio' : 
                   '⚠️ Ratio baixo'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button 
            className="btn btn--ghost flex-1"
            onClick={() => setShowResults(false)}
          >
            Fechar
          </button>
          <button 
            className="btn btn--primary flex-1"
            onClick={() => {
              setShowResults(false);
              setActiveSection('exchange');
              setFormData({
                entryPrice: '',
                stopLoss: '',
                targetPrice: '',
                accountSize: formData.accountSize,
                riskPercent: formData.riskPercent,
                direction: 'LONG'
              });
              setResults(null);
            }}
          >
            Novo Cálculo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mobile-container" {...pullHandlers} ref={containerRef}>
      {/* Pull to refresh indicator */}
      {showIndicator && (
        <div className={`pull-indicator ${isPulling ? 'visible' : ''} ${isRefreshing ? 'loading' : ''}`}>
          🔄
        </div>
      )}

      {/* Header */}
      <header className="mobile-center mb-6">
        <h1 className="text-3xl font-extrabold text-gradient mb-2">
          📱 Risk Calculator
        </h1>
        <p className="text-base text-secondary">
          Calculadora otimizada para mobile
        </p>
        {liveCurrentPrice && selectedSymbol && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="pulse-dot"></div>
            <span className="text-sm font-semibold text-success">
              {selectedSymbol.symbol}: ${Number(liveCurrentPrice).toFixed(4)}
            </span>
          </div>
        )}
      </header>

      {/* Exchange Selection */}
      {activeSection === 'exchange' && (
        <div className="mobile-form">
          <div className="mobile-form-section">
            <div className="mobile-form-title">
              🏢 Selecionar Exchange
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {exchanges.map(exchange => (
                <button
                  key={exchange.id}
                  className={`mobile-card-item ${selectedExchange?.id === exchange.id ? 'selected' : ''}`}
                  onClick={() => handleExchangeSelect(exchange)}
                >
                  <div className="mobile-center">
                    <div className="text-2xl mb-2">
                      {getExchangeIcon(exchange.id)}
                    </div>
                    <div className="text-sm font-semibold">
                      {exchange.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Symbol Selection */}
      {activeSection === 'symbol' && selectedExchange && (
        <div className="mobile-form">
          <div className="mobile-form-section">
            <div className="mobile-form-title">
              💱 Par de Moedas
            </div>
            
            <div className="input-group-mobile">
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Buscar par de moedas..."
                options={symbols.map(symbol => ({
                  value: symbol,
                  label: `${symbol.symbol} (${symbol.baseAsset}/${symbol.quoteAsset})`
                }))}
                value={selectedSymbol ? {
                  value: selectedSymbol,
                  label: `${selectedSymbol.symbol} (${selectedSymbol.baseAsset}/${selectedSymbol.quoteAsset})`
                } : null}
                onChange={(option) => handleSymbolSelect(option?.value || null)}
                isLoading={loading.symbols}
                isClearable
                isSearchable
                noOptionsMessage={() => "Nenhum par encontrado"}
                loadingMessage={() => "Carregando..."}
              />
            </div>

            <div className="flex gap-3">
              <button 
                className="btn btn--ghost flex-1"
                onClick={() => setActiveSection('exchange')}
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Form */}
      {activeSection === 'form' && selectedExchange && selectedSymbol && (
        <div className="mobile-form">
          {/* Direction Toggle */}
          <div className="mobile-form-section">
            <div className="mobile-form-title">
              📈 Direção da Operação
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`btn ${formData.direction === 'LONG' ? 'btn--success' : 'btn--ghost'}`}
                onClick={() => handleDirectionChange('LONG')}
              >
                📈 LONG
              </button>
              <button
                type="button"
                className={`btn ${formData.direction === 'SHORT' ? 'btn--error' : 'btn--ghost'}`}
                onClick={() => handleDirectionChange('SHORT')}
              >
                📉 SHORT
              </button>
            </div>
          </div>

          {/* Price Inputs */}
          <div className="mobile-form-section">
            <div className="mobile-form-title">
              💰 Preços
            </div>
            
            <div className="input-group-mobile">
              <label>Preço de Entrada</label>
              <input
                type="number"
                step="any"
                className={`input ${validationErrors.entryPrice ? 'input--error' : ''}`}
                placeholder="0.00"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              />
              {fieldTouched.entryPrice && validationErrors.entryPrice && (
                <p className="text-sm text-error mt-1">
                  ⚠️ {validationErrors.entryPrice}
                </p>
              )}
            </div>

            <div className="mobile-form-row two-columns">
              <div className="input-group-mobile">
                <label>Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  className={`input ${validationErrors.stopLoss ? 'input--error' : ''}`}
                  placeholder="0.00"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                />
                {fieldTouched.stopLoss && validationErrors.stopLoss && (
                  <p className="text-sm text-error mt-1">
                    ⚠️ {validationErrors.stopLoss}
                  </p>
                )}
              </div>

              <div className="input-group-mobile">
                <label>Target Price</label>
                <input
                  type="number"
                  step="any"
                  className={`input ${validationErrors.targetPrice ? 'input--error' : ''}`}
                  placeholder="0.00"
                  value={formData.targetPrice}
                  onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                />
                {fieldTouched.targetPrice && validationErrors.targetPrice && (
                  <p className="text-sm text-error mt-1">
                    ⚠️ {validationErrors.targetPrice}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account & Risk */}
          <div className="mobile-form-section">
            <div className="mobile-form-title">
              💼 Conta & Risco
            </div>
            
            <div className="mobile-form-row two-columns">
              <div className="input-group-mobile">
                <label>Tamanho da Conta</label>
                <input
                  type="number"
                  step="any"
                  className={`input ${validationErrors.accountSize ? 'input--error' : ''}`}
                  placeholder="1000.00"
                  value={formData.accountSize}
                  onChange={(e) => handleInputChange('accountSize', e.target.value)}
                />
                {fieldTouched.accountSize && validationErrors.accountSize && (
                  <p className="text-sm text-error mt-1">
                    ⚠️ {validationErrors.accountSize}
                  </p>
                )}
              </div>

              <div className="input-group-mobile">
                <label>Risco por Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className={`input ${validationErrors.riskPercent ? 'input--error' : ''}`}
                  placeholder="2.0"
                  value={formData.riskPercent}
                  onChange={(e) => handleInputChange('riskPercent', e.target.value)}
                />
                {fieldTouched.riskPercent && validationErrors.riskPercent ? (
                  <p className="text-sm text-error mt-1">
                    ⚠️ {validationErrors.riskPercent}
                  </p>
                ) : !validationErrors.riskPercent && formData.riskPercent && parseFloat(formData.riskPercent) <= 3 ? (
                  <p className="text-sm text-success mt-1">
                    ✅ Risco conservador
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              className="btn btn--ghost flex-1"
              onClick={() => setActiveSection('symbol')}
            >
              ← Voltar
            </button>
            <button
              className="btn btn--primary flex-1"
              onClick={handleCalculate}
              disabled={calculating || Object.keys(validationErrors).length > 0}
            >
              {calculating ? (
                <>
                  <span className="loading-spinner loading-spinner--sm"></span>
                  Calculando...
                </>
              ) : (
                '🚀 Calcular'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Modal */}
      <ResultsModal />

      {/* Mobile Navigation */}
      <div className="mobile-nav show-mobile">
        <div className="mobile-nav-items">
          <button 
            className={`mobile-nav-item ${activeSection === 'exchange' ? 'active' : ''}`}
            onClick={() => setActiveSection('exchange')}
          >
            <div className="mobile-nav-icon">🏢</div>
            <div className="mobile-nav-label">Exchange</div>
          </button>
          <button 
            className={`mobile-nav-item ${activeSection === 'symbol' ? 'active' : ''}`}
            onClick={() => selectedExchange && setActiveSection('symbol')}
            disabled={!selectedExchange}
          >
            <div className="mobile-nav-icon">💱</div>
            <div className="mobile-nav-label">Par</div>
          </button>
          <button 
            className={`mobile-nav-item ${activeSection === 'form' ? 'active' : ''}`}
            onClick={() => selectedSymbol && setActiveSection('form')}
            disabled={!selectedSymbol}
          >
            <div className="mobile-nav-icon">📊</div>
            <div className="mobile-nav-label">Calcular</div>
          </button>
          <button 
            className="mobile-nav-item"
            onClick={() => history.length > 0 && console.log('Mostrar histórico')}
          >
            <div className="mobile-nav-icon">📋</div>
            <div className="mobile-nav-label">Histórico</div>
          </button>
        </div>
      </div>

      {/* Keyboard offset */}
      {isKeyboardOpen && <div style={{ height: '300px' }} />}
    </div>
  );
};

export default MobileRiskCalculator;