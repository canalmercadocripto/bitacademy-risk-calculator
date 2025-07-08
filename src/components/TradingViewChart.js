import React, { useState, useEffect, useRef } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  entryPrice = null,
  stopLoss = null,
  targetPrice = null,
  tradeDirection = null
}) => {
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const chartContainerRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

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

    // Monitorar redimensionamento
    const handleResize = () => {
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Chamada inicial

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Componente para renderizar linhas de preço
  const PriceLevelsOverlay = () => {
    if (!entryPrice && !stopLoss && !targetPrice) return null;
    
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
        {levels.map((level, index) => (
          <div
            key={index}
            className={`price-level-line ${level.type}`}
            style={{
              borderColor: level.color,
              top: `${20 + (index * 60)}px` // Distribuir as linhas verticalmente
            }}
          >
            <div className="price-level-label" style={{ backgroundColor: level.color }}>
              <span className="level-icon">{level.label.split(' ')[0]}</span>
              <span className="level-text">{level.label.split(' ')[1]}</span>
              <span className="level-price">{level.value}</span>
            </div>
          </div>
        ))}
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