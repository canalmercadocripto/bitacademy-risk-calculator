import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import toast from 'react-hot-toast';
import PhoneInput from './PhoneInput';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ activeTab: initialTab = 'overview' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    users: [],
    trades: [],
    stats: {
      totalUsers: 0,
      totalTrades: 0,
      totalVolume: 0,
      topExchanges: [],
      recentActivity: []
    }
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadData = async () => {
    if (!token) {
      toast.error('Token de acesso não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Carregar dados sequencialmente para melhor debug
      console.log('🔄 Carregando dados admin...');
      
      const dashboardRes = await api.get('/admin/dashboard', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log('📊 Dashboard data:', dashboardRes.data);

      const usersRes = await api.get('/admin/users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log('👥 Users data:', usersRes.data);

      const tradesRes = await api.get('/admin/trades', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log('💰 Trades data:', tradesRes.data);

      // Verificar estrutura dos dados
      const dashboardData = dashboardRes.data?.data || dashboardRes.data;
      const usersData = usersRes.data?.data || usersRes.data;
      const tradesData = tradesRes.data?.data || tradesRes.data;

      setData({
        users: usersData?.users || usersData || [],
        trades: tradesData?.trades || tradesData || [],
        stats: {
          summary: dashboardData?.summary || {},
          exchanges: dashboardData?.exchanges || [],
          topSymbols: dashboardData?.topSymbols || [],
          dailyActivity: dashboardData?.dailyActivity || [],
          totalUsers: dashboardData?.summary?.users?.total || 0,
          totalTrades: dashboardData?.summary?.trades?.total || 0,
          totalVolume: dashboardData?.summary?.trades?.total_volume || 0,
          recentActivity: dashboardData?.dailyActivity || []
        }
      });

      console.log('✅ Dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados admin:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Erro ao carregar dados: ${error.response?.data?.message || error.message}`);
      
      // Set empty data on error
      setData({
        users: [],
        trades: [],
        stats: {
          summary: { users: { total: 0 }, trades: { total: 0, total_volume: 0 } },
          exchanges: [],
          topSymbols: [],
          dailyActivity: [],
          totalUsers: 0,
          totalTrades: 0,
          totalVolume: 0,
          recentActivity: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const calculateExchangeStats = () => {
    const exchangeCount = {};
    const exchangeVolume = {};
    
    data.trades.forEach(trade => {
      const exchange = trade.exchange || 'manual';
      exchangeCount[exchange] = (exchangeCount[exchange] || 0) + 1;
      exchangeVolume[exchange] = (exchangeVolume[exchange] || 0) + (trade.account_size || 0);
    });

    return Object.entries(exchangeCount)
      .map(([exchange, count]) => ({
        exchange,
        count,
        volume: exchangeVolume[exchange] || 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getUserStats = () => {
    const userTrades = {};
    
    data.trades.forEach(trade => {
      const userId = trade.user_id;
      if (!userTrades[userId]) {
        userTrades[userId] = {
          count: 0,
          volume: 0,
          exchanges: new Set()
        };
      }
      userTrades[userId].count++;
      userTrades[userId].volume += trade.account_size || 0;
      userTrades[userId].exchanges.add(trade.exchange || 'manual');
    });

    return data.users.map(user => ({
      ...user,
      tradeCount: userTrades[user.id]?.count || 0,
      totalVolume: userTrades[user.id]?.volume || 0,
      exchangesUsed: userTrades[user.id]?.exchanges.size || 0
    }));
  };

  const Header = () => (
    <div className="admin-header">
      <h1>👑 Painel Administrativo - BitAcademy</h1>
      <div className="admin-header-actions">
        <div className="admin-user-info">
          Olá, {user?.name}
        </div>
        <button 
          onClick={logout}
          className="admin-logout-btn"
        >
          Sair
        </button>
        <div className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-text">
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </span>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, icon, label, isActive }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`admin-tab-button ${isActive ? 'active' : 'inactive'}`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  const StatCard = ({ icon, title, value, subtitle, color = '#667eea' }) => (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-value">
        {value}
      </div>
      <div className="admin-stat-title">
        {title}
      </div>
      {subtitle && (
        <div className="admin-stat-subtitle">
          {subtitle}
        </div>
      )}
    </div>
  );

  const OverviewTab = () => {
    const exchangeStats = calculateExchangeStats();
    const totalVolume = data.trades.reduce((sum, trade) => sum + (trade.account_size || 0), 0);

    return (
      <div>
        {/* Cards de Estatísticas */}
        <div className="admin-stats-grid">
          <StatCard
            icon="👥"
            title="Usuários Totais"
            value={data.users.length}
            subtitle="Usuários ativos"
            color="#28a745"
          />
          <StatCard
            icon="📊"
            title="Trades Realizados"
            value={data.trades.length}
            subtitle="Cálculos salvos"
            color="#007bff"
          />
          <StatCard
            icon="💰"
            title="Volume Total"
            value={formatCurrency(totalVolume)}
            subtitle="Capital sob gestão"
            color="#ffc107"
          />
          <StatCard
            icon="🏢"
            title="Exchanges Usadas"
            value={exchangeStats.length}
            subtitle="Corretoras ativas"
            color="#17a2b8"
          />
        </div>

        {/* Top Exchanges */}
        <div className="admin-section">
          <h3 className="admin-section-title">
            📈 Exchanges Mais Utilizadas
          </h3>
          <div className="admin-exchanges-grid">
            {exchangeStats.slice(0, 4).map((stat, index) => (
              <div key={stat.exchange} className="admin-exchange-card">
                <div className="admin-exchange-header">
                  <span className="admin-exchange-name">
                    {stat.exchange}
                  </span>
                  <span className="admin-exchange-rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏢'}
                  </span>
                </div>
                <div className="admin-exchange-stats">
                  <div>{stat.count} trades</div>
                  <div>{formatCurrency(stat.volume)} volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const UsersTab = () => {
    const userStats = getUserStats();
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', countryCode: '+55', role: 'user' });

    const handleToggleUserStatus = async (userId, currentStatus) => {
      try {
        await api.patch(`/admin/users/${userId}/status`, 
          { is_active: !currentStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Status do usuário atualizado!');
        loadData();
      } catch (error) {
        console.error('Erro ao alterar status:', error);
        toast.error('Erro ao alterar status do usuário');
      }
    };

    const handleAddUser = async () => {
      try {
        await api.post('/admin/users', newUser, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Usuário adicionado com sucesso!');
        setShowAddUser(false);
        setNewUser({ name: '', email: '', password: '', phone: '', countryCode: '+55', role: 'user' });
        loadData();
      } catch (error) {
        console.error('Erro ao adicionar usuário:', error);
        toast.error('Erro ao adicionar usuário');
      }
    };

    const handleEditUser = async () => {
      try {
        await api.patch(`/admin/users/${editingUser.id}`, editingUser, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Usuário atualizado com sucesso!');
        setEditingUser(null);
        loadData();
      } catch (error) {
        console.error('Erro ao editar usuário:', error);
        toast.error('Erro ao editar usuário');
      }
    };

    const handleDeleteUser = async (userId, userName) => {
      if (window.confirm(`Tem certeza que deseja remover o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
        try {
          await api.delete(`/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Usuário removido com sucesso!');
          loadData();
        } catch (error) {
          console.error('Erro ao remover usuário:', error);
          toast.error('Erro ao remover usuário');
        }
      }
    };

    const getUserExchanges = (userId) => {
      const userTrades = data.trades.filter(trade => trade.user_id === userId);
      const exchanges = [...new Set(userTrades.map(trade => trade.exchange || 'manual'))];
      return exchanges;
    };

    return (
      <div className="admin-section">
        <div className="admin-users-header">
          <h3 className="admin-section-title">
            👥 Gestão de Usuários
          </h3>
          <button 
            onClick={() => setShowAddUser(true)}
            className="admin-add-user-btn"
          >
            ➕ Adicionar Usuário
          </button>
        </div>

        {/* Modal Adicionar Usuário */}
        {showAddUser && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h4>➕ Adicionar Novo Usuário</h4>
                <button onClick={() => setShowAddUser(false)} className="admin-modal-close">❌</button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nome:</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Email:</label>
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Telefone: *</label>
                  <PhoneInput
                    value={newUser.phone}
                    countryCode={newUser.countryCode}
                    onChange={(phone) => setNewUser({...newUser, phone})}
                    onCountryCodeChange={(countryCode) => setNewUser({...newUser, countryCode})}
                    placeholder="Digite o telefone"
                    required={true}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Senha:</label>
                  <input 
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Senha forte"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Perfil:</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">👤 Usuário</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button onClick={() => setShowAddUser(false)} className="admin-btn-cancel">Cancelar</button>
                <button onClick={handleAddUser} className="admin-btn-confirm">Criar Usuário</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário */}
        {editingUser && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h4>✏️ Editar Usuário</h4>
                <button onClick={() => setEditingUser(null)} className="admin-modal-close">❌</button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nome:</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Email:</label>
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Telefone: *</label>
                  <PhoneInput
                    value={editingUser.phone || ''}
                    countryCode={editingUser.country_code || '+55'}
                    onChange={(phone) => setEditingUser({...editingUser, phone})}
                    onCountryCodeChange={(country_code) => setEditingUser({...editingUser, country_code})}
                    placeholder="Digite o telefone"
                    required={true}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Perfil:</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  >
                    <option value="user">👤 Usuário</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button onClick={() => setEditingUser(null)} className="admin-btn-cancel">Cancelar</button>
                <button onClick={handleEditUser} className="admin-btn-confirm">Salvar Alterações</button>
              </div>
            </div>
          </div>
        )}
        
        <div className="admin-users-grid">
          {userStats.map((user, index) => {
            const exchanges = getUserExchanges(user.id);
            return (
              <div key={user.id} className="admin-user-card">
                <div className="admin-user-card-header">
                  <div className="admin-user-avatar">
                    {user.role === 'admin' ? '👑' : '👤'}
                  </div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">{user.name}</div>
                    <div className="admin-user-email">{user.email}</div>
                    <div className="admin-user-phone">
                      📱 {user.country_code || '+55'} {user.phone || 'Não informado'}
                    </div>
                    <div className={`admin-user-role ${user.role}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                    </div>
                  </div>
                  <div className="admin-user-actions">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="admin-action-btn edit"
                      title="Editar usuário"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      className={`admin-action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                      title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                    >
                      {user.is_active ? '🔴' : '🟢'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="admin-action-btn delete"
                      title="Remover usuário"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="admin-user-stats">
                  <div className="admin-user-stat">
                    <div className="admin-stat-icon">📊</div>
                    <div className="admin-stat-info">
                      <div className="admin-stat-value">{user.tradeCount}</div>
                      <div className="admin-stat-label">Trades</div>
                    </div>
                  </div>
                  
                  <div className="admin-user-stat">
                    <div className="admin-stat-icon">💰</div>
                    <div className="admin-stat-info">
                      <div className="admin-stat-value">{formatCurrency(user.totalVolume)}</div>
                      <div className="admin-stat-label">Volume</div>
                    </div>
                  </div>
                  
                  <div className="admin-user-stat">
                    <div className="admin-stat-icon">🏢</div>
                    <div className="admin-stat-info">
                      <div className="admin-stat-value">{user.exchangesUsed}</div>
                      <div className="admin-stat-label">Exchanges</div>
                    </div>
                  </div>
                  
                  <div className="admin-user-stat">
                    <div className="admin-stat-icon">📅</div>
                    <div className="admin-stat-info">
                      <div className="admin-stat-value">
                        {user.last_login ? formatDate(user.last_login).split(' ')[0] : 'Nunca'}
                      </div>
                      <div className="admin-stat-label">Último Login</div>
                    </div>
                  </div>
                </div>

                <div className="admin-user-exchanges">
                  <div className="admin-exchanges-title">🏢 Corretoras Utilizadas:</div>
                  <div className="admin-exchanges-list">
                    {exchanges.length > 0 ? (
                      exchanges.map((exchange, idx) => (
                        <span key={idx} className="admin-exchange-tag">
                          {exchange.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="admin-no-exchanges">Nenhuma corretora utilizada</span>
                    )}
                  </div>
                </div>

                <div className="admin-user-status">
                  <span className={`admin-status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '✅ Ativo' : '❌ Inativo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TradesTab = () => (
    <div className="admin-section">
      <h3 className="admin-section-title">
        📊 Histórico de Trades
      </h3>
      
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        {data.trades.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📭</div>
            <div>Nenhum trade encontrado</div>
          </div>
        ) : (
          data.trades.map((trade, index) => (
            <div key={trade.id} className={`admin-trade-item ${trade.direction}`}>
              {/* Header do Trade */}
              <div className="admin-trade-header">
                <div className="admin-trade-symbol">
                  <div className="admin-trade-pair">{trade.symbol}</div>
                  <div className="admin-trade-exchange">{(trade.exchange || 'manual').toUpperCase()}</div>
                </div>
                <div className={`admin-trade-direction ${trade.direction}`}>
                  {trade.direction === 'long' ? '📈 LONG' : '📉 SHORT'}
                </div>
              </div>

              {/* Body do Trade */}
              <div className="admin-trade-body">
                <div className="admin-trade-grid">
                  {/* Seção de Informações Gerais */}
                  <div className="admin-trade-section">
                    <div className="admin-trade-section-title">👤 Informações Gerais</div>
                    
                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Usuário</span>
                      <span className="admin-trade-value">
                        <div className="user-info-mini">
                          <div className="user-name">{trade.user_name || data.users.find(u => u.id === trade.user_id)?.name || 'N/A'}</div>
                          <div className="user-email">{trade.user_email || data.users.find(u => u.id === trade.user_id)?.email || ''}</div>
                        </div>
                      </span>
                    </div>

                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Conta</span>
                      <span className="admin-trade-value account-size">
                        {formatCurrency(trade.account_size)}
                      </span>
                    </div>

                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Data</span>
                      <span className="admin-trade-value date-info">
                        {formatDate(trade.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Seção de Preços e Take Profits */}
                  <div className="admin-trade-section">
                    <div className="admin-trade-section-title">💰 Preços & Take Profits</div>
                    
                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Preços Principais</span>
                      <span className="admin-trade-value">
                        <div className="price-stack">
                          <div className="entry-price">Entrada: {formatCurrency(trade.entry_price)}</div>
                          <div className="stop-loss">SL: {formatCurrency(trade.stop_loss)}</div>
                        </div>
                      </span>
                    </div>

                    {(() => {
                      try {
                        const calcData = trade.calculation_data ? JSON.parse(trade.calculation_data) : {};
                        const takeProfits = calcData.takeProfits || [];
                        return takeProfits.length > 0 && (
                          <div className="admin-trade-field">
                            <span className="admin-trade-label">Take Profits Parciais</span>
                            <span className="admin-trade-value">
                              <div className="take-profits">
                                {takeProfits.map((tp, idx) => (
                                  <div key={idx} className="tp-item">
                                    <div className="tp-price">
                                      TP{tp.level || idx + 1}: {formatCurrency(tp.price)}
                                    </div>
                                    <div className="tp-details">
                                      <span className="tp-percentage">{tp.percentage}%</span>
                                      <span className="tp-profit">{formatCurrency(tp.profit || 0)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </span>
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                </div>

                <div className="admin-trade-grid">
                  {/* Seção de Risk Management */}
                  <div className="admin-trade-section">
                    <div className="admin-trade-section-title">📊 Risk Management</div>
                    
                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Risk/Reward</span>
                      <span className="admin-trade-value rr-info">
                        <div className="rr-stack">
                          <div className="risk-percent">Risco: {trade.risk_percent || 0}%</div>
                          <div className="rr-ratio">R/R: {trade.risk_reward_ratio ? `1:${parseFloat(trade.risk_reward_ratio).toFixed(2)}` : 'N/A'}</div>
                        </div>
                      </span>
                    </div>

                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Posição</span>
                      <span className="admin-trade-value position-info">
                        <div className="position-stack">
                          <div className="position-size">Tamanho: {formatCurrency(trade.position_size || 0)}</div>
                          <div className="risk-amount">Risco: {formatCurrency(trade.risk_amount || 0)}</div>
                        </div>
                      </span>
                    </div>
                  </div>

                  {/* Seção de Resultados */}
                  <div className="admin-trade-section">
                    <div className="admin-trade-section-title">💎 Resultados</div>
                    
                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Potencial Lucro</span>
                      <span className="admin-trade-value reward-info">
                        <div className="reward-stack">
                          <div className="reward-amount">Reward: {formatCurrency(trade.reward_amount || 0)}</div>
                        </div>
                      </span>
                    </div>

                    <div className="admin-trade-field">
                      <span className="admin-trade-label">Sessão</span>
                      <span className="admin-trade-value session-info">
                        <div className="session-stack">
                          <div className="ip-address">IP: {trade.ip_address || 'N/A'}</div>
                          <div className="session-id">ID: {trade.session_id ? trade.session_id.substring(0, 8) + '...' : 'N/A'}</div>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const SettingsTab = () => {
    const [backupLoading, setBackupLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const handleDatabaseBackup = async () => {
      try {
        setBackupLoading(true);
        
        const response = await api.get('/admin/backup/database', {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        // Criar link para download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Extrair nome do arquivo do header Content-Disposition
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'backup-database.db';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Backup do banco de dados baixado com sucesso!');
        
      } catch (error) {
        console.error('Erro ao fazer backup:', error);
        toast.error('Erro ao fazer backup do banco de dados');
      } finally {
        setBackupLoading(false);
      }
    };

    const handleExportUsers = async (format) => {
      try {
        setExportLoading(true);
        
        const response = await api.get(`/admin/export/users?format=${format}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'csv' ? 'blob' : 'json'
        });
        
        if (format === 'csv') {
          // Download CSV
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `usuarios-export-${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } else {
          // Download JSON
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `usuarios-export-${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }
        
        toast.success(`Usuários exportados em ${format.toUpperCase()} com sucesso!`);
        
      } catch (error) {
        console.error('Erro ao exportar usuários:', error);
        toast.error('Erro ao exportar usuários');
      } finally {
        setExportLoading(false);
      }
    };

    const handleExportTrades = async (format) => {
      try {
        setExportLoading(true);
        
        const response = await api.get(`/admin/export/trades?format=${format}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'csv' ? 'blob' : 'json'
        });
        
        if (format === 'csv') {
          // Download CSV
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `trades-export-${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } else {
          // Download JSON
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `trades-export-${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }
        
        toast.success(`Trades exportados em ${format.toUpperCase()} com sucesso!`);
        
      } catch (error) {
        console.error('Erro ao exportar trades:', error);
        toast.error('Erro ao exportar trades');
      } finally {
        setExportLoading(false);
      }
    };

    return (
      <div className="admin-section">
        <h3 className="admin-section-title">
          ⚙️ Configurações do Sistema
        </h3>

        {/* Seção de Backup */}
        <div className="admin-settings-section">
          <div className="admin-settings-header">
            <h4>🔒 Backup e Segurança</h4>
            <p>Faça backup do banco de dados para garantir a segurança dos dados</p>
          </div>
          
          <div className="admin-settings-actions">
            <button 
              onClick={handleDatabaseBackup}
              disabled={backupLoading}
              className="admin-backup-btn"
            >
              {backupLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Gerando Backup...
                </>
              ) : (
                <>
                  💾 Baixar Backup do Banco
                </>
              )}
            </button>
            
            <div className="admin-backup-info">
              <small>
                ⚠️ O backup inclui todos os dados: usuários, trades e configurações.
                Mantenha o arquivo em local seguro.
              </small>
            </div>
          </div>
        </div>

        {/* Seção de Exportação */}
        <div className="admin-settings-section">
          <div className="admin-settings-header">
            <h4>📊 Exportação de Dados</h4>
            <p>Exporte dados em formatos CSV ou JSON para análise externa</p>
          </div>

          {/* Export Usuários */}
          <div className="admin-export-group">
            <h5>👥 Exportar Usuários</h5>
            <div className="admin-export-buttons">
              <button 
                onClick={() => handleExportUsers('csv')}
                disabled={exportLoading}
                className="admin-export-btn csv"
              >
                📋 CSV
              </button>
              <button 
                onClick={() => handleExportUsers('json')}
                disabled={exportLoading}
                className="admin-export-btn json"
              >
                📄 JSON
              </button>
            </div>
            <small>Inclui dados pessoais, estatísticas e informações de contato</small>
          </div>

          {/* Export Trades */}
          <div className="admin-export-group">
            <h5>💼 Exportar Trades</h5>
            <div className="admin-export-buttons">
              <button 
                onClick={() => handleExportTrades('csv')}
                disabled={exportLoading}
                className="admin-export-btn csv"
              >
                📋 CSV
              </button>
              <button 
                onClick={() => handleExportTrades('json')}
                disabled={exportLoading}
                className="admin-export-btn json"
              >
                📄 JSON
              </button>
            </div>
            <small>Inclui histórico completo de operações e cálculos</small>
          </div>
        </div>

        {/* Seção de Informações do Sistema */}
        <div className="admin-settings-section">
          <div className="admin-settings-header">
            <h4>📋 Informações do Sistema</h4>
          </div>
          
          <div className="admin-system-info">
            <div className="admin-info-item">
              <span className="admin-info-label">🗄️ Banco de Dados:</span>
              <span className="admin-info-value">SQLite (Desenvolvimento)</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">👥 Total de Usuários:</span>
              <span className="admin-info-value">{data.users.length}</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">💼 Total de Trades:</span>
              <span className="admin-info-value">{data.trades.length}</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">📅 Último Backup:</span>
              <span className="admin-info-value">Manual</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <Header />
      
      <div className="admin-content-wrapper">
        {/* Tabs Navigation */}
        <div className="admin-tabs">
          <TabButton
            id="overview"
            icon="📊"
            label="Visão Geral"
            isActive={activeTab === 'overview'}
          />
          <TabButton
            id="users"
            icon="👥"
            label="Usuários"
            isActive={activeTab === 'users'}
          />
          <TabButton
            id="trades"
            icon="💼"
            label="Trades"
            isActive={activeTab === 'trades'}
          />
          <TabButton
            id="settings"
            icon="⚙️"
            label="Configurações"
            isActive={activeTab === 'settings'}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <div>Carregando dados...</div>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'trades' && <TradesTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;