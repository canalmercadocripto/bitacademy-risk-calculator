import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  onPriceUpdate,
  entryPrice,
  stopLoss,
  takeProfit,
  showLevels = false 
}) => {
  const chartRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);

  // Converter símbolo para formato TradingView
  const formatSymbolForTradingView = useCallback((exchange, pair) => {
    if (!exchange || !pair) return "BINANCE:BTCUSDT";
    
    const exchangeMap = {
      'binance': 'BINANCE',
      'bybit': 'BYBIT',
      'bitget': 'BITGET',
      'bingx': 'BINGX'
    };
    
    const tvExchange = exchangeMap[exchange.toLowerCase()] || 'BINANCE';
    const cleanPair = pair.replace('/', '').toUpperCase();
    
    return `${tvExchange}:${cleanPair}`;
  }, []);

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

  // Simular atualização de preço (em produção isso viria de WebSocket)
  useEffect(() => {
    if (!symbol) return;

    const interval = setInterval(() => {
      // Simular preço atual (em produção, pegar do TradingView ou API)
      const basePrice = symbol.includes('BTC') ? 43000 : 
                       symbol.includes('ETH') ? 2500 : 
                       symbol.includes('BNB') ? 300 : 1;
      
      const variance = basePrice * 0.001; // 0.1% de variação
      const mockPrice = basePrice + (Math.random() - 0.5) * variance;
      
      setCurrentPrice(mockPrice);
      
      if (onPriceUpdate) {
        onPriceUpdate(mockPrice);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol, onPriceUpdate]);

  // Handler para quando o gráfico está pronto
  const handleChartReady = useCallback(() => {
    setChartReady(true);
    console.log('📈 TradingView chart ready for symbol:', symbol);
  }, [symbol]);

  return (
    <div className="tradingview-chart-container">
      {/* Header com informações */}
      <div className="chart-header">
        <div className="chart-symbol">
          <span className="symbol-text">{symbol}</span>
          {currentPrice && (
            <span className="current-price">
              ${currentPrice.toFixed(2)}
            </span>
          )}
        </div>
        
        <div className="chart-controls">
          {showLevels && (entryPrice || stopLoss || takeProfit) && (
            <div className="trade-levels">
              {entryPrice && (
                <span className="level entry">
                  Entry: ${parseFloat(entryPrice).toFixed(2)}
                </span>
              )}
              {stopLoss && (
                <span className="level stop-loss">
                  SL: ${parseFloat(stopLoss).toFixed(2)}
                </span>
              )}
              {takeProfit && (
                <span className="level take-profit">
                  TP: ${parseFloat(takeProfit).toFixed(2)}
                </span>
              )}
            </div>
          )}
          
          {currentPrice && onPriceUpdate && (
            <button
              className="sync-price-btn"
              onClick={() => {
                if (window.confirm(`Sincronizar preço atual (${currentPrice.toFixed(2)}) com a calculadora?`)) {
                  onPriceUpdate(currentPrice);
                }
              }}
              title="Usar preço atual do gráfico na calculadora"
            >
              🔄 Sync
            </button>
          )}
        </div>
      </div>

      {/* Widget TradingView */}
      <div className="chart-widget" ref={chartRef}>
        <AdvancedRealTimeChart
          {...widgetConfig}
          onLoadScript={handleChartReady}
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