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
  
  // Debug apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 TradingViewChartAdvanced mounted');
  }
  
  // Logs para localStorage apenas em desenvolvimento
  const addToLocalStorage = (log) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const logs = JSON.parse(localStorage.getItem('tradingViewLogs') || '[]');
      logs.push(`${new Date().toISOString()}: ${log}`);
      // Manter apenas últimos 20 logs
      if (logs.length > 20) logs.shift();
      localStorage.setItem('tradingViewLogs', JSON.stringify(logs));
    } catch (e) {
      // Silenciar erros de localStorage
    }
  };
  
  addToLocalStorage('🚀 Component mounted');
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
  
  // Função helper para sincronizar preços de forma centralizada
  const syncPriceChange = (fieldName, currentPrice, lineType) => {
    const lastPrice = lastKnownPrices.current[lineType];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${lineType} line found - Current: ${currentPrice}, Last: ${lastPrice}, Diff: ${Math.abs(currentPrice - (lastPrice || 0))}`);
    }
    
    if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.01) {
      lastKnownPrices.current[lineType] = currentPrice;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 ${lineType} syncing: ${currentPrice} -> calling onPriceChange('${fieldName}', '${currentPrice}')`);
      }
      addToLocalStorage(`🔄 ${lineType} synced: ${currentPrice}`);
      
      // Temporariamente bloquear recriação
      isUpdatingFromCalculator.current = true;
      try {
        onPriceChange(fieldName, currentPrice.toString());
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ onPriceChange called successfully for ${lineType}`);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Error calling onPriceChange for ${lineType}:`, e);
        }
      }
      setTimeout(() => {
        isUpdatingFromCalculator.current = false;
      }, 100);
    }
  };
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
          const chart = widget.activeChart();
          
          console.log('📊 Chart object:', !!chart);
          console.log('📊 Chart methods available:', {
            getAllShapes: typeof chart?.getAllShapes,
            createShape: typeof chart?.createShape,
            removeEntity: typeof chart?.removeEntity,
            createPriceLine: typeof chart?.createPriceLine,
            removePriceLine: typeof chart?.removePriceLine,
            getPriceLine: typeof chart?.getPriceLine,
            getAllPriceLines: typeof chart?.getAllPriceLines,
            createHorizontalLine: typeof chart?.createHorizontalLine,
            createOrderLine: typeof chart?.createOrderLine,
            createPositionLine: typeof chart?.createPositionLine
          });
          
          // Listar todas as funções do chart
          const chartMethods = Object.getOwnPropertyNames(chart)
            .filter(name => typeof chart[name] === 'function')
            .filter(name => name.toLowerCase().includes('line') || name.toLowerCase().includes('price'));
          console.log('📊 Chart line/price methods:', chartMethods);
          
          // Armazenar referência para uso posterior
          chartRef.current = chart;
          
          setChartReady(true);
          setHasError(false);
          
          // Criar linhas horizontais iniciais
          setTimeout(() => {
            console.log('🏗️ Creating initial lines...');
            createOrUpdateLines();
          }, 1000);
          
          // Configurar eventos nativos do TradingView (sem polling)
          if (onPriceChange) {
            console.log('🔄 Setting up native TradingView events...');
            
            // Tentar usar eventos nativos primeiro
            try {
              // Evento de mudança em shapes/linhas
              if (typeof chart.onChartDataChanged === 'function') {
                chart.onChartDataChanged().subscribe(null, () => {
                  console.log('📊 Chart data changed event');
                  syncLinePriceCoordinates();
                });
              }
              
              // Evento de mudança em estudos/overlays
              if (typeof chart.onDataChanged === 'function') {
                chart.onDataChanged().subscribe(null, () => {
                  console.log('📊 Data changed event');
                  syncLinePriceCoordinates();
                });
              }
              
              // Fallback: polling reduzido apenas se eventos não estiverem disponíveis
              const pollInterval = setInterval(() => {
                syncLinePriceCoordinates();
              }, 2000); // Reduzido para 2 segundos (era 200ms)
              
              console.log('✅ Event listeners configured (with 2s fallback polling)');
              
              // Cleanup
              return () => {
                if (pollInterval) {
                  clearInterval(pollInterval);
                }
              };
            } catch (e) {
              console.warn('⚠️ Could not set up native events, using reduced polling');
              
              // Fallback com polling muito reduzido
              const pollInterval = setInterval(() => {
                syncLinePriceCoordinates();
              }, 3000); // 3 segundos apenas
              
              return () => {
                if (pollInterval) {
                  clearInterval(pollInterval);
                }
              };
            }
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Checking TradingView script... attempt ${retryCount + 1}/${maxRetries}`);
        console.log('🔍 window.TradingView available:', typeof window.TradingView);
      }
      
      if (typeof window.TradingView !== 'undefined') {
        console.log('✅ TradingView script loaded, initializing chart');
        console.log('🔧 About to call initTradingViewChart()');
        addToLocalStorage('✅ TradingView script loaded, initializing chart');
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

  // Função para sincronizar coordenadas de preço das linhas com calculadora (otimizada)
  const syncLinePriceCoordinates = () => {
    if (!chartReady || !chartRef.current || !onPriceChange || isUpdatingFromCalculator.current) {
      return;
    }
    
    const chart = chartRef.current;
    
    // Tentar usar getAllPriceLines se disponível (mais preciso)
    if (typeof chart.getAllPriceLines === 'function') {
      try {
        const priceLines = chart.getAllPriceLines();
        console.log('📊 PriceLines found:', priceLines.length);
        addToLocalStorage(`📊 PriceLines check: ${priceLines.length} lines`);
        
        priceLines.forEach(line => {
          console.log('📊 PriceLine:', line);
          // Implementar sincronização com PriceLines
        });
        
        return; // Usar PriceLines se disponível
      } catch (e) {
        console.log('⚠️ getAllPriceLines failed:', e);
      }
    }
    
    try {
      const chart = chartRef.current;
      const allShapes = chart.getAllShapes();
      
      // Log apenas se shapes mudaram significativamente
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Checking ${allShapes.length} shapes`);
      }
      
      // Verificar cada linha individualmente
      allShapes.forEach(shape => {
        if (!shape) return;
        
        const shapeId = shape.id;
        
        // Tentar diferentes formas de acessar o preço
        let currentPrice = null;
        if (shape.points && shape.points.length > 0) {
          currentPrice = shape.points[0].price || shape.points[0].value || shape.points[0].y;
        } else if (shape.price !== undefined) {
          currentPrice = shape.price;
        } else if (shape.value !== undefined) {
          currentPrice = shape.value;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Shape ${shapeId}:`, {
            hasPoints: !!shape.points,
            pointsLength: shape.points?.length,
            price: currentPrice,
            fullShape: shape
          });
        }
        
        if (currentPrice === null || currentPrice === undefined) {
          return; // Pular shapes sem preço
        }
        
        // Verificar se é uma das nossas linhas
        if (priceLineIds.current.entry === shapeId) {
          const lastPrice = lastKnownPrices.current.entry;
          // Força log sempre
          console.log(`🔍 Entry line found - Current: ${currentPrice}, Last: ${lastPrice}, Diff: ${Math.abs(currentPrice - lastPrice)}`);
          console.log(`🔍 Entry condition check: lastPrice=${lastPrice}, diffThreshold=${Math.abs(currentPrice - lastPrice) > 0.01}`);
          
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.01) {
            lastKnownPrices.current.entry = currentPrice;
            
            // Força log sempre
            console.log(`🟢 Entry syncing: ${currentPrice} -> calling onPriceChange('entryPrice', '${currentPrice}')`);
            window.tradingViewLogs.push(`🟢 Entry synced: ${currentPrice} at ${new Date().toLocaleTimeString()}`);
            addToLocalStorage(`🟢 Entry synced: ${currentPrice}`);
            
            
            // Temporariamente bloquear recriação
            isUpdatingFromCalculator.current = true;
            try {
              onPriceChange('entryPrice', currentPrice.toString());
              // Força log sempre
              console.log(`✅ onPriceChange called successfully for entry`);
              
            } catch (e) {
              // Força log sempre
              console.error(`❌ Error calling onPriceChange for entry:`, e);
              
            }
            setTimeout(() => {
              isUpdatingFromCalculator.current = false;
            }, 100);
          }
        } else if (priceLineIds.current.stop === shapeId) {
          const lastPrice = lastKnownPrices.current.stop;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Stop line found - Current: ${currentPrice}, Last: ${lastPrice}, Diff: ${Math.abs(currentPrice - lastPrice)}`);
          }
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.01) {
            lastKnownPrices.current.stop = currentPrice;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔴 Stop syncing: ${currentPrice} -> calling onPriceChange('stopLoss', '${currentPrice}')`);
            }
            
            // Temporariamente bloquear recriação
            isUpdatingFromCalculator.current = true;
            try {
              onPriceChange('stopLoss', currentPrice.toString());
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ onPriceChange called successfully for stop`);
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`❌ Error calling onPriceChange for stop:`, e);
              }
            }
            setTimeout(() => {
              isUpdatingFromCalculator.current = false;
            }, 100);
          }
        } else if (priceLineIds.current.target === shapeId) {
          const lastPrice = lastKnownPrices.current.target;
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Target line found - Current: ${currentPrice}, Last: ${lastPrice}, Diff: ${Math.abs(currentPrice - lastPrice)}`);
          }
          if (lastPrice && Math.abs(currentPrice - lastPrice) > 0.01) {
            lastKnownPrices.current.target = currentPrice;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔵 Target syncing: ${currentPrice} -> calling onPriceChange('targetPrice', '${currentPrice}')`);
            }
            
            // Temporariamente bloquear recriação
            isUpdatingFromCalculator.current = true;
            try {
              onPriceChange('targetPrice', currentPrice.toString());
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ onPriceChange called successfully for target`);
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`❌ Error calling onPriceChange for target:`, e);
              }
            }
            setTimeout(() => {
              isUpdatingFromCalculator.current = false;
            }, 100);
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
        console.log('❌ createOrUpdateLines called but chart not ready', {
          chartReady,
          widgetRef: !!widgetRef.current
        });
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
        let entryLineId;
        try {
          // Tentar usar createPriceLine (função nativa) primeiro
          if (typeof chart.createPriceLine === 'function') {
            entryLineId = chart.createPriceLine({
              price: parseFloat(entryPrice),
              color: '#00FF00',
              lineWidth: 2,
              lineStyle: 0, // solid
              axisLabelVisible: true,
              title: `🟢 Entrada`
            });
            addToLocalStorage(`🟢 Entry PriceLine created: ID=${entryLineId}, Price=${entryPrice}`);
          } else {
            // Fallback para createShape
            entryLineId = chart.createShape(
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
                  text: `🟢 Entrada`,
                  horzLabelsAlign: "right",
                  vertLabelsAlign: "middle",
                  textColor: "#FFFFFF",
                  backgroundColor: "#00AA00",
                  borderColor: "#00FF00",
                  borderWidth: 1
                }
              }
            );
            addToLocalStorage(`🟢 Entry Shape created: ID=${entryLineId}, Price=${entryPrice}`);
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🟢 Entry line created successfully:', entryLineId);
          }
        } catch (createError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error creating entry line:', createError);
          }
          addToLocalStorage(`❌ Error creating entry line: ${createError.message}`);
          return;
        }
        
        
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
              text: `🛑 Stop`,
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
              text: `🎯 Alvo`,
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
                text: `🎯 ${target.label}`,
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


  // useEffect ULTRA conservador - só atualiza quando valores REALMENTE mudam
  useEffect(() => {
    if (!chartReady || !widgetRef.current || isUpdatingFromCalculator.current) return;

    // Criar hash dos valores importantes para detectar mudanças reais
    const currentHash = `${entryPrice || 'null'}_${stopLoss || 'null'}_${targetPrice || 'null'}_${tradeDirection || 'LONG'}_${results?.smartTargets?.length || 0}`;
    
    // Se hash não mudou, não fazer nada
    if (currentHash === lastValuesRef.current?.hash) {
      return;
    }
    
    // Primeiro render OU mudança real detectada
    if (process.env.NODE_ENV === 'development') {
      console.log('💡 Real value change detected, updating lines...', {
        oldHash: lastValuesRef.current?.hash,
        newHash: currentHash
      });
    }
    
    lastValuesRef.current = { hash: currentHash };
    
    // Limpar timeout anterior
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce para evitar recriações rápidas
    updateTimeoutRef.current = setTimeout(() => {
      createOrUpdateLines();
    }, 500);

    // Cleanup do timeout quando componente desmonta ou deps mudam
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [chartReady, entryPrice, stopLoss, targetPrice, results, tradeDirection]);

  // Função de teste para debug
  const testSyncFunction = () => {
    console.log('🔧 Testing sync function manually...');
    console.log('🔧 Chart ready:', chartReady);
    console.log('🔧 Chart ref:', !!chartRef.current);
    console.log('🔧 onPriceChange:', !!onPriceChange);
    console.log('🔧 isUpdatingFromCalculator:', isUpdatingFromCalculator.current);
    console.log('🔧 priceLineIds:', priceLineIds.current);
    console.log('🔧 lastKnownPrices:', lastKnownPrices.current);
    
    // Capturar no log global
    window.tradingViewLogs.push(`🔧 Test sync: chartReady=${chartReady}, chartRef=${!!chartRef.current}, onPriceChange=${!!onPriceChange}`);
    
    if (chartRef.current) {
      try {
        const allShapes = chartRef.current.getAllShapes();
        console.log('🔧 All shapes:', allShapes.length, allShapes);
        window.tradingViewLogs.push(`🔧 Shapes found: ${allShapes.length}`);
      } catch (e) {
        console.error('🔧 Error getting shapes:', e);
        window.tradingViewLogs.push(`🔧 Error getting shapes: ${e.message}`);
      }
    }
    
    syncLinePriceCoordinates();
  };

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
      
      {chartReady && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, display: 'flex', gap: '5px' }}>
          <button 
            onClick={testSyncFunction}
            style={{
              padding: '5px 10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test Sync
          </button>
          <button 
            onClick={() => {
              console.log('📋 TradingView Logs:', window.tradingViewLogs);
              alert('Logs mostrados no console. Veja o console (F12)');
            }}
            style={{
              padding: '5px 10px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Show Logs
          </button>
        </div>
      )}
      
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