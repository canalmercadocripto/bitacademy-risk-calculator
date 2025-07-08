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
    // Função para criar linhas de preço nativas do TradingView
    const createPriceLines = () => {
      if (!chartReady || !widgetRef.current) return;

      try {
        const chart = widgetRef.current.activeChart();
        
        // Limpar linhas anteriores
        priceLineIds.current.forEach(id => {
          try {
            chart.removePriceLine(id);
          } catch (e) {
            console.warn('Error removing price line:', e);
          }
        });
        priceLineIds.current.clear();

        // Criar linha de entrada usando createPriceLine
        if (entryPrice) {
          const entryLineId = chart.createPriceLine({
            price: parseFloat(entryPrice),
            color: '#28a745',
            lineWidth: 2,
            lineStyle: 0, // solid
            axisLabelVisible: true,
            title: '🟢 Entrada',
            extend: 'both'
          });
          priceLineIds.current.add(entryLineId);
          console.log('✅ Entry price line created:', entryPrice);
        }

        // Criar linha de stop loss
        if (stopLoss) {
          const stopLineId = chart.createPriceLine({
            price: parseFloat(stopLoss),
            color: '#dc3545',
            lineWidth: 2,
            lineStyle: 0, // solid
            axisLabelVisible: true,
            title: '🛑 Stop',
            extend: 'both'
          });
          priceLineIds.current.add(stopLineId);
          console.log('✅ Stop loss price line created:', stopLoss);
        }

        // Criar linha de target
        if (targetPrice) {
          const targetLineId = chart.createPriceLine({
            price: parseFloat(targetPrice),
            color: '#17a2b8',
            lineWidth: 2,
            lineStyle: 0, // solid
            axisLabelVisible: true,
            title: '🎯 Alvo',
            extend: 'both'
          });
          priceLineIds.current.add(targetLineId);
          console.log('✅ Target price line created:', targetPrice);
        }

        // Criar linha de preço atual (se diferente da entrada)
        if (currentPrice && currentPrice !== entryPrice) {
          const currentLineId = chart.createPriceLine({
            price: parseFloat(currentPrice),
            color: '#ffc107',
            lineWidth: 2,
            lineStyle: 2, // dashed
            axisLabelVisible: true,
            title: '📊 Atual',
            extend: 'both'
          });
          priceLineIds.current.add(currentLineId);
          console.log('✅ Current price line created:', currentPrice);
        }

        console.log('✅ Price lines created:', priceLineIds.current.size);

      } catch (error) {
        console.error('❌ Error creating price lines:', error);
      }
    };

    // Função para inicializar o widget TradingView
    const initTradingView = async () => {
      try {
        // Aguardar o script do TradingView carregar
        if (typeof window.TradingView === 'undefined') {
          console.error('❌ TradingView library not loaded yet');
          setHasError(true);
          return;
        }

        // Verificar se Datafeeds está disponível
        if (typeof window.Datafeeds === 'undefined') {
          console.error('❌ Datafeeds library not loaded yet');
          setHasError(true);
          return;
        }

        console.log('✅ TradingView and Datafeeds libraries loaded successfully');

        // Verificar se o container existe
        if (!chartContainerRef.current) {
          console.error('❌ Chart container not found');
          setHasError(true);
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

        // Configurar datafeed avançado - TradingView Advanced Charts
        const datafeed = new window.Datafeeds.UDFCompatibleDatafeed(
          'https://demo-feed-data.tradingview.com',
          undefined,
          {
            maxResponseLength: 10000,
            expectedOrder: 'latestFirst',
            supports_search: true,
            supports_group_request: false,
            supports_marks: true,
            supports_timescale_marks: true,
            supports_time: true,
            exchanges: [
              { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' },
              { value: 'BYBIT', name: 'Bybit', desc: 'Bybit Exchange' },
              { value: 'BITGET', name: 'Bitget', desc: 'Bitget Exchange' },
              { value: 'BINGX', name: 'BingX', desc: 'BingX Exchange' }
            ],
            symbols_types: [
              { name: 'crypto', value: 'crypto' },
              { name: 'spot', value: 'spot' },
              { name: 'futures', value: 'futures' }
            ]
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
            'study_templates',
            'create_volume_indicator_by_default',
            'side_toolbar_in_fullscreen_mode',
            'header_in_fullscreen_mode',
            'disable_resolution_rebuild',
            'move_logo_to_main_pane',
            'chart_crosshair_menu',
            'popup_hints'
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
          },
          // Configurações avançadas para melhor performance
          debug: false,
          snapshot_url: 'https://demo-feed-data.tradingview.com/snapshot',
          charts_storage_url: 'https://demo-feed-data.tradingview.com/charts',
          charts_storage_api_version: '1.1',
          client_id: 'tradingview.com',
          user_id: 'public_user',
          // Configurações de cache e performance
          cache_time: 120, // 2 minutos de cache
          numeric_formatting: {
            decimal_sign: ',',
            thousands_separator: '.'
          },
          // Configurações para trading
          trading_enabled: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false
        });

        widgetRef.current = widget;

        // Quando o widget estiver pronto
        widget.onChartReady(() => {
          console.log('📊 TradingView widget ready');
          setChartReady(true);
          setHasError(false);
          
          // Configurar listener para atualizar linhas quando necessário
          const chart = widget.activeChart();
          
          // Criar linhas de preço imediatamente
          if (entryPrice || stopLoss || targetPrice || currentPrice) {
            createPriceLines();
          }
          
          // Listener para mudanças no range (opcional - price lines persistem)
          chart.onVisibleRangeChanged().subscribe(null, () => {
            console.log('📊 Visible range changed - price lines remain visible');
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

    // Função para carregar scripts dinamicamente
    const loadScriptDynamically = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Verificar se os scripts estão carregados
    const checkScripts = async (retryCount = 0) => {
      const maxRetries = 50; // 5 segundos (50 * 100ms)
      
      if (typeof window.TradingView !== 'undefined' && typeof window.Datafeeds !== 'undefined') {
        console.log('✅ All scripts loaded, initializing TradingView');
        initTradingView();
      } else if (retryCount < maxRetries) {
        console.log(`⏳ Waiting for scripts... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => checkScripts(retryCount + 1), 100);
      } else {
        console.warn('❌ Scripts not loaded from HTML, trying dynamic loading...');
        try {
          await loadScriptDynamically('/charting_library/charting_library.standalone.js');
          await loadScriptDynamically('/datafeeds/udf/dist/bundle.js');
          console.log('✅ Scripts loaded dynamically, initializing TradingView');
          initTradingView();
        } catch (error) {
          console.error('❌ Failed to load scripts dynamically:', error);
          setHasError(true);
        }
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

  // useEffect separado para atualizar price lines quando preços mudarem
  useEffect(() => {
    if (chartReady && widgetRef.current) {
      createPriceLines();
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
          <div>❌ Erro ao carregar gráfico TradingView</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            Possíveis causas:
            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
              <li>Biblioteca TradingView não carregada</li>
              <li>Datafeed UDF não disponível</li>
              <li>Problema de conexão</li>
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
          <p>Carregando gráfico TradingView...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChartNative;