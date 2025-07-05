import React, { useState, useCallback } from 'react';
import BinanceAPI from '../services/binanceApi';
import MultiExchangeAPI from '../services/multiExchangeApi';
import { useApiKeys } from '../hooks/useApiKeys';
import toast from 'react-hot-toast';

const TradingHistoryView = () => {
  const { hasValidKeys, getApiCredentials, getConnectedExchanges } = useApiKeys();
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    symbol: 'ALL',
    startDate: '',
    endDate: '',
    limit: 1000
  });

  // Símbolos populares
  const popularSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'XRPUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'AVAXUSDT',
    'LTCUSDT', 'LINKUSDT', 'UNIUSDT', 'BCHUSDT', 'ATOMUSDT'
  ];

  const fetchTradingHistory = useCallback(async () => {
    setLoading(true);
    setTrades([]);
    setStats(null);

    try {
      // Verificar se há configuração de API usando o contexto
      if (!hasValidKeys()) {
        toast.error('Configure suas chaves da API primeiro em "Configuração da API"');
        setLoading(false);
        return;
      }

      console.log('📊 Buscando histórico de trades...');
      
      // Obter todas as exchanges conectadas
      const connectedExchanges = getConnectedExchanges();
      if (connectedExchanges.length === 0) {
        throw new Error('Nenhuma exchange conectada. Configure suas chaves API primeiro.');
      }
      
      console.log(`📊 Buscando histórico de ${connectedExchanges.length} exchange(s): ${connectedExchanges.map(ex => ex.id).join(', ')}`);

      let allTrades = [];
      let totalVolume = 0;
      let totalFees = 0;
      let symbolsWithTrades = new Set();
      let exchangesWithData = new Set();

      // Configurar filtros de data
      const startTime = filters.startDate ? new Date(filters.startDate).getTime() : null;
      const endTime = filters.endDate ? new Date(filters.endDate).getTime() : null;

      // Buscar dados de cada exchange conectada
      for (const exchangeInfo of connectedExchanges) {
        try {
          console.log(`🔄 Processando ${exchangeInfo.id}...`);
          
          const { apiKey, secretKey } = getApiCredentials(exchangeInfo.id);
          const exchangeApi = new MultiExchangeAPI(exchangeInfo.id, apiKey, secretKey, false);
          
          if (filters.symbol === 'ALL') {
            console.log(`🔍 Buscando todos os símbolos em ${exchangeInfo.id}...`);
            
            // Para "ALL", buscar símbolos populares
            for (let i = 0; i < popularSymbols.length; i++) {
              const symbol = popularSymbols[i];
              const progress = Math.round(((i + 1) / popularSymbols.length) * 100);
              
              try {
                console.log(`📈 [${progress}%] ${exchangeInfo.id}: ${symbol}...`);
                
                const symbolTrades = await exchangeApi.getTradingHistory(
                  symbol, 
                  Math.min(filters.limit / connectedExchanges.length, 200), // Distribuir limite entre exchanges
                  startTime,
                  endTime
                );

                if (symbolTrades && symbolTrades.length > 0) {
                  const formattedTrades = symbolTrades.map(trade => ({
                    ...exchangeApi.formatTradeData(trade),
                    symbol: symbol,
                    exchangeId: exchangeInfo.id,
                    exchangeName: exchangeApi.getExchangeName(),
                    rawData: trade
                  }));

                  allTrades = allTrades.concat(formattedTrades);
                  symbolsWithTrades.add(symbol);
                  exchangesWithData.add(exchangeInfo.id);

                  // Calcular estatísticas
                  symbolTrades.forEach(trade => {
                    totalVolume += parseFloat(trade.cost || 0);
                    totalFees += parseFloat(trade.fee?.cost || 0);
                  });

                  console.log(`✅ ${symbolTrades.length} trades de ${symbol} em ${exchangeInfo.id}`);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));

              } catch (error) {
                console.log(`⚠️ ${exchangeInfo.id} ${symbol}: ${error.message}`);
                continue;
              }
            }

          } else {
            // Buscar símbolo específico
            console.log(`🎯 Buscando ${filters.symbol} em ${exchangeInfo.id}...`);
            
            try {
              const symbolTrades = await exchangeApi.getTradingHistory(
                filters.symbol,
                Math.min(filters.limit / connectedExchanges.length, 500),
                startTime,
                endTime
              );

              if (symbolTrades && symbolTrades.length > 0) {
                const formattedTrades = symbolTrades.map(trade => ({
                  ...exchangeApi.formatTradeData(trade),
                  symbol: filters.symbol,
                  exchangeId: exchangeInfo.id,
                  exchangeName: exchangeApi.getExchangeName(),
                  rawData: trade
                }));

                allTrades = allTrades.concat(formattedTrades);
                symbolsWithTrades.add(filters.symbol);
                exchangesWithData.add(exchangeInfo.id);

                symbolTrades.forEach(trade => {
                  totalVolume += parseFloat(trade.cost || 0);
                  totalFees += parseFloat(trade.fee?.cost || 0);
                });

                console.log(`✅ ${symbolTrades.length} trades de ${filters.symbol} em ${exchangeInfo.id}`);
              }
            } catch (error) {
              console.log(`⚠️ Erro ao buscar ${filters.symbol} em ${exchangeInfo.id}: ${error.message}`);
            }
          }
          
          // Aguardar entre exchanges
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Erro ao processar ${exchangeInfo.id}:`, error);
          continue;
        }
      }

      // Ordenar por data (mais recentes primeiro)
      allTrades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calcular estatísticas
      const buyTrades = allTrades.filter(t => t.side === 'BUY');
      const sellTrades = allTrades.filter(t => t.side === 'SELL');
      
      // Estatísticas por exchange
      const exchangeStats = {};
      for (const exchangeId of exchangesWithData) {
        const exchangeTrades = allTrades.filter(t => t.exchangeId === exchangeId);
        exchangeStats[exchangeId] = {
          trades: exchangeTrades.length,
          volume: exchangeTrades.reduce((sum, t) => sum + (t.total || 0), 0),
          fees: exchangeTrades.reduce((sum, t) => sum + (t.fees || 0), 0)
        };
      }
      
      const statsData = {
        totalTrades: allTrades.length,
        buyTrades: buyTrades.length,
        sellTrades: sellTrades.length,
        totalVolume,
        totalFees,
        symbolsTraded: symbolsWithTrades.size,
        exchangesUsed: exchangesWithData.size,
        avgFeeRate: totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0,
        dateRange: {
          oldest: allTrades.length > 0 ? new Date(Math.min(...allTrades.map(t => new Date(t.timestamp)))) : null,
          newest: allTrades.length > 0 ? new Date(Math.max(...allTrades.map(t => new Date(t.timestamp)))) : null
        },
        topSymbols: Array.from(symbolsWithTrades).slice(0, 5),
        exchangeStats
      };

      setTrades(allTrades);
      setStats(statsData);

      if (allTrades.length > 0) {
        toast.success(`✅ ${allTrades.length} trades carregados de ${exchangesWithData.size} exchange(s) e ${symbolsWithTrades.size} símbolos`);
      } else {
        toast.info('ℹ️ Nenhum trade encontrado no período selecionado em nenhuma exchange');
      }

    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const exportToCSV = () => {
    if (trades.length === 0) {
      toast.error('Nenhum trade para exportar');
      return;
    }

    const headers = [
      'Data/Hora', 'Símbolo', 'Lado', 'Quantidade', 'Preço', 'Total (USDT)', 
      'Taxa', 'Asset da Taxa', 'Trade ID'
    ];

    const csvData = trades.map(trade => [
      new Date(trade.timestamp).toLocaleString('pt-BR'),
      trade.symbol,
      trade.side,
      trade.quantity.toFixed(8),
      trade.price.toFixed(8),
      (trade.quantity * trade.price).toFixed(2),
      trade.fees.toFixed(8),
      trade.rawData?.commissionAsset || 'N/A',
      trade.rawData?.id || trade.id
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `binance_trades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('📥 Histórico exportado para CSV!');
  };

  return (
    <div className="trading-history-view">
      <div className="history-header">
        <h2>📈 Histórico de Trades</h2>
        <p>Visualize todo seu histórico de trading das exchanges conectadas</p>
        
        {/* Status das Chaves API */}
        {hasValidKeys() ? (
          <div className="api-status-indicator">
            <span className="status-icon">✅</span>
            <span>Chaves API configuradas - Pronto para buscar dados reais</span>
          </div>
        ) : (
          <div className="api-status-indicator error">
            <span className="status-icon">❌</span>
            <span>Configure suas chaves API primeiro em "Configuração API"</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Símbolo:</label>
            <select 
              value={filters.symbol} 
              onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
            >
              <option value="ALL">🌟 Todos os Símbolos</option>
              <optgroup label="Principais Moedas">
                {popularSymbols.slice(0, 10).map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </optgroup>
              <optgroup label="Outras Moedas">
                {popularSymbols.slice(10).map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="filter-group">
            <label>Data Início:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Data Fim:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Limite:</label>
            <select 
              value={filters.limit} 
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
            >
              <option value={500}>500 trades</option>
              <option value={1000}>1.000 trades</option>
              <option value={2000}>2.000 trades</option>
              <option value={5000}>5.000 trades</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="search-button"
            onClick={fetchTradingHistory}
            disabled={loading || !hasValidKeys()}
            title={!hasValidKeys() ? 'Configure suas chaves API primeiro' : ''}
          >
            {loading ? '🔄 Carregando...' : '🔍 Buscar Histórico'}
          </button>

          {trades.length > 0 && (
            <button className="export-button" onClick={exportToCSV}>
              📥 Exportar CSV ({trades.length} trades)
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-section">
          <div className="loading-spinner">🔄</div>
          <p>Buscando histórico completo da API real...</p>
          <small>Isso pode levar alguns minutos para contas com muito histórico</small>
        </div>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="stats-section">
          <h3>📊 Resumo do Período</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalTrades}</div>
                <div className="stat-label">Total de Trades</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-info">
                <div className="stat-value">{stats.buyTrades}</div>
                <div className="stat-label">Compras</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-info">
                <div className="stat-value">{stats.sellTrades}</div>
                <div className="stat-label">Vendas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalVolume.toLocaleString()}</div>
                <div className="stat-label">Volume Total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalFees.toFixed(4)}</div>
                <div className="stat-label">Total de Taxas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{stats.symbolsTraded}</div>
                <div className="stat-label">Símbolos Diferentes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <div className="stat-value">{stats.exchangesUsed}</div>
                <div className="stat-label">Exchanges</div>
              </div>
            </div>
          </div>
          
          {/* Breakdown por exchange */}
          {stats.exchangeStats && Object.keys(stats.exchangeStats).length > 1 && (
            <div className="exchange-breakdown">
              <h4>📊 Breakdown por Exchange</h4>
              <div className="exchange-stats-grid">
                {Object.entries(stats.exchangeStats).map(([exchangeId, stat]) => (
                  <div key={exchangeId} className="exchange-stat-card">
                    <div className="exchange-stat-header">
                      <span className="exchange-stat-icon">
                        {exchangeId === 'binance' && '🟡'}
                        {exchangeId === 'bingx' && '🔥'}
                        {exchangeId === 'bybit' && '🟠'}
                        {exchangeId === 'bitget' && '🟢'}
                      </span>
                      <span className="exchange-stat-name">
                        {exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1)}
                      </span>
                    </div>
                    <div className="exchange-stat-details">
                      <small>{stat.trades} trades</small>
                      <small>${stat.volume.toFixed(2)} volume</small>
                      <small>${stat.fees.toFixed(4)} taxas</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {stats.topSymbols.length > 0 && (
            <div className="top-symbols">
              <strong>Símbolos negociados:</strong> {stats.topSymbols.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Lista de Trades */}
      {trades.length > 0 && (
        <div className="trades-section">
          <h3>📋 Histórico Detalhado ({trades.length} trades)</h3>
          <div className="trades-table">
            <div className="table-header">
              <span>Data/Hora</span>
              <span>Exchange</span>
              <span>Símbolo</span>
              <span>Lado</span>
              <span>Quantidade</span>
              <span>Preço</span>
              <span>Total</span>
              <span>Taxa</span>
            </div>
            <div className="table-body">
              {trades.slice(0, 100).map((trade, index) => (
                <div key={index} className="table-row">
                  <span className="trade-date">
                    {new Date(trade.timestamp).toLocaleString('pt-BR')}
                  </span>
                  <span className="trade-exchange">
                    <span className="exchange-badge" data-exchange={trade.exchangeId}>
                      {trade.exchangeId === 'binance' && '🟡'}
                      {trade.exchangeId === 'bingx' && '🔥'}
                      {trade.exchangeId === 'bybit' && '🟠'}
                      {trade.exchangeId === 'bitget' && '🟢'}
                      {trade.exchangeName || trade.exchangeId}
                    </span>
                  </span>
                  <span className="trade-symbol">{trade.symbol}</span>
                  <span className={`trade-side ${trade.side.toLowerCase()}`}>
                    {trade.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                  </span>
                  <span className="trade-quantity">{trade.quantity.toFixed(8)}</span>
                  <span className="trade-price">${trade.price.toFixed(4)}</span>
                  <span className="trade-total">
                    ${(trade.quantity * trade.price).toFixed(2)}
                  </span>
                  <span className="trade-fee">{trade.fees.toFixed(6)}</span>
                </div>
              ))}
            </div>
            {trades.length > 100 && (
              <div className="table-footer">
                Mostrando primeiros 100 de {trades.length} trades. 
                Exporte CSV para ver todos os dados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && trades.length === 0 && !stats && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Nenhum histórico carregado</h3>
          <p>Configure suas chaves da API e clique em "Buscar Histórico" para ver seus trades.</p>
        </div>
      )}

      <style jsx>{`
        .trading-history-view {
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
        }

        .history-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .filters-section {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.9em;
        }

        .filter-group select,
        .filter-group input {
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text-primary);
        }

        .filter-actions {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .search-button, .export-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-button {
          background: var(--accent-color);
          color: white;
        }

        .export-button {
          background: var(--success-color);
          color: white;
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-section {
          text-align: center;
          padding: 40px;
          background: var(--bg-section);
          border-radius: 12px;
          margin-bottom: 25px;
        }

        .loading-spinner {
          font-size: 3em;
          margin-bottom: 15px;
          animation: spin 2s linear infinite;
        }

        .stats-section {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid var(--accent-color);
        }

        .stat-icon {
          font-size: 1.5em;
        }

        .stat-value {
          font-size: 1.2em;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.8em;
          color: var(--text-secondary);
        }

        .top-symbols {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 0.9em;
        }

        .exchange-breakdown {
          margin-top: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .exchange-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .exchange-stat-card {
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          text-align: center;
        }

        .exchange-stat-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .exchange-stat-icon {
          font-size: 1.2em;
        }

        .exchange-stat-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .exchange-stat-details small {
          font-size: 0.8em;
          color: var(--text-secondary);
        }

        .exchange-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 500;
        }

        .trades-section {
          background: var(--bg-section);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
        }

        .trades-table {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1fr;
          gap: 10px;
          padding: 15px;
          background: var(--bg-gradient-light);
          font-weight: 600;
          font-size: 0.9em;
          color: var(--text-secondary);
        }

        .table-body {
          max-height: 500px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1fr;
          gap: 10px;
          padding: 12px 15px;
          border-top: 1px solid var(--border-color);
          font-size: 0.85em;
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

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-section);
          border-radius: 12px;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 4em;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .api-status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
          padding: 12px 16px;
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid rgba(40, 167, 69, 0.3);
          border-radius: 8px;
          color: var(--success-color);
          font-size: 0.9em;
        }

        .api-status-indicator.error {
          background: rgba(220, 53, 69, 0.1);
          border-color: rgba(220, 53, 69, 0.3);
          color: var(--error-color);
        }

        .api-status-indicator .status-icon {
          font-size: 1.1em;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .filter-actions {
            flex-direction: column;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default TradingHistoryView;