import React, { useState } from 'react';
import { testBinanceConnection, testBinanceData } from '../config/binance-test';

const BinanceApiTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState('');

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError('');
    setConnectionResult(null);
    
    try {
      const result = await testBinanceConnection();
      setConnectionResult(result);
      
      if (result) {
        // If connection successful, also test data retrieval
        const data = await testBinanceData();
        setTestData(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="binance-api-test">
      <div className="test-header">
        <h2>🔑 Teste de API Binance</h2>
        <p>Configure suas credenciais em <code>src/config/binance-test.js</code></p>
      </div>

      <div className="test-controls">
        <button 
          onClick={handleTestConnection}
          disabled={isLoading}
          className="test-button"
        >
          {isLoading ? '⏳ Testando...' : '🧪 Testar Conexão API'}
        </button>
      </div>

      {error && (
        <div className="test-error">
          <h3>❌ Erro</h3>
          <p>{error}</p>
        </div>
      )}

      {connectionResult !== null && (
        <div className={`test-result ${connectionResult ? 'success' : 'error'}`}>
          <h3>{connectionResult ? '✅ Conexão Bem-sucedida' : '❌ Falha na Conexão'}</h3>
          <p>Verifique o console do navegador para mais detalhes.</p>
        </div>
      )}

      {testData && (
        <div className="test-data">
          <h3>📊 Dados Recuperados</h3>
          
          <div className="data-section">
            <h4>💰 Saldos da Conta</h4>
            <p>Ativos encontrados: {testData.balances?.length || 0}</p>
            {testData.balances?.length > 0 && (
              <ul>
                {testData.balances.slice(0, 5).map((balance, index) => (
                  <li key={index}>
                    {balance.asset}: {balance.total} (${balance.usdValue?.toFixed(2) || 'N/A'})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="data-section">
            <h4>📈 Histórico de Trades</h4>
            <p>Trades encontrados: {testData.trades?.length || 0}</p>
            {testData.trades?.length > 0 && (
              <ul>
                {testData.trades.slice(0, 3).map((trade, index) => (
                  <li key={index}>
                    {trade.symbol}: {trade.side} {trade.qty} @ {trade.price}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="data-section">
            <h4>💸 Custos de Trading (30 dias)</h4>
            <p>Total de taxas: {testData.costs?.totalFees || 0}</p>
            <p>Total de trades: {testData.costs?.totalTrades || 0}</p>
            <p>Taxa média: {((testData.costs?.averageFeeRate || 0) * 100).toFixed(4)}%</p>
          </div>
        </div>
      )}

      <div className="test-instructions">
        <h3>📋 Instruções</h3>
        <ol>
          <li>Abra o arquivo <code>src/config/binance-test.js</code></li>
          <li>Adicione sua chave secreta no campo <code>secretKey</code></li>
          <li>Defina <code>enabled: true</code> para habilitar os testes</li>
          <li>Clique em "Testar Conexão API" para verificar a integração</li>
        </ol>
        
        <div className="security-note">
          <p><strong>⚠️ Importante:</strong> Nunca comita as chaves da API no repositório. 
          Use apenas chaves read-only para testes.</p>
        </div>
      </div>

      <style jsx>{`
        .binance-api-test {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .test-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .test-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .test-controls {
          text-align: center;
          margin-bottom: 30px;
        }

        .test-button {
          background: #f0b90b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .test-button:hover {
          background: #d9a441;
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .test-result {
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .test-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .test-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .test-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .test-data {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .data-section {
          margin-bottom: 20px;
        }

        .data-section h4 {
          color: #333;
          margin-bottom: 10px;
        }

        .data-section ul {
          list-style: none;
          padding: 0;
        }

        .data-section li {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .test-instructions {
          background: #e9ecef;
          padding: 20px;
          border-radius: 6px;
        }

        .test-instructions h3 {
          color: #333;
          margin-bottom: 15px;
        }

        .test-instructions ol {
          margin-bottom: 20px;
        }

        .test-instructions li {
          margin-bottom: 8px;
        }

        .security-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 15px;
          margin-top: 15px;
        }

        .security-note p {
          margin: 0;
          color: #856404;
        }

        code {
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
};

export default BinanceApiTest;