import React, { useState, useEffect, useRef } from 'react';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null,
  currentPrice = null
}) => {
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const chartContainerRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [realChartRange, setRealChartRange] = useState({ min: 0, max: 0 });
  const [priceScaleData, setPriceScaleData] = useState([]);
  const iframeRef = useRef(null);

  // Referência para o widget TradingView
  const tvWidgetRef = useRef(null);
  const [widget, setWidget] = useState(null);

  // Effect para inicializar o widget TradingView nativo
  useEffect(() => {
    const initializeWidget = () => {
      if (!chartContainerRef.current || widget) return;

      console.log('🎯 Inicializando TradingView Widget nativo...');

      // Garantir que a biblioteca TradingView está carregada
      if (!window.TradingView) {
        console.log('⏳ Aguardando biblioteca TradingView carregar...');
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.onload = () => {
          setTimeout(initializeWidget, 1000);
        };
        document.head.appendChild(script);
        return;
      }

      try {
        const tvWidget = new window.TradingView.widget({
          container_id: 'tradingview-widget',
          width: '100%',
          height: '100%',
          symbol: symbol,
          interval: '5',
          timezone: 'America/Sao_Paulo',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'pt_BR',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: [],
          // Configurações cruciais para API de desenhos
          drawings_access: {
            type: 'black',
            tools: [
              { name: 'LineToolHorzLine' }
            ]
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'save_chart_properties_to_local_storage'
          ],
          enabled_features: [
            'study_templates'
          ],
          onChartReady: () => {
            console.log('🎯 TradingView Widget carregado com sucesso!');
            setWidget(tvWidget);
            setChartReady(true);
            
            // Configurar monitoramento de dimensões
            const handleResize = () => {
              if (chartContainerRef.current) {
                const rect = chartContainerRef.current.getBoundingClientRect();
                setChartDimensions({ width: rect.width, height: rect.height });
              }
            };
            handleResize();
            window.addEventListener('resize', handleResize);
          }
        });

        tvWidgetRef.current = tvWidget;

      } catch (error) {
        console.error('❌ Erro ao inicializar TradingView Widget:', error);
        setHasError(true);
      }
    };

    const timer = setTimeout(initializeWidget, 500);

    return () => {
      clearTimeout(timer);
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
        } catch (error) {
          console.log('Erro ao remover widget:', error);
        }
      }
    };
  }, [symbol, theme]);

  // Função para adicionar linhas horizontais nativas do TradingView
  const addPriceLevelsToChart = () => {
    if (!widget || !chartReady) {
      console.log('❌ Widget não está pronto para adicionar linhas');
      return;
    }

    console.log('🎯 Adicionando linhas de preço ao gráfico nativo...', {
      entryPrice,
      stopLoss,
      targetPrice
    });

    try {
      widget.onChartReady(() => {
        const chart = widget.chart();
        
        // Remover linhas anteriores
        chart.getAllShapes().forEach(shape => {
          if (shape.name && shape.name.includes('price-level')) {
            chart.removeEntity(shape.id);
          }
        });

        // Adicionar linha de entrada
        if (entryPrice && parseFloat(entryPrice) > 0) {
          const entryLine = chart.createMultipointShape(
            [{ time: chart.getVisibleRange().from, price: parseFloat(entryPrice) }],
            {
              shape: 'horizontal_line',
              lock: true,
              disableSelection: false,
              disableEditing: true,
              text: `🟢 Entrada: $${parseFloat(entryPrice).toFixed(4)}`,
              overrides: {
                linecolor: '#28a745',
                linewidth: 2,
                linestyle: 2, // Linha tracejada
                showLabel: true,
                textcolor: '#ffffff',
                fontsize: 12
              }
            }
          );
          entryLine.name = 'price-level-entry';
        }

        // Adicionar linha de stop loss
        if (stopLoss && parseFloat(stopLoss) > 0) {
          const stopLine = chart.createMultipointShape(
            [{ time: chart.getVisibleRange().from, price: parseFloat(stopLoss) }],
            {
              shape: 'horizontal_line',
              lock: true,
              disableSelection: false,
              disableEditing: true,
              text: `🛑 Stop: $${parseFloat(stopLoss).toFixed(4)}`,
              overrides: {
                linecolor: '#dc3545',
                linewidth: 2,
                linestyle: 2, // Linha tracejada
                showLabel: true,
                textcolor: '#ffffff',
                fontsize: 12
              }
            }
          );
          stopLine.name = 'price-level-stop';
        }

        // Adicionar linha de target
        if (targetPrice && parseFloat(targetPrice) > 0) {
          const targetLine = chart.createMultipointShape(
            [{ time: chart.getVisibleRange().from, price: parseFloat(targetPrice) }],
            {
              shape: 'horizontal_line',
              lock: true,
              disableSelection: false,
              disableEditing: true,
              text: `🎯 Alvo: $${parseFloat(targetPrice).toFixed(4)}`,
              overrides: {
                linecolor: '#17a2b8',
                linewidth: 2,
                linestyle: 2, // Linha tracejada
                showLabel: true,
                textcolor: '#ffffff',
                fontsize: 12
              }
            }
          );
          targetLine.name = 'price-level-target';
        }

        console.log('✅ Linhas de preço adicionadas com sucesso!');
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar linhas ao gráfico:', error);
    }
  };

  // Effect para adicionar/atualizar linhas quando preços mudam
  useEffect(() => {
    if (widget && chartReady && (entryPrice || stopLoss || targetPrice)) {
      console.log('🎯 Preços mudaram, atualizando linhas...');
      const updateTimer = setTimeout(() => {
        addPriceLevelsToChart();
      }, 1000);
      
      return () => clearTimeout(updateTimer);
    }
  }, [widget, chartReady, entryPrice, stopLoss, targetPrice]);









  return (
    <div className="tradingview-chart-container" ref={chartContainerRef}>
      {/* Widget TradingView Nativo */}
      <div id="tradingview-widget" className="chart-widget">
        {hasError ? (
          <div className="chart-error">
            <div>❌ Erro ao carregar gráfico</div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              Verifique a conexão e tente novamente
            </div>
          </div>
        ) : null}
      </div>

      {/* Overlay para loading */}
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico nativo...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;