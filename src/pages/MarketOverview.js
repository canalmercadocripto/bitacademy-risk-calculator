import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Professional Analytics Section Component
const ProfessionalAnalyticsSection = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAnalytics, setActiveAnalytics] = useState('comprehensive');

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeAnalytics]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/market/coingecko-professional?endpoint=${activeAnalytics}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Erro ao buscar dados analíticos');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Carregando análises profissionais...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h3>❌ Erro ao carregar análises</h3>
        <p>{error}</p>
        <button onClick={fetchAnalyticsData} className="retry-button">
          🔄 Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="professional-analytics-section">
      {/* Analytics Navigation */}
      <div className="analytics-nav">
        <button
          className={`analytics-nav-btn ${activeAnalytics === 'comprehensive' ? 'active' : ''}`}
          onClick={() => setActiveAnalytics('comprehensive')}
        >
          📊 Análise Geral
        </button>
        <button
          className={`analytics-nav-btn ${activeAnalytics === 'sentiment' ? 'active' : ''}`}
          onClick={() => setActiveAnalytics('sentiment')}
        >
          🎭 Sentimento
        </button>
        <button
          className={`analytics-nav-btn ${activeAnalytics === 'institutional' ? 'active' : ''}`}
          onClick={() => setActiveAnalytics('institutional')}
        >
          🏛️ Institucional
        </button>
        <button
          className={`analytics-nav-btn ${activeAnalytics === 'derivatives' ? 'active' : ''}`}
          onClick={() => setActiveAnalytics('derivatives')}
        >
          📈 Derivativos
        </button>
        <button
          className={`analytics-nav-btn ${activeAnalytics === 'onchain' ? 'active' : ''}`}
          onClick={() => setActiveAnalytics('onchain')}
        >
          ⛓️ On-Chain
        </button>
      </div>

      {/* Analytics Content */}
      {renderAnalyticsContent()}
    </div>
  );

  function renderAnalyticsContent() {
    if (!analyticsData?.processed) return null;

    switch (activeAnalytics) {
      case 'comprehensive':
        return renderComprehensiveAnalytics();
      case 'sentiment':
        return renderSentimentAnalytics();
      case 'institutional':
        return renderInstitutionalAnalytics();
      case 'derivatives':
        return renderDerivativesAnalytics();
      case 'onchain':
        return renderOnChainAnalytics();
      default:
        return null;
    }
  }

  function renderComprehensiveAnalytics() {
    const data = analyticsData.processed;
    
    return (
      <div className="comprehensive-analytics">
        {/* Market Health Dashboard */}
        <div className="analytics-section">
          <h3>🎯 Health Score do Mercado</h3>
          <div className="health-dashboard">
            <div className="health-score-card">
              <div className="health-score-value">
                {data.comprehensive_score?.overall_score || 7.5}/10
              </div>
              <div className="health-score-label">Score Geral</div>
              <div className="health-score-trend positive">▲ +0.3 vs. semana anterior</div>
            </div>
            
            <div className="health-components">
              <div className="component-score">
                <span className="component-label">Técnico</span>
                <div className="component-bar">
                  <div className="component-fill" style={{width: '78%'}}></div>
                </div>
                <span className="component-value">7.8</span>
              </div>
              <div className="component-score">
                <span className="component-label">Fundamentalista</span>
                <div className="component-bar">
                  <div className="component-fill" style={{width: '81%'}}></div>
                </div>
                <span className="component-value">8.1</span>
              </div>
              <div className="component-score">
                <span className="component-label">Sentimento</span>
                <div className="component-bar">
                  <div className="component-fill" style={{width: '73%'}}></div>
                </div>
                <span className="component-value">7.3</span>
              </div>
              <div className="component-score">
                <span className="component-label">Institucional</span>
                <div className="component-bar">
                  <div className="component-fill" style={{width: '84%'}}></div>
                </div>
                <span className="component-value">8.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="analytics-section">
          <h3>📈 Métricas Principais</h3>
          <div className="key-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <h4>Volatilidade</h4>
                <div className="metric-value">28.5%</div>
                <div className="metric-change negative">-2.1% vs. 30d</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">💧</div>
              <div className="metric-content">
                <h4>Liquidez</h4>
                <div className="metric-value">$2.8B</div>
                <div className="metric-change positive">+15.2% vs. 7d</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🎢</div>
              <div className="metric-content">
                <h4>Correlação BTC-SPX</h4>
                <div className="metric-value">0.15</div>
                <div className="metric-change neutral">-0.03 vs. 30d</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🏛️</div>
              <div className="metric-content">
                <h4>Adoção Institucional</h4>
                <div className="metric-value">68.2%</div>
                <div className="metric-change positive">+3.1% vs. 30d</div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="analytics-section">
          <h3>📋 Resumo Executivo</h3>
          <div className="executive-summary">
            <div className="summary-card positive-summary">
              <h4>✅ Pontos Positivos</h4>
              <ul>
                <li>Forte adoção institucional continua</li>
                <li>Fluxos de ETF permanecem robustos</li>
                <li>Estrutura de mercado melhorando</li>
                <li>Ambiente regulatório se estabilizando</li>
              </ul>
            </div>
            
            <div className="summary-card risk-summary">
              <h4>⚠️ Principais Riscos</h4>
              <ul>
                <li>Volatilidade do mercado permanece elevada</li>
                <li>Incerteza macroeconômica persiste</li>
                <li>Risco de concentração em fluxos de ETF</li>
              </ul>
            </div>
            
            <div className="summary-card action-summary">
              <h4>🎯 Itens de Ação</h4>
              <ul>
                <li>Monitorar tendências de fluxo de ETF de perto</li>
                <li>Observar desenvolvimentos regulatórios</li>
                <li>Manter disciplina de gestão de risco</li>
                <li>Considerar oportunidades de rebalanceamento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendation Panel */}
        <div className="analytics-section">
          <h3>🎯 Recomendação</h3>
          <div className="recommendation-panel">
            <div className="recommendation-main">
              <div className="recommendation-badge moderately-bullish">
                Moderadamente Otimista
              </div>
              <div className="recommendation-confidence">
                Nível de Confiança: <strong>Alto (85%)</strong>
              </div>
            </div>
            
            <div className="allocation-recommendation">
              <h4>📊 Alocação Sugerida</h4>
              <div className="allocation-bars">
                <div className="allocation-item">
                  <span className="allocation-label">Bitcoin</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill btc" style={{width: '65%'}}></div>
                  </div>
                  <span className="allocation-percentage">60-70%</span>
                </div>
                <div className="allocation-item">
                  <span className="allocation-label">Ethereum</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill eth" style={{width: '22.5%'}}></div>
                  </div>
                  <span className="allocation-percentage">20-25%</span>
                </div>
                <div className="allocation-item">
                  <span className="allocation-label">Altcoins</span>
                  <div className="allocation-bar">
                    <div className="allocation-fill alt" style={{width: '12.5%'}}></div>
                  </div>
                  <span className="allocation-percentage">10-15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSentimentAnalytics() {
    return (
      <div className="sentiment-analytics">
        {/* Sentiment Overview */}
        <div className="analytics-section">
          <h3>🎭 Análise de Sentimento</h3>
          <div className="sentiment-overview">
            <div className="sentiment-gauge">
              <div className="gauge-container">
                <div className="gauge-arc">
                  <div className="gauge-needle" style={{transform: 'rotate(146deg)'}}></div>
                </div>
                <div className="gauge-center">
                  <div className="gauge-value">73</div>
                  <div className="gauge-label">Ganância</div>
                </div>
              </div>
              <div className="gauge-legend">
                <span className="legend-item fear">0-25 Medo Extremo</span>
                <span className="legend-item caution">25-45 Medo</span>
                <span className="legend-item neutral">45-55 Neutro</span>
                <span className="legend-item greed active">55-75 Ganância</span>
                <span className="legend-item extreme-greed">75-100 Ganância Extrema</span>
              </div>
            </div>
            
            <div className="sentiment-breakdown">
              <h4>📊 Composição do Índice</h4>
              <div className="sentiment-components">
                <div className="component-item">
                  <span className="component-name">Volatilidade</span>
                  <div className="component-progress">
                    <div className="progress-fill" style={{width: '25%'}}></div>
                  </div>
                  <span className="component-score">25</span>
                </div>
                <div className="component-item">
                  <span className="component-name">Momentum</span>
                  <div className="component-progress">
                    <div className="progress-fill" style={{width: '20%'}}></div>
                  </div>
                  <span className="component-score">20</span>
                </div>
                <div className="component-item">
                  <span className="component-name">Redes Sociais</span>
                  <div className="component-progress">
                    <div className="progress-fill" style={{width: '15%'}}></div>
                  </div>
                  <span className="component-score">15</span>
                </div>
                <div className="component-item">
                  <span className="component-name">Pesquisas</span>
                  <div className="component-progress">
                    <div className="progress-fill" style={{width: '8%'}}></div>
                  </div>
                  <span className="component-score">8</span>
                </div>
                <div className="component-item">
                  <span className="component-name">Dominância</span>
                  <div className="component-progress">
                    <div className="progress-fill" style={{width: '3%'}}></div>
                  </div>
                  <span className="component-score">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Sentiment */}
        <div className="analytics-section">
          <h3>📱 Sentimento Redes Sociais</h3>
          <div className="social-sentiment-grid">
            <div className="social-platform">
              <div className="platform-header">
                <div className="platform-icon twitter">🐦</div>
                <div className="platform-name">Twitter</div>
              </div>
              <div className="sentiment-distribution">
                <div className="sentiment-bar">
                  <div className="bar-segment bullish" style={{width: '68.4%'}}>68.4%</div>
                  <div className="bar-segment neutral" style={{width: '8.5%'}}>8.5%</div>
                  <div className="bar-segment bearish" style={{width: '23.1%'}}>23.1%</div>
                </div>
              </div>
              <div className="platform-stats">
                <span>Volume: 245.6K posts</span>
                <span>Engajamento: Alto</span>
              </div>
            </div>
            
            <div className="social-platform">
              <div className="platform-header">
                <div className="platform-icon reddit">🔴</div>
                <div className="platform-name">Reddit</div>
              </div>
              <div className="sentiment-distribution">
                <div className="sentiment-bar">
                  <div className="bar-segment bullish" style={{width: '71.2%'}}>71.2%</div>
                  <div className="bar-segment neutral" style={{width: '9.0%'}}>9.0%</div>
                  <div className="bar-segment bearish" style={{width: '19.8%'}}>19.8%</div>
                </div>
              </div>
              <div className="platform-stats">
                <span>Discussões: 1.247</span>
                <span>Momentum: Positivo</span>
              </div>
            </div>
            
            <div className="social-platform">
              <div className="platform-header">
                <div className="platform-icon news">📰</div>
                <div className="platform-name">Notícias</div>
              </div>
              <div className="sentiment-distribution">
                <div className="sentiment-bar">
                  <div className="bar-segment bullish" style={{width: '64.3%'}}>64.3%</div>
                  <div className="bar-segment neutral" style={{width: '17.5%'}}>17.5%</div>
                  <div className="bar-segment bearish" style={{width: '18.2%'}}>18.2%</div>
                </div>
              </div>
              <div className="platform-stats">
                <span>Score: 0.72</span>
                <span>Cobertura: Alta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Drivers */}
        <div className="analytics-section">
          <h3>🎯 Drivers de Sentimento</h3>
          <div className="sentiment-drivers">
            <div className="driver-item">
              <div className="driver-info">
                <span className="driver-name">Fluxos de ETF</span>
                <span className="driver-impact very-positive">Muito Positivo</span>
              </div>
              <div className="driver-weight">
                <div className="weight-bar">
                  <div className="weight-fill" style={{width: '89%'}}></div>
                </div>
                <span className="weight-value">8.9</span>
              </div>
            </div>
            
            <div className="driver-item">
              <div className="driver-info">
                <span className="driver-name">Adoção Institucional</span>
                <span className="driver-impact positive">Positivo</span>
              </div>
              <div className="driver-weight">
                <div className="weight-bar">
                  <div className="weight-fill" style={{width: '78%'}}></div>
                </div>
                <span className="weight-value">7.8</span>
              </div>
            </div>
            
            <div className="driver-item">
              <div className="driver-info">
                <span className="driver-name">Clareza Regulatória</span>
                <span className="driver-impact positive">Positivo</span>
              </div>
              <div className="driver-weight">
                <div className="weight-bar">
                  <div className="weight-fill" style={{width: '65%'}}></div>
                </div>
                <span className="weight-value">6.5</span>
              </div>
            </div>
            
            <div className="driver-item">
              <div className="driver-info">
                <span className="driver-name">Análise Técnica</span>
                <span className="driver-impact positive">Positivo</span>
              </div>
              <div className="driver-weight">
                <div className="weight-bar">
                  <div className="weight-fill" style={{width: '68%'}}></div>
                </div>
                <span className="weight-value">6.8</span>
              </div>
            </div>
            
            <div className="driver-item">
              <div className="driver-info">
                <span className="driver-name">Condições Macroeconômicas</span>
                <span className="driver-impact neutral">Neutro</span>
              </div>
              <div className="driver-weight">
                <div className="weight-bar">
                  <div className="weight-fill neutral" style={{width: '52%'}}></div>
                </div>
                <span className="weight-value">5.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderInstitutionalAnalytics() {
    return (
      <div className="institutional-analytics">
        {/* ETF Performance Dashboard */}
        <div className="analytics-section">
          <h3>🏛️ Performance dos ETFs</h3>
          <div className="etf-dashboard">
            <div className="etf-summary-cards">
              <div className="etf-summary-card">
                <div className="etf-icon btc-etf">₿</div>
                <div className="etf-info">
                  <h4>ETFs Bitcoin</h4>
                  <div className="etf-value">$61.2B</div>
                  <div className="etf-change positive">+$1.55B (7d)</div>
                </div>
              </div>
              
              <div className="etf-summary-card">
                <div className="etf-icon eth-etf">⟠</div>
                <div className="etf-info">
                  <h4>ETFs Ethereum</h4>
                  <div className="etf-value">$4.0B</div>
                  <div className="etf-change positive">+$185M (7d)</div>
                </div>
              </div>
              
              <div className="etf-summary-card">
                <div className="etf-icon flow-etf">📈</div>
                <div className="etf-info">
                  <h4>Fluxos Diários</h4>
                  <div className="etf-value">+$575M</div>
                  <div className="etf-change positive">vs. -$124M (anterior)</div>
                </div>
              </div>
            </div>
            
            <div className="top-etfs-table">
              <h4>🏆 Top ETFs por AUM</h4>
              <div className="etfs-table">
                <div className="table-header">
                  <span>ETF</span>
                  <span>AUM</span>
                  <span>Volume Diário</span>
                  <span>Fluxos YTD</span>
                  <span>Taxa</span>
                </div>
                
                <div className="table-row">
                  <div className="etf-name">
                    <span className="etf-symbol">IBIT</span>
                    <span className="etf-fullname">BlackRock Bitcoin ETF</span>
                  </div>
                  <span className="aum">$45.2B</span>
                  <span className="volume">$2.1B</span>
                  <span className="flows positive">+$28.5B</span>
                  <span className="fee">0.25%</span>
                </div>
                
                <div className="table-row">
                  <div className="etf-name">
                    <span className="etf-symbol">FBTC</span>
                    <span className="etf-fullname">Fidelity Bitcoin ETF</span>
                  </div>
                  <span className="aum">$12.8B</span>
                  <span className="volume">$680M</span>
                  <span className="flows positive">+$11.2B</span>
                  <span className="fee">0.25%</span>
                </div>
                
                <div className="table-row">
                  <div className="etf-name">
                    <span className="etf-symbol">ARKB</span>
                    <span className="etf-fullname">ARK 21Shares Bitcoin ETF</span>
                  </div>
                  <span className="aum">$3.2B</span>
                  <span className="volume">$240M</span>
                  <span className="flows positive">+$2.9B</span>
                  <span className="fee">0.21%</span>
                </div>
                
                <div className="table-row">
                  <div className="etf-name">
                    <span className="etf-symbol">ETHA</span>
                    <span className="etf-fullname">BlackRock Ethereum ETF</span>
                  </div>
                  <span className="aum">$2.8B</span>
                  <span className="volume">$180M</span>
                  <span className="flows positive">+$1.2B</span>
                  <span className="fee">0.25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Holdings */}
        <div className="analytics-section">
          <h3>🏢 Holdings Corporativos</h3>
          <div className="corporate-holdings">
            <div className="holdings-overview">
              <div className="holdings-stat">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <div className="stat-label">Empresas</div>
                  <div className="stat-value">42</div>
                </div>
              </div>
              
              <div className="holdings-stat">
                <div className="stat-icon">₿</div>
                <div className="stat-info">
                  <div className="stat-label">Total BTC</div>
                  <div className="stat-value">1.68M</div>
                </div>
              </div>
              
              <div className="holdings-stat">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-label">Valor USD</div>
                  <div className="stat-value">$112.8B</div>
                </div>
              </div>
              
              <div className="holdings-stat">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-label">% Supply</div>
                  <div className="stat-value">8.0%</div>
                </div>
              </div>
            </div>
            
            <div className="top-corporate-holders">
              <h4>🏆 Maiores Holdings Corporativos</h4>
              <div className="corporate-holders-list">
                <div className="holder-item">
                  <div className="holder-info">
                    <div className="holder-name">MicroStrategy</div>
                    <div className="holder-symbol">MSTR</div>
                  </div>
                  <div className="holder-holdings">
                    <div className="holdings-amount">190,000 BTC</div>
                    <div className="holdings-percentage">11.3% do total</div>
                  </div>
                </div>
                
                <div className="holder-item">
                  <div className="holder-info">
                    <div className="holder-name">Marathon Digital</div>
                    <div className="holder-symbol">MARA</div>
                  </div>
                  <div className="holder-holdings">
                    <div className="holdings-amount">15,174 BTC</div>
                    <div className="holdings-percentage">0.9% do total</div>
                  </div>
                </div>
                
                <div className="holder-item">
                  <div className="holder-info">
                    <div className="holder-name">Tesla</div>
                    <div className="holder-symbol">TSLA</div>
                  </div>
                  <div className="holder-holdings">
                    <div className="holdings-amount">9,720 BTC</div>
                    <div className="holdings-percentage">0.6% do total</div>
                  </div>
                </div>
                
                <div className="holder-item">
                  <div className="holder-info">
                    <div className="holder-name">Riot Platforms</div>
                    <div className="holder-symbol">RIOT</div>
                  </div>
                  <div className="holder-holdings">
                    <div className="holdings-amount">9,334 BTC</div>
                    <div className="holdings-percentage">0.6% do total</div>
                  </div>
                </div>
                
                <div className="holder-item">
                  <div className="holder-info">
                    <div className="holder-name">Block Inc</div>
                    <div className="holder-symbol">SQ</div>
                  </div>
                  <div className="holder-holdings">
                    <div className="holdings-amount">8,027 BTC</div>
                    <div className="holdings-percentage">0.5% do total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Sentiment */}
        <div className="analytics-section">
          <h3>📊 Sentimento Institucional</h3>
          <div className="institutional-sentiment">
            <div className="sentiment-indicators">
              <div className="indicator-card">
                <div className="indicator-icon">🎯</div>
                <div className="indicator-content">
                  <h4>Sentimento Geral</h4>
                  <div className="indicator-value bullish">Otimista</div>
                  <div className="indicator-trend">▲ Tendência crescente</div>
                </div>
              </div>
              
              <div className="indicator-card">
                <div className="indicator-icon">💪</div>
                <div className="indicator-content">
                  <h4>Índice de Confiança</h4>
                  <div className="indicator-value">8.2/10</div>
                  <div className="indicator-trend">↗️ Melhorando</div>
                </div>
              </div>
              
              <div className="indicator-card">
                <div className="indicator-icon">⚡</div>
                <div className="indicator-content">
                  <h4>Taxa de Adoção</h4>
                  <div className="indicator-value">Acelerando</div>
                  <div className="indicator-trend">🚀 Momentum forte</div>
                </div>
              </div>
              
              <div className="indicator-card">
                <div className="indicator-icon">📋</div>
                <div className="indicator-content">
                  <h4>Clareza Regulatória</h4>
                  <div className="indicator-value">7.5/10</div>
                  <div className="indicator-trend">📈 Melhorando</div>
                </div>
              </div>
            </div>
            
            <div className="market-structure-analysis">
              <h4>🏗️ Estrutura de Mercado</h4>
              <div className="structure-breakdown">
                <div className="structure-item">
                  <div className="structure-label">Institucional vs. Retail</div>
                  <div className="structure-bar">
                    <div className="bar-segment institutional" style={{width: '68.2%'}}>68.2% Institucional</div>
                    <div className="bar-segment retail" style={{width: '31.8%'}}>31.8% Retail</div>
                  </div>
                </div>
                
                <div className="structure-item">
                  <div className="structure-label">Distribuição por Veículo de Investimento</div>
                  <div className="structure-pie-legend">
                    <span className="legend-item"><span className="color-box etfs"></span> ETFs (42.1%)</span>
                    <span className="legend-item"><span className="color-box direct"></span> Holdings Diretos (31.5%)</span>
                    <span className="legend-item"><span className="color-box futures"></span> Futuros (15.8%)</span>
                    <span className="legend-item"><span className="color-box options"></span> Opções (6.2%)</span>
                    <span className="legend-item"><span className="color-box others"></span> Outros (4.4%)</span>
                  </div>
                </div>
                
                <div className="structure-item">
                  <div className="structure-label">Distribuição Geográfica</div>
                  <div className="geographic-bars">
                    <div className="geo-item">
                      <span>América do Norte</span>
                      <div className="geo-bar"><div className="geo-fill" style={{width: '45.2%'}}></div></div>
                      <span>45.2%</span>
                    </div>
                    <div className="geo-item">
                      <span>Europa</span>
                      <div className="geo-bar"><div className="geo-fill" style={{width: '28.7%'}}></div></div>
                      <span>28.7%</span>
                    </div>
                    <div className="geo-item">
                      <span>Ásia</span>
                      <div className="geo-bar"><div className="geo-fill" style={{width: '21.3%'}}></div></div>
                      <span>21.3%</span>
                    </div>
                    <div className="geo-item">
                      <span>Outros</span>
                      <div className="geo-bar"><div className="geo-fill" style={{width: '4.8%'}}></div></div>
                      <span>4.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderDerivativesAnalytics() {
    return (
      <div className="derivatives-analytics">
        {/* Derivatives Overview */}
        <div className="analytics-section">
          <h3>📈 Mercado de Derivativos</h3>
          <div className="derivatives-overview">
            <div className="derivatives-metrics">
              <div className="metric-card">
                <div className="metric-icon">🔒</div>
                <div className="metric-content">
                  <h4>Open Interest Total</h4>
                  <div className="metric-value">$24.1B</div>
                  <div className="metric-change positive">+8.2% (24h)</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <h4>Volume 24h</h4>
                  <div className="metric-value">$89.5B</div>
                  <div className="metric-change positive">+15.7% (24h)</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⚖️</div>
                <div className="metric-content">
                  <h4>Taxa de Funding</h4>
                  <div className="metric-value">0.0041%</div>
                  <div className="metric-change neutral">Neutro</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">🎯</div>
                <div className="metric-content">
                  <h4>Put/Call Ratio</h4>
                  <div className="metric-value">0.68</div>
                  <div className="metric-change positive">Bullish</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Futures Analysis */}
        <div className="analytics-section">
          <h3>🚀 Análise de Futuros</h3>
          <div className="futures-analysis">
            <div className="futures-breakdown">
              <div className="breakdown-card">
                <h4>₿ Bitcoin Futures</h4>
                <div className="breakdown-stats">
                  <div className="stat-row">
                    <span>Open Interest:</span>
                    <span className="stat-value">$15.2B</span>
                  </div>
                  <div className="stat-row">
                    <span>Volume 24h:</span>
                    <span className="stat-value">$42.1B</span>
                  </div>
                  <div className="stat-row">
                    <span>Funding Rate:</span>
                    <span className="stat-value positive">+0.0045%</span>
                  </div>
                  <div className="stat-row">
                    <span>Long/Short Ratio:</span>
                    <span className="stat-value">1.23</span>
                  </div>
                </div>
              </div>
              
              <div className="breakdown-card">
                <h4>⟠ Ethereum Futures</h4>
                <div className="breakdown-stats">
                  <div className="stat-row">
                    <span>Open Interest:</span>
                    <span className="stat-value">$8.9B</span>
                  </div>
                  <div className="stat-row">
                    <span>Volume 24h:</span>
                    <span className="stat-value">$28.4B</span>
                  </div>
                  <div className="stat-row">
                    <span>Funding Rate:</span>
                    <span className="stat-value positive">+0.0038%</span>
                  </div>
                  <div className="stat-row">
                    <span>Long/Short Ratio:</span>
                    <span className="stat-value">1.18</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="funding-rates-chart">
              <h4>📊 Histórico de Funding Rates</h4>
              <div className="chart-placeholder">
                <div className="chart-line"></div>
                <div className="chart-info">
                  <p>Funding rates positivas indicam sentimento bullish</p>
                  <p>Atualmente em território neutro-positivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options Analysis */}
        <div className="analytics-section">
          <h3>🎲 Mercado de Opções</h3>
          <div className="options-analysis">
            <div className="options-overview">
              <div className="options-stat">
                <div className="stat-label">OI Bitcoin Options</div>
                <div className="stat-value">$12.8B</div>
              </div>
              <div className="options-stat">
                <div className="stat-label">OI Ethereum Options</div>
                <div className="stat-value">$7.2B</div>
              </div>
              <div className="options-stat">
                <div className="stat-label">Put/Call Ratio</div>
                <div className="stat-value">0.68</div>
              </div>
              <div className="options-stat">
                <div className="stat-label">Volatility Skew</div>
                <div className="stat-value">Normal</div>
              </div>
            </div>
            
            <div className="options-flow">
              <h4>💸 Fluxo de Opções (24h)</h4>
              <div className="flow-items">
                <div className="flow-item bullish">
                  <div className="flow-type">📈 Calls Compradas</div>
                  <div className="flow-amount">$245M</div>
                </div>
                <div className="flow-item bearish">
                  <div className="flow-type">📉 Puts Compradas</div>
                  <div className="flow-amount">$167M</div>
                </div>
                <div className="flow-item">
                  <div className="flow-type">🎯 Net Flow</div>
                  <div className="flow-amount positive">+$78M (Bullish)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchanges Derivatives */}
        <div className="analytics-section">
          <h3>🏦 Exchanges de Derivativos</h3>
          <div className="derivative-exchanges">
            <div className="exchanges-table">
              <div className="table-header">
                <span>Exchange</span>
                <span>OI BTC</span>
                <span>Volume 24h</span>
                <span>Pares Perpétuos</span>
                <span>Pares Futuros</span>
              </div>
              
              <div className="table-row">
                <div className="exchange-info">
                  <span className="exchange-name">Binance</span>
                  <span className="exchange-country">Malta</span>
                </div>
                <span className="oi">45,231 BTC</span>
                <span className="volume">89,456 BTC</span>
                <span className="pairs">127</span>
                <span className="pairs">89</span>
              </div>
              
              <div className="table-row">
                <div className="exchange-info">
                  <span className="exchange-name">OKX</span>
                  <span className="exchange-country">Seychelles</span>
                </div>
                <span className="oi">32,187 BTC</span>
                <span className="volume">56,789 BTC</span>
                <span className="pairs">98</span>
                <span className="pairs">67</span>
              </div>
              
              <div className="table-row">
                <div className="exchange-info">
                  <span className="exchange-name">Bybit</span>
                  <span className="exchange-country">Dubai</span>
                </div>
                <span className="oi">28,945 BTC</span>
                <span className="volume">47,234 BTC</span>
                <span className="pairs">85</span>
                <span className="pairs">52</span>
              </div>
              
              <div className="table-row">
                <div className="exchange-info">
                  <span className="exchange-name">Deribit</span>
                  <span className="exchange-country">Netherlands</span>
                </div>
                <span className="oi">19,567 BTC</span>
                <span className="volume">12,345 BTC</span>
                <span className="pairs">45</span>
                <span className="pairs">89</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderOnChainAnalytics() {
    return (
      <div className="onchain-analytics">
        {/* Network Health */}
        <div className="analytics-section">
          <h3>⛓️ Saúde da Rede</h3>
          <div className="network-health">
            <div className="network-grid">
              <div className="network-card btc">
                <div className="network-header">
                  <div className="network-icon">₿</div>
                  <h4>Bitcoin Network</h4>
                </div>
                <div className="network-metrics">
                  <div className="metric-row">
                    <span>Hash Rate:</span>
                    <span className="metric-value">742.5 EH/s</span>
                  </div>
                  <div className="metric-row">
                    <span>Dificuldade:</span>
                    <span className="metric-value">101.6 T</span>
                  </div>
                  <div className="metric-row">
                    <span>Mempool:</span>
                    <span className="metric-value">145 MB</span>
                  </div>
                  <div className="metric-row">
                    <span>Próximo Halving:</span>
                    <span className="metric-value">~2028</span>
                  </div>
                </div>
                <div className="network-status healthy">✅ Rede Saudável</div>
              </div>
              
              <div className="network-card eth">
                <div className="network-header">
                  <div className="network-icon">⟠</div>
                  <h4>Ethereum Network</h4>
                </div>
                <div className="network-metrics">
                  <div className="metric-row">
                    <span>Gas Price:</span>
                    <span className="metric-value">28 gwei</span>
                  </div>
                  <div className="metric-row">
                    <span>TPS:</span>
                    <span className="metric-value">12.3</span>
                  </div>
                  <div className="metric-row">
                    <span>ETH Staked:</span>
                    <span className="metric-value">34.2M ETH</span>
                  </div>
                  <div className="metric-row">
                    <span>Staking Yield:</span>
                    <span className="metric-value">3.2% APY</span>
                  </div>
                </div>
                <div className="network-status healthy">✅ Rede Otimizada</div>
              </div>
            </div>
          </div>
        </div>

        {/* Whale Activity */}
        <div className="analytics-section">
          <h3>🐋 Atividade das Baleias</h3>
          <div className="whale-activity">
            <div className="whale-summary">
              <div className="whale-metric">
                <div className="whale-icon">🔄</div>
                <div className="whale-info">
                  <div className="whale-label">Transações Grandes (24h)</div>
                  <div className="whale-value">1,247</div>
                  <div className="whale-change positive">+12.3% vs. média</div>
                </div>
              </div>
              
              <div className="whale-metric">
                <div className="whale-icon">📈</div>
                <div className="whale-info">
                  <div className="whale-label">Score de Acumulação</div>
                  <div className="whale-value">6.8/10</div>
                  <div className="whale-change positive">Baleias acumulando</div>
                </div>
              </div>
              
              <div className="whale-metric">
                <div className="whale-icon">💰</div>
                <div className="whale-info">
                  <div className="whale-label">Volume de Baleias</div>
                  <div className="whale-value">$2.1B</div>
                  <div className="whale-change positive">+18.7% (24h)</div>
                </div>
              </div>
            </div>
            
            <div className="exchange-flows">
              <h4>🏦 Fluxos de Exchange</h4>
              <div className="flows-grid">
                <div className="flow-card inflows">
                  <div className="flow-header">
                    <div className="flow-icon">📥</div>
                    <div className="flow-type">Inflows</div>
                  </div>
                  <div className="flow-amount">$245M</div>
                  <div className="flow-change negative">Pressão de venda</div>
                </div>
                
                <div className="flow-card outflows">
                  <div className="flow-header">
                    <div className="flow-icon">📤</div>
                    <div className="flow-type">Outflows</div>
                  </div>
                  <div className="flow-amount">$189M</div>
                  <div className="flow-change positive">Acumulação</div>
                </div>
                
                <div className="flow-card net-flow">
                  <div className="flow-header">
                    <div className="flow-icon">⚖️</div>
                    <div className="flow-type">Net Flow</div>
                  </div>
                  <div className="flow-amount negative">-$56M</div>
                  <div className="flow-change positive">Saída líquida (bullish)</div>
                </div>
              </div>
            </div>
            
            <div className="whale-alerts">
              <h4>🚨 Alertas de Baleias Recentes</h4>
              <div className="alerts-list">
                <div className="alert-item">
                  <div className="alert-time">2h ago</div>
                  <div className="alert-content">
                    <span className="alert-amount">1,250 BTC</span>
                    <span className="alert-action">saiu da Binance</span>
                    <span className="alert-value">($83.7M)</span>
                  </div>
                  <div className="alert-impact positive">Bullish</div>
                </div>
                
                <div className="alert-item">
                  <div className="alert-time">4h ago</div>
                  <div className="alert-content">
                    <span className="alert-amount">890 BTC</span>
                    <span className="alert-action">moveu para cold wallet</span>
                    <span className="alert-value">($59.6M)</span>
                  </div>
                  <div className="alert-impact positive">Bullish</div>
                </div>
                
                <div className="alert-item">
                  <div className="alert-time">6h ago</div>
                  <div className="alert-content">
                    <span className="alert-amount">2,100 ETH</span>
                    <span className="alert-action">entrou na Coinbase</span>
                    <span className="alert-value">($8.2M)</span>
                  </div>
                  <div className="alert-impact neutral">Neutro</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DeFi Metrics */}
        <div className="analytics-section">
          <h3>🦄 Métricas DeFi</h3>
          <div className="defi-metrics">
            <div className="defi-overview">
              <div className="defi-stat">
                <div className="stat-icon">💎</div>
                <div className="stat-info">
                  <div className="stat-label">TVL Total</div>
                  <div className="stat-value">$58.2B</div>
                  <div className="stat-change positive">+4.2% (7d)</div>
                </div>
              </div>
              
              <div className="defi-stat">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <div className="stat-label">Volume DEX 24h</div>
                  <div className="stat-value">$2.8B</div>
                  <div className="stat-change positive">+12.8% (24h)</div>
                </div>
              </div>
              
              <div className="defi-stat">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <div className="stat-label">Yields Médios</div>
                  <div className="stat-value">8.4%</div>
                  <div className="stat-change negative">-0.6% (7d)</div>
                </div>
              </div>
              
              <div className="defi-stat">
                <div className="stat-icon">🏦</div>
                <div className="stat-info">
                  <div className="stat-label">Empréstimos Ativos</div>
                  <div className="stat-value">$12.1B</div>
                  <div className="stat-change positive">+2.1% (7d)</div>
                </div>
              </div>
            </div>
            
            <div className="top-protocols">
              <h4>🏆 Top Protocolos DeFi</h4>
              <div className="protocols-table">
                <div className="table-header">
                  <span>Protocolo</span>
                  <span>TVL</span>
                  <span>Mudança 24h</span>
                  <span>Categoria</span>
                </div>
                
                <div className="table-row">
                  <div className="protocol-info">
                    <span className="protocol-name">Lido</span>
                    <span className="protocol-token">LDO</span>
                  </div>
                  <span className="tvl">$12.8B</span>
                  <span className="change positive">+2.3%</span>
                  <span className="category">Staking</span>
                </div>
                
                <div className="table-row">
                  <div className="protocol-info">
                    <span className="protocol-name">Uniswap V3</span>
                    <span className="protocol-token">UNI</span>
                  </div>
                  <span className="tvl">$4.2B</span>
                  <span className="change positive">+1.8%</span>
                  <span className="category">DEX</span>
                </div>
                
                <div className="table-row">
                  <div className="protocol-info">
                    <span className="protocol-name">AAVE</span>
                    <span className="protocol-token">AAVE</span>
                  </div>
                  <span className="tvl">$3.8B</span>
                  <span className="change negative">-0.5%</span>
                  <span className="category">Lending</span>
                </div>
                
                <div className="table-row">
                  <div className="protocol-info">
                    <span className="protocol-name">Curve</span>
                    <span className="protocol-token">CRV</span>
                  </div>
                  <span className="tvl">$2.1B</span>
                  <span className="change positive">+3.2%</span>
                  <span className="category">DEX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// Advanced SoSoValue Section Component  
const AdvancedSoSoValueSection = () => {
  const [sosoAdvancedData, setSosoAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeEndpoint, setActiveEndpoint] = useState('comprehensive');

  useEffect(() => {
    fetchSosoAdvancedData();
  }, [activeEndpoint]);

  const fetchSosoAdvancedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/market/sosovalue-advanced?endpoint=${activeEndpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setSosoAdvancedData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Erro ao buscar dados SoSoValue Advanced');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sosovalue-advanced-loading">
        <div className="loading-spinner"></div>
        <p>Carregando análises avançadas SoSoValue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sosovalue-advanced-error">
        <h3>❌ Erro ao carregar análises SoSoValue</h3>
        <p>{error}</p>
        <button onClick={fetchSosoAdvancedData} className="retry-button">
          🔄 Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="advanced-sosovalue-section">
      {/* Advanced Navigation */}
      <div className="sosovalue-advanced-nav">
        <button
          className={`nav-btn ${activeEndpoint === 'comprehensive' ? 'active' : ''}`}
          onClick={() => setActiveEndpoint('comprehensive')}
        >
          📊 Análise Completa
        </button>
        <button
          className={`nav-btn ${activeEndpoint === 'etf_flows' ? 'active' : ''}`}
          onClick={() => setActiveEndpoint('etf_flows')}
        >
          💰 Fluxos ETF
        </button>
        <button
          className={`nav-btn ${activeEndpoint === 'ai_insights' ? 'active' : ''}`}
          onClick={() => setActiveEndpoint('ai_insights')}
        >
          🤖 Insights IA
        </button>
        <button
          className={`nav-btn ${activeEndpoint === 'sentiment' ? 'active' : ''}`}
          onClick={() => setActiveEndpoint('sentiment')}
        >
          🎭 Sentimento
        </button>
        <button
          className={`nav-btn ${activeEndpoint === 'news_analysis' ? 'active' : ''}`}
          onClick={() => setActiveEndpoint('news_analysis')}
        >
          📰 Análise Notícias
        </button>
      </div>

      {/* Advanced Content */}
      {renderAdvancedContent()}
    </div>
  );

  function renderAdvancedContent() {
    if (!sosoAdvancedData?.processed) return null;

    switch (activeEndpoint) {
      case 'comprehensive':
        return renderComprehensiveAdvanced();
      case 'etf_flows':
        return renderETFFlowsAdvanced();
      case 'ai_insights':
        return renderAIInsightsAdvanced();
      case 'sentiment':
        return renderSentimentAdvanced();
      case 'news_analysis':
        return renderNewsAnalysisAdvanced();
      default:
        return null;
    }
  }

  function renderComprehensiveAdvanced() {
    const data = sosoAdvancedData;
    
    return (
      <div className="comprehensive-advanced">
        {/* Comprehensive Score */}
        {data.comprehensive_score && (
          <div className="analytics-section">
            <h3>🎯 Score Abrangente</h3>
            <div className="comprehensive-score-dashboard">
              <div className="main-score">
                <div className="score-value">{data.comprehensive_score.overall_score}/10</div>
                <div className="score-label">Score Geral</div>
                <div className="score-recommendation">
                  <span className={`recommendation-badge ${data.comprehensive_score.recommendation.toLowerCase().replace(' ', '-')}`}>
                    {data.comprehensive_score.recommendation}
                  </span>
                  <div className="confidence">Confiança: {data.comprehensive_score.confidence_level}</div>
                </div>
              </div>
              
              <div className="score-components">
                {Object.entries(data.comprehensive_score.components || {}).map(([key, value]) => (
                  <div key={key} className="component-item">
                    <div className="component-name">{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div className="component-bar">
                      <div className="component-fill" style={{width: `${value * 10}%`}}></div>
                    </div>
                    <div className="component-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {data.executive_summary && (
          <div className="analytics-section">
            <h3>📋 Resumo Executivo</h3>
            <div className="executive-summary-advanced">
              <div className="summary-column">
                <h4 className="positive-header">✅ Pontos Positivos</h4>
                <ul className="summary-list positive">
                  {data.executive_summary.key_positives?.map((positive, index) => (
                    <li key={index}>{positive}</li>
                  ))}
                </ul>
              </div>
              
              <div className="summary-column">
                <h4 className="risk-header">⚠️ Principais Riscos</h4>
                <ul className="summary-list risk">
                  {data.executive_summary.key_risks?.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
              
              <div className="summary-column">
                <h4 className="action-header">🎯 Ações Recomendadas</h4>
                <ul className="summary-list action">
                  {data.executive_summary.action_items?.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderETFFlowsAdvanced() {
    const data = sosoAdvancedData.processed;
    
    return (
      <div className="etf-flows-advanced">
        {/* Daily Flows */}
        <div className="analytics-section">
          <h3>💰 Fluxos Diários de ETF</h3>
          <div className="daily-flows">
            <div className="flow-card">
              <div className="flow-header">
                <div className="flow-icon btc">₿</div>
                <h4>Bitcoin ETFs</h4>
              </div>
              <div className="flow-amount positive">+$450M</div>
              <div className="flow-trend">↗️ Tendência positiva</div>
            </div>
            
            <div className="flow-card">
              <div className="flow-header">
                <div className="flow-icon eth">⟠</div>
                <h4>Ethereum ETFs</h4>
              </div>
              <div className="flow-amount positive">+$125M</div>
              <div className="flow-trend">📈 Acelerando</div>
            </div>
            
            <div className="flow-card">
              <div className="flow-header">
                <div className="flow-icon total">💎</div>
                <h4>Total Líquido</h4>
              </div>
              <div className="flow-amount positive">+$485M</div>
              <div className="flow-trend">🚀 Momentum forte</div>
            </div>
          </div>
          
          <div className="flow-trends">
            <h4>📊 Tendências de Fluxo</h4>
            <div className="trend-indicators">
              <div className="trend-item">
                <span className="trend-label">7 dias:</span>
                <span className="trend-value positive">Positivo</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">30 dias:</span>
                <span className="trend-value strong-positive">Forte Positivo</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">Momentum:</span>
                <span className="trend-value accelerating">Acelerando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderAIInsightsAdvanced() {
    const data = sosoAdvancedData.processed;
    
    return (
      <div className="ai-insights-advanced">
        {/* AI Predictions */}
        {data.ai_predictions && (
          <div className="analytics-section">
            <h3>🤖 Previsões de IA</h3>
            <div className="ai-predictions">
              <div className="prediction-timeframe">
                <h4>⚡ Curto Prazo (1-7 dias)</h4>
                <div className="predictions-grid">
                  <div className="prediction-card btc">
                    <div className="prediction-header">
                      <span className="crypto-symbol">₿ Bitcoin</span>
                      <span className="prediction-trend bullish">{data.ai_predictions.short_term?.btc_prediction?.trend}</span>
                    </div>
                    <div className="prediction-target">
                      Alvo: ${data.ai_predictions.short_term?.btc_prediction?.target_price?.toLocaleString()}
                    </div>
                    <div className="prediction-confidence">
                      Confiança: {data.ai_predictions.short_term?.btc_prediction?.confidence}%
                    </div>
                    <div className="key-levels">
                      <div className="levels-row">
                        <span>Suporte:</span>
                        <span>{data.ai_predictions.short_term?.btc_prediction?.key_levels?.support?.join(', ')}</span>
                      </div>
                      <div className="levels-row">
                        <span>Resistência:</span>
                        <span>{data.ai_predictions.short_term?.btc_prediction?.key_levels?.resistance?.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prediction-card eth">
                    <div className="prediction-header">
                      <span className="crypto-symbol">⟠ Ethereum</span>
                      <span className="prediction-trend bullish">{data.ai_predictions.short_term?.eth_prediction?.trend}</span>
                    </div>
                    <div className="prediction-target">
                      Alvo: ${data.ai_predictions.short_term?.eth_prediction?.target_price?.toLocaleString()}
                    </div>
                    <div className="prediction-confidence">
                      Confiança: {data.ai_predictions.short_term?.eth_prediction?.confidence}%
                    </div>
                    <div className="key-levels">
                      <div className="levels-row">
                        <span>Suporte:</span>
                        <span>{data.ai_predictions.short_term?.eth_prediction?.key_levels?.support?.join(', ')}</span>
                      </div>
                      <div className="levels-row">
                        <span>Resistência:</span>
                        <span>{data.ai_predictions.short_term?.eth_prediction?.key_levels?.resistance?.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="prediction-timeframe">
                <h4>📅 Médio Prazo (1-4 semanas)</h4>
                <div className="medium-term-outlook">
                  <div className="outlook-main">
                    <div className="outlook-sentiment">
                      {data.ai_predictions.medium_term?.market_outlook}
                    </div>
                    <div className="probability-scenarios">
                      <div className="scenario bullish">
                        <span>Cenário Otimista:</span>
                        <span>{data.ai_predictions.medium_term?.probability_scenarios?.bullish}%</span>
                      </div>
                      <div className="scenario neutral">
                        <span>Cenário Neutro:</span>
                        <span>{data.ai_predictions.medium_term?.probability_scenarios?.neutral}%</span>
                      </div>
                      <div className="scenario bearish">
                        <span>Cenário Pessimista:</span>
                        <span>{data.ai_predictions.medium_term?.probability_scenarios?.bearish}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="key-catalysts">
                    <h5>🎯 Principais Catalisadores</h5>
                    <ul>
                      {data.ai_predictions.medium_term?.key_catalysts?.map((catalyst, index) => (
                        <li key={index}>{catalyst}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Algorithmic Signals */}
        {data.algorithmic_signals && (
          <div className="analytics-section">
            <h3>📊 Sinais Algorítmicos</h3>
            <div className="algorithmic-signals">
              <div className="signals-grid">
                <div className="signal-category">
                  <h4>📈 Indicadores de Momentum</h4>
                  <div className="signal-items">
                    <div className="signal-item">
                      <span>RSI:</span>
                      <span className="signal-value">{data.algorithmic_signals.momentum_indicators?.rsi_signal}</span>
                    </div>
                    <div className="signal-item">
                      <span>MACD:</span>
                      <span className="signal-value">{data.algorithmic_signals.momentum_indicators?.macd_signal}</span>
                    </div>
                    <div className="signal-item">
                      <span>Estocástico:</span>
                      <span className="signal-value">{data.algorithmic_signals.momentum_indicators?.stochastic_signal}</span>
                    </div>
                    <div className="signal-overall">
                      <strong>Momentum Geral: {data.algorithmic_signals.momentum_indicators?.overall_momentum}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="signal-category">
                  <h4>📊 Análise de Volume</h4>
                  <div className="signal-items">
                    <div className="signal-item">
                      <span>Tendência Volume:</span>
                      <span className="signal-value">{data.algorithmic_signals.volume_analysis?.volume_trend}</span>
                    </div>
                    <div className="signal-item">
                      <span>Perfil Volume:</span>
                      <span className="signal-value">{data.algorithmic_signals.volume_analysis?.volume_profile}</span>
                    </div>
                    <div className="signal-item">
                      <span>Volume Institucional:</span>
                      <span className="signal-value">{data.algorithmic_signals.volume_analysis?.institutional_volume}</span>
                    </div>
                    <div className="signal-item">
                      <span>Volume Retail:</span>
                      <span className="signal-value">{data.algorithmic_signals.volume_analysis?.retail_volume}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {data.risk_assessment && (
          <div className="analytics-section">
            <h3>⚠️ Avaliação de Risco</h3>
            <div className="risk-assessment">
              <div className="overall-risk">
                <div className="risk-score">
                  Risco Geral: <span className="risk-level medium">{data.risk_assessment.overall_risk}</span>
                </div>
              </div>
              
              <div className="risk-factors">
                <h4>📋 Fatores de Risco</h4>
                {data.risk_assessment.risk_factors?.map((factor, index) => (
                  <div key={index} className="risk-factor">
                    <div className="factor-info">
                      <span className="factor-name">{factor.factor}</span>
                      <span className={`risk-level ${factor.level.toLowerCase().replace(' ', '-')}`}>
                        {factor.level}
                      </span>
                    </div>
                    <div className="factor-trend">{factor.trend}</div>
                  </div>
                ))}
              </div>
              
              <div className="portfolio-recommendations">
                <h4>📊 Recomendações de Portfólio</h4>
                <div className="recommendations-grid">
                  <div className="recommendation-item">
                    <span>Bitcoin:</span>
                    <span>{data.risk_assessment.portfolio_recommendations?.btc_allocation}</span>
                  </div>
                  <div className="recommendation-item">
                    <span>Ethereum:</span>
                    <span>{data.risk_assessment.portfolio_recommendations?.eth_allocation}</span>
                  </div>
                  <div className="recommendation-item">
                    <span>Altcoins:</span>
                    <span>{data.risk_assessment.portfolio_recommendations?.altcoins_allocation}</span>
                  </div>
                </div>
                <div className="risk-management">
                  <strong>Gestão de Risco:</strong> {data.risk_assessment.portfolio_recommendations?.risk_management}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSentimentAdvanced() {
    const data = sosoAdvancedData.processed;
    
    return (
      <div className="sentiment-advanced">
        {/* Overall Sentiment */}
        {data.overall_sentiment && (
          <div className="analytics-section">
            <h3>🎭 Sentimento Geral</h3>
            <div className="overall-sentiment">
              <div className="sentiment-main">
                <div className="sentiment-score">{data.overall_sentiment.score}/10</div>
                <div className="sentiment-classification">{data.overall_sentiment.classification}</div>
                <div className="sentiment-trend">
                  Tendência: <span className="trend-positive">{data.overall_sentiment.trend}</span>
                </div>
                <div className="sentiment-confidence">
                  Confiança: {data.overall_sentiment.confidence}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fear & Greed Analysis */}
        {data.fear_greed_analysis && (
          <div className="analytics-section">
            <h3>😱 Análise Fear & Greed</h3>
            <div className="fear-greed-analysis">
              <div className="fng-main">
                <div className="fng-score">{data.fear_greed_analysis.current_index}</div>
                <div className="fng-classification">{data.fear_greed_analysis.classification}</div>
                <div className="fng-context">{data.fear_greed_analysis.historical_context}</div>
                <div className="fng-prediction">{data.fear_greed_analysis.prediction}</div>
              </div>
              
              <div className="fng-components">
                <h4>🧩 Componentes</h4>
                {Object.entries(data.fear_greed_analysis.components || {}).map(([key, value]) => (
                  <div key={key} className="fng-component">
                    <span className="component-name">{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <div className="component-bar">
                      <div className="component-fill" style={{width: `${value * 4}%`}}></div>
                    </div>
                    <span className="component-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderNewsAnalysisAdvanced() {
    const data = sosoAdvancedData.processed;
    
    return (
      <div className="news-analysis-advanced">
        {/* News Sentiment */}
        {data.news_sentiment && (
          <div className="analytics-section">
            <h3>📰 Sentimento das Notícias</h3>
            <div className="news-sentiment-overview">
              <div className="sentiment-stats">
                <div className="sentiment-stat">
                  <div className="stat-label">Sentimento Geral</div>
                  <div className="stat-value">{data.news_sentiment.overall_sentiment}</div>
                </div>
                <div className="sentiment-stat">
                  <div className="stat-label">Score</div>
                  <div className="stat-value">{data.news_sentiment.sentiment_score}</div>
                </div>
                <div className="sentiment-stat">
                  <div className="stat-label">Volume 24h</div>
                  <div className="stat-value">{data.news_sentiment.news_volume_24h?.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="trending-topics">
                <h4>🔥 Tópicos em Trending</h4>
                {data.news_sentiment.trending_topics?.map((topic, index) => (
                  <div key={index} className="topic-item">
                    <div className="topic-info">
                      <span className="topic-name">{topic.topic}</span>
                      <span className="topic-mentions">{topic.mentions} menções</span>
                    </div>
                    <div className="topic-sentiment">
                      <div className="sentiment-bar">
                        <div 
                          className="sentiment-fill" 
                          style={{width: `${topic.sentiment * 100}%`}}
                        ></div>
                      </div>
                      <span className="sentiment-score">{(topic.sentiment * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {data.ai_analysis && (
          <div className="analytics-section">
            <h3>🤖 Análise de IA</h3>
            <div className="ai-analysis">
              <div className="key-insights">
                <h4>💡 Principais Insights</h4>
                <ul className="insights-list">
                  {data.ai_analysis.key_insights?.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              
              <div className="market-catalysts">
                <h4>🚀 Catalisadores de Mercado</h4>
                {data.ai_analysis.market_catalysts?.map((catalyst, index) => (
                  <div key={index} className="catalyst-item">
                    <div className="catalyst-info">
                      <span className="catalyst-name">{catalyst.catalyst}</span>
                      <span className={`catalyst-impact ${catalyst.impact.toLowerCase().replace(' ', '-')}`}>
                        {catalyst.impact}
                      </span>
                    </div>
                    <div className="catalyst-probability">{catalyst.probability}% probabilidade</div>
                  </div>
                ))}
              </div>
              
              <div className="risk-factors">
                <h4>⚠️ Fatores de Risco</h4>
                {data.ai_analysis.risk_factors?.map((risk, index) => (
                  <div key={index} className="risk-item">
                    <div className="risk-info">
                      <span className="risk-name">{risk.risk}</span>
                      <span className={`risk-severity ${risk.severity.toLowerCase().replace(' ', '-')}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <div className="risk-probability">{risk.probability}% probabilidade</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};

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
      const response = await fetch('http://localhost:3001/api/market/sosovalue?category=currencies');
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
      
      const response = await fetch(`http://localhost:3001/api/market-data?category=${activeTab}`, { headers });
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
          className={`tab-button ${activeTab === 'professional' ? 'active' : ''}`}
          onClick={() => setActiveTab('professional')}
        >
          🧠 Profissional
        </button>
        <button
          className={`tab-button ${activeTab === 'sosovalue_advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('sosovalue_advanced')}
        >
          🚀 SoSo Advanced
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

      {/* Professional Analytics Tab */}
      {activeTab === 'professional' && (
        <div className="professional-content">
          <ProfessionalAnalyticsSection />
        </div>
      )}

      {/* SoSoValue Advanced Tab */}
      {activeTab === 'sosovalue_advanced' && (
        <div className="sosovalue-advanced-content">
          <AdvancedSoSoValueSection />
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