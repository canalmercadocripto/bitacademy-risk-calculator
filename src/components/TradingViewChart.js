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

  // Componente melhorado de overlay de preços com melhor posicionamento
  const SimplePriceLevels = () => {
    if (!entryPrice && !stopLoss && !targetPrice) return null;
    if (!chartReady) return null;

    // Calcular range dos preços para posicionamento relativo
    const prices = [];
    if (entryPrice && !isNaN(parseFloat(entryPrice))) prices.push(parseFloat(entryPrice));
    if (stopLoss && !isNaN(parseFloat(stopLoss))) prices.push(parseFloat(stopLoss));
    if (targetPrice && !isNaN(parseFloat(targetPrice))) prices.push(parseFloat(targetPrice));
    if (currentPrice && !isNaN(parseFloat(currentPrice))) prices.push(parseFloat(currentPrice));
    
    if (prices.length === 0) {
      console.warn('⚠️ No valid prices for chart overlay');
      return null;
    }
    
    console.log('💰 Price levels overlay - Data:', {
      entryPrice,
      stopLoss,
      targetPrice,
      currentPrice,
      validPrices: prices
    });

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Calcular padding baseado no range atual do mercado
    const marketPadding = priceRange > 0 ? priceRange * 0.25 : minPrice * 0.05;
    const scaledMin = minPrice - marketPadding;
    const scaledMax = maxPrice + marketPadding;
    const totalRange = scaledMax - scaledMin;

    const calculatePosition = (price) => {
      if (totalRange === 0) return 50; // Posição central se não há range
      const ratio = (price - scaledMin) / totalRange;
      // Inverter para que preços maiores fiquem no topo
      const position = 90 - (ratio * 80); // 90% = bottom, 10% = top (80% usable area)
      
      console.log(`📍 Price positioning: ${price} -> ${position.toFixed(1)}% (ratio: ${ratio.toFixed(3)})`, {
        price,
        scaledMin,
        scaledMax,
        totalRange,
        ratio,
        position
      });
      
      return position;
    };

    const getPriceDecimalPlaces = (price) => {
      if (price >= 1000) return 2;
      if (price >= 100) return 3;
      if (price >= 10) return 4;
      return 5;
    };

    return (
      <div className="simple-price-levels">
        {entryPrice && (
          <div 
            className="price-line entry"
            style={{ top: `${calculatePosition(parseFloat(entryPrice))}%` }}
          >
            <div className="price-label">
              🟢 Entrada: ${parseFloat(entryPrice).toFixed(getPriceDecimalPlaces(parseFloat(entryPrice)))}
            </div>
          </div>
        )}
        
        {stopLoss && (
          <div 
            className="price-line stop"
            style={{ top: `${calculatePosition(parseFloat(stopLoss))}%` }}
          >
            <div className="price-label">
              🛑 Stop: ${parseFloat(stopLoss).toFixed(getPriceDecimalPlaces(parseFloat(stopLoss)))}
            </div>
          </div>
        )}
        
        {targetPrice && (
          <div 
            className="price-line target"
            style={{ top: `${calculatePosition(parseFloat(targetPrice))}%` }}
          >
            <div className="price-label">
              🎯 Alvo: ${parseFloat(targetPrice).toFixed(getPriceDecimalPlaces(parseFloat(targetPrice)))}
            </div>
          </div>
        )}
        
        {currentPrice && currentPrice !== entryPrice && (
          <div 
            className="price-line current"
            style={{ top: `${calculatePosition(parseFloat(currentPrice))}%` }}
          >
            <div className="price-label">
              📊 Atual: ${parseFloat(currentPrice).toFixed(getPriceDecimalPlaces(parseFloat(currentPrice)))}
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
          interval="15"
          timezone="America/Sao_Paulo"
          theme={theme === "dark" ? "dark" : "light"}
          locale="pt_BR"
          hide_side_toolbar={false}
          hide_top_toolbar={false}
          disabled_features={[]}
          enabled_features={["study_templates"]}
          container_id="tradingview_chart"
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