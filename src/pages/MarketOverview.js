import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// SoSoValue Section Component
const SoSoValueSection = () => {
  const [sosoData, setSosoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSoSoValueData();
  }, []);

  const fetchSoSoValueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sosovalue?category=currencies');
      const data = await response.json();
      
      if (data.success) {
        setSosoData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Erro ao buscar dados SoSoValue');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sosovalue-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados SoSoValue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sosovalue-error">
        <h3>❌ Erro ao carregar dados SoSoValue</h3>
        <p>{error}</p>
        <button onClick={fetchSoSoValueData} className="retry-button">
          🔄 Tentar novamente
        </button>
      </div>
    );
  }

  if (!sosoData?.processed) {
    return (
      <div className="sosovalue-empty">
        <h3>📝 Dados SoSoValue não disponíveis</h3>
      </div>
    );
  }

  const { processed } = sosoData;

  return (
    <div className="sosovalue-section">
      {/* Summary Cards */}
      <div className="sosovalue-summary">
        <div className="summary-card">
          <div className="summary-icon">🪙</div>
          <div className="summary-content">
            <h3>Total Currencies</h3>
            <div className="summary-value">{processed.total?.toLocaleString()}</div>
            <div className="summary-subtitle">Suportadas pela SoSoValue</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🏆</div>
          <div className="summary-content">
            <h3>Top Currencies</h3>
            <div className="summary-value">{processed.topCurrencies?.length || 0}</div>
            <div className="summary-subtitle">Principais criptomoedas</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Stablecoins</h3>
            <div className="summary-value">{processed.categories?.stablecoins || 0}</div>
            <div className="summary-subtitle">Moedas estáveis</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🦄</div>
          <div className="summary-content">
            <h3>DeFi Tokens</h3>
            <div className="summary-value">{processed.categories?.defi || 0}</div>
            <div className="summary-subtitle">Finanças descentralizadas</div>
          </div>
        </div>
      </div>

      {/* Top Currencies */}
      {processed.topCurrencies && processed.topCurrencies.length > 0 && (
        <div className="market-section">
          <h3>🏆 Top Currencies - SoSoValue</h3>
          <div className="currencies-grid">
            {processed.topCurrencies.map(currency => (
              <div key={currency.id} className="currency-card">
                <div className="currency-header">
                  <div className="currency-symbol">{currency.symbol}</div>
                  <div className="currency-status">
                    {currency.supported ? '✅' : '❌'}
                  </div>
                </div>
                <div className="currency-name">{currency.name}</div>
                <div className="currency-id">ID: {currency.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Overview */}
      <div className="market-section">
        <h3>📊 Categories Overview</h3>
        <div className="categories-grid">
          <div className="category-item">
            <div className="category-icon">🏦</div>
            <div className="category-info">
              <h4>Layer 1</h4>
              <div className="category-count">{processed.categories?.layer1 || 0}</div>
              <div className="category-desc">Blockchains principais</div>
            </div>
          </div>

          <div className="category-item">
            <div className="category-icon">💰</div>
            <div className="category-info">
              <h4>Stablecoins</h4>
              <div className="category-count">{processed.categories?.stablecoins || 0}</div>
              <div className="category-desc">Moedas estáveis</div>
            </div>
          </div>

          <div className="category-item">
            <div className="category-icon">🦄</div>
            <div className="category-info">
              <h4>DeFi</h4>
              <div className="category-count">{processed.categories?.defi || 0}</div>
              <div className="category-desc">Finanças descentralizadas</div>
            </div>
          </div>

          <div className="category-item">
            <div className="category-icon">🐕</div>
            <div className="category-info">
              <h4>Meme Coins</h4>
              <div className="category-count">{processed.categories?.meme || 0}</div>
              <div className="category-desc">Moedas meme</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Currencies Sample */}
      {processed.currencies && processed.currencies.length > 0 && (
        <div className="market-section">
          <h3>💎 Sample Currencies (Top 20)</h3>
          <div className="currencies-list">
            {processed.currencies.slice(0, 20).map(currency => (
              <div key={currency.id} className="currency-item">
                <div className="currency-symbol">{currency.symbol}</div>
                <div className="currency-name">{currency.name}</div>
                <div className="currency-id">ID: {currency.id}</div>
                <div className="currency-supported">
                  {currency.isSupported ? '✅ Supported' : '❌ Not Supported'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="market-section">
        <h3>ℹ️ SoSoValue API Info</h3>
        <div className="api-info">
          <div className="info-card">
            <h4>📡 Endpoint</h4>
            <p>{sosoData.endpoint}</p>
          </div>
          <div className="info-card">
            <h4>⏱️ Last Update</h4>
            <p>{new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div className="info-card">
            <h4>🔑 Status</h4>
            <p className="status-active">✅ API Ativa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketOverview = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubSection, setActiveSubSection] = useState('global');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchMarketData, 120000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log(`🔍 Buscando dados de mercado: ${activeTab}`);
      
      const response = await fetch(`/api/market-data?category=${activeTab}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setMarketData(data.data);
        setLastUpdate(new Date());
        console.log('✅ Dados de mercado carregados:', data.data);
      } else {
        console.error('❌ Erro ao buscar dados de mercado:', data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados de mercado:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency = 'USD', decimals = 2) => {
    if (!value && value !== 0) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (!value && value !== 0) return 'N/A';
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value, decimals = 2) => {
    if (!value && value !== 0) return 'N/A';
    const formatted = value.toFixed(decimals);
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatted}%`;
  };

  const getChangeColor = (value) => {
    if (!value && value !== 0) return '#888';
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  const getFearGreedColor = (value) => {
    if (value <= 25) return '#ef4444'; // Red - Extreme Fear
    if (value <= 45) return '#f97316'; // Orange - Fear
    if (value <= 55) return '#eab308'; // Yellow - Neutral
    if (value <= 75) return '#84cc16'; // Light Green - Greed
    return '#10b981'; // Green - Extreme Greed
  };

  if (loading && !marketData) {
    return (
      <div className="market-overview-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de mercado...</p>
      </div>
    );
  }

  return (
    <div className="market-overview-container">
      <div className="market-overview-header">
        <h1>📊 Market Overview</h1>
        <p>Visão geral dos mercados cripto e tradicionais</p>
        {lastUpdate && (
          <div className="last-update">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="market-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Visão Geral
        </button>
        <button
          className={`tab-button ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          ₿ Cripto
        </button>
        <button
          className={`tab-button ${activeTab === 'gainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('gainers')}
        >
          📈 Gainers/Losers
        </button>
        <button
          className={`tab-button ${activeTab === 'exchanges' ? 'active' : ''}`}
          onClick={() => setActiveTab('exchanges')}
        >
          🏦 Exchanges
        </button>
        <button
          className={`tab-button ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          🏢 Empresas
        </button>
        <button
          className={`tab-button ${activeTab === 'sosovalue' ? 'active' : ''}`}
          onClick={() => setActiveTab('sosovalue')}
        >
          🌟 SoSoValue
        </button>
        <button
          className={`tab-button ${activeTab === 'traditional' ? 'active' : ''}`}
          onClick={() => setActiveTab('traditional')}
        >
          🏛️ Tradicional
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && marketData && (
        <div className="overview-content">
          {/* Global Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">🌍</div>
              <div className="metric-content">
                <h3>Market Cap Total Cripto</h3>
                <div className="metric-value">
                  {formatNumber(marketData.crypto?.global?.totalMarketCap)}
                </div>
                <div className="metric-change" style={{ color: getChangeColor(marketData.crypto?.global?.marketCapChange24h) }}>
                  {formatPercentage(marketData.crypto?.global?.marketCapChange24h)} 24h
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">₿</div>
              <div className="metric-content">
                <h3>Dominância Bitcoin</h3>
                <div className="metric-value">
                  {marketData.crypto?.global?.btcDominance?.toFixed(1)}%
                </div>
                <div className="metric-change">
                  ETH: {marketData.crypto?.global?.ethDominance?.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h3>Volume 24h Cripto</h3>
                <div className="metric-value">
                  {formatNumber(marketData.crypto?.global?.totalVolume24h)}
                </div>
                <div className="metric-change">
                  {marketData.crypto?.global?.activeCryptocurrencies?.toLocaleString()} moedas ativas
                </div>
              </div>
            </div>

            {marketData.crypto?.fearGreed && (
              <div className="metric-card">
                <div className="metric-icon">😱</div>
                <div className="metric-content">
                  <h3>Fear & Greed Index</h3>
                  <div className="metric-value" style={{ color: getFearGreedColor(marketData.crypto.fearGreed.value) }}>
                    {marketData.crypto.fearGreed.value}
                  </div>
                  <div className="metric-change">
                    {marketData.crypto.fearGreed.classification}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Combined Analysis */}
          {marketData.combined && (
            <div className="combined-analysis">
              <h2>Análise Combinada</h2>
              <div className="analysis-grid">
                <div className="analysis-card">
                  <h4>Cripto vs Ações</h4>
                  <p>Market Cap Cripto representa <strong>{marketData.combined.cryptoToStocksRatio}%</strong> do mercado global de ações</p>
                </div>
                <div className="analysis-card">
                  <h4>Cripto vs S&P 500</h4>
                  <p>Market Cap Cripto representa <strong>{marketData.combined.cryptoToSP500Ratio}%</strong> do S&P 500</p>
                </div>
                <div className="analysis-card">
                  <h4>Correlações</h4>
                  <p>BTC-S&P500: <strong>{marketData.combined.correlations.btcToSP500}</strong></p>
                  <p>BTC-Gold: <strong>{marketData.combined.correlations.btcToGold}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Top Cryptocurrencies */}
          {marketData.crypto?.topCoins && (
            <div className="top-cryptos">
              <h2>Top Criptomoedas</h2>
              <div className="crypto-table">
                <div className="table-header">
                  <div className="col-rank">#</div>
                  <div className="col-name">Nome</div>
                  <div className="col-price">Preço</div>
                  <div className="col-change-1h">1h</div>
                  <div className="col-change-24h">24h</div>
                  <div className="col-change-7d">7d</div>
                  <div className="col-market-cap">Market Cap</div>
                  <div className="col-volume">Volume 24h</div>
                </div>
                
                {marketData.crypto.topCoins.slice(0, 10).map(coin => (
                  <div key={coin.id} className="crypto-row">
                    <div className="col-rank">{coin.rank}</div>
                    <div className="col-name">
                      <div className="coin-info">
                        {coin.image && <img src={coin.image} alt={coin.symbol} className="coin-image" />}
                        <div>
                          <div className="coin-name">{coin.name}</div>
                          <div className="coin-symbol">{coin.symbol}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-price">{formatCurrency(coin.price)}</div>
                    <div className="col-change-1h" style={{ color: getChangeColor(coin.priceChange1h) }}>
                      {formatPercentage(coin.priceChange1h)}
                    </div>
                    <div className="col-change-24h" style={{ color: getChangeColor(coin.priceChange24h) }}>
                      {formatPercentage(coin.priceChange24h)}
                    </div>
                    <div className="col-change-7d" style={{ color: getChangeColor(coin.priceChange7d) }}>
                      {formatPercentage(coin.priceChange7d)}
                    </div>
                    <div className="col-market-cap">{formatNumber(coin.marketCap)}</div>
                    <div className="col-volume">{formatNumber(coin.volume24h)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'crypto' && marketData && (
        <div className="crypto-content">
          {/* Crypto specific content */}
          <div className="crypto-grid">
            {/* Fear & Greed Gauge */}
            {marketData.fearGreed && (
              <div className="fear-greed-gauge">
                <h3>Fear & Greed Index</h3>
                <div className="gauge-container">
                  <div className="gauge-value" style={{ color: getFearGreedColor(marketData.fearGreed.value) }}>
                    {marketData.fearGreed.value}
                  </div>
                  <div className="gauge-label">{marketData.fearGreed.classification}</div>
                </div>
              </div>
            )}

            {/* Trending Coins */}
            {marketData.trending && marketData.trending.length > 0 && (
              <div className="trending-coins">
                <h3>🔥 Trending</h3>
                <div className="trending-list">
                  {marketData.trending.map((coin, index) => (
                    <div key={coin.id} className="trending-item">
                      <span className="trending-rank">#{index + 1}</span>
                      {coin.image && <img src={coin.image} alt={coin.symbol} className="trending-image" />}
                      <div className="trending-info">
                        <div className="trending-name">{coin.name}</div>
                        <div className="trending-symbol">{coin.symbol}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categories Performance */}
          {marketData.categories && marketData.categories.length > 0 && (
            <div className="crypto-categories">
              <h3>Performance por Categoria</h3>
              <div className="categories-grid">
                {marketData.categories.map(category => (
                  <div key={category.id} className="category-card">
                    <h4>{category.name}</h4>
                    <div className="category-market-cap">{formatNumber(category.marketCap)}</div>
                    <div className="category-change" style={{ color: getChangeColor(category.marketCapChange24h) }}>
                      {formatPercentage(category.marketCapChange24h)} 24h
                    </div>
                    <div className="category-volume">Vol: {formatNumber(category.volume24h)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gainers/Losers Tab */}
      {activeTab === 'gainers' && marketData?.crypto && (
        <div className="gainers-content">
          <div className="gainers-losers-grid">
            {/* Top Gainers */}
            <div className="market-section">
              <h3>📈 Top Gainers (24h)</h3>
              <div className="coins-list">
                {marketData.crypto.topGainers?.map(coin => (
                  <div key={coin.id} className="coin-item">
                    <img src={coin.image} alt={coin.symbol} className="coin-icon" />
                    <div className="coin-info">
                      <div className="coin-name">{coin.name}</div>
                      <div className="coin-symbol">{coin.symbol}</div>
                    </div>
                    <div className="coin-price">{formatCurrency(coin.price)}</div>
                    <div className="coin-change positive">
                      {formatPercentage(coin.priceChange24h)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="market-section">
              <h3>📉 Top Losers (24h)</h3>
              <div className="coins-list">
                {marketData.crypto.topLosers?.map(coin => (
                  <div key={coin.id} className="coin-item">
                    <img src={coin.image} alt={coin.symbol} className="coin-icon" />
                    <div className="coin-info">
                      <div className="coin-name">{coin.name}</div>
                      <div className="coin-symbol">{coin.symbol}</div>
                    </div>
                    <div className="coin-price">{formatCurrency(coin.price)}</div>
                    <div className="coin-change negative">
                      {formatPercentage(coin.priceChange24h)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Health */}
          {marketData.crypto.marketMetrics && (
            <div className="market-section">
              <h3>🔍 Análise de Mercado</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">📊</div>
                  <div className="metric-content">
                    <h4>Volatilidade Média</h4>
                    <div className="metric-value">
                      {marketData.crypto.marketMetrics.volatility?.avgVolatility?.toFixed(2)}%
                    </div>
                    <div className="metric-subtext">
                      Alta: {marketData.crypto.marketMetrics.volatility?.high} | 
                      Média: {marketData.crypto.marketMetrics.volatility?.medium} | 
                      Baixa: {marketData.crypto.marketMetrics.volatility?.low}
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">📈</div>
                  <div className="metric-content">
                    <h4>Sentimento de Mercado</h4>
                    <div className="metric-value">
                      {marketData.crypto.marketMetrics.health?.marketSentiment}
                    </div>
                    <div className="metric-subtext">
                      Bull: {marketData.crypto.marketMetrics.health?.bullishCoins} | 
                      Bear: {marketData.crypto.marketMetrics.health?.bearishCoins}
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-content">
                    <h4>Proximidade ATH</h4>
                    <div className="metric-value">
                      {marketData.crypto.marketMetrics.health?.athProximity?.toFixed(1)}%
                    </div>
                    <div className="metric-subtext">Média do mercado</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exchanges Tab */}
      {activeTab === 'exchanges' && marketData?.crypto && (
        <div className="exchanges-content">
          <div className="market-section">
            <h3>🏦 Top Exchanges</h3>
            <div className="exchanges-grid">
              {marketData.crypto.topExchanges?.map(exchange => (
                <div key={exchange.id} className="exchange-card">
                  <img src={exchange.image} alt={exchange.name} className="exchange-logo" />
                  <div className="exchange-info">
                    <h4>{exchange.name}</h4>
                    <div className="exchange-trust">
                      Trust Score: <span className={`trust-score ${exchange.trustScore >= 8 ? 'high' : exchange.trustScore >= 6 ? 'medium' : 'low'}`}>
                        {exchange.trustScore}/10
                      </span>
                    </div>
                    <div className="exchange-volume">
                      Volume 24h: {exchange.tradeVolume24hBtc?.toFixed(0)} BTC
                    </div>
                    {exchange.country && (
                      <div className="exchange-country">📍 {exchange.country}</div>
                    )}
                    {exchange.yearEstablished && (
                      <div className="exchange-year">🗓️ {exchange.yearEstablished}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && marketData?.crypto && (
        <div className="companies-content">
          {/* Bitcoin Holdings */}
          <div className="market-section">
            <h3>₿ Holdings Bitcoin Corporativos</h3>
            <div className="companies-summary">
              <div className="summary-card">
                <h4>Total Holdings</h4>
                <div className="summary-value">
                  {marketData.crypto.companyHoldings?.bitcoin?.totalHoldings?.toLocaleString()} BTC
                </div>
              </div>
              <div className="summary-card">
                <h4>Valor Total</h4>
                <div className="summary-value">
                  {formatNumber(marketData.crypto.companyHoldings?.bitcoin?.totalValueUsd)}
                </div>
              </div>
              <div className="summary-card">
                <h4>Dominância</h4>
                <div className="summary-value">
                  {marketData.crypto.companyHoldings?.bitcoin?.marketCapDominance?.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="companies-list">
              {marketData.crypto.companyHoldings?.bitcoin?.companies?.map((company, index) => (
                <div key={index} className="company-item">
                  <div className="company-info">
                    <h4>{company.name}</h4>
                    <div className="company-symbol">{company.symbol}</div>
                    <div className="company-country">📍 {company.country}</div>
                  </div>
                  <div className="company-holdings">
                    <div className="holdings-amount">{company.totalHoldings?.toLocaleString()} BTC</div>
                    <div className="holdings-value">{formatNumber(company.totalCurrentValueUsd)}</div>
                    <div className="holdings-percent">{company.percentageOfTotalSupply?.toFixed(4)}% do supply</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ethereum Holdings */}
          <div className="market-section">
            <h3>⟠ Holdings Ethereum Corporativos</h3>
            <div className="companies-summary">
              <div className="summary-card">
                <h4>Total Holdings</h4>
                <div className="summary-value">
                  {marketData.crypto.companyHoldings?.ethereum?.totalHoldings?.toLocaleString()} ETH
                </div>
              </div>
              <div className="summary-card">
                <h4>Valor Total</h4>
                <div className="summary-value">
                  {formatNumber(marketData.crypto.companyHoldings?.ethereum?.totalValueUsd)}
                </div>
              </div>
              <div className="summary-card">
                <h4>Dominância</h4>
                <div className="summary-value">
                  {marketData.crypto.companyHoldings?.ethereum?.marketCapDominance?.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="companies-list">
              {marketData.crypto.companyHoldings?.ethereum?.companies?.map((company, index) => (
                <div key={index} className="company-item">
                  <div className="company-info">
                    <h4>{company.name}</h4>
                    <div className="company-symbol">{company.symbol}</div>
                    <div className="company-country">📍 {company.country}</div>
                  </div>
                  <div className="company-holdings">
                    <div className="holdings-amount">{company.totalHoldings?.toLocaleString()} ETH</div>
                    <div className="holdings-value">{formatNumber(company.totalCurrentValueUsd)}</div>
                    <div className="holdings-percent">{company.percentageOfTotalSupply?.toFixed(4)}% do supply</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SoSoValue Tab */}
      {activeTab === 'sosovalue' && (
        <div className="sosovalue-content">
          <SoSoValueSection />
        </div>
      )}

      {activeTab === 'traditional' && marketData && (
        <div className="traditional-content">
          {/* Stock Indices */}
          {marketData.indices && (
            <div className="market-section">
              <h3>📈 Índices de Ações</h3>
              <div className="indices-grid">
                {marketData.indices.map(index => (
                  <div key={index.symbol} className="index-card">
                    <h4>{index.name}</h4>
                    <div className="index-symbol">{index.symbol}</div>
                    <div className="index-price">{formatNumber(index.price, 2)}</div>
                    <div className="index-change" style={{ color: getChangeColor(index.changePercent) }}>
                      {formatPercentage(index.changePercent)} ({formatNumber(index.change, 2)})
                    </div>
                    <div className="index-volume">Vol: {formatNumber(index.volume)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forex */}
          {marketData.forex && (
            <div className="market-section">
              <h3>💱 Forex</h3>
              <div className="forex-grid">
                {marketData.forex.map(pair => (
                  <div key={pair.pair} className="forex-card">
                    <h4>{pair.pair}</h4>
                    <div className="forex-price">{pair.price.toFixed(4)}</div>
                    <div className="forex-change" style={{ color: getChangeColor(pair.changePercent) }}>
                      {formatPercentage(pair.changePercent)} ({pair.change > 0 ? '+' : ''}{pair.change.toFixed(4)})
                    </div>
                    <div className="forex-spread">
                      Bid: {pair.bid.toFixed(4)} | Ask: {pair.ask.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commodities */}
          {marketData.commodities && (
            <div className="market-section">
              <h3>🏗️ Commodities</h3>
              <div className="commodities-grid">
                {marketData.commodities.map(commodity => (
                  <div key={commodity.symbol} className="commodity-card">
                    <h4>{commodity.name}</h4>
                    <div className="commodity-symbol">{commodity.symbol}</div>
                    <div className="commodity-price">{formatCurrency(commodity.price)} / {commodity.unit}</div>
                    <div className="commodity-change" style={{ color: getChangeColor(commodity.changePercent) }}>
                      {formatPercentage(commodity.changePercent)} ({commodity.change > 0 ? '+' : ''}{commodity.change.toFixed(2)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonds */}
          {marketData.bonds && (
            <div className="market-section">
              <h3>🏦 Bonds & Yields</h3>
              <div className="bonds-grid">
                {marketData.bonds.map(bond => (
                  <div key={bond.symbol} className="bond-card">
                    <h4>{bond.name}</h4>
                    <div className="bond-symbol">{bond.symbol}</div>
                    <div className="bond-yield">{bond.yield.toFixed(3)}%</div>
                    <div className="bond-change" style={{ color: getChangeColor(bond.changePercent) }}>
                      {formatPercentage(bond.changePercent)} ({bond.change > 0 ? '+' : ''}{bond.change.toFixed(3)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay for updates */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-small"></div>
          Atualizando dados...
        </div>
      )}
    </div>
  );
};

export default MarketOverview;