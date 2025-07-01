import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { tradeApi } from '../services/authApi';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, token } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas do usuário
      const statsResponse = await tradeApi.getUserStats(token);
      setUserStats(statsResponse.data);

      // Carregar atividade recente
      const historyResponse = await tradeApi.getTradeHistory(token, 1, 5);
      setRecentActivity(historyResponse.data.trades || []);

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Aqui você implementaria a API para atualizar perfil
      toast.success('Perfil atualizado com sucesso!');
      setEditMode(false);
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>👤 Meu Perfil</h2>
        <p>Gerencie suas informações pessoais e veja suas estatísticas</p>
      </div>

      <div className="profile-content">
        {/* Informações Pessoais */}
        <div className="profile-card">
          <div className="card-header">
            <h3>📝 Informações Pessoais</h3>
            <button 
              className="edit-btn"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? '❌ Cancelar' : '✏️ Editar'}
            </button>
          </div>

          <div className="profile-info">
            <div className="avatar-section">
              <div className="user-avatar-profile">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-badge">
                {user.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
              </div>
            </div>

            <div className="info-fields">
              {editMode ? (
                <>
                  <div className="input-group">
                    <label>Nome:</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>
                  <button className="save-btn" onClick={handleUpdateProfile}>
                    💾 Salvar Alterações
                  </button>
                </>
              ) : (
                <>
                  <div className="info-item">
                    <label>Nome:</label>
                    <span>{user.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Membro desde:</label>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Último acesso:</label>
                    <span>{user.last_login ? formatDate(user.last_login) : 'Primeiro acesso'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {userStats && (
          <div className="profile-card">
            <div className="card-header">
              <h3>📊 Suas Estatísticas</h3>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🧮</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.total_trades || 0}</div>
                  <div className="stat-label">Total de Cálculos</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(userStats.total_volume || 0)}</div>
                  <div className="stat-label">Volume Total</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.avg_risk?.toFixed(2) || 0}%</div>
                  <div className="stat-label">Risco Médio</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.favorite_exchange || 'N/A'}</div>
                  <div className="stat-label">Exchange Favorita</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.symbols_traded || 0}</div>
                  <div className="stat-label">Símbolos Diferentes</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.avg_risk_reward?.toFixed(2) || 0}</div>
                  <div className="stat-label">R/R Médio</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.trades_this_month || 0}</div>
                  <div className="stat-label">Trades este Mês</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.trades_last_7_days || 0}</div>
                  <div className="stat-label">Últimos 7 Dias</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas por Exchange */}
        {userStats.exchanges && userStats.exchanges.length > 0 && (
          <div className="profile-card">
            <div className="card-header">
              <h3>🏢 Performance por Exchange</h3>
            </div>

            <div className="exchange-stats-list">
              {userStats.exchanges.map((exchange, index) => (
                <div key={index} className="exchange-stat-item">
                  <div className="exchange-stat-header">
                    <span className="exchange-stat-name">{exchange.exchange}</span>
                    <span className="exchange-stat-count">{exchange.trade_count} trades</span>
                  </div>
                  <div className="exchange-stat-details">
                    <span>Risco médio: {exchange.avg_risk?.toFixed(2)}%</span>
                    <span>Volume: {formatCurrency(exchange.total_volume)}</span>
                    <span>Último trade: {new Date(exchange.last_trade).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atividade Mensal */}
        {userStats.monthly && userStats.monthly.length > 0 && (
          <div className="profile-card">
            <div className="card-header">
              <h3>📅 Atividade Mensal</h3>
            </div>

            <div className="monthly-stats-grid">
              {userStats.monthly.slice(0, 6).map((month, index) => (
                <div key={index} className="monthly-stat-item">
                  <div className="monthly-stat-month">{month.month}</div>
                  <div className="monthly-stat-data">
                    <div>{month.trades} trades</div>
                    <div>{month.avg_risk?.toFixed(1)}% risco médio</div>
                    <div>{formatCurrency(month.volume)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atividade Recente */}
        <div className="profile-card">
          <div className="card-header">
            <h3>🕒 Atividade Recente</h3>
          </div>

          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((trade, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {trade.direction === 'long' ? '📈' : '📉'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-symbol">{trade.symbol}</span>
                      <span className="activity-exchange">{trade.exchange}</span>
                      <span className={`activity-direction ${trade.direction}`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="activity-details">
                      <span>Entrada: {formatCurrency(trade.entry_price)}</span>
                      <span>Risco: {trade.risk_percent}%</span>
                      <span>{formatDate(trade.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <div className="no-activity-icon">📭</div>
                <p>Nenhuma atividade recente</p>
                <p>Comece fazendo alguns cálculos!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;