import React, { useState, useEffect, useRef } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

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
  const iframeRef = useRef(null);

  // Configurações avançadas do widget TradingView com linhas de trade
  const widgetConfig = {
    symbol: symbol,
    autosize: true,
    interval: "5",
    timezone: "America/Sao_Paulo",
    theme: theme === "dark" ? "dark" : "light",
    locale: "pt_BR",
    hide_side_toolbar: false,
    allow_symbol_change: false,
    save_image: false,
    container_id: `tradingview_${symbol}`,
    studies: entryPrice ? [
      "MASimple@tv-basicstudies",
    ] : [],
    // Configurações para desenhos automáticos
    drawings_access: {
      type: "black",
      tools: [
        { name: "LineToolHorzLine" }
      ]
    }
  };

  // Effect para monitorar dimensões do gráfico
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 3000);

    // Monitorar redimensionamento e dimensões
    const handleResize = () => {
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Observer para mudanças no DOM
    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', handleResize);
    // Delay para garantir que o gráfico carregou
    setTimeout(handleResize, 1000);
    setTimeout(handleResize, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Tentar detectar o range real do gráfico TradingView
  const detectRealChartRange = () => {
    if (!currentPrice) return null;
    
    // Método 1: Tentar acessar API TradingView global (se disponível)
    try {
      if (window.TradingView && window.TradingView.chart) {
        const chart = window.TradingView.chart();
        if (chart && chart.getPriceScale) {
          const priceScale = chart.getPriceScale();
          if (priceScale) {
            const range = {
              min: priceScale.getVisibleRange().from,
              max: priceScale.getVisibleRange().to
            };
            console.log('Range detectado via API TradingView:', range);
            setRealChartRange(range);
            return range;
          }
        }
      }
    } catch (error) {
      console.log('API TradingView não disponível:', error);
    }
    
    // Método 2: Tentar acessar o iframe do TradingView
    try {
      const iframe = chartContainerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        // Tentar comunicar com o iframe
        iframe.contentWindow.postMessage({
          type: 'GET_PRICE_RANGE',
          id: 'price-levels'
        }, '*');
      }
    } catch (error) {
      console.log('Não foi possível acessar iframe TradingView:', error);
    }
    
    // Método 3: Estimativa inteligente baseada no preço atual
    const currentPriceFloat = parseFloat(currentPrice);
    if (currentPriceFloat > 0) {
      // Coletar todos os preços relevantes
      const allPrices = [currentPriceFloat];
      if (entryPrice) allPrices.push(parseFloat(entryPrice));
      if (stopLoss) allPrices.push(parseFloat(stopLoss));
      if (targetPrice) allPrices.push(parseFloat(targetPrice));
      
      const minTradePrice = Math.min(...allPrices);
      const maxTradePrice = Math.max(...allPrices);
      const priceSpread = maxTradePrice - minTradePrice;
      
      // Se há spread significativo entre os preços, usar isso como base
      if (priceSpread > currentPriceFloat * 0.02) { // 2% ou mais de spread
        const margin = priceSpread * 0.2; // 20% de margem
        const estimatedRange = {
          min: minTradePrice - margin,
          max: maxTradePrice + margin
        };
        console.log('Range estimado baseado no spread dos preços:', estimatedRange);
        return estimatedRange;
      } else {
        // Usar range padrão centrado no preço atual
        const volatilityFactor = 0.05; // 5% para cada lado (mais conservador)
        const estimatedRange = {
          min: currentPriceFloat * (1 - volatilityFactor),
          max: currentPriceFloat * (1 + volatilityFactor)
        };
        console.log('Range estimado baseado no preço atual:', estimatedRange);
        return estimatedRange;
      }
    }
    
    return null;
  };

  // Listener para respostas do iframe TradingView
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PRICE_RANGE_RESPONSE') {
        setRealChartRange(event.data.range);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Calcular range de preços usando detecção do range real do gráfico
  const calculatePriceRange = () => {
    // Primeiro: tentar usar o range real detectado do TradingView
    if (realChartRange.min > 0 && realChartRange.max > realChartRange.min) {
      return realChartRange;
    }
    
    // Segundo: usar detecção inteligente baseada no preço atual
    const detectedRange = detectRealChartRange();
    if (detectedRange) {
      return detectedRange;
    }
    
    // Fallback: método original como último recurso
    const prices = [];
    if (currentPrice) prices.push(parseFloat(currentPrice));
    if (entryPrice) prices.push(parseFloat(entryPrice));
    if (stopLoss) prices.push(parseFloat(stopLoss));
    if (targetPrice) prices.push(parseFloat(targetPrice));
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const margin = (maxPrice - minPrice) * 0.15; // 15% margin para fallback
    
    return {
      min: minPrice - margin,
      max: maxPrice + margin
    };
  };

  // Converter preço para posição Y no gráfico com melhor precisão
  const priceToY = (price, chartHeight) => {
    const range = calculatePriceRange();
    if (range.max === range.min || chartHeight === 0) return chartHeight / 2;
    
    // Normalizar o preço dentro do range (0 a 1)
    const normalizedPrice = (price - range.min) / (range.max - range.min);
    
    // Configurações específicas para o TradingView widget
    const headerHeight = 0; // Sem header agora
    const footerHeight = chartHeight * 0.05; // 5% para footer/controls
    const usableHeight = chartHeight - headerHeight - footerHeight;
    const topOffset = headerHeight;
    
    // Inverter Y porque no CSS, 0 é no topo e preços altos ficam em cima
    const yPosition = topOffset + ((1 - normalizedPrice) * usableHeight);
    
    // Log para debug
    console.log('Conversão preço->Y:', {
      price,
      range,
      normalizedPrice,
      chartHeight,
      yPosition,
      usableHeight
    });
    
    // Garantir que a posição está dentro dos limites
    return Math.max(topOffset, Math.min(yPosition, chartHeight - footerHeight));
  };

  // Effect para detectar range do gráfico quando carrega
  useEffect(() => {
    if (chartReady) {
      // Tentar detectar range real após gráfico carregar
      const detectTimer = setTimeout(() => {
        detectRealChartRange();
      }, 2000);
      
      return () => clearTimeout(detectTimer);
    }
  }, [chartReady]);

  // Effect para atualizar range quando preços mudam
  useEffect(() => {
    const newRange = calculatePriceRange();
    setPriceRange(newRange);
  }, [entryPrice, stopLoss, targetPrice, currentPrice, realChartRange]);

  // Componente para renderizar linhas de preço com posicionamento preciso
  const PriceLevelsOverlay = () => {
    if (!entryPrice && !stopLoss && !targetPrice) return null;
    if (!chartDimensions.height || chartDimensions.height === 0) return null;
    
    const levels = [];
    
    if (entryPrice) {
      levels.push({
        price: parseFloat(entryPrice),
        type: 'entry',
        color: '#28a745',
        label: '🟢 Entrada',
        value: `$${parseFloat(entryPrice).toFixed(4)}`
      });
    }
    
    if (stopLoss) {
      levels.push({
        price: parseFloat(stopLoss),
        type: 'stop',
        color: '#dc3545',
        label: '🛑 Stop',
        value: `$${parseFloat(stopLoss).toFixed(4)}`
      });
    }
    
    if (targetPrice) {
      levels.push({
        price: parseFloat(targetPrice),
        type: 'target',
        color: '#17a2b8',
        label: '🎯 Alvo',
        value: `$${parseFloat(targetPrice).toFixed(4)}`
      });
    }
    
    return (
      <div className="price-levels-overlay">
        {levels.map((level, index) => {
          const yPosition = priceToY(level.price, chartDimensions.height);
          
          return (
            <div
              key={index}
              className={`price-level-line ${level.type}`}
              style={{
                borderColor: level.color,
                top: `${yPosition}px`
              }}
            >
              <div className="price-level-label" style={{ backgroundColor: level.color }}>
                <span className="level-icon">{level.label.split(' ')[0]}</span>
                <span className="level-text">{level.label.split(' ')[1]}</span>
                <span className="level-price">{level.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChart = () => {
    try {
      return (
        <AdvancedRealTimeChart
          symbol={widgetConfig.symbol}
          autosize={widgetConfig.autosize}
          interval={widgetConfig.interval}
          timezone={widgetConfig.timezone}
          theme={widgetConfig.theme}
          locale={widgetConfig.locale}
        />
      );
    } catch (error) {
      console.error('TradingView widget error:', error);
      setHasError(true);
      return (
        <div className="chart-error">
          <div>❌ Erro ao carregar gráfico</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
            Verifique a conexão e tente novamente
          </div>
        </div>
      );
    }
  };

  return (
    <div className="tradingview-chart-container" ref={chartContainerRef}>
      {/* Widget TradingView */}
      <div className="chart-widget">
        {hasError ? (
          <div className="chart-error">
            <div>❌ Erro ao carregar gráfico</div>
            <div style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              Verifique a conexão e tente novamente
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Price Levels Overlay - Linhas desenhadas no gráfico */}
      {chartReady && <PriceLevelsOverlay />}

      {/* Overlay para loading */}
      {!chartReady && !hasError && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;