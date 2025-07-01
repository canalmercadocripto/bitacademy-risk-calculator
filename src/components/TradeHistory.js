import React, { useState, useEffect } from 'react';
import { tradeApi } from '../services/authApi';
import toast from 'react-hot-toast';

const TradeHistory = ({ isOpen, onClose, token }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      loadHistory();
    }
  }, [isOpen, token]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await tradeApi.getHistory(token);
      if (response.success) {
        setTrades(response.data.trades || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico');
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px', width: '90%'}}>
        <div className="modal-header">
          <h2>📊 Meu Histórico de Trades</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="history-content" style={{maxHeight: '400px', overflowY: 'auto'}}>
          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>
              <div>Carregando histórico...</div>
            </div>
          ) : trades.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-placeholder)'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📈</div>
              <div>Nenhum trade encontrado</div>
              <div style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
                Seus cálculos aparecerão aqui automaticamente
              </div>
            </div>
          ) : (
            <div className="trades-list">
              {trades.map((trade, index) => (
                <div key={trade.id} className="trade-item" style={{
                  background: 'var(--bg-section)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${trade.direction === 'long' ? '#28a745' : '#dc3545'}`
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                    <div style={{fontWeight: 'bold', color: 'var(--text-secondary)'}}>
                      {trade.symbol} - {trade.exchange.toUpperCase()}
                    </div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-placeholder)'}}>
                      {formatDate(trade.created_at)}
                    </div>
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', fontSize: '0.9rem'}}>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Direção:</span>{' '}
                      <span style={{
                        color: trade.direction === 'long' ? '#28a745' : '#dc3545',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {trade.direction}
                      </span>
                    </div>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Entrada:</span>{' '}
                      <span style={{fontWeight: 'bold'}}>{formatCurrency(trade.entry_price)}</span>
                    </div>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Stop:</span>{' '}
                      <span style={{fontWeight: 'bold'}}>{formatCurrency(trade.stop_loss)}</span>
                    </div>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Alvo:</span>{' '}
                      <span style={{fontWeight: 'bold'}}>{formatCurrency(trade.target_price)}</span>
                    </div>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Conta:</span>{' '}
                      <span style={{fontWeight: 'bold'}}>{formatCurrency(trade.account_size)}</span>
                    </div>
                    <div>
                      <span style={{color: 'var(--text-placeholder)'}}>Risco:</span>{' '}
                      <span style={{fontWeight: 'bold'}}>{trade.risk_percent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
          <button 
            className="auth-submit-btn"
            onClick={onClose}
            style={{maxWidth: '200px'}}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;