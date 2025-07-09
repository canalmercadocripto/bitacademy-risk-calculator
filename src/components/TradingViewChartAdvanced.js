import React, { useEffect, useRef, useState, useCallback } from 'react';
import BinanceDatafeed from '../utils/binanceDatafeed';

const TradingViewChartAdvanced = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null,
  currentPrice = null,
  results = null,  // Adicionar resultados para alvos inteligentes
  onPriceChange = null  // Callback para sincronizar com calculadora
}) => {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lineCounter = useRef(0); // Contador para IDs únicos
  const updateTimeoutRef = useRef(null); // Para debounce
  const lastValuesRef = useRef({}); // Cache dos últimos valores
  const chartRef = useRef(null); // Referência direta do chart
  const lastKnownPrices = useRef({}); // Cache dos últimos preços conhecidos
  const isUpdatingFromCalculator = useRef(false); // Flag para evitar loops de sincronização
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
          
          // Listener para capturar movimento das linhas
          const chart = widget.activeChart();
          
          // Armazenar referência para uso posterior
          chartRef.current = chart;
          
          // Listener para mudanças nas shapes/linhas - polling mais frequente
          if (onPriceChange) {
            const pollInterval = setInterval(() => {
              syncLinePriceCoordinates();
            }, 200); // Verificar a cada 0.2 segundos para maior responsividade
            
            // Cleanup
            return () => {
              if (pollInterval) {
                clearInterval(pollInterval);
              }
            };
          }
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

  // Função para sincronizar coordenadas de preço das linhas com calculadora
  const syncLinePriceCoordinates = () => {
    if (!chartReady || !chartRef.current || !onPriceChange || isUpdatingFromCalculator.current) return;
    
    try {
      const chart = chartRef.current;
      const allShapes = chart.getAllShapes();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Checking ${allShapes.length} shapes. Our IDs: Entry=${priceLineIds.current.entry}, Stop=${priceLineIds.current.stop}, Target=${priceLineIds.current.target}`);
      }
      
      // Verificar cada linha individualmente
      allShapes.forEach(shape => {
        if (!shape || !shape.points || shape.points.length === 0) return;
        
        const shapeId = shape.id;
        const currentPrice = shape.points[0].price;
        
        // Verificar se é uma das nossas linhas
        if (priceLineIds.current.entry === shapeId) {
          const lastPrice = lastKnownPrices.current.entry;
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.001) {
            lastKnownPrices.current.entry = currentPrice;
            onPriceChange('entryPrice', currentPrice.toString());
            if (process.env.NODE_ENV === 'development') {
              console.log(`🟢 Entry synced: ${currentPrice}`);
            }
          }
        } else if (priceLineIds.current.stop === shapeId) {
          const lastPrice = lastKnownPrices.current.stop;
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.001) {
            lastKnownPrices.current.stop = currentPrice;
            onPriceChange('stopLoss', currentPrice.toString());
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔴 Stop synced: ${currentPrice}`);
            }
          }
        } else if (priceLineIds.current.target === shapeId) {
          const lastPrice = lastKnownPrices.current.target;
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.001) {
            lastKnownPrices.current.target = currentPrice;
            onPriceChange('targetPrice', currentPrice.toString());
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔵 Target synced: ${currentPrice}`);
            }
          }
        }
      });
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error syncing coordinates:', error);
      }
    }
  };

  // Função para formatar preço com casas decimais adequadas
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1000) {
      return numPrice.toFixed(2);
    } else if (numPrice >= 100) {
      return numPrice.toFixed(3);
    } else if (numPrice >= 10) {
      return numPrice.toFixed(4);
    } else {
      return numPrice.toFixed(6);
    }
  };

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

  // Função otimizada para remover linhas - menos agressiva
  const clearAllLines = () => {
    if (!chartReady || !widgetRef.current) return;
    
    try {
      const chart = widgetRef.current.activeChart();
      let removedCount = 0;
      
      // MÉTODO 1: Remoção individual das linhas rastreadas
      ['entry', 'stop', 'target', 'smartTarget1', 'smartTarget2', 'smartTarget3'].forEach(lineType => {
        const lineId = priceLineIds.current[lineType];
        if (lineId) {
          try {
            chart.removeEntity(lineId);
            removedCount++;
            console.log(`🗑️ ${lineType} removed`);
          } catch (e) {
            console.warn(`⚠️ removeEntity failed for ${lineType}`);
          }
          priceLineIds.current[lineType] = null;
        }
      });
      
      // MÉTODO 2: Limpeza adicional apenas se necessário
      if (removedCount === 0) {
        try {
          const allEntities = chart.getAllShapes();
          if (allEntities.length > 0) {
            console.log(`🧹 Fallback: removing ${allEntities.length} orphaned entities`);
            allEntities.forEach(entity => {
              try {
                chart.removeEntity(entity.id);
              } catch (e) {
                // Silenciar erros de fallback
              }
            });
          }
        } catch (getAllError) {
          // Silenciar erro de getAllShapes se não disponível
        }
      }
      
      console.log(`🧹 Cleanup completed: ${removedCount} lines removed`);
      
    } catch (error) {
      console.error('❌ Error in cleanup:', error);
      // Reset forçado apenas em caso de erro
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

  // Função para criar/atualizar linhas horizontais - VERSÃO ROBUSTA
  const createOrUpdateLines = async () => {
    if (!chartReady || !widgetRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ createOrUpdateLines called but chart not ready');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 createOrUpdateLines called with:', {
        entryPrice,
        stopLoss,
        targetPrice,
        currentPrice,
        hasResults: !!results
      });
    }

    try {
      const chart = widgetRef.current.activeChart();
      
      // PASSO 1: LIMPEZA RADICAL E FORÇADA
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ FORCE CLEARING ALL LINES...');
      }
      
      // Método 1: Limpar linhas rastreadas
      Object.keys(priceLineIds.current).forEach(lineType => {
        const lineId = priceLineIds.current[lineType];
        if (lineId) {
          try {
            chart.removeEntity(lineId);
            if (process.env.NODE_ENV === 'development') {
              console.log(`🗑️ Force removed ${lineType}`);
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to remove ${lineType}`);
            }
          }
        }
      });
      
      // Método 2: Limpar TODAS as entidades
      try {
        const allEntities = chart.getAllShapes();
        allEntities.forEach(entity => {
          try {
            chart.removeEntity(entity.id);
          } catch (e) {
            // Silenciar erros individuais
          }
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`🧹 Removed ${allEntities.length} total entities`);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('getAllShapes failed');
        }
      }
      
      // Método 3: Reset completo dos refs
      priceLineIds.current = {
        entry: null,
        stop: null,
        target: null,
        smartTarget1: null,
        smartTarget2: null,
        smartTarget3: null
      };
      
      // Reset dos preços conhecidos
      lastKnownPrices.current = {
        entry: null,
        stop: null,
        target: null,
        smartTarget1: null,
        smartTarget2: null,
        smartTarget3: null
      };
      
      // PASSO 2: Delay para garantir limpeza completa
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // PASSO 2.5: Verificação leve de limpeza (opcional)
      if (process.env.NODE_ENV === 'development') {
        try {
          const remainingEntities = chart.getAllShapes();
          if (remainingEntities.length > 0) {
            console.warn(`⚠️ ${remainingEntities.length} entities remain after cleanup`);
          } else {
            console.log('✅ Chart is clean');
          }
        } catch (e) {
          // Silenciar erros de verificação
        }
      }
      
      // PASSO 3: Obter range de tempo para as linhas horizontais
      const visibleRange = chart.getVisibleRange();
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = visibleRange.from || (currentTime - 86400 * 30); // 30 dias atrás
      const endTime = visibleRange.to || currentTime;

      // PASSO 4: Criar linha de entrada (verde) se válida
      if (entryPrice && entryPrice.toString().trim() !== '') {
        lineCounter.current++;
        if (process.env.NODE_ENV === 'development') {
          console.log('🟢 Creating entry line:', entryPrice);
        }
        const entryLineId = chart.createShape(
          { time: startTime, price: parseFloat(entryPrice) },
          {
            shape: "horizontal_line",
            lock: false,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 10,
              linewidth: 2,
              linecolor: "#00FF00",
              extendLeft: false,
              extendRight: true,
              text: `🟢 Entrada: $${formatPrice(entryPrice)}`,
              horzLabelsAlign: "right",
              vertLabelsAlign: "middle",
              textColor: "#FFFFFF",
              backgroundColor: "#00AA00",
              borderColor: "#00FF00",
              borderWidth: 1
            }
          }
        );
        
        
        priceLineIds.current.entry = entryLineId;
        lastKnownPrices.current.entry = parseFloat(entryPrice);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Entry line created:', entryPrice, 'ID:', entryLineId);
        }
      }

      // PASSO 5: Criar linha de stop loss (vermelho) se válida
      if (stopLoss && stopLoss.toString().trim() !== '') {
        lineCounter.current++;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔴 Creating stop loss line:', stopLoss);
        }
        const stopLineId = chart.createShape(
          { time: startTime, price: parseFloat(stopLoss) },
          {
            shape: "horizontal_line",
            lock: false,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 10,
              linewidth: 2,
              linecolor: "#FF0000",
              extendLeft: false,
              extendRight: true,
              text: `🛑 Stop: $${formatPrice(stopLoss)}`,
              horzLabelsAlign: "right",
              vertLabelsAlign: "middle",
              textColor: "#FFFFFF",
              backgroundColor: "#CC0000",
              borderColor: "#FF0000",
              borderWidth: 1
            }
          }
        );
        
        
        priceLineIds.current.stop = stopLineId;
        lastKnownPrices.current.stop = parseFloat(stopLoss);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Stop loss line created:', stopLoss, 'ID:', stopLineId);
        }
      }

      // PASSO 6: Criar linha de target (azul) apenas se não há alvos inteligentes
      const smartTargets = calculateSmartTargets();
      const hasSmartTargets = smartTargets && results;
      
      if (targetPrice && targetPrice.toString().trim() !== '' && !hasSmartTargets) {
        lineCounter.current++;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔵 Creating manual target line:', targetPrice);
        }
        const targetLineId = chart.createShape(
          { time: startTime, price: parseFloat(targetPrice) },
          {
            shape: "horizontal_line",
            lock: false,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 10,
              linewidth: 2,
              linecolor: "#0000FF",
              extendLeft: false,
              extendRight: true,
              text: `🎯 Alvo: $${formatPrice(targetPrice)}`,
              horzLabelsAlign: "right",
              vertLabelsAlign: "middle",
              textColor: "#FFFFFF",
              backgroundColor: "#0000CC",
              borderColor: "#0000FF",
              borderWidth: 1
            }
          }
        );
        
        
        priceLineIds.current.target = targetLineId;
        lastKnownPrices.current.target = parseFloat(targetPrice);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Target line created:', targetPrice, 'ID:', targetLineId);
        }
      }

      // PASSO 5: Criar linha de stop loss (vermelho) se válida
      if (stopLoss && stopLoss.toString().trim() !== '') {
        lineCounter.current++;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔴 Creating stop loss line:', stopLoss);
        }
        const stopLineId = chart.createShape(
          { time: startTime, price: parseFloat(stopLoss) },
          {
            shape: "horizontal_line",
            lock: false,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 10,
              linewidth: 2,
              linecolor: "#FF0000",
              extendLeft: false,
              extendRight: true,
              text: `🛑 Stop: $${formatPrice(stopLoss)}`,
              horzLabelsAlign: "right",
              vertLabelsAlign: "middle",
              textColor: "#FFFFFF",
              backgroundColor: "#CC0000",
              borderColor: "#FF0000",
              borderWidth: 1
            }
          }
        );
        priceLineIds.current.stop = stopLineId;
        lastKnownPrices.current.stop = parseFloat(stopLoss);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Stop loss line created:', stopLoss);
        }
      }

      // PASSO 6: Criar linha de target (azul) apenas se não há alvos inteligentes
      // (smartTargets já foi calculado acima)
      
      if (targetPrice && targetPrice.toString().trim() !== '' && !hasSmartTargets) {
        lineCounter.current++;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔵 Creating manual target line:', targetPrice);
        }
        const targetLineId = chart.createShape(
          { time: startTime, price: parseFloat(targetPrice) },
          {
            shape: "horizontal_line",
            lock: false,
            disableSelection: false,
            disableSave: false,
            disableUndo: false,
            overrides: {
              showLabel: true,
              fontSize: 10,
              linewidth: 2,
              linecolor: "#0000FF",
              extendLeft: false,
              extendRight: true,
              text: `🎯 Alvo: $${formatPrice(targetPrice)}`,
              horzLabelsAlign: "right",
              vertLabelsAlign: "middle",
              textColor: "#FFFFFF",
              backgroundColor: "#0000CC",
              borderColor: "#0000FF",
              borderWidth: 1
            }
          }
        );
        priceLineIds.current.target = targetLineId;
        lastKnownPrices.current.target = parseFloat(targetPrice);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Manual target line created:', targetPrice);
        }
      } else if (hasSmartTargets && process.env.NODE_ENV === 'development') {
        console.log('🚫 Skipping manual target - smart targets will be shown instead');
      }

      // PASSO 7: Criar alvos inteligentes se há resultados
      if (hasSmartTargets) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🟠 Creating smart targets:', smartTargets.length);
        }
        smartTargets.forEach((target, index) => {
          lineCounter.current++;
          const lineType = `smartTarget${index + 1}`;
          const colors = ['#FFA500', '#FF8C00', '#FF6347']; // Laranja, laranja escuro, vermelho coral
          const targetLineId = chart.createShape(
            { time: startTime, price: target.price },
            {
              shape: "horizontal_line",
              lock: false,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                showLabel: true,
                fontSize: 9,
                linewidth: 1,
                linecolor: colors[index],
                linestyle: 2, // Linha pontilhada
                extendLeft: false,
                extendRight: true,
                text: `🎯 ${target.label}: $${formatPrice(target.price)}`,
                horzLabelsAlign: "right",
                vertLabelsAlign: "middle",
                textColor: "#FFFFFF",
                backgroundColor: colors[index],
                borderColor: colors[index],
                borderWidth: 1
              }
            }
          );
          priceLineIds.current[lineType] = targetLineId;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Smart target ${index + 1} line created:`, target.price);
          }
        });
      }

      const totalLines = Object.values(priceLineIds.current).filter(Boolean).length;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Lines status: ${totalLines} active lines`);
      }
      
      // PASSO FINAL: Forçar refresh visual
      try {
        // Força uma pequena atualização visual
        const visibleRange = chart.getVisibleRange();
        chart.setVisibleRange(visibleRange);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Chart visual refresh forced');
        }
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Chart refresh failed:', refreshError);
        }
      }

    } catch (error) {
      console.error('❌ Error creating/updating horizontal lines:', error);
    }
  };


  // useEffect para mudanças nos valores - mais conservador
  useEffect(() => {
    if (!chartReady || !widgetRef.current) return;

    // Verificar apenas se mudanças estruturais realmente necessárias
    const currentValues = {
      hasEntryPrice: !!entryPrice && entryPrice.trim() !== '',
      hasStopLoss: !!stopLoss && stopLoss.trim() !== '',
      hasTargetPrice: !!targetPrice && targetPrice.trim() !== '',
      hasResults: !!results,
      tradeDirection
    };
    
    const structuralChange = JSON.stringify(currentValues) !== JSON.stringify(lastValuesRef.current);
    
    if (!structuralChange) {
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 No structural changes, skipping recreation');
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('💡 Structural changes detected, recreating lines...');
    }
    
    // Definir flag para evitar sincronização durante recriação
    isUpdatingFromCalculator.current = true;
    
    lastValuesRef.current = currentValues;
    
    // Limpar timeout anterior
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce para recriação completa
    updateTimeoutRef.current = setTimeout(() => {
      createOrUpdateLines();
      // Liberar flag após recriação
      setTimeout(() => {
        isUpdatingFromCalculator.current = false;
      }, 1500);
    }, 500);

    // Cleanup do timeout quando componente desmonta ou deps mudam
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
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