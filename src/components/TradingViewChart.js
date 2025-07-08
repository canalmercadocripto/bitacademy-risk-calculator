import React, { useState, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark"
}) => {
  const [chartReady, setChartReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Configurações mínimas do widget TradingView
  const widgetConfig = {
    symbol: symbol,
    autosize: true,
    interval: "5",
    timezone: "America/Sao_Paulo",
    theme: theme === "dark" ? "dark" : "light",
    locale: "pt_BR"
  };

  // Error boundary effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
    <div className="tradingview-chart-container">
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