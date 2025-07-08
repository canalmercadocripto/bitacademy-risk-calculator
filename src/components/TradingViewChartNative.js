import React, { useEffect, useRef, useState } from 'react';

const TradingViewChartNative = ({ 
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
  const priceLineIds = useRef(new Set());

  useEffect(() => {
    // Função para criar linhas horizontais nativas
    const createHorizontalLines = () => {
      if (!chartReady || !widgetRef.current) return;

      try {
        const chart = widgetRef.current.activeChart();
        
        // Limpar linhas anteriores
        priceLineIds.current.forEach(id => {
          try {
            chart.removeEntity(id);
          } catch (e) {
            console.warn('Error removing line:', e);
          }
        });
        priceLineIds.current.clear();

        // Obter range de tempo visível
        const visibleRange = chart.getVisibleRange();
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = visibleRange.from || (currentTime - 86400); // 24h atrás
        const endTime = visibleRange.to || currentTime;

        // Criar linha de entrada
        if (entryPrice) {
          const entryLineId = chart.createMultipointShape(
            [
              { time: startTime, price: parseFloat(entryPrice) },
              { time: endTime, price: parseFloat(entryPrice) }
            ],
            {
              shape: "horizontal_line",
              lock: true,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                linecolor: "#28a745",
                linewidth: 2,
                linestyle: 0, // solid
                showLabel: true,
                text: `🟢 Entrada: $${parseFloat(entryPrice).toFixed(4)}`,
                textColor: "#28a745",
                fontSize: 12,
                fontBold: true,
                horzLabelsAlign: "right",
                vertLabelsAlign: "middle",
                extendLeft: true,
                extendRight: true
              }
            }
          );
          priceLineIds.current.add(entryLineId);
        }

        // Criar linha de stop loss
        if (stopLoss) {
          const stopLineId = chart.createMultipointShape(
            [
              { time: startTime, price: parseFloat(stopLoss) },
              { time: endTime, price: parseFloat(stopLoss) }
            ],
            {
              shape: "horizontal_line",
              lock: true,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                linecolor: "#dc3545",
                linewidth: 2,
                linestyle: 0, // solid
                showLabel: true,
                text: `🛑 Stop: $${parseFloat(stopLoss).toFixed(4)}`,
                textColor: "#dc3545",
                fontSize: 12,
                fontBold: true,
                horzLabelsAlign: "right",
                vertLabelsAlign: "middle",
                extendLeft: true,
                extendRight: true
              }
            }
          );
          priceLineIds.current.add(stopLineId);
        }

        // Criar linha de target
        if (targetPrice) {
          const targetLineId = chart.createMultipointShape(
            [
              { time: startTime, price: parseFloat(targetPrice) },
              { time: endTime, price: parseFloat(targetPrice) }
            ],
            {
              shape: "horizontal_line",
              lock: true,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                linecolor: "#17a2b8",
                linewidth: 2,
                linestyle: 0, // solid
                showLabel: true,
                text: `🎯 Alvo: $${parseFloat(targetPrice).toFixed(4)}`,
                textColor: "#17a2b8",
                fontSize: 12,
                fontBold: true,
                horzLabelsAlign: "right",
                vertLabelsAlign: "middle",
                extendLeft: true,
                extendRight: true
              }
            }
          );
          priceLineIds.current.add(targetLineId);
        }

        // Criar linha de preço atual (se diferente da entrada)
        if (currentPrice && currentPrice !== entryPrice) {
          const currentLineId = chart.createMultipointShape(
            [
              { time: startTime, price: parseFloat(currentPrice) },
              { time: endTime, price: parseFloat(currentPrice) }
            ],
            {
              shape: "horizontal_line",
              lock: true,
              disableSelection: false,
              disableSave: false,
              disableUndo: false,
              overrides: {
                linecolor: "#ffc107",
                linewidth: 2,
                linestyle: 2, // dashed
                showLabel: true,
                text: `📊 Atual: $${parseFloat(currentPrice).toFixed(4)}`,
                textColor: "#ffc107",
                fontSize: 12,
                fontBold: true,
                horzLabelsAlign: "right",
                vertLabelsAlign: "middle",
                extendLeft: true,
                extendRight: true
              }
            }
          );
          priceLineIds.current.add(currentLineId);
        }

        console.log('✅ Linhas horizontais criadas:', priceLineIds.current.size);

      } catch (error) {
        console.error('❌ Error creating horizontal lines:', error);
      }
    };

    // Função para inicializar o widget TradingView
    const initTradingView = async () => {
      try {
        // Aguardar o script do TradingView carregar
        if (typeof window.TradingView === 'undefined') {
          console.warn('TradingView library not loaded yet');
          return;
        }

        // Limpar widget anterior se existir
        if (widgetRef.current) {
          try {
            widgetRef.current.remove();
          } catch (e) {
            console.warn('Error removing previous widget:', e);
          }
        }

        // Configurar datafeed simples
        const datafeed = new window.Datafeeds.UDFCompatibleDatafeed(
          'https://demo-feed-data.tradingview.com',
          undefined,
          {
            maxResponseLength: 1000,
            expectedOrder: 'latestFirst',
          }
        );

        console.log('📊 Initializing TradingView with symbol:', symbol);

        // Criar novo widget
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
            'use_localstorage_for_settings',
            'volume_force_overlay'
          ],
          enabled_features: [
            'study_templates'
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

        // Quando o widget estiver pronto
        widget.onChartReady(() => {
          console.log('📊 TradingView widget ready');
          setChartReady(true);
          setHasError(false);
          
          // Configurar listener para atualizar linhas quando o range mudar
          const chart = widget.activeChart();
          chart.onVisibleRangeChanged().subscribe(null, () => {
            console.log('📊 Visible range changed - updating lines');
            setTimeout(() => {
              // Recriar linhas após mudança de range
              if (entryPrice || stopLoss || targetPrice) {
                createHorizontalLines();
              }
            }, 100);
          });
        });

        // Aguardar o header estar pronto para adicionar funcionalidades
        widget.headerReady().then(() => {
          console.log('📱 TradingView header ready');
        });

      } catch (error) {
        console.error('❌ Error initializing TradingView:', error);
        setHasError(true);
        setChartReady(false);
      }
    };

    // Verificar se os scripts estão carregados
    const checkScripts = () => {
      if (typeof window.TradingView !== 'undefined' && typeof window.Datafeeds !== 'undefined') {
        initTradingView();
      } else {
        setTimeout(checkScripts, 100);
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
  }, [symbol, theme, chartReady, entryPrice, stopLoss, targetPrice, currentPrice]);

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
          <div>❌ Erro ao carregar gráfico</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            Verifique se a biblioteca TradingView está carregada
          </div>
        </div>
      )}
      
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico TradingView...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChartNative;