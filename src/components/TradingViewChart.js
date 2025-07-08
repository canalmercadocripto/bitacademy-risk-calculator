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

  // Calcular range de preços baseado nos níveis de trade
  const calculatePriceRange = () => {
    const prices = [];
    
    if (currentPrice) prices.push(parseFloat(currentPrice));
    if (entryPrice) prices.push(parseFloat(entryPrice));
    if (stopLoss) prices.push(parseFloat(stopLoss));
    if (targetPrice) prices.push(parseFloat(targetPrice));
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Adicionar margem de 10% para melhor visualização
    const margin = (maxPrice - minPrice) * 0.1;
    
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
    
    // Garantir que a posição está dentro dos limites
    return Math.max(topOffset, Math.min(yPosition, chartHeight - footerHeight));
  };

  // Effect para atualizar range quando preços mudam
  useEffect(() => {
    const newRange = calculatePriceRange();
    setPriceRange(newRange);
  }, [entryPrice, stopLoss, targetPrice, currentPrice]);

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