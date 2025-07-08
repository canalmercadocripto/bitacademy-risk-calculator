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

  // Effect para marcar chart como ready após carregar
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Componente simples de overlay de preços
  const SimplePriceLevels = () => {
    if (!entryPrice && !stopLoss && !targetPrice) return null;
    if (!chartReady) return null;

    // Calcular range dos preços para posicionamento relativo
    const prices = [];
    if (entryPrice) prices.push(parseFloat(entryPrice));
    if (stopLoss) prices.push(parseFloat(stopLoss));
    if (targetPrice) prices.push(parseFloat(targetPrice));
    
    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Se range muito pequeno, usar padding
    const padding = priceRange < minPrice * 0.02 ? minPrice * 0.05 : priceRange * 0.2;
    const scaledMin = minPrice - padding;
    const scaledMax = maxPrice + padding;
    const totalRange = scaledMax - scaledMin;

    const calculatePosition = (price) => {
      const ratio = (price - scaledMin) / totalRange;
      return 85 - (ratio * 70); // 85% = bottom, 15% = top (70% usable area)
    };

    return (
      <div className="simple-price-levels">
        {entryPrice && (
          <div 
            className="price-line entry"
            style={{ top: `${calculatePosition(parseFloat(entryPrice))}%` }}
          >
            <div className="price-label">
              🟢 Entrada: ${parseFloat(entryPrice).toFixed(2)}
            </div>
          </div>
        )}
        
        {stopLoss && (
          <div 
            className="price-line stop"
            style={{ top: `${calculatePosition(parseFloat(stopLoss))}%` }}
          >
            <div className="price-label">
              🛑 Stop: ${parseFloat(stopLoss).toFixed(2)}
            </div>
          </div>
        )}
        
        {targetPrice && (
          <div 
            className="price-line target"
            style={{ top: `${calculatePosition(parseFloat(targetPrice))}%` }}
          >
            <div className="price-label">
              🎯 Alvo: ${parseFloat(targetPrice).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  };









  const renderChart = () => {
    try {
      return (
        <AdvancedRealTimeChart
          symbol={symbol}
          autosize={true}
          interval="5"
          timezone="America/Sao_Paulo"
          theme={theme === "dark" ? "dark" : "light"}
          locale="pt_BR"
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

      {/* Simple Price Levels Overlay */}
      <SimplePriceLevels />

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