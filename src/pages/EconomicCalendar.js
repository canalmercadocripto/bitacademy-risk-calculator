import React, { useState, useEffect, useRef } from 'react';
import '../styles/EconomicCalendar.css';

const EconomicCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [impactAnalysis, setImpactAnalysis] = useState({
    totalEvents: 0,
    highImpact: 0,
    mediumImpact: 0,
    lowImpact: 0,
    riskLevel: 'low',
    recommendation: 'Normal trading conditions'
  });
  const [currentEvents, setCurrentEvents] = useState([]);
  const [marketAlert, setMarketAlert] = useState(null);
  const iframeRef = useRef(null);

  // Simulação de eventos econômicos baseados na data
  const getEventsForDate = (date) => {
    const events = [
      {
        time: '08:30',
        name: 'Pedidos de Auxílio Desemprego',
        country: '🇺🇸',
        impact: 'medium',
        actual: '220K',
        forecast: '215K',
        previous: '218K',
        currency: 'USD'
      },
      {
        time: '10:00',
        name: 'PMI Industrial',
        country: '🇪🇺',
        impact: 'medium',
        actual: '52.1',
        forecast: '51.8',
        previous: '51.5',
        currency: 'EUR'
      },
      {
        time: '14:30',
        name: 'Non-Farm Payroll',
        country: '🇺🇸',
        impact: 'high',
        actual: '275K',
        forecast: '250K',
        previous: '260K',
        currency: 'USD'
      },
      {
        time: '14:30',
        name: 'Taxa de Desemprego',
        country: '🇺🇸',
        impact: 'high',
        actual: '3.8%',
        forecast: '3.9%',
        previous: '3.9%',
        currency: 'USD'
      },
      {
        time: '16:00',
        name: 'Decisão Taxa de Juros Fed',
        country: '🇺🇸',
        impact: 'high',
        actual: '5.50%',
        forecast: '5.25%',
        previous: '5.25%',
        currency: 'USD'
      }
    ];

    // Simular diferentes eventos baseados no dia da semana
    const dayOfWeek = date.getDay();
    const filteredEvents = events.filter((_, index) => {
      if (dayOfWeek === 5) return true; // Sexta-feira: todos os eventos
      if (dayOfWeek === 1) return index < 2; // Segunda: poucos eventos
      if (dayOfWeek === 3) return index < 4; // Quarta: muitos eventos
      return index < 3; // Outros dias: eventos médios
    });

    return filteredEvents;
  };

  // Análise de impacto baseada nos eventos
  const analyzeImpact = (events) => {
    const highImpact = events.filter(e => e.impact === 'high').length;
    const mediumImpact = events.filter(e => e.impact === 'medium').length;
    const lowImpact = events.filter(e => e.impact === 'low').length;
    const totalEvents = events.length;

    let riskLevel = 'low';
    let recommendation = 'Condições normais de trading';

    if (highImpact >= 3) {
      riskLevel = 'extreme';
      recommendation = 'EXTREMO CUIDADO: Múltiplos eventos de alto impacto. Considere pausar operações.';
    } else if (highImpact >= 2) {
      riskLevel = 'high';
      recommendation = 'ALTO RISCO: Reduza posições e use stops mais apertados.';
    } else if (highImpact >= 1) {
      riskLevel = 'medium';
      recommendation = 'RISCO MODERADO: Monitore closely e ajuste gerenciamento de risco.';
    } else if (mediumImpact >= 3) {
      riskLevel = 'medium';
      recommendation = 'VOLATILIDADE ESPERADA: Múltiplos eventos médios podem causar movimentos.';
    }

    return {
      totalEvents,
      highImpact,
      mediumImpact,
      lowImpact,
      riskLevel,
      recommendation
    };
  };

  // Gerar alerta baseado na análise
  const generateMarketAlert = (analysis) => {
    if (analysis.riskLevel === 'extreme') {
      return {
        type: 'danger',
        title: '🚨 ALERTA EXTREMO',
        message: 'Múltiplos eventos de alto impacto detectados. Trading de alto risco.',
        actions: ['Fechar Posições', 'Alertas SMS']
      };
    } else if (analysis.riskLevel === 'high') {
      return {
        type: 'warning',
        title: '⚠️ ALERTA ALTO',
        message: 'Eventos críticos nas próximas horas. Ajuste sua estratégia.',
        actions: ['Reduzir Exposição', 'Monitorar']
      };
    } else if (analysis.riskLevel === 'medium') {
      return {
        type: 'info',
        title: '📊 ALERTA MODERADO',
        message: 'Volatilidade esperada. Mantenha disciplina de risco.',
        actions: ['Verificar Stops', 'Analisar Setup']
      };
    }
    return null;
  };

  // Atualizar dados quando a data muda
  useEffect(() => {
    const events = getEventsForDate(selectedDate);
    const analysis = analyzeImpact(events);
    const alert = generateMarketAlert(analysis);

    setCurrentEvents(events);
    setImpactAnalysis(analysis);
    setMarketAlert(alert);
  }, [selectedDate]);

  // Detectar mudanças no iframe (simulação)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular detecção de mudança de data no calendario
      const random = Math.random();
      if (random > 0.95) { // 5% chance de "detectar" mudança
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 7));
        setSelectedDate(newDate);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'extreme': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#198754';
      default: return '#6c757d';
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case 'extreme': return 'EXTREMO';
      case 'high': return 'ALTO';
      case 'medium': return 'MODERADO';
      case 'low': return 'BAIXO';
      default: return 'NORMAL';
    }
  };

  return (
    <div className="economic-calendar-container">
      {/* Header Compacto */}
      <div className="calendar-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="calendar-title">📅 Calendário Econômico</h1>
            <p className="calendar-subtitle">Análise Inteligente de Eventos</p>
          </div>
          <div className="header-right">
            <div className="live-stats">
              <div className="stat-box">
                <span className="stat-number">{impactAnalysis.totalEvents}</span>
                <span className="stat-label">Eventos Hoje</span>
              </div>
              <div className="stat-box">
                <span 
                  className="stat-number risk-level"
                  style={{ color: getRiskLevelColor(impactAnalysis.riskLevel) }}
                >
                  {getRiskLevelText(impactAnalysis.riskLevel)}
                </span>
                <span className="stat-label">Nível de Risco</span>
              </div>
              <div className="live-badge">
                <div className="pulse-dot"></div>
                <span>AO VIVO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal sem gaps */}
      <div className="calendar-main-layout">
        
        {/* Calendário Principal */}
        <div className="calendar-section">
          <div className="calendar-widget">
            <div className="widget-header">
              <div className="header-info">
                <h2>📊 Eventos em Tempo Real</h2>
                <p>Dados sincronizados com mercados globais</p>
              </div>
              <div className="header-controls">
                <div className="control-group">
                  <span className="control-label">Fonte:</span>
                  <span className="control-value">Investing.com</span>
                </div>
                <div className="refresh-indicator">
                  <div className="refresh-dot"></div>
                  <span>Sync</span>
                </div>
              </div>
            </div>
            
            <div className="calendar-iframe-container">
              <iframe 
                ref={iframeRef}
                src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=32,37,5,72&calType=day&timeZone=12&lang=12" 
                width="100%" 
                height="600" 
                frameBorder="0" 
                allowTransparency="true" 
                marginWidth="0" 
                marginHeight="0"
                title="Calendário Econômico"
              ></iframe>
            </div>
            
            <div className="widget-footer">
              <div className="footer-left">
                <span>Powered by</span>
                <a href="https://br.investing.com/" target="_blank" rel="nofollow">Investing.com</a>
              </div>
              <div className="footer-right">
                <span>Atualizado: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar de Análise */}
        <div className="analysis-sidebar">
          
          {/* Análise de Impacto Dinâmica */}
          <div className="analysis-card impact-analysis">
            <div className="card-header">
              <h3>🎯 Análise de Impacto</h3>
              <div className="impact-score" style={{ backgroundColor: getRiskLevelColor(impactAnalysis.riskLevel) }}>
                {getRiskLevelText(impactAnalysis.riskLevel)}
              </div>
            </div>
            <div className="card-content">
              <div className="impact-grid">
                <div className="impact-item">
                  <div className="impact-dot high"></div>
                  <span className="impact-count">{impactAnalysis.highImpact}</span>
                  <span className="impact-label">Alto</span>
                </div>
                <div className="impact-item">
                  <div className="impact-dot medium"></div>
                  <span className="impact-count">{impactAnalysis.mediumImpact}</span>
                  <span className="impact-label">Médio</span>
                </div>
                <div className="impact-item">
                  <div className="impact-dot low"></div>
                  <span className="impact-count">{impactAnalysis.lowImpact}</span>
                  <span className="impact-label">Baixo</span>
                </div>
              </div>
              <div className="recommendation">
                <p>{impactAnalysis.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Eventos Principais */}
          <div className="analysis-card events-today">
            <div className="card-header">
              <h3>⭐ Eventos Principais</h3>
              <span className="event-count">{currentEvents.length}</span>
            </div>
            <div className="card-content">
              <div className="events-list">
                {currentEvents.map((event, index) => (
                  <div key={index} className="event-row">
                    <div className="event-time">{event.time}</div>
                    <div className="event-details">
                      <div className="event-name">{event.name}</div>
                      <div className="event-country">{event.country}</div>
                    </div>
                    <div className={`event-impact ${event.impact}`}>
                      {event.impact === 'high' && '🔴'}
                      {event.impact === 'medium' && '🟡'}
                      {event.impact === 'low' && '🟢'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerta de Mercado Dinâmico */}
          {marketAlert && (
            <div className={`analysis-card market-alert ${marketAlert.type}`}>
              <div className="card-header">
                <h3>{marketAlert.title}</h3>
              </div>
              <div className="card-content">
                <p className="alert-message">{marketAlert.message}</p>
                <div className="alert-actions">
                  {marketAlert.actions.map((action, index) => (
                    <button key={index} className="action-btn">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Métricas em Tempo Real */}
          <div className="analysis-card metrics">
            <div className="card-header">
              <h3>📈 Métricas Live</h3>
            </div>
            <div className="card-content">
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Volatilidade Esperada</span>
                  <span className="metric-value">
                    {impactAnalysis.highImpact > 0 ? 'Alta' : 
                     impactAnalysis.mediumImpact > 2 ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Pares Afetados</span>
                  <span className="metric-value">
                    {currentEvents.filter(e => e.currency === 'USD').length > 0 ? 'USD/*' : ''}
                    {currentEvents.filter(e => e.currency === 'EUR').length > 0 ? ' EUR/*' : ''}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Próximo Evento</span>
                  <span className="metric-value">
                    {currentEvents.length > 0 ? currentEvents[0].time : '--:--'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Recomendação</span>
                  <span className={`metric-value ${impactAnalysis.riskLevel}`}>
                    {impactAnalysis.riskLevel === 'high' ? 'Cuidado' :
                     impactAnalysis.riskLevel === 'medium' ? 'Atenção' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Seção de Estratégias Compacta */}
      <div className="strategies-section">
        <div className="strategies-grid">
          <div className="strategy-card">
            <div className="strategy-icon">⚡</div>
            <div className="strategy-content">
              <h4>News Trading</h4>
              <p>Aproveite a volatilidade dos eventos econômicos</p>
              <ul>
                <li>Entre 30min antes do evento</li>
                <li>Use ordens pendentes</li>
                <li>R:R mínimo 1:2</li>
              </ul>
            </div>
          </div>
          
          <div className="strategy-card">
            <div className="strategy-icon">🛡️</div>
            <div className="strategy-content">
              <h4>Risk Management</h4>
              <p>Proteja seu capital durante eventos</p>
              <ul>
                <li>Reduza posições em 50%</li>
                <li>Stops mais apertados</li>
                <li>Evite carry trades</li>
              </ul>
            </div>
          </div>
          
          <div className="strategy-card">
            <div className="strategy-icon">📊</div>
            <div className="strategy-content">
              <h4>Market Analysis</h4>
              <p>Analise o contexto dos eventos</p>
              <ul>
                <li>Compare com previsões</li>
                <li>Histórico de revisões</li>
                <li>Reação do mercado</li>
              </ul>
            </div>
          </div>
          
          <div className="strategy-card">
            <div className="strategy-icon">⏰</div>
            <div className="strategy-content">
              <h4>Perfect Timing</h4>
              <p>Melhores horários para trading</p>
              <ul>
                <li>Londres: 09:00-11:00</li>
                <li>Nova York: 14:30-16:30</li>
                <li>Overlap: 13:00-17:00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;