import React, { useEffect, useRef, useState } from 'react';

const TradingViewChartAdvanced = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null,
  currentPrice = null
}) => {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const priceLineIds = useRef([]);

  useEffect(() => {

    // Inicializar TradingView Advanced Charts
    const initTradingViewChart = async () => {
      try {
        // Verificar se as bibliotecas estão carregadas
        if (typeof window.TradingView === 'undefined') {
          console.error('❌ TradingView library not loaded');
          setHasError(true);
          return;
        }

        if (typeof window.Datafeeds === 'undefined') {
          console.error('❌ Datafeeds library not loaded');
          setHasError(true);
          return;
        }

        if (!chartContainerRef.current) {
          console.error('❌ Chart container not found');
          setHasError(true);
          return;
        }

        console.log('✅ Initializing TradingView Advanced Charts');

        // Configurar datafeed
        const datafeed = new window.Datafeeds.UDFCompatibleDatafeed(
          'https://demo-feed-data.tradingview.com',
          undefined,
          {
            maxResponseLength: 1000,
            expectedOrder: 'latestFirst',
          }
        );

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
          
          // Criar linhas horizontais
          createHorizontalLines();
          
          // Listener para atualizar linhas quando o range mudar
          const chart = widget.activeChart();
          chart.onVisibleRangeChanged().subscribe(null, () => {
            console.log('📊 Visible range changed - updating horizontal lines');
            setTimeout(() => {
              createHorizontalLines();
            }, 200);
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
      
      if (typeof window.TradingView !== 'undefined' && typeof window.Datafeeds !== 'undefined') {
        console.log('✅ Scripts loaded, initializing chart');
        initTradingViewChart();
      } else if (retryCount < maxRetries) {
        console.log(`⏳ Waiting for scripts... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkScripts(retryCount + 1), 100);
      } else {
        console.error('❌ Failed to load TradingView scripts');
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

  // Função para criar linhas horizontais - definida fora do useEffect para poder ser chamada em qualquer lugar
  const createHorizontalLines = () => {
    if (!chartReady || !widgetRef.current) return;

    try {
      const chart = widgetRef.current.activeChart();
      
      // Remover linhas anteriores
      priceLineIds.current.forEach(lineId => {
        try {
          chart.removeEntity(lineId);
        } catch (e) {
          console.warn('Error removing line:', e);
        }
      });
      priceLineIds.current = [];

      // Obter range de tempo para as linhas horizontais
      const visibleRange = chart.getVisibleRange();
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = visibleRange.from || (currentTime - 86400 * 30); // 30 dias atrás
      const endTime = visibleRange.to || currentTime;

      // Criar linha de entrada (verde)
      if (entryPrice) {
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
              text: `🟢 Entrada: $${parseFloat(entryPrice).toFixed(4)}`
            }
          }
        );
        priceLineIds.current.push(entryLineId);
        console.log('✅ Entry line created:', entryPrice);
      }

      // Criar linha de stop loss (vermelho)
      if (stopLoss) {
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
              text: `🛑 Stop: $${parseFloat(stopLoss).toFixed(4)}`
            }
          }
        );
        priceLineIds.current.push(stopLineId);
        console.log('✅ Stop loss line created:', stopLoss);
      }

      // Criar linha de target (azul)
      if (targetPrice) {
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
              text: `🎯 Alvo: $${parseFloat(targetPrice).toFixed(4)}`
            }
          }
        );
        priceLineIds.current.push(targetLineId);
        console.log('✅ Target line created:', targetPrice);
      }

      // Criar linha de preço atual (amarelo)
      if (currentPrice && currentPrice !== entryPrice) {
        const currentLineId = chart.createMultipointShape(
          [
            { time: startTime, price: parseFloat(currentPrice) },
            { time: endTime, price: parseFloat(currentPrice) }
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
              linecolor: "#FFFF00",
              extendLeft: true,
              extendRight: true,
              text: `📊 Atual: $${parseFloat(currentPrice).toFixed(4)}`
            }
          }
        );
        priceLineIds.current.push(currentLineId);
        console.log('✅ Current price line created:', currentPrice);
      }

      console.log('✅ All horizontal lines created:', priceLineIds.current.length);

    } catch (error) {
      console.error('❌ Error creating horizontal lines:', error);
    }
  };

  // useEffect para atualizar linhas quando preços mudarem
  useEffect(() => {
    if (chartReady && widgetRef.current) {
      const chart = widgetRef.current.activeChart();
      if (chart) {
        setTimeout(() => {
          createHorizontalLines();
        }, 100);
      }
    }
  }, [chartReady, entryPrice, stopLoss, targetPrice, currentPrice]);

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
            Possíveis causas:
            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
              <li>Biblioteca TradingView Advanced Charts não carregada</li>
              <li>Datafeed UDF não disponível</li>
              <li>Problema de conexão com demo feed</li>
            </ul>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Verifique o console do navegador para mais detalhes
            </div>
          </div>
        </div>
      )}
      
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando TradingView Advanced Charts...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChartAdvanced;