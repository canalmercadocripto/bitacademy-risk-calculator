import React from 'react';

const CalculatorForm = ({ 
  formData, 
  onInputChange, 
  onDirectionChange, 
  onCalculate, 
  calculating, 
  loading,
  currentPrice 
}) => {
  return (
    <>
      <div className="question">📍 Qual a direção da sua operação?</div>

      <div className="direction-buttons">
        <button
          type="button"
          className={`direction-button ${formData.direction === 'LONG' ? 'selected long' : ''}`}
          onClick={() => onDirectionChange('LONG')}
        >
          📈 LONG (Compra)
        </button>
        <button
          type="button"
          className={`direction-button ${formData.direction === 'SHORT' ? 'selected short' : ''}`}
          onClick={() => onDirectionChange('SHORT')}
        >
          📉 SHORT (Venda)
        </button>
      </div>

      <div className="input-group">
        <label htmlFor="entryPrice">Preço de Entrada (USD):</label>
        <input
          type="number"
          id="entryPrice"
          value={formData.entryPrice}
          onChange={(e) => onInputChange('entryPrice', e.target.value)}
          placeholder="Digite o preço de entrada desejado"
          step="any"
        />
      </div>

      <div className="input-group">
        <label htmlFor="stopLoss">Stop Loss (USD):</label>
        <input
          type="number"
          id="stopLoss"
          value={formData.stopLoss}
          onChange={(e) => onInputChange('stopLoss', e.target.value)}
          placeholder="0.00"
          step="any"
        />
      </div>

      <div className="input-group">
        <label htmlFor="targetPrice">Alvo de Saída (USD):</label>
        <input
          type="number"
          id="targetPrice"
          value={formData.targetPrice}
          onChange={(e) => onInputChange('targetPrice', e.target.value)}
          placeholder="0.00"
          step="any"
        />
      </div>

      <div className="input-group">
        <label htmlFor="accountSize">Tamanho da Conta (USD):</label>
        <input
          type="number"
          id="accountSize"
          value={formData.accountSize}
          onChange={(e) => onInputChange('accountSize', e.target.value)}
          placeholder="1000"
          step="any"
        />
      </div>

      <div className="input-group">
        <label htmlFor="riskPercent">Risco por Trade (%):</label>
        <input
          type="number"
          id="riskPercent"
          value={formData.riskPercent}
          onChange={(e) => onInputChange('riskPercent', e.target.value)}
          placeholder="2"
          step="0.1"
          min="0.1"
          max="100"
        />
      </div>

      <button
        type="button"
        className="calculate-button"
        onClick={onCalculate}
        disabled={calculating}
      >
        {calculating ? (
          <>
            <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
            Calculando...
          </>
        ) : (
          '🧮 Calcular Risk Management'
        )}
      </button>
    </>
  );
};

export default CalculatorForm;