import React, { useEffect, useRef, useState } from 'react';
import BinanceDatafeed from '../utils/binanceDatafeed';

const TradingViewChartAdvanced = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null,
  currentPrice = null,
  results = null  // Adicionar resultados para alvos inteligentes
}) => {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lineCounter = useRef(0); // Contador para IDs únicos
  const priceLineIds = useRef({
    entry: null,
    stop: null,
    target: null,
    smartTarget1: null,
    smartTarget2: null,
    smartTarget3: null
  });

  useEffect(() => {

    // Inicializar TradingView Advanced Charts
    const initTradingViewChart = async () => {
      try {
        // Verificar se a biblioteca TradingView está carregada
        if (typeof window.TradingView === 'undefined') {
          console.error('❌ TradingView library not loaded');
          setHasError(true);
          return;
        }

        if (!chartContainerRef.current) {
          console.error('❌ Chart container not found');
          setHasError(true);
          return;
        }

        console.log('✅ Initializing TradingView Advanced Charts with Binance Real Data');

        // Configurar datafeed com dados reais da Binance
        const datafeed = new BinanceDatafeed();

        // Limpar widget anterior
        if (widgetRef.current) {
          try {
            widgetRef.current.remove();
          } catch (e) {
            console.warn('Error removing previous widget:', e);
          }
        }

        // Criar widget TradingView Advanced Charts
        const widget = new window.TradingView.widget({
          symbol: symbol,
          interval: '5',
          container: chartContainerRef.current,
          datafeed: datafeed,
          library_path: '/charting_library/',
          locale: 'pt_BR',
          disabled_features: [
            'header_symbol_search',
            'header_resolutions',
            'header_chart_type',
            'header_settings',
            'header_indicators',
            'header_compare',
            'header_undo_redo',
            'header_fullscreen_button',
            'use_localstorage_for_settings'
          ],
          enabled_features: [
            'study_templates',
            'move_logo_to_main_pane'
          ],
          theme: theme === 'dark' ? 'dark' : 'light',
          timezone: 'America/Sao_Paulo',
          overrides: {
            "mainSeriesProperties.style": 1, // Candlestick
            "volumePaneSize": "tiny",
            "paneProperties.background": theme === 'dark' ? '#1e1e1e' : '#ffffff',
            "paneProperties.vertGridProperties.color": theme === 'dark' ? '#2e2e2e' : '#e1e1e1',
            "paneProperties.horzGridProperties.color": theme === 'dark' ? '#2e2e2e' : '#e1e1e1',
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": theme === 'dark' ? '#cccccc' : '#333333',
            "scalesProperties.backgroundColor": theme === 'dark' ? '#1e1e1e' : '#ffffff'
          },
          autosize: true,
          fullscreen: false,
          toolbar_bg: theme === 'dark' ? '#2e2e2e' : '#f4f7f9',
          loading_screen: {
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#cccccc' : '#333333'
          }
        });

        widgetRef.current = widget;

        // Quando o chart estiver pronto
        widget.onChartReady(() => {
          console.log('✅ TradingView Advanced Charts ready');
          setChartReady(true);
          setHasError(false);
          
          // Criar linhas horizontais iniciais
          setTimeout(() => {
            createOrUpdateLines();
          }, 1000);
          
          // Listener para atualizar linhas quando o range mudar (apenas recriar se necessário)
          const chart = widget.activeChart();
          let rangeChangeTimeout;
          
          chart.onVisibleRangeChanged().subscribe(null, () => {
            console.log('📊 Visible range changed - checking existing lines');
            
            // Limpar timeout anterior
            if (rangeChangeTimeout) {
              clearTimeout(rangeChangeTimeout);
            }
            
            // Debounce para evitar recriação excessiva
            rangeChangeTimeout = setTimeout(() => {
              console.log('📊 Range changed - lines remain persistent');
              // Não fazer nada - as linhas são persistentes
            }, 500);
          });
        });

      } catch (error) {
        console.error('❌ Error initializing TradingView Advanced Charts:', error);
        setHasError(true);
      }
    };

    // Verificar se scripts estão carregados
    const checkScripts = (retryCount = 0) => {
      const maxRetries = 50;
      
      if (typeof window.TradingView !== 'undefined') {
        console.log('✅ TradingView script loaded, initializing chart');
        initTradingViewChart();
      } else if (retryCount < maxRetries) {
        console.log(`⏳ Waiting for TradingView script... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkScripts(retryCount + 1), 100);
      } else {
        console.error('❌ Failed to load TradingView script');
        setHasError(true);
      }
    };

    checkScripts();

    // Cleanup
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error in cleanup:', e);
        }
      }
    };
  }, [symbol, theme]);

  // Função para calcular alvos inteligentes baseados nos resultados
  const calculateSmartTargets = () => {
    if (!results || !entryPrice || !targetPrice) return null;
    
    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);
    const isLong = tradeDirection === 'LONG';
    
    // Calcular a diferença total
    const totalDistance = Math.abs(target - entry);
    
    // Alvos inteligentes: 33%, 66%, 100%
    const targets = [];
    
    if (isLong) {
      targets.push({
        level: 1,
        percentage: 33,
        price: entry + (totalDistance * 0.33),
        label: "TP1 - 33%"
      });
      targets.push({
        level: 2,
        percentage: 66,
        price: entry + (totalDistance * 0.66),
        label: "TP2 - 66%"
      });
      targets.push({
        level: 3,
        percentage: 100,
        price: target,
        label: "TP3 - 100%"
      });
    } else {
      targets.push({
        level: 1,
        percentage: 33,
        price: entry - (totalDistance * 0.33),
        label: "TP1 - 33%"
      });
      targets.push({
        level: 2,
        percentage: 66,
        price: entry - (totalDistance * 0.66),
        label: "TP2 - 66%"
      });
      targets.push({
        level: 3,
        percentage: 100,
        price: target,
        label: "TP3 - 100%"
      });
    }
    
    return targets;
  };

  // Função para remover uma linha específica
  const removeLine = (lineType) => {
    if (!chartReady || !widgetRef.current) return;
    
    try {
      const chart = widgetRef.current.activeChart();
      const lineId = priceLineIds.current[lineType];
      
      if (lineId) {
        chart.removeEntity(lineId);
        priceLineIds.current[lineType] = null;
        console.log(`🗑️ ${lineType} line removed`);
      }
    } catch (error) {
      console.error(`❌ Error removing ${lineType} line:`, error);
    }
  };

  // Função para remover múltiplas linhas de uma vez
  const removeMultipleLines = (lineTypes) => {
    if (!chartReady || !widgetRef.current) return;
    
    try {
      const chart = widgetRef.current.activeChart();
      lineTypes.forEach(lineType => {
        const lineId = priceLineIds.current[lineType];
        if (lineId) {
          chart.removeEntity(lineId);
          priceLineIds.current[lineType] = null;
          console.log(`🗑️ ${lineType} line removed`);
        }
      });
    } catch (error) {
      console.error(`❌ Error removing multiple lines:`, error);
    }
  };

  // Função para remover todas as linhas - VERSÃO ROBUSTA
  const clearAllLines = () => {
    if (!chartReady || !widgetRef.current) return;
    
    try {
      const chart = widgetRef.current.activeChart();
      
      // Remover cada linha individualmente
      ['entry', 'stop', 'target', 'smartTarget1', 'smartTarget2', 'smartTarget3'].forEach(lineType => {
        const lineId = priceLineIds.current[lineType];
        if (lineId) {
          try {
            chart.removeEntity(lineId);
            priceLineIds.current[lineType] = null;
            console.log(`🗑️ ${lineType} line forcefully removed`);
          } catch (e) {
            console.warn(`⚠️ Error removing ${lineType}:`, e);
            // Força reset mesmo com erro
            priceLineIds.current[lineType] = null;
          }
        }
      });
      
      console.log('🗑️ All lines forcefully cleared');
    } catch (error) {
      console.error('❌ Error clearing lines:', error);
      // Reset forçado em caso de erro
      priceLineIds.current = {
        entry: null,
        stop: null,
        target: null,
        smartTarget1: null,
        smartTarget2: null,
        smartTarget3: null
      };
    }
  };

  // Função para criar/atualizar linhas horizontais - SOLUÇÃO DEFINITIVA
  const createOrUpdateLines = async () => {
    if (!chartReady || !widgetRef.current) {
      console.log('❌ createOrUpdateLines called but chart not ready');
      return;
    }

    console.log('🔍 createOrUpdateLines called with:', {
      entryPrice,
      stopLoss,
      targetPrice,
      currentPrice,
      hasResults: !!results
    });

    try {
      const chart = widgetRef.current.activeChart();
      
      // PASSO 1: SEMPRE LIMPAR TODAS AS LINHAS PRIMEIRO
      console.log('🗑️ Clearing ALL existing lines...');
      clearAllLines();
      
      // PASSO 2: Pequeno delay para garantir limpeza completa
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // PASSO 3: Obter range de tempo para as linhas horizontais
      const visibleRange = chart.getVisibleRange();
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = visibleRange.from || (currentTime - 86400 * 30); // 30 dias atrás
      const endTime = visibleRange.to || currentTime;

      // PASSO 4: Criar linha de entrada (verde) se válida
      if (entryPrice && entryPrice.toString().trim() !== '') {
        lineCounter.current++;
        console.log('🟢 Creating entry line:', entryPrice, 'ID:', lineCounter.current);
        const entryLineId = chart.createMultipointShape(
          [
            { time: startTime, price: parseFloat(entryPrice) },
            { time: endTime, price: parseFloat(entryPrice) }
          ],
          {
            shape: "trend_line",
            lock: true,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 12,
              linewidth: 2,
              linecolor: "#00FF00",
              extendLeft: true,
              extendRight: true,
              text: `🟢 Entrada: $${parseFloat(entryPrice).toFixed(4)} [${lineCounter.current}]`
            }
          }
        );
        priceLineIds.current.entry = entryLineId;
        console.log('✅ Entry line created:', entryPrice, 'with ID:', lineCounter.current);
      }

      // PASSO 5: Criar linha de stop loss (vermelho) se válida
      if (stopLoss && stopLoss.toString().trim() !== '') {
        lineCounter.current++;
        console.log('🔴 Creating stop loss line:', stopLoss, 'ID:', lineCounter.current);
        const stopLineId = chart.createMultipointShape(
          [
            { time: startTime, price: parseFloat(stopLoss) },
            { time: endTime, price: parseFloat(stopLoss) }
          ],
          {
            shape: "trend_line",
            lock: true,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 12,
              linewidth: 2,
              linecolor: "#FF0000",
              extendLeft: true,
              extendRight: true,
              text: `🛑 Stop: $${parseFloat(stopLoss).toFixed(4)} [${lineCounter.current}]`
            }
          }
        );
        priceLineIds.current.stop = stopLineId;
        console.log('✅ Stop loss line created:', stopLoss, 'with ID:', lineCounter.current);
      }

      // PASSO 6: Criar linha de target (azul) se válida
      if (targetPrice && targetPrice.toString().trim() !== '') {
        lineCounter.current++;
        console.log('🔵 Creating target line:', targetPrice, 'ID:', lineCounter.current);
        const targetLineId = chart.createMultipointShape(
          [
            { time: startTime, price: parseFloat(targetPrice) },
            { time: endTime, price: parseFloat(targetPrice) }
          ],
          {
            shape: "trend_line",
            lock: true,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 12,
              linewidth: 2,
              linecolor: "#0000FF",
              extendLeft: true,
              extendRight: true,
              text: `🎯 Alvo: $${parseFloat(targetPrice).toFixed(4)} [${lineCounter.current}]`
            }
          }
        );
        priceLineIds.current.target = targetLineId;
        console.log('✅ Target line created:', targetPrice, 'with ID:', lineCounter.current);
      }

      // PASSO 7: Criar alvos inteligentes se há resultados
      const smartTargets = calculateSmartTargets();
      if (smartTargets && results) {
        console.log('🟠 Creating smart targets:', smartTargets.length);
        smartTargets.forEach((target, index) => {
          lineCounter.current++;
          const lineType = `smartTarget${index + 1}`;
          const colors = ['#FFA500', '#FF8C00', '#FF6347']; // Laranja, laranja escuro, vermelho coral
          const targetLineId = chart.createMultipointShape(
            [
              { time: startTime, price: target.price },
              { time: endTime, price: target.price }
            ],
            {
              shape: "trend_line",
              lock: true,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                showLabel: true,
                fontSize: 11,
                linewidth: 1,
                linecolor: colors[index],
                linestyle: 2, // Linha pontilhada
                extendLeft: true,
                extendRight: true,
                text: `🎯 ${target.label}: $${target.price.toFixed(4)} [${lineCounter.current}]`
              }
            }
          );
          priceLineIds.current[lineType] = targetLineId;
          console.log(`✅ Smart target ${index + 1} line created:`, target.price, 'with ID:', lineCounter.current);
        });
      }

      const totalLines = Object.values(priceLineIds.current).filter(Boolean).length;
      console.log(`✅ Lines status: ${totalLines} active lines`);
      
      // PASSO FINAL: Forçar refresh visual
      try {
        // Força uma pequena atualização visual
        const visibleRange = chart.getVisibleRange();
        chart.setVisibleRange(visibleRange);
        console.log('🔄 Chart visual refresh forced');
      } catch (refreshError) {
        console.warn('⚠️ Chart refresh failed:', refreshError);
      }

    } catch (error) {
      console.error('❌ Error creating/updating horizontal lines:', error);
    }
  };

  // useEffect para criar/atualizar linhas quando preços mudarem - cria apenas uma vez
  useEffect(() => {
    if (!chartReady || !widgetRef.current) return;

    console.log('💡 Checking for new lines to create...');

    // Pequeno delay para garantir que o chart esteja completamente pronto
    const timeoutId = setTimeout(() => {
      createOrUpdateLines();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [chartReady, entryPrice, stopLoss, targetPrice, results, tradeDirection]);

  return (
    <div className="tradingview-chart-container">
      <div
        ref={chartContainerRef}
        className="chart-widget"
        style={{
          height: '100%',
          width: '100%',
          minHeight: '400px'
        }}
      />
      
      {hasError && (
        <div className="chart-error">
          <div>❌ Erro ao carregar TradingView Advanced Charts</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            Usando dados reais da API Binance.
            <br />
            <strong>Possíveis causas:</strong>
            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
              <li>Biblioteca TradingView não carregada</li>
              <li>Container do gráfico não encontrado</li>
              <li>Erro na conexão com API Binance</li>
              <li>Problema na inicialização do widget</li>
            </ul>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              📡 Dados em tempo real via WebSocket Binance
            </div>
          </div>
        </div>
      )}
      
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados reais da Binance...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChartAdvanced;