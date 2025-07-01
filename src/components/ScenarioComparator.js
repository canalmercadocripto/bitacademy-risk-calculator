import React, { useState } from 'react';
import { calculatorApi } from '../services/api';
import toast from 'react-hot-toast';

const ScenarioComparator = ({ baseFormData, selectedSymbol, selectedExchange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState([
    { name: 'Conservador', riskPercent: 1, targetMultiplier: 2 },
    { name: 'Moderado', riskPercent: 2, targetMultiplier: 3 },
    { name: 'Agressivo', riskPercent: 3, targetMultiplier: 4 }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const calculateScenarios = async () => {
    if (!baseFormData.entryPrice || !baseFormData.stopLoss || !baseFormData.accountSize) {
      toast.error('Preencha os dados básicos primeiro');
      return;
    }

    setLoading(true);
    try {
      const entryPrice = parseFloat(baseFormData.entryPrice);
      const stopLoss = parseFloat(baseFormData.stopLoss);
      const accountSize = parseFloat(baseFormData.accountSize);
      const direction = baseFormData.direction;

      const scenarioCalculations = await Promise.all(
        scenarios.map(async (scenario) => {
          // Calcular target baseado no multiplier e distância do SL
          const slDistance = Math.abs(entryPrice - stopLoss);
          const targetPrice = direction === 'LONG' 
            ? entryPrice + (slDistance * scenario.targetMultiplier)
            : entryPrice - (slDistance * scenario.targetMultiplier);

          const params = {
            entryPrice,
            stopLoss,
            targetPrice,
            accountSize,
            riskPercent: scenario.riskPercent,
            direction
          };

          const response = await calculatorApi.calculateRisk(params);
          return {
            scenario: scenario.name,
            params,
            result: response.data
          };
        })
      );

      setResults(scenarioCalculations);
    } catch (error) {
      toast.error('Erro ao calcular cenários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = (index, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[index][field] = parseFloat(value) || 0;
    setScenarios(newScenarios);
  };

  const getBestScenario = () => {
    if (results.length === 0) return null;
    return results.reduce((best, current) => 
      current.result.analysis.riskRewardRatio > best.result.analysis.riskRewardRatio ? current : best
    );
  };

  const formatCurrency = (value) => `$${value.toFixed(2)}`;
  const formatPercent = (value) => `${value.toFixed(1)}%`;

  if (!isOpen) {
    return (
      <div className="scenario-trigger">
        <button 
          className="action-button secondary"
          onClick={() => setIsOpen(true)}
        >
          📊 Comparar Cenários
        </button>
      </div>
    );
  }

  return (
    <div className="scenario-comparator">
      <div className="scenario-header">
        <h4>📊 Comparador de Cenários</h4>
        <button 
          className="scenario-close"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
      </div>

      <div className="scenario-config">
        <div className="config-header">
          <span>Cenário</span>
          <span>Risco %</span>
          <span>R/R Target</span>
        </div>
        
        {scenarios.map((scenario, index) => (
          <div key={index} className="scenario-config-row">
            <span className="scenario-name">{scenario.name}</span>
            <input
              type="number"
              value={scenario.riskPercent}
              onChange={(e) => updateScenario(index, 'riskPercent', e.target.value)}
              className="scenario-input"
              min="0.1"
              max="10"
              step="0.1"
            />
            <input
              type="number"
              value={scenario.targetMultiplier}
              onChange={(e) => updateScenario(index, 'targetMultiplier', e.target.value)}
              className="scenario-input"
              min="1"
              max="10"
              step="0.5"
            />
          </div>
        ))}
      </div>

      <div className="scenario-actions">
        <button 
          className="calculate-scenarios-btn"
          onClick={calculateScenarios}
          disabled={loading}
        >
          {loading ? '⏳ Calculando...' : '🧮 Calcular Cenários'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="scenario-results">
          <div className="results-header">
            <div className="best-scenario-badge">
              🏆 Melhor R/R: {getBestScenario()?.scenario}
            </div>
          </div>

          <div className="results-grid">
            {results.map((result, index) => {
              const isBest = result === getBestScenario();
              
              return (
                <div 
                  key={index} 
                  className={`scenario-result-card ${isBest ? 'best' : ''}`}
                >
                  <div className="card-header">
                    <span className="card-title">{result.scenario}</span>
                    {isBest && <span className="best-badge">🏆</span>}
                  </div>
                  
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-label">R/R Ratio</span>
                      <span className="stat-value rr">
                        {result.result.analysis.riskRewardRatio.toFixed(2)}/1
                      </span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-label">Lucro Potencial</span>
                      <span className={`stat-value ${result.result.profit.amount > 0 ? 'profit' : 'loss'}`}>
                        {result.result.profit.amount > 0 ? '+' : ''}{formatCurrency(result.result.profit.amount)}
                      </span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-label">Risco Máximo</span>
                      <span className="stat-value loss">
                        -{formatCurrency(result.result.risk.amount)}
                      </span>
                    </div>
                    
                    <div className="stat">
                      <span className="stat-label">% da Conta</span>
                      <span className={`stat-value ${result.result.profit.amount > 0 ? 'profit' : 'loss'}`}>
                        {result.result.profit.percentage > 0 ? '+' : ''}{formatPercent(result.result.profit.percentage)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <span className="risk-level" style={{
                      color: result.result.analysis.riskLevel === 'EXCELENTE' ? '#28a745' :
                             result.result.analysis.riskLevel === 'BOM' ? '#20c997' :
                             result.result.analysis.riskLevel === 'ACEITÁVEL' ? '#ffc107' : '#dc3545'
                    }}>
                      {result.result.analysis.riskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioComparator;