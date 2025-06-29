import React, { useState } from 'react';

const TradeHistory = ({ alerts, onClose, formData, fixedEntryPrice, currentPrice, results, selectedSymbol, selectedExchange }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [tradeLog, setTradeLog] = useState(null);

  // Gerar diário de trade completo
  const generateTradeDiary = () => {
    const diary = {
      timestamp: new Date().toLocaleString('pt-BR'),
      symbol: selectedSymbol?.symbol || 'N/A',
      exchange: selectedExchange?.name || 'N/A',
      
      // Setup da Operação
      setup: {
        direction: formData.tradeType?.toUpperCase() || formData.direction || 'N/A',
        entryPrice: fixedEntryPrice,
        stopLoss: parseFloat(formData.stopLoss),
        target: parseFloat(formData.exitPrice || formData.targetPrice),
        accountSize: parseFloat(formData.accountSize),
        riskPercent: parseFloat(formData.riskPercent || 2),
        positionSize: results?.position?.size || 0,
        positionValue: results?.position?.value || 0
      },
      
      // Análise Risk/Reward
      analysis: {
        riskReward: results?.analysis?.riskRewardRatio || 0,
        riskLevel: results?.analysis?.riskLevel || 'N/A',
        riskAmount: Math.abs(results?.risk?.amount || 0),
        profitPotential: Math.abs(results?.profit?.amount || 0),
        profitPercentage: Math.abs(results?.profit?.percentage || 0)
      },
      
      // Histórico de Alertas
      alertsHistory: alerts.map(alert => ({
        time: alert.timestamp.toLocaleString('pt-BR'),
        type: alert.type,
        level: alert.level,
        price: alert.price,
        message: alert.message,
        profit: alert.profit || null,
        loss: alert.loss || null
      })),
      
      // Estatísticas da Sessão
      statistics: {
        totalAlerts: alerts.length,
        successAlerts: alerts.filter(a => a.type === 'success').length,
        warningAlerts: alerts.filter(a => a.type === 'warning').length,
        dangerAlerts: alerts.filter(a => a.type === 'danger').length,
        currentPrice: currentPrice,
        priceVariation: currentPrice && fixedEntryPrice ? 
          (((currentPrice - fixedEntryPrice) / fixedEntryPrice) * 100).toFixed(2) + '%' : 'N/A'
      },
      
      // Status da Operação
      status: {
        entryHit: alerts.some(a => a.level === 'entry'),
        stopHit: alerts.some(a => a.level === 'stop'),
        targetsHit: alerts.filter(a => a.level?.includes('target')).length,
        isActive: alerts.length > 0 && !alerts.some(a => a.level === 'stop'),
        finalResult: calculateFinalResult()
      }
    };
    
    return diary;
  };

  const calculateFinalResult = () => {
    const stopHit = alerts.find(a => a.level === 'stop');
    const targetHits = alerts.filter(a => a.level?.includes('target'));
    
    if (stopHit) {
      return {
        type: 'LOSS',
        amount: stopHit.loss || 'N/A',
        description: 'Stop Loss ativado'
      };
    } else if (targetHits.length > 0) {
      const lastTarget = targetHits[targetHits.length - 1];
      return {
        type: 'PROFIT',
        amount: lastTarget.profit || 'N/A',
        description: `${targetHits.length} alvo(s) atingido(s)`
      };
    }
    
    return {
      type: 'PENDING',
      amount: '0',
      description: 'Operação em andamento'
    };
  };

  const formatAlertDetails = (alert) => {
    const details = {
      timestamp: alert.timestamp.toLocaleString('pt-BR'),
      price: alert.price?.toFixed(4) || 'N/A',
      level: alert.level,
      type: alert.type,
      message: alert.message
    };

    // Adicionar informações específicas baseadas no tipo de alerta
    if (alert.profit) {
      details.profit = `${alert.profit}%`;
      details.profitAmount = `$${((alert.price - fixedEntryPrice) * parseFloat(formData.positionSize || 0)).toFixed(2)}`;
    }

    if (alert.loss) {
      details.loss = `${alert.loss}%`;
      details.lossAmount = `$${((fixedEntryPrice - alert.price) * parseFloat(formData.positionSize || 0)).toFixed(2)}`;
    }

    if (alert.target) {
      details.targetLevel = alert.target.level;
      details.targetPercentage = `${alert.target.percentage}%`;
      details.riskReward = `${alert.target.riskReward}:1`;
    }

    // Informações do contexto no momento do alerta
    details.context = {
      entryPrice: fixedEntryPrice?.toFixed(4) || 'N/A',
      stopLoss: formData.stopLoss || 'N/A',
      tradeDirection: formData.tradeType?.toUpperCase() || 'N/A',
      accountSize: formData.accountSize || 'N/A',
      riskPercent: formData.riskPercent || 'N/A'
    };

    return details;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return '🎯';
      case 'warning': return '⚠️';
      case 'danger': return '🛑';
      default: return '📊';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="trade-history-overlay">
      <div className="trade-history-modal">
        <div className="history-header">
          <h3>📊 Histórico Detalhado de Alertas</h3>
          <div className="header-actions">
            <button 
              className="btn-diary" 
              onClick={() => setTradeLog(generateTradeDiary())}
              title="Ver Diário Completo"
            >
              📝 Diário
            </button>
            <button 
              className="btn-save" 
              onClick={() => {
                const diary = generateTradeDiary();
                const blob = new Blob([JSON.stringify(diary, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trade-diary-${diary.symbol}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              title="Salvar Diário"
            >
              💾 Salvar
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="history-content">
          {tradeLog ? (
            // Visualização do Diário Completo
            <div className="trade-diary-view">
              <div className="diary-header">
                <h4>📝 Diário de Trade Completo</h4>
                <button 
                  className="btn-back" 
                  onClick={() => setTradeLog(null)}
                >
                  ← Voltar aos Alertas
                </button>
              </div>
              
              <div className="diary-sections">
                {/* Setup da Operação */}
                <div className="diary-section">
                  <h5>🎯 Setup da Operação</h5>
                  <div className="diary-grid">
                    <div><strong>Símbolo:</strong> {tradeLog.symbol}</div>
                    <div><strong>Exchange:</strong> {tradeLog.exchange}</div>
                    <div><strong>Direção:</strong> {tradeLog.setup.direction}</div>
                    <div><strong>Entrada:</strong> ${tradeLog.setup.entryPrice?.toFixed(4)}</div>
                    <div><strong>Stop:</strong> ${tradeLog.setup.stopLoss?.toFixed(4)}</div>
                    <div><strong>Alvo:</strong> ${tradeLog.setup.target?.toFixed(4)}</div>
                    <div><strong>Posição:</strong> ${tradeLog.setup.positionValue?.toFixed(2)}</div>
                    <div><strong>Risco:</strong> {tradeLog.setup.riskPercent}%</div>
                  </div>
                </div>

                {/* Análise R/R */}
                <div className="diary-section">
                  <h5>⚖️ Análise Risk/Reward</h5>
                  <div className="diary-grid">
                    <div><strong>R/R Ratio:</strong> {tradeLog.analysis.riskReward?.toFixed(2)}:1</div>
                    <div><strong>Classificação:</strong> {tradeLog.analysis.riskLevel}</div>
                    <div><strong>Risco Máximo:</strong> ${tradeLog.analysis.riskAmount?.toFixed(2)}</div>
                    <div><strong>Potencial Lucro:</strong> ${tradeLog.analysis.profitPotential?.toFixed(2)}</div>
                  </div>
                </div>

                {/* Status Atual */}
                <div className="diary-section">
                  <h5>📊 Status da Operação</h5>
                  <div className="diary-grid">
                    <div><strong>Entrada Atingida:</strong> {tradeLog.status.entryHit ? '✅ Sim' : '❌ Não'}</div>
                    <div><strong>Stop Atingido:</strong> {tradeLog.status.stopHit ? '🛑 Sim' : '✅ Não'}</div>
                    <div><strong>Alvos Atingidos:</strong> {tradeLog.status.targetsHit}/3</div>
                    <div><strong>Status:</strong> {tradeLog.status.isActive ? '🟢 Ativo' : '🔴 Finalizado'}</div>
                    <div><strong>Preço Atual:</strong> ${tradeLog.statistics.currentPrice?.toFixed(4)}</div>
                    <div><strong>Variação:</strong> {tradeLog.statistics.priceVariation}</div>
                    <div><strong>Resultado:</strong> 
                      <span style={{ 
                        color: tradeLog.status.finalResult.type === 'PROFIT' ? '#28a745' : 
                              tradeLog.status.finalResult.type === 'LOSS' ? '#dc3545' : '#6c757d' 
                      }}>
                        {tradeLog.status.finalResult.description}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Histórico de Alertas */}
                <div className="diary-section">
                  <h5>🚨 Cronologia de Alertas</h5>
                  <div className="alerts-timeline">
                    {tradeLog.alertsHistory.map((alert, index) => (
                      <div key={index} className={`timeline-item ${alert.type}`}>
                        <div className="timeline-time">{alert.time}</div>
                        <div className="timeline-content">
                          <strong>{alert.level?.toUpperCase()}</strong> - ${alert.price?.toFixed(4)}
                          <div className="timeline-message">{alert.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="diary-section">
                  <h5>📈 Estatísticas da Sessão</h5>
                  <div className="stats-grid">
                    <div className="stat-card success">
                      <div className="stat-number">{tradeLog.statistics.successAlerts}</div>
                      <div className="stat-label">Sucessos</div>
                    </div>
                    <div className="stat-card warning">
                      <div className="stat-number">{tradeLog.statistics.warningAlerts}</div>
                      <div className="stat-label">Avisos</div>
                    </div>
                    <div className="stat-card danger">
                      <div className="stat-number">{tradeLog.statistics.dangerAlerts}</div>
                      <div className="stat-label">Riscos</div>
                    </div>
                    <div className="stat-card total">
                      <div className="stat-number">{tradeLog.statistics.totalAlerts}</div>
                      <div className="stat-label">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Visualização Normal dos Alertas
            <>
              <div className="alerts-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total de Alertas:</span>
                <span className="stat-value">{alerts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Alertas de Sucesso:</span>
                <span className="stat-value">{alerts.filter(a => a.type === 'success').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Alertas de Risco:</span>
                <span className="stat-value">{alerts.filter(a => a.type === 'danger').length}</span>
              </div>
            </div>
          </div>

          <div className="history-layout">
            <div className="alerts-list-history">
              <h4>Lista de Alertas</h4>
              {alerts.map((alert, index) => (
                <div 
                  key={alert.id} 
                  className={`alert-item-history ${alert.type} ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="alert-header-history">
                    <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                    <span className="alert-time">{alert.timestamp.toLocaleTimeString('pt-BR')}</span>
                    <span className="alert-price">${alert.price?.toFixed(4) || 'N/A'}</span>
                  </div>
                  <div className="alert-message-short">{alert.message}</div>
                </div>
              ))}
            </div>

            <div className="alert-details">
              {selectedAlert ? (
                <div className="details-content">
                  <h4>Detalhes do Alerta</h4>
                  
                  <div className="detail-section">
                    <h5>Informações Básicas</h5>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Horário:</span>
                        <span className="detail-value">{formatAlertDetails(selectedAlert).timestamp}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Preço:</span>
                        <span className="detail-value">${formatAlertDetails(selectedAlert).price}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nível:</span>
                        <span className="detail-value">{selectedAlert.level}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tipo:</span>
                        <span className="detail-value" style={{ color: getAlertColor(selectedAlert.type) }}>
                          {selectedAlert.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedAlert.profit && (
                    <div className="detail-section profit-section">
                      <h5>💰 Informações de Lucro</h5>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Lucro %:</span>
                          <span className="detail-value profit">{formatAlertDetails(selectedAlert).profit}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Valor do Lucro:</span>
                          <span className="detail-value profit">{formatAlertDetails(selectedAlert).profitAmount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAlert.loss && (
                    <div className="detail-section loss-section">
                      <h5>📉 Informações de Prejuízo</h5>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Prejuízo %:</span>
                          <span className="detail-value loss">{formatAlertDetails(selectedAlert).loss}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Valor do Prejuízo:</span>
                          <span className="detail-value loss">{formatAlertDetails(selectedAlert).lossAmount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="detail-section context-section">
                    <h5>📋 Contexto da Operação</h5>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Entrada:</span>
                        <span className="detail-value">${formatAlertDetails(selectedAlert).context.entryPrice}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Stop Loss:</span>
                        <span className="detail-value">${formatAlertDetails(selectedAlert).context.stopLoss}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Direção:</span>
                        <span className="detail-value">{formatAlertDetails(selectedAlert).context.tradeDirection}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tamanho da Conta:</span>
                        <span className="detail-value">${formatAlertDetails(selectedAlert).context.accountSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section message-section">
                    <h5>💬 Mensagem Completa</h5>
                    <div className="message-full">{selectedAlert.message}</div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <div className="no-selection-icon">👆</div>
                  <p>Clique em um alerta à esquerda para ver os detalhes completos</p>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;