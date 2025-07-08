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
import CalculatorForm from './CalculatorForm';
import EnhancedResults from './EnhancedResults';
import ExchangeSelector from './ExchangeSelector';
import AuthModal from './AuthModal';
import TradingViewChart from './TradingViewChart';
import '../styles/TradingViewChart.css';

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
  
  // States dos modais
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  // States do TradingView
  const [showChart, setShowChart] = useState(true);
  const [chartSymbol, setChartSymbol] = useState("BINANCE:BTCUSDT");

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

  // Função simples para atualizar símbolo do TradingView
  const updateChartSymbol = useCallback((exchange, symbol) => {
    if (!exchange || !symbol) return;
    
    const exchangeMap = {
      'binance': 'BINANCE',
      'bybit': 'BYBIT',
      'bitget': 'BITGET',
      'bingx': 'BINGX'
    };
    
    const exchangeName = typeof exchange === 'object' ? exchange.id : exchange;
    const symbolName = typeof symbol === 'object' ? symbol.symbol : symbol;
    
    const tvExchange = exchangeMap[exchangeName?.toLowerCase()] || 'BINANCE';
    const cleanSymbol = symbolName?.replace('/', '').toUpperCase() || 'BTCUSDT';
    
    const newChartSymbol = `${tvExchange}:${cleanSymbol}`;
    setChartSymbol(newChartSymbol);
  }, []);

  // Atualizar símbolos quando exchange muda
  useEffect(() => {
    if (selectedExchange) {
      loadSymbols(selectedExchange.id);
      setSelectedSymbol(null);
      setFormData(prev => ({ ...prev, entryPrice: '' }));
    }
  }, [selectedExchange, loadSymbols]);

  // Atualizar símbolo do gráfico quando exchange/symbol mudam
  useEffect(() => {
    if (selectedExchange && selectedSymbol) {
      updateChartSymbol(selectedExchange, selectedSymbol);
    }
  }, [selectedExchange, selectedSymbol, updateChartSymbol]);

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
  };

  const handleDirectionChange = (direction) => {
    setFormData(prev => ({
      ...prev,
      direction
    }));
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

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme}
        />
        
        {/* Professional Chart Toggle */}
        <div className="chart-toggle-container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div className="chart-toggle-status">
            <div className="status-dot"></div>
            <span>TradingView {showChart ? 'Ativo' : 'Inativo'}</span>
          </div>
          
          <button
            className={`chart-toggle-btn ${showChart ? 'active' : ''}`}
            onClick={() => setShowChart(!showChart)}
          >
            📈 {showChart ? 'Ocultar' : 'Mostrar'} Gráfico
          </button>
        </div>

        {/* Container 1: Gráfico + Calculadora */}
        <div className={`trading-calculator-container ${showChart ? 'chart-visible' : 'chart-hidden'}`}>
          {/* Chart Section - ESQUERDA */}
          {showChart && (
            <div className="chart-section">
              <TradingViewChart
                symbol={chartSymbol}
                theme={theme}
                entryPrice={formData.entryPrice}
                stopLoss={formData.stopLoss}
                targetPrice={formData.targetPrice}
                tradeDirection={formData.direction}
              />
            </div>
          )}

          {/* Calculator Section - DIREITA */}
          <div className="calculator-section">
            <div className="calculator-inner">
              <div className="form-section">
                <ExchangeSelector
                  exchanges={exchanges}
                  selectedExchange={selectedExchange}
                  onExchangeSelect={setSelectedExchange}
                  loading={loading}
                />

                <div className="input-group">
                  <label>Par de Moedas:</label>
                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder={selectedExchange ? "Selecione um par..." : "Selecione uma corretora primeiro"}
                    options={formatSymbolOptions()}
                    value={selectedSymbol ? { value: selectedSymbol, label: `${selectedSymbol.symbol} (${selectedSymbol.baseAsset}/${selectedSymbol.quoteAsset})` } : null}
                    onChange={(option) => setSelectedSymbol(option?.value || null)}
                    isLoading={loading.symbols}
                    isDisabled={!selectedExchange}
                    isClearable
                    isSearchable
                  />
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

                <CalculatorForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onDirectionChange={handleDirectionChange}
                  onCalculate={handleCalculate}
                  calculating={calculating}
                  loading={loading}
                  currentPrice={liveCurrentPrice}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Container 2: Risk Management Analysis - ABAIXO */}
        {results && (
          <div className="risk-management-container">
            <div className="analysis-header">
              <h4 className="analysis-title">📊 Análise de Risk Management</h4>
              <div className="analysis-status">
                <div className="status-indicator"></div>
                <span>Análise em Tempo Real</span>
              </div>
            </div>
            
            <div className="analysis-content">
              <EnhancedResults 
                results={results} 
                selectedSymbol={selectedSymbol}
                selectedExchange={selectedExchange}
                formData={formData}
                currentPrice={liveCurrentPrice}
              />
            </div>
          </div>
        )}

        {/* Modais */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />

      </div>
    </div>
  );
};

export default RiskCalculator;