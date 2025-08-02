import React from 'react';
import '../styles/EconomicCalendar.css';

const EconomicCalendar = () => {
  return (
    <div className="economic-calendar-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            📅 Calendário Econômico
          </h1>
          <p className="page-description">
            Acompanhe os principais eventos econômicos que podem impactar os mercados financeiros e suas operações.
          </p>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-info">
          <div className="info-cards">
            <div className="info-card">
              <div className="card-icon">🔴</div>
              <div className="card-content">
                <h3>Alto Impacto</h3>
                <p>Eventos que podem causar alta volatilidade nos mercados</p>
              </div>
            </div>
            <div className="info-card">
              <div className="card-icon">🟡</div>
              <div className="card-content">
                <h3>Médio Impacto</h3>
                <p>Eventos com impacto moderado nos preços dos ativos</p>
              </div>
            </div>
            <div className="info-card">
              <div className="card-icon">🟢</div>
              <div className="card-content">
                <h3>Baixo Impacto</h3>
                <p>Eventos com menor influência nos movimentos do mercado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="calendar-widget">
          <div className="widget-header">
            <h2>📊 Eventos Econômicos em Tempo Real</h2>
            <p>Dados atualizados automaticamente do Investing.com</p>
          </div>
          
          <div className="iframe-container">
            <iframe 
              src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=1,2,3&features=datepicker,timezone,timeselector,filters&countries=32,37,5,72&calType=day&timeZone=12&lang=12" 
              width="100%" 
              height="467" 
              frameBorder="0" 
              allowTransparency="true" 
              marginWidth="0" 
              marginHeight="0"
              title="Calendário Econômico"
            ></iframe>
          </div>
          
          <div className="powered-by">
            <span>
              Calendário Econômico fornecido por{' '}
              <a 
                href="https://br.investing.com/" 
                rel="nofollow" 
                target="_blank" 
                className="investing-link"
              >
                Investing.com Brasil
              </a>
              , o portal líder financeiro.
            </span>
          </div>
        </div>

        <div className="calendar-tips">
          <h3>💡 Dicas para Usar o Calendário Econômico</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">⏰</div>
              <div className="tip-content">
                <h4>Planejamento</h4>
                <p>Use o calendário para planejar suas operações evitando horários de alta volatilidade</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎯</div>
              <div className="tip-content">
                <h4>Foco nos Dados</h4>
                <p>Acompanhe especialmente dados de emprego, inflação e decisões de bancos centrais</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">⚠️</div>
              <div className="tip-content">
                <h4>Gerenciamento de Risco</h4>
                <p>Ajuste o tamanho das posições antes de eventos de alto impacto</p>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📈</div>
              <div className="tip-content">
                <h4>Oportunidades</h4>
                <p>Eventos econômicos podem criar oportunidades de trading para traders experientes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="important-events">
          <h3>🔍 Principais Eventos a Acompanhar</h3>
          <div className="events-list">
            <div className="event-category">
              <h4>📊 Dados de Emprego</h4>
              <ul>
                <li>Payroll (EUA) - Primeira sexta-feira do mês</li>
                <li>Taxa de Desemprego - Países desenvolvidos</li>
                <li>Pedidos de Auxílio Desemprego (EUA) - Semanalmente</li>
              </ul>
            </div>
            <div className="event-category">
              <h4>💰 Bancos Centrais</h4>
              <ul>
                <li>Decisões de Taxa de Juros - Fed, ECB, BOE, BOJ</li>
                <li>Atas de Reuniões - FOMC Minutes</li>
                <li>Discursos de Presidentes - Powell, Lagarde</li>
              </ul>
            </div>
            <div className="event-category">
              <h4>📈 Indicadores Econômicos</h4>
              <ul>
                <li>PIB - Crescimento trimestral</li>
                <li>Inflação (CPI/PCI) - Dados mensais</li>
                <li>PMI Manufacturing/Services</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;