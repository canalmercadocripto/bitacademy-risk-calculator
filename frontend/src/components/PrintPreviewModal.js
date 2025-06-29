import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const PrintPreviewModal = ({ isOpen, onClose, results, symbol, exchange, formData }) => {
  const [selectedBackground, setSelectedBackground] = useState('gradient1');
  const printRef = useRef();

  const backgrounds = {
    gradient1: {
      name: 'Dark Purple',
      style: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      preview: '🌌'
    },
    gradient2: {
      name: 'Dark Blue',
      style: 'linear-gradient(135deg, #0f3460 0%, #0a2540 100%)',
      preview: '🌊'
    },
    gradient3: {
      name: 'Dark Green',
      style: 'linear-gradient(135deg, #134e13 0%, #0f3b0f 100%)',
      preview: '🌿'
    },
    gradient4: {
      name: 'Bitcoin Orange',
      style: 'linear-gradient(135deg, #f7931e 0%, #d4782a 100%)',
      preview: '🔶'
    },
    dark: {
      name: 'Pure Black',
      style: '#1a1a1a',
      preview: '⚫'
    },
    professional: {
      name: 'Professional',
      style: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      preview: '💼'
    }
  };

  const downloadPrint = async () => {
    try {
      toast.loading('Gerando print...');
      
      const printElement = printRef.current;
      
      const canvas = await html2canvas(printElement, {
        backgroundColor: 'transparent',
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        height: 600
      });

      const link = document.createElement('a');
      link.download = `risk-analysis-${symbol?.symbol || 'trade'}-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.dismiss();
      toast.success('Print baixado com sucesso!');
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao gerar print');
      console.error('Erro no print:', error);
    }
  };

  const formatDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDirectionIcon = () => {
    return results?.position.direction === 'LONG' ? '📈' : '📉';
  };

  const getDirectionColor = () => {
    return results?.position.direction === 'LONG' ? '#00d4aa' : '#ff4757';
  };

  const getProfitColor = () => {
    return results?.profit.amount > 0 ? '#00d4aa' : '#ff4757';
  };

  const getRiskLevelColor = () => {
    switch (results?.analysis.riskLevel) {
      case 'EXCELENTE': return '#00d4aa';
      case 'BOM': return '#26c6da';
      case 'ACEITÁVEL': return '#ffb300';
      case 'RUIM': return '#ff4757';
      default: return '#78909c';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content print-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📸 Preview do Print</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="preview-controls">
          <div className="background-selector">
            <label>🎨 Background:</label>
            <div className="background-options">
              {Object.entries(backgrounds).map(([key, bg]) => (
                <button
                  key={key}
                  className={`bg-option ${selectedBackground === key ? 'selected' : ''}`}
                  onClick={() => setSelectedBackground(key)}
                  style={{ background: bg.style }}
                  title={bg.name}
                >
                  {bg.preview}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="preview-container">
          <div 
            ref={printRef} 
            className="profit-print-preview"
            style={{ background: backgrounds[selectedBackground].style }}
          >
            <div className="print-container">
              {/* Header */}
              <div className="print-header">
                <div className="print-logo">
                  <div className="logo-icon">🚀</div>
                  <div className="logo-text">
                    <div className="logo-main">BitAcademy</div>
                    <div className="logo-sub">Risk Management</div>
                  </div>
                </div>
                <div className="print-datetime">{formatDateTime()}</div>
              </div>

              {/* Trade Info */}
              <div className="print-trade-info">
                <div className="trade-symbol">
                  <span className="symbol-text">{symbol?.symbol || 'N/A'}</span>
                  <span className="exchange-badge">{exchange?.name || 'N/A'}</span>
                </div>
                <div className="trade-direction" style={{ color: getDirectionColor() }}>
                  {getDirectionIcon()} {results?.position.direction}
                </div>
              </div>

              {/* Main Stats */}
              <div className="print-main-stats">
                <div className="stat-card profit-card">
                  <div className="stat-label">P&L Estimado</div>
                  <div className="stat-value" style={{ color: getProfitColor() }}>
                    {results?.profit.amount > 0 ? '+' : ''}${results?.profit.amount.toFixed(2)}
                  </div>
                  <div className="stat-sub">
                    {results?.profit.percentage > 0 ? '+' : ''}{results?.profit.percentage.toFixed(1)}% da conta
                  </div>
                </div>

                <div className="stat-card risk-card">
                  <div className="stat-label">Risco Máximo</div>
                  <div className="stat-value risk-value">
                    -${results?.risk.amount.toFixed(2)}
                  </div>
                  <div className="stat-sub">
                    {results?.risk.percentage.toFixed(1)}% da conta
                  </div>
                </div>

                <div className="stat-card rr-card">
                  <div className="stat-label">Risk/Reward</div>
                  <div className="stat-value rr-value">
                    {results?.analysis.riskRewardRatio.toFixed(2)}/1
                  </div>
                  <div className="stat-sub" style={{ color: getRiskLevelColor() }}>
                    {results?.analysis.riskLevel}
                  </div>
                </div>
              </div>

              {/* Pontos de Operação */}
              <div className="print-operation-points">
                <h4 className="section-title">📍 Pontos de Operação</h4>
                <div className="points-grid">
                  <div className="point-card entry-point">
                    <div className="point-icon">🟢</div>
                    <div className="point-info">
                      <div className="point-label">Entrada</div>
                      <div className="point-value">${formData?.entryPrice || formData?.fixedEntryPrice}</div>
                    </div>
                  </div>
                  <div className="point-card exit-point">
                    <div className="point-icon">🎯</div>
                    <div className="point-info">
                      <div className="point-label">Saída</div>
                      <div className="point-value">${formData?.exitPrice || formData?.targetPrice}</div>
                    </div>
                  </div>
                  <div className="point-card stop-point">
                    <div className="point-icon">🛑</div>
                    <div className="point-info">
                      <div className="point-label">Stop Loss</div>
                      <div className="point-value">${formData?.stopLoss}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado Financeiro Organizado */}
              <div className="print-financial-result">
                <h4 className="section-title">💰 Resultado Financeiro</h4>
                <div className="financial-grid">
                  <div className="financial-card">
                    <div className="financial-type">
                      {results?.profit.amount > 0 ? '💰 LUCRO' : '📉 PREJUÍZO'}
                    </div>
                    <div className="financial-amount" style={{ color: getProfitColor() }}>
                      ${Math.abs(results?.profit.amount).toFixed(2)}
                    </div>
                    <div className="financial-percentage">
                      {Math.abs(results?.profit.percentage).toFixed(1)}% da conta
                    </div>
                  </div>
                  <div className="risk-card-print">
                    <div className="risk-label">🛡️ Risco Máximo</div>
                    <div className="risk-amount">-${results?.risk.amount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Alvos de Realização */}
              {formData?.profitTargets && formData.profitTargets.length > 0 && (
                <div className="print-profit-targets">
                  <h4 className="section-title">🎯 Pontos de Realização</h4>
                  <div className="targets-list">
                    {formData.profitTargets.map((target, index) => (
                      <div key={index} className="target-item-print">
                        <div className="target-level">{target.level}</div>
                        <div className="target-price">${target.price.toFixed(4)}</div>
                        <div className="target-desc">{target.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalhes da Posição */}
              <div className="print-position-details">
                <h4 className="section-title">📊 Detalhes da Posição</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">🪙 Quantidade:</span>
                    <span className="detail-value">{results?.position.size.toFixed(6)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">💵 Valor Total:</span>
                    <span className="detail-value">${results?.position.value.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">💰 Tamanho da Conta:</span>
                    <span className="detail-value">${formData?.accountSize}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⚖️ Risk/Reward:</span>
                    <span className="detail-value">{results?.analysis.riskRewardRatio.toFixed(2)}/1</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="print-footer">
                <div className="footer-disclaimer">
                  * Esta análise é apenas para fins educacionais. Trade com responsabilidade.
                </div>
                <div className="footer-powered">
                  Powered by BitAcademy Risk Calculator
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="action-button secondary" onClick={onClose}>
            ❌ Cancelar
          </button>
          <button className="action-button primary" onClick={downloadPrint}>
            📥 Baixar Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;