import React from 'react';
import toast from 'react-hot-toast';
import ProfitPrintGenerator from './ProfitPrintGenerator';
import ScenarioComparator from './ScenarioComparator';

const Results = ({ results, selectedSymbol, selectedExchange, formData }) => {
  const copyResult = async () => {
    if (!results) return;

    const resultText = formatResultForCopy(results);
    
    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('Resultado copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar resultado');
      console.error('Erro ao copiar:', err);
    }
  };

  const formatResultForCopy = (data) => {
    const symbol = selectedSymbol ? selectedSymbol.symbol : 'N/A';
    const exchange = selectedExchange ? selectedExchange.name : 'N/A';
    
    return `
📊 ANÁLISE DE RISK MANAGEMENT
Corretora: ${exchange}
Símbolo: ${symbol}

💰 POSIÇÃO:
🪙 Quantidade: ${data.position.size.toFixed(6)} moedas
💵 Valor da Posição: $${data.position.value.toFixed(2)}
📍 Direção: ${data.position.direction}

📈 RESULTADOS:
💰 Lucro/Prejuízo: ${data.profit.amount > 0 ? '+' : ''}$${data.profit.amount.toFixed(2)}
🛑 Risco Máximo: -$${data.risk.amount.toFixed(2)}
📊 % da Conta: ${data.profit.percentage > 0 ? '+' : ''}${data.profit.percentage.toFixed(1)}%

⚖️ ANÁLISE R/R:
🎯 Risk/Reward: ${data.analysis.riskRewardRatio.toFixed(2)}/1
📋 Avaliação: ${data.analysis.riskLevel}

💡 Recomendações:
${data.analysis.recommendation.join('\n')}

Generated by BitAcademy Risk Calculator
    `.trim();
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'EXCELENTE': return '#28a745';
      case 'BOM': return '#20c997';  
      case 'ACEITÁVEL': return '#ffc107';
      case 'RUIM': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!results) {
    return (
      <div className="results-section">
        <h3 className="section-title">📊 Resultado da Análise</h3>
        <div className="result">
          Preencha os campos ao lado e clique em "Calcular" para ver os resultados da sua análise de risco.
        </div>
        <button className="copy-button" disabled>
          📋 Copiar Resultado
        </button>
      </div>
    );
  }

  return (
    <div className="results-section">
      <h3 className="section-title">📊 Resultado da Análise</h3>
      
      <div className="result">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
            📊 ANÁLISE COMPLETA
          </h4>
          {selectedSymbol && selectedExchange && (
            <div style={{ fontSize: '0.9em', color: 'var(--text-placeholder)' }}>
              {selectedExchange.name} - {selectedSymbol.symbol}
            </div>
          )}
        </div>

        <div className="result-section">
          <h4>💰 POSIÇÃO</h4>
          <div className="result-grid">
            <div className="result-item">
              <div className="result-item-label">🪙 Quantidade</div>
              <div className="result-item-value">{results.position.size.toFixed(6)}</div>
            </div>
            <div className="result-item">
              <div className="result-item-label">💵 Valor (USD)</div>
              <div className="result-item-value">${results.position.value.toFixed(2)}</div>
            </div>
          </div>
          <div className="result-row">
            <span className="result-label">📍 Direção:</span>
            <span className="result-value">
              {results.position.direction} {results.position.direction === 'LONG' ? '📈' : '📉'}
            </span>
          </div>
        </div>

        <div className="result-section">
          <h4>📈 RESULTADOS</h4>
          <div className="result-grid">
            <div className="result-item">
              <div className="result-item-label">💰 Lucro/Prejuízo</div>
              <div className={`result-item-value ${results.profit.amount > 0 ? 'profit' : 'loss'}`}>
                {results.profit.amount > 0 ? '+' : ''}${results.profit.amount.toFixed(2)}
              </div>
            </div>
            <div className="result-item">
              <div className="result-item-label">🛑 Risco Máximo</div>
              <div className="result-item-value loss">-${results.risk.amount.toFixed(2)}</div>
            </div>
          </div>
          <div className="result-row">
            <span className="result-label">📊 % da Conta:</span>
            <span className={`result-value ${results.profit.amount > 0 ? 'profit' : 'loss'}`}>
              {results.profit.percentage > 0 ? '+' : ''}{results.profit.percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="result-section">
          <h4>⚖️ ANÁLISE R/R</h4>
          <div className="result-grid">
            <div className="result-item">
              <div className="result-item-label">🎯 Risk/Reward</div>
              <div className="result-item-value">{results.analysis.riskRewardRatio.toFixed(2)}/1</div>
            </div>
            <div className="result-item">
              <div className="result-item-label">📋 Avaliação</div>
              <div 
                className="result-item-value" 
                style={{ 
                  color: getRiskLevelColor(results.analysis.riskLevel),
                  fontWeight: 'bold'
                }}
              >
                {results.analysis.riskLevel}
              </div>
            </div>
          </div>
        </div>

        {results.analysis.recommendation && results.analysis.recommendation.length > 0 && (
          <div className="result-section">
            <h4>💡 Recomendações</h4>
            {results.analysis.recommendation.map((rec, index) => (
              <div key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="action-button secondary" onClick={copyResult}>
          📋 Copiar
        </button>
        <ProfitPrintGenerator 
          results={results}
          symbol={selectedSymbol}
          exchange={selectedExchange}
          formData={formData}
        />
      </div>

      {results && (
        <ScenarioComparator 
          baseFormData={formData}
          selectedSymbol={selectedSymbol}
          selectedExchange={selectedExchange}
        />
      )}
    </div>
  );
};

export default Results;