import React from 'react';

const ExchangeSelector = ({ exchanges, selectedExchange, onExchangeSelect, loading }) => {
  const exchangeLogos = {
    bingx: '🔷',   // Placeholder - seria a logo real
    bybit: '🔸',   // Placeholder - seria a logo real  
    binance: '🟡', // Placeholder - seria a logo real
    bitget: '🟢'   // Placeholder - seria a logo real
  };

  const exchangeColors = {
    bingx: {
      bg: 'linear-gradient(135deg, #1890FF, #096DD9)',
      border: '#1890FF', 
      shadow: 'rgba(24, 144, 255, 0.3)'
    },
    bybit: {
      bg: 'linear-gradient(135deg, #F7A600, #FF6B00)', 
      border: '#F7A600',
      shadow: 'rgba(247, 166, 0, 0.3)'
    },
    binance: {
      bg: 'linear-gradient(135deg, #F3BA2F, #F0B90B)',
      border: '#F3BA2F',
      shadow: 'rgba(243, 186, 47, 0.3)'
    },
    bitget: {
      bg: 'linear-gradient(135deg, #00D4FF, #0052FF)',
      border: '#00D4FF',
      shadow: 'rgba(0, 212, 255, 0.3)'
    }
  };

  if (loading.exchanges) {
    return (
      <div className="exchange-selector">
        <label>Escolha a Corretora:</label>
        <div className="exchange-buttons">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="exchange-button loading-skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-selector">
      <label>Escolha a Corretora:</label>
      <div className="exchange-buttons">
        {(exchanges || []).map((exchange) => {
          const isSelected = selectedExchange?.id === exchange.id;
          const colors = exchangeColors[exchange.id] || exchangeColors.binance;
          
          return (
            <button
              key={exchange.id}
              className={`exchange-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onExchangeSelect(exchange)}
              style={{
                background: isSelected ? colors.bg : 'var(--bg-button)',
                borderColor: isSelected ? colors.border : 'var(--border-color)',
                boxShadow: isSelected ? `0 5px 15px ${colors.shadow}` : 'none',
                color: isSelected ? 'white' : 'var(--text-primary)',
                position: 'relative'
              }}
            >
              <div className="exchange-logo">
                {exchangeLogos[exchange.id] || '🏢'}
              </div>
              <div className="exchange-info">
                <div className="exchange-name">{exchange.name}</div>
                <div className="exchange-subtitle">
                  {exchange.id === 'bingx' && 'Perpetual'}
                  {exchange.id === 'bybit' && 'Linear'}  
                  {exchange.id === 'binance' && 'Futures'}
                  {exchange.id === 'bitget' && 'USDT-M'}
                </div>
              </div>
              {isSelected && (
                <div className="exchange-check">✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExchangeSelector;