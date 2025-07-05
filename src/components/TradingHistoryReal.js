import React, { useState, useCallback } from 'react';
import BinanceAPI from '../services/binanceApi';
import toast from 'react-hot-toast';

const TradingHistoryReal = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Símbolos mais populares para buscar histórico
  const popularSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'XRPUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'AVAXUSDT',
    'LTCUSDT', 'LINKUSDT', 'UNIUSDT', 'BCHUSDT', 'FILUSDT'
  ];

  const fetchCompleteHistory = useCallback(async () => {
    setLoading(true);
    setTrades([]);
    setStats(null);

    try {
      console.log('🔍 Iniciando busca completa do histórico de trades...');
      
      // Inicializar API Binance real
      const binanceApi = new BinanceAPI(
        process.env.REACT_APP_BINANCE_API_KEY,
        process.env.REACT_APP_BINANCE_SECRET_KEY,
        false, // not testnet - API REAL
        true   // use proxy
      );

      // Testar conexão primeiro
      const connectionTest = await binanceApi.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha na conexão com API Binance: ' + connectionTest.error);
      }

      console.log('✅ Conectado à API real da Binance');

      let allTrades = [];
      let totalVolume = 0;
      let totalFees = 0;
      let symbolsWithTrades = new Set();

      // Configurar range de datas se fornecido
      const startTime = dateRange.startDate ? new Date(dateRange.startDate).getTime() : null;
      const endTime = dateRange.endDate ? new Date(dateRange.endDate).getTime() : null;

      if (selectedSymbol === 'ALL') {
        console.log('📊 Buscando histórico completo de todos os símbolos...');
        
        // Buscar para todos os símbolos populares
        for (const symbol of popularSymbols) {
          try {
            console.log(`🔍 Buscando trades de ${symbol}...`);
            
            const symbolTrades = await binanceApi.getTradingHistory(
              symbol, 
              1000, // máximo por request
              startTime,
              endTime
            );

            if (symbolTrades && symbolTrades.length > 0) {
              console.log(`✅ ${symbolTrades.length} trades encontrados para ${symbol}`);
              
              const formattedTrades = symbolTrades.map(trade => ({
                ...binanceApi.formatTradeData(trade),
                symbol: symbol,
                originalData: trade
              }));

              allTrades = allTrades.concat(formattedTrades);
              symbolsWithTrades.add(symbol);

              // Calcular estatísticas
              symbolTrades.forEach(trade => {
                totalVolume += parseFloat(trade.quoteQty || 0);
                totalFees += parseFloat(trade.commission || 0);
              });
            }

            // Delay para respeitar rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.log(`⚠️ Sem trades para ${symbol}: ${error.message}`);
            continue;
          }
        }

      } else {
        // Buscar apenas o símbolo selecionado
        console.log(`🔍 Buscando histórico específico de ${selectedSymbol}...`);
        
        const symbolTrades = await binanceApi.getTradingHistory(
          selectedSymbol,
          1000,
          startTime,
          endTime
        );

        if (symbolTrades && symbolTrades.length > 0) {
          allTrades = symbolTrades.map(trade => ({
            ...binanceApi.formatTradeData(trade),
            symbol: selectedSymbol,
            originalData: trade
          }));

          symbolTrades.forEach(trade => {
            totalVolume += parseFloat(trade.quoteQty || 0);
            totalFees += parseFloat(trade.commission || 0);
          });

          symbolsWithTrades.add(selectedSymbol);
        }
      }

      // Ordenar trades por data (mais recentes primeiro)
      allTrades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calcular estatísticas finais
      const tradesStats = {
        totalTrades: allTrades.length,
        totalVolume: totalVolume,
        totalFees: totalFees,
        symbolsTraded: symbolsWithTrades.size,
        averageFeeRate: totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0,
        dateRange: {
          oldest: allTrades.length > 0 ? new Date(Math.min(...allTrades.map(t => new Date(t.timestamp)))) : null,
          newest: allTrades.length > 0 ? new Date(Math.max(...allTrades.map(t => new Date(t.timestamp)))) : null
        },
        profitLoss: calculateProfitLoss(allTrades)
      };

      // Buscar informações da conta mesmo sem trades
      let accountInfo = null;
      try {
        const accountData = await binanceApi.getAccountInfo();
        const balances = await binanceApi.getBalances();
        
        accountInfo = {
          accountType: accountData.accountType,
          canTrade: accountData.canTrade,
          permissions: accountData.permissions,
          totalAssets: balances.length,
          totalBalanceUSD: balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0),
          lastUpdate: new Date().toISOString()
        };
      } catch (error) {
        console.log('Informações da conta não disponíveis:', error.message);
      }

      setTrades(allTrades);
      setStats({...tradesStats, accountInfo});

      console.log('🎉 Histórico completo carregado:', {
        trades: allTrades.length,
        symbols: symbolsWithTrades.size,
        volume: totalVolume.toFixed(2),
        fees: totalFees.toFixed(4)
      });

      if (allTrades.length > 0) {
        toast.success(`${allTrades.length} trades reais carregados da API Binance!`);
      } else {
        toast.info('Nenhum trade encontrado no período. Isso é normal para contas novas ou sem atividade recente.');
      }

    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, dateRange]);

  const calculateProfitLoss = (tradesData) => {
    // Cálculo simplificado de P&L (seria mais complexo com matching de trades)
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let buyTrades = 0;
    let sellTrades = 0;

    tradesData.forEach(trade => {
      const value = trade.quantity * trade.price;
      if (trade.side === 'BUY') {
        totalBuyValue += value;
        buyTrades++;
      } else {
        totalSellValue += value;
        sellTrades++;
      }
    });

    return {
      totalBuyValue,
      totalSellValue,
      buyTrades,
      sellTrades,
      estimatedPnL: totalSellValue - totalBuyValue
    };
  };

  const exportToCSV = () => {
    if (trades.length === 0) {
      toast.error('Nenhum trade para exportar');
      return;
    }

    const csvHeaders = [
      'Data/Hora',
      'Símbolo', 
      'Lado',
      'Quantidade',
      'Preço',
      'Total',
      'Taxa',
      'Asset da Taxa'
    ];

    const csvData = trades.map(trade => [
      new Date(trade.timestamp).toLocaleString('pt-BR'),
      trade.symbol,
      trade.side,
      trade.quantity.toFixed(8),
      trade.price.toFixed(8),
      (trade.quantity * trade.price).toFixed(2),
      trade.fees.toFixed(8),
      trade.originalData?.commissionAsset || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `binance_trades_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Histórico exportado para CSV!');
  };

  return (
    <div className="trading-history-real">
      <div className="history-header">
        <h2>📊 Histórico Completo de Trades - API REAL</h2>
        <div className="api-status">
          <span className="status-indicator"></span>
          <span>Dados reais da API Binance</span>
        </div>
      </div>

      <div className="history-controls">
        <div className="control-group">
          <label>Símbolo:</label>
          <select 
            value={selectedSymbol} 
            onChange={(e) => setSelectedSymbol(e.target.value)}
          >
            <option value="ALL">Todos os Símbolos</option>
            {popularSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Data Início:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>

        <div className="control-group">
          <label>Data Fim:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <button 
          className="fetch-button"
          onClick={fetchCompleteHistory}
          disabled={loading}
        >
          {loading ? '⏳ Carregando...' : '🔄 Buscar Histórico Real'}
        </button>

        {trades.length > 0 && (
          <button className="export-button" onClick={exportToCSV}>
            📥 Exportar CSV
          </button>
        )}
      </div>

      {stats && (
        <div className="trading-stats">
          <h3>📈 Estatísticas do Período</h3>
          
          {stats.accountInfo && (
            <div className="account-info-section">
              <h4>🏦 Informações da Conta</h4>
              <div className="account-grid">
                <div className="account-item">
                  <span className="account-label">Tipo de Conta:</span>
                  <span className="account-value">{stats.accountInfo.accountType}</span>
                </div>
                <div className="account-item">
                  <span className="account-label">Pode Operar:</span>
                  <span className={`account-value ${stats.accountInfo.canTrade ? 'positive' : 'negative'}`}>
                    {stats.accountInfo.canTrade ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                <div className="account-item">
                  <span className="account-label">Total de Assets:</span>
                  <span className="account-value">{stats.accountInfo.totalAssets}</span>
                </div>
                <div className="account-item">
                  <span className="account-label">Valor Total:</span>
                  <span className="account-value">${stats.accountInfo.totalBalanceUSD.toFixed(2)}</span>
                </div>
                <div className="account-item">
                  <span className="account-label">Permissões:</span>
                  <span className="account-value">{stats.accountInfo.permissions.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total de Trades:</span>
              <span className="stat-value">{stats.totalTrades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Símbolos Negociados:</span>
              <span className="stat-value">{stats.symbolsTraded}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Volume Total:</span>
              <span className="stat-value">${stats.totalVolume.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total de Taxas:</span>
              <span className="stat-value">${stats.totalFees.toFixed(4)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Taxa Média:</span>
              <span className="stat-value">{stats.averageFeeRate.toFixed(4)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P&L Estimado:</span>
              <span className={`stat-value ${stats.profitLoss.estimatedPnL >= 0 ? 'positive' : 'negative'}`}>
                ${stats.profitLoss.estimatedPnL.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-section">
          <div className="loading-animation">⏳</div>
          <p>Buscando histórico completo da API real...</p>
          <p>Isso pode levar alguns minutos para contas com muito histórico.</p>
        </div>
      )}

      {trades.length > 0 && (
        <div className="trades-list">
          <h3>📋 Lista de Trades ({trades.length} encontrados)</h3>
          <div className="trades-table">
            <div className="table-header">
              <span>Data/Hora</span>
              <span>Símbolo</span>
              <span>Lado</span>
              <span>Quantidade</span>
              <span>Preço</span>
              <span>Total</span>
              <span>Taxa</span>
            </div>
            {trades.slice(0, 100).map((trade, index) => (
              <div key={index} className="table-row">
                <span className="trade-date">
                  {new Date(trade.timestamp).toLocaleString('pt-BR')}
                </span>
                <span className="trade-symbol">{trade.symbol}</span>
                <span className={`trade-side ${trade.side.toLowerCase()}`}>
                  {trade.side}
                </span>
                <span className="trade-quantity">{trade.quantity.toFixed(8)}</span>
                <span className="trade-price">${trade.price.toFixed(4)}</span>
                <span className="trade-total">
                  ${(trade.quantity * trade.price).toFixed(2)}
                </span>
                <span className="trade-fee">{trade.fees.toFixed(6)}</span>
              </div>
            ))}
            {trades.length > 100 && (
              <div className="table-footer">
                Mostrando primeiros 100 de {trades.length} trades. 
                Exporte CSV para ver todos.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .trading-history-real {
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
          background: var(--bg-section);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .api-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9em;
          color: var(--success-color);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background: var(--success-color);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .history-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 25px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .control-group label {
          font-size: 0.9em;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .control-group select,
        .control-group input {
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text-primary);
        }

        .fetch-button, .export-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .fetch-button {
          background: var(--accent-color);
          color: white;
        }

        .export-button {
          background: var(--success-color);
          color: white;
        }

        .fetch-button:hover,
        .export-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .fetch-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .trading-stats {
          margin-bottom: 25px;
          padding: 20px;
          background: var(--bg-gradient-light);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .account-info-section {
          margin-bottom: 25px;
          padding: 20px;
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid rgba(40, 167, 69, 0.3);
          border-radius: 8px;
        }

        .account-info-section h4 {
          margin: 0 0 15px 0;
          color: var(--success-color);
          font-size: 1.1em;
        }

        .account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .account-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          border-left: 3px solid var(--success-color);
        }

        .account-label {
          color: var(--text-secondary);
          font-size: 0.9em;
          font-weight: 500;
        }

        .account-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.9em;
        }

        .stat-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-value.positive {
          color: var(--success-color);
        }

        .stat-value.negative {
          color: var(--error-color);
        }

        .loading-section {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .loading-animation {
          font-size: 3em;
          margin-bottom: 20px;
        }

        .trades-table {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1fr;
          gap: 10px;
          padding: 15px;
          background: var(--bg-gradient-light);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1fr;
          gap: 10px;
          padding: 12px 15px;
          border-top: 1px solid var(--border-color);
          font-size: 0.9em;
          transition: background 0.2s ease;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .trade-side.buy {
          color: var(--success-color);
          font-weight: 600;
        }

        .trade-side.sell {
          color: var(--error-color);
          font-weight: 600;
        }

        .table-footer {
          padding: 15px;
          text-align: center;
          background: var(--bg-gradient-light);
          color: var(--text-secondary);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .history-controls {
            flex-direction: column;
          }
          
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TradingHistoryReal;