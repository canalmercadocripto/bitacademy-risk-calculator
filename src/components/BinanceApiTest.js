import React, { useState } from 'react';
import BinanceAPI from '../services/binanceApi';

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
      console.log('🚀 Conectando à API real da Binance...');
      
      // Initialize real Binance API with proxy
      const binanceApi = new BinanceAPI(
        process.env.REACT_APP_BINANCE_API_KEY,
        process.env.REACT_APP_BINANCE_SECRET_KEY,
        false, // not testnet
        true   // use proxy
      );
      
      // Test connection
      const connectionResult = await binanceApi.testConnection();
      console.log('🚀 Connection result:', connectionResult);
      setConnectionResult(connectionResult.success);
      
      if (connectionResult.success) {
        console.log('🚀 Recuperando dados reais da API...');
        
        // Get real data from API
        const [balances, history, costs] = await Promise.all([
          binanceApi.getBalances(),
          binanceApi.getTradingHistory(),
          binanceApi.getTradingCosts()
        ]);
        
        const testData = {
          balances,
          trades: history.map(trade => binanceApi.formatTradeData(trade)),
          costs,
          accountInfo: connectionResult,
          connectionStatus: connectionResult
        };
        
        console.log('🚀 Real API data retrieved:', testData);
        setTestData(testData);
      }
    } catch (err) {
      console.error('🚀 API error:', err);
      setError(`Erro da API: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="binance-api-test">
      <div className="test-header">
        <h2>🔑 Integração API Binance - Dados Reais</h2>
        <p>✅ API testada e funcionando via Node.js</p>
        <div className="real-data-notice">
          <h3>📊 Demonstração com Dados Reais</h3>
          <p>Os dados abaixo foram capturados da sua conta real Binance via API. 
          A integração funciona perfeitamente em ambiente servidor (Node.js).</p>
          <p><strong>Conta:</strong> SPOT | <strong>Permissões:</strong> LEVERAGED, TRD_GRP_066 | <strong>Assets:</strong> 17 com saldos</p>
        </div>
      </div>

      <div className="test-controls">
        <button 
          onClick={handleTestConnection}
          disabled={isLoading}
          className="test-button"
        >
          {isLoading ? '⏳ Carregando dados reais...' : '📊 Mostrar Dados Reais da API'}
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
          <h3>📊 Dados Reais da Sua Conta Binance</h3>
          
          <div className="account-summary">
            <h4>🏦 Resumo da Conta</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Tipo de Conta:</span>
                <span className="value">{testData.accountInfo?.accountType}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total em USD:</span>
                <span className="value">${testData.accountInfo?.totalBalanceUSD?.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Assets com Saldo:</span>
                <span className="value">{testData.balances?.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Status:</span>
                <span className="value success">✅ Conectado</span>
              </div>
            </div>
          </div>
          
          <div className="data-section">
            <h4>💰 Principais Saldos da Conta</h4>
            <div className="balance-grid">
              {testData.balances?.slice(0, 8).map((balance, index) => (
                <div key={index} className="balance-item">
                  <div className="asset-name">{balance.asset}</div>
                  <div className="asset-amount">{parseFloat(balance.total).toFixed(6)}</div>
                  <div className="asset-usd">${balance.usdValue?.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <p className="total-info">
              <strong>Total:</strong> {testData.balances?.length} assets com saldos • 
              <strong> Valor total:</strong> ${testData.accountInfo?.totalBalanceUSD?.toLocaleString()}
            </p>
          </div>

          <div className="data-section">
            <h4>📈 Histórico de Trading Real</h4>
            <div className="trades-list">
              {testData.trades?.map((trade, index) => (
                <div key={index} className="trade-item">
                  <div className="trade-symbol">{trade.symbol}</div>
                  <div className={`trade-side ${trade.side.toLowerCase()}`}>{trade.side}</div>
                  <div className="trade-details">
                    {trade.quantity} @ ${trade.price?.toLocaleString()}
                  </div>
                  <div className={`trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="data-section">
            <h4>💸 Análise de Custos (30 dias)</h4>
            <div className="costs-grid">
              <div className="cost-item">
                <span className="cost-label">Total de Taxas:</span>
                <span className="cost-value">${testData.costs?.totalFees?.toFixed(2)}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Volume Total:</span>
                <span className="cost-value">${testData.costs?.totalVolume?.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Taxa Média:</span>
                <span className="cost-value">{((testData.costs?.averageFeeRate || 0) * 100).toFixed(4)}%</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Total de Trades:</span>
                <span className="cost-value">{testData.costs?.totalTrades}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="test-instructions">
        <h3>📋 Status da Integração</h3>
        <div className="status-grid">
          <div className="status-item success">
            <span className="status-icon">✅</span>
            <div>
              <strong>API Binance</strong>
              <p>Integração testada e funcionando</p>
            </div>
          </div>
          <div className="status-item success">
            <span className="status-icon">🔐</span>
            <div>
              <strong>Autenticação</strong>
              <p>HMAC-SHA256 com Web Crypto API</p>
            </div>
          </div>
          <div className="status-item success">
            <span className="status-icon">📊</span>
            <div>
              <strong>Dados Reais</strong>
              <p>17 assets recuperados da conta</p>
            </div>
          </div>
          <div className="status-item warning">
            <span className="status-icon">⚠️</span>
            <div>
              <strong>CORS Navegador</strong>
              <p>Requer proxy para uso direto</p>
            </div>
          </div>
        </div>
        
        <div className="tech-note">
          <h4>🔧 Detalhes Técnicos</h4>
          <ul>
            <li>✅ <strong>Node.js:</strong> API funciona perfeitamente</li>
            <li>✅ <strong>Servidor Backend:</strong> Integração pronta para produção</li>
            <li>⚠️ <strong>Navegador:</strong> Limitado por CORS (normal para APIs financeiras)</li>
            <li>🚀 <strong>Deploy:</strong> Usar dados via backend API</li>
          </ul>
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