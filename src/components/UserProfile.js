import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { tradeApi } from '../services/authApi';
import PhoneInput from './PhoneInput';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, token } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    countryCode: user?.countryCode || '+55'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Perfil atualizado com sucesso!');
        setEditMode(false);
        // Atualizar os dados locais
        window.location.reload(); // Recarrega para atualizar o contexto do usuário
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleUpdatePassword = async () => {
    try {
      // Validações
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast.error('Todos os campos de senha são obrigatórios');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Nova senha e confirmação não coincidem');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Senha alterada com sucesso!');
        setPasswordMode(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
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
            <div className="header-actions">
              <button 
                className="edit-btn"
                onClick={() => {
                  setEditMode(!editMode);
                  if (passwordMode) setPasswordMode(false);
                }}
              >
                {editMode ? '❌ Cancelar' : '✏️ Editar'}
              </button>
              <button 
                className="password-btn"
                onClick={() => {
                  setPasswordMode(!passwordMode);
                  if (editMode) setEditMode(false);
                }}
              >
                {passwordMode ? '❌ Cancelar' : '🔐 Alterar Senha'}
              </button>
            </div>
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
              {passwordMode ? (
                <>
                  <div className="input-group">
                    <label>Senha Atual:</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Digite sua senha atual"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Nova Senha:</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      minLength="6"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirmar Nova Senha:</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirme a nova senha"
                      minLength="6"
                      required
                    />
                  </div>
                  <div className="profile-actions">
                    <button className="save-btn" onClick={handleUpdatePassword}>
                      🔐 Alterar Senha
                    </button>
                    <button className="cancel-btn" onClick={() => {
                      setPasswordMode(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}>
                      ❌ Cancelar
                    </button>
                  </div>
                </>
              ) : editMode ? (
                <>
                  <div className="input-group">
                    <label>Nome:</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Sobrenome:</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Telefone:</label>
                    <PhoneInput
                      value={profileData.phone}
                      countryCode={profileData.countryCode}
                      onChange={(phone) => setProfileData({...profileData, phone})}
                      onCountryCodeChange={(countryCode) => setProfileData({...profileData, countryCode})}
                      required
                    />
                  </div>
                  <div className="profile-actions">
                    <button className="save-btn" onClick={handleUpdateProfile}>
                      💾 Salvar Alterações
                    </button>
                    <button className="cancel-btn" onClick={() => {
                      setEditMode(false);
                      setProfileData({
                        name: user?.name || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        countryCode: user?.countryCode || '+55'
                      });
                    }}>
                      ❌ Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-item">
                    <label>Nome:</label>
                    <span>{user.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Sobrenome:</label>
                    <span>{user.lastName}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Telefone:</label>
                    <span>{user.countryCode} {user.phone}</span>
                  </div>
                  <div className="info-item">
                    <label>Tipo de conta:</label>
                    <span className={`user-role ${user.role}`}>
                      {user.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                    </span>
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