import React from 'react';
import '../styles/EconomicCalendar.css';

const EconomicCalendar = () => {
  return (
    <div className="economic-calendar-page">
      {/* Professional Header */}
      <div className="page-header-professional">
        <div className="header-container">
          <div className="header-main">
            <div className="header-icon">📅</div>
            <div className="header-text">
              <h1 className="header-title">Calendário Econômico</h1>
              <p className="header-subtitle">Centro de Inteligência de Mercado</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Monitoramento</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">150+</span>
              <span className="stat-label">Indicadores</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">Dados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {/* Main Calendar Section */}
        <div className="calendar-main-section">
          <div className="calendar-widget-enhanced">
            <div className="widget-header-professional">
              <div className="widget-title-section">
                <h2 className="widget-title">📊 Central de Eventos Econômicos</h2>
                <p className="widget-description">
                  Dados em tempo real dos principais eventos que movimentam os mercados globais
                </p>
              </div>
              <div className="widget-controls">
                <div className="control-item">
                  <span className="control-label">Fonte:</span>
                  <span className="control-value">Investing.com</span>
                </div>
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <span>AO VIVO</span>
                </div>
              </div>
            </div>
            
            <div className="iframe-wrapper-professional">
              <iframe 
                src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=32,37,5,72&calType=day&timeZone=12&lang=12" 
                width="100%" 
                height="550" 
                frameBorder="0" 
                allowTransparency="true" 
                marginWidth="0" 
                marginHeight="0"
                title="Calendário Econômico"
                className="economic-iframe"
              ></iframe>
            </div>
            
            <div className="widget-footer">
              <div className="footer-info">
                <span>Calendário fornecido por</span>
                <a 
                  href="https://br.investing.com/" 
                  rel="nofollow" 
                  target="_blank" 
                  className="provider-link"
                >
                  Investing.com Brasil
                </a>
              </div>
              <div className="footer-update">
                <span>Última atualização: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="calendar-sidebar">
          {/* Impact Levels */}
          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">🎯</span>
              Níveis de Impacto
            </h3>
            <div className="impact-levels">
              <div className="impact-item high-impact">
                <div className="impact-indicator"></div>
                <div className="impact-content">
                  <h4>Alto Impacto</h4>
                  <p>Movimento significativo esperado (&gt;50 pips)</p>
                </div>
              </div>
              <div className="impact-item medium-impact">
                <div className="impact-indicator"></div>
                <div className="impact-content">
                  <h4>Médio Impacto</h4>
                  <p>Volatilidade moderada (20-50 pips)</p>
                </div>
              </div>
              <div className="impact-item low-impact">
                <div className="impact-indicator"></div>
                <div className="impact-content">
                  <h4>Baixo Impacto</h4>
                  <p>Movimento limitado (&lt;20 pips)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Events Today */}
          <div className="info-section">
            <h3 className="section-title">
              <span className="section-icon">⭐</span>
              Eventos Principais
            </h3>
            <div className="key-events">
              <div className="event-item">
                <div className="event-time">14:30</div>
                <div className="event-details">
                  <div className="event-name">NFP - Folha de Pagamento</div>
                  <div className="event-country">🇺🇸 Estados Unidos</div>
                </div>
                <div className="event-impact high">🔴</div>
              </div>
              <div className="event-item">
                <div className="event-time">16:00</div>
                <div className="event-details">
                  <div className="event-name">Taxa de Juros Fed</div>
                  <div className="event-country">🇺🇸 Estados Unidos</div>
                </div>
                <div className="event-impact high">🔴</div>
              </div>
              <div className="event-item">
                <div className="event-time">10:00</div>
                <div className="event-details">
                  <div className="event-name">PIB Trimestral</div>
                  <div className="event-country">🇪🇺 Zona do Euro</div>
                </div>
                <div className="event-impact medium">🟡</div>
              </div>
            </div>
          </div>

          {/* Market Alert */}
          <div className="info-section alert-section">
            <h3 className="section-title">
              <span className="section-icon">⚠️</span>
              Alerta de Mercado
            </h3>
            <div className="market-alert">
              <div className="alert-content">
                <p><strong>Atenção:</strong> Eventos de alto impacto nas próximas 2 horas podem causar alta volatilidade.</p>
                <div className="alert-actions">
                  <button className="alert-btn primary">Ajustar Stop Loss</button>
                  <button className="alert-btn secondary">Ver Análise</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Tips Section */}
      <div className="professional-tips-section">
        <div className="tips-header">
          <h2 className="tips-title">💡 Centro de Conhecimento Profissional</h2>
          <p className="tips-subtitle">Estratégias avançadas para maximizar seus resultados</p>
        </div>
        
        <div className="tips-grid-professional">
          <div className="tip-card-pro strategy">
            <div className="tip-header">
              <div className="tip-icon">📈</div>
              <h3>Estratégia de News Trading</h3>
            </div>
            <div className="tip-content">
              <ul>
                <li>Monitore eventos 30min antes</li>
                <li>Use ordens pendentes</li>
                <li>Defina R:R mínimo de 1:2</li>
                <li>Evite mercados ilíquidos</li>
              </ul>
            </div>
            <div className="tip-footer">
              <span className="tip-level">Avançado</span>
            </div>
          </div>

          <div className="tip-card-pro risk">
            <div className="tip-header">
              <div className="tip-icon">🛡️</div>
              <h3>Gestão de Risco</h3>
            </div>
            <div className="tip-content">
              <ul>
                <li>Reduza posições em 50%</li>
                <li>Use stop loss mais apertado</li>
                <li>Evite carry trades</li>
                <li>Monitore correlações</li>
              </ul>
            </div>
            <div className="tip-footer">
              <span className="tip-level">Essencial</span>
            </div>
          </div>

          <div className="tip-card-pro timing">
            <div className="tip-header">
              <div className="tip-icon">⏰</div>
              <h3>Timing Perfeito</h3>
            </div>
            <div className="tip-content">
              <ul>
                <li>Londres: 09:00-11:00 GMT</li>
                <li>Nova York: 14:30-16:30 GMT</li>
                <li>Overlap: 13:00-17:00 GMT</li>
                <li>Sexta-feira: Cuidado especial</li>
              </ul>
            </div>
            <div className="tip-footer">
              <span className="tip-level">Intermediário</span>
            </div>
          </div>

          <div className="tip-card-pro analysis">
            <div className="tip-header">
              <div className="tip-icon">🔍</div>
              <h3>Análise Fundamentalista</h3>
            </div>
            <div className="tip-content">
              <ul>
                <li>Compare com previsões</li>
                <li>Analise revisões anteriores</li>
                <li>Contexto econômico geral</li>
                <li>Reação do mercado</li>
              </ul>
            </div>
            <div className="tip-footer">
              <span className="tip-level">Profissional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Economic Categories */}
      <div className="economic-categories-section">
        <h2 className="categories-title">📊 Categorias de Indicadores Econômicos</h2>
        
        <div className="categories-grid">
          <div className="category-card employment">
            <div className="category-header">
              <div className="category-icon">👥</div>
              <h3>Emprego</h3>
            </div>
            <div className="category-indicators">
              <div className="indicator-item">
                <span className="indicator-name">Non-Farm Payroll</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Taxa de Desemprego</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Pedidos de Auxílio</span>
                <span className="indicator-frequency">Semanal</span>
              </div>
            </div>
          </div>

          <div className="category-card inflation">
            <div className="category-header">
              <div className="category-icon">💰</div>
              <h3>Inflação</h3>
            </div>
            <div className="category-indicators">
              <div className="indicator-item">
                <span className="indicator-name">CPI - Índice de Preços</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">PPI - Preços Produtores</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Core PCE</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
            </div>
          </div>

          <div className="category-card central-banks">
            <div className="category-header">
              <div className="category-icon">🏛️</div>
              <h3>Bancos Centrais</h3>
            </div>
            <div className="category-indicators">
              <div className="indicator-item">
                <span className="indicator-name">Decisões de Taxa</span>
                <span className="indicator-frequency">8x/ano</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Atas FOMC</span>
                <span className="indicator-frequency">8x/ano</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Discursos Fed</span>
                <span className="indicator-frequency">Frequente</span>
              </div>
            </div>
          </div>

          <div className="category-card gdp">
            <div className="category-header">
              <div className="category-icon">📈</div>
              <h3>Crescimento</h3>
            </div>
            <div className="category-indicators">
              <div className="indicator-item">
                <span className="indicator-name">PIB Trimestral</span>
                <span className="indicator-frequency">Trimestral</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">PMI Manufacturing</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
              <div className="indicator-item">
                <span className="indicator-name">Vendas Varejo</span>
                <span className="indicator-frequency">Mensal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;