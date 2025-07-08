import React, { useState } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark"
}) => {
  const [chartReady, setChartReady] = useState(false);

  // Configurações do widget TradingView
  const widgetConfig = {
    symbol: symbol,
    width: "100%",
    height: "100%",
    autosize: true,
    interval: "5",
    timezone: "America/Sao_Paulo",
    theme: theme,
    style: "1",
    locale: "pt_BR",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    allow_symbol_change: true,
    save_image: false,
    calendar: false,
    hide_legend: true,
    hide_side_toolbar: false,
    details: true,
    hotlist: true,
    calendar: true,
    studies: [
      "Volume@tv-basicstudies"
    ],
    show_popup_button: true,
    popup_width: "1000",
    popup_height: "650",
    container_id: "tradingview_chart"
  };

  return (
    <div className="tradingview-chart-container">
      {/* Header com informações */}
      <div className="chart-header">
        <div className="chart-symbol">
          <span className="symbol-text">{symbol}</span>
        </div>
      </div>

      {/* Widget TradingView */}
      <div className="chart-widget">
        <AdvancedRealTimeChart
          {...widgetConfig}
        />
      </div>

      {/* Overlay para loading */}
      {!chartReady && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Carregando gráfico...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;