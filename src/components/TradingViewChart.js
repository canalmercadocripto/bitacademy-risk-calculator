import React, { useState, useEffect } from 'react';
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
      {/* Trade Levels Header - Showing Entry, Stop, Target */}
      {(entryPrice || stopLoss || targetPrice) && (
        <div className="chart-header">
          <div className="chart-symbol">
            <span className="symbol-text">{symbol.replace(/^[A-Z]+:/, '')}</span>
          </div>
          <div className="chart-controls">
            <div className="trade-levels">
              {entryPrice && (
                <div className="level entry">
                  🟢 Entrada: ${parseFloat(entryPrice).toFixed(4)}
                </div>
              )}
              {stopLoss && (
                <div className="level stop-loss">
                  🛑 Stop: ${parseFloat(stopLoss).toFixed(4)}
                </div>
              )}
              {targetPrice && (
                <div className="level take-profit">
                  🎯 Alvo: ${parseFloat(targetPrice).toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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