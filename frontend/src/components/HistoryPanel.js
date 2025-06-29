import React, { useState } from 'react';
import toast from 'react-hot-toast';

const HistoryPanel = ({ history, onClearHistory, onRemoveCalculation, onExportCSV, onLoadCalculation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExport = () => {
    const csv = onExportCSV();
    if (!csv) {
      toast.error('Nenhum histórico para exportar');
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `risk-calculations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Histórico exportado com sucesso!');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'EXCELENTE': return '#28a745';
      case 'BOM': return '#20c997';
      case 'ACEITÁVEL': return '#ffc107';
      case 'RUIM': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (history.length === 0) {
    return (
      <div className="history-panel">
        <div className="history-header">
          <h4>📊 Histórico</h4>
        </div>
        <div className="history-empty">
          <p>Nenhum cálculo realizado ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>📊 Histórico ({history.length})</h4>
        <span className="expand-icon">{isExpanded ? '📖' : '📝'}</span>
      </div>
      
      {isExpanded && (
        <div className="history-content">
          <div className="history-actions">
            <button className="history-btn export" onClick={handleExport}>
              📊 Export CSV
            </button>
            <button className="history-btn clear" onClick={onClearHistory}>
              🗑️ Limpar
            </button>
          </div>
          
          <div className="history-list">
            {history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-symbol">
                    {entry.exchange} - {entry.symbol}
                  </span>
                  <span className="history-date">{formatDate(entry.timestamp)}</span>
                </div>
                
                <div className="history-item-details">
                  <div className="history-detail">
                    <span className="history-label">Direção:</span>
                    <span className={`history-value ${entry.calculation.position.direction.toLowerCase()}`}>
                      {entry.calculation.position.direction}
                    </span>
                  </div>
                  
                  <div className="history-detail">
                    <span className="history-label">P&L:</span>
                    <span className={`history-value ${entry.calculation.profit.amount > 0 ? 'profit' : 'loss'}`}>
                      {entry.calculation.profit.amount > 0 ? '+' : ''}${entry.calculation.profit.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="history-detail">
                    <span className="history-label">R/R:</span>
                    <span className="history-value">
                      {entry.calculation.analysis.riskRewardRatio.toFixed(2)}/1
                    </span>
                  </div>
                  
                  <div className="history-detail">
                    <span className="history-label">Nível:</span>
                    <span 
                      className="history-value"
                      style={{ color: getRiskColor(entry.calculation.analysis.riskLevel) }}
                    >
                      {entry.calculation.analysis.riskLevel}
                    </span>
                  </div>
                </div>
                
                <div className="history-item-actions">
                  <button 
                    className="history-action-btn load"
                    onClick={() => onLoadCalculation(entry)}
                    title="Carregar cálculo"
                  >
                    🔄
                  </button>
                  <button 
                    className="history-action-btn remove"
                    onClick={() => onRemoveCalculation(entry.id)}
                    title="Remover"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;