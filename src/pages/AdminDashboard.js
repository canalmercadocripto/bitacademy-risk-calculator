import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/AdminPages.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 0,
      totalTrades: 0,
      totalVolume: 0,
      avgRiskReward: 0,
      activeUsers: 0,
      activeTrades: 0
    },
    recentTrades: [],
    topUsers: [],
    exchangeDistribution: {},
    monthlyStats: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Carregar dados de trades
      const tradesResponse = await fetch('/api/admin-trades?action=list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tradesData = await tradesResponse.json();
      
      // Carregar dados de usuários
      const usersResponse = await fetch('/api/users?action=list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      
      if (tradesData.success && usersData.success) {
        const trades = tradesData.data;
        const users = usersData.data;
        
        // Calcular estatísticas
        const overview = {
          totalUsers: users.length,
          totalTrades: trades.length,
          totalVolume: trades.reduce((sum, trade) => sum + (trade.accountSize || 0), 0),
          avgRiskReward: trades.length > 0 ? 
            trades.reduce((sum, trade) => sum + (trade.riskRewardRatio || 0), 0) / trades.length : 0,
          activeUsers: users.filter(u => u.isActive).length,
          activeTrades: trades.filter(t => t.status === 'active').length
        };
        
        // Trades recentes (últimos 10)
        const recentTrades = trades
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        
        // Top usuários por volume
        const userVolume = {};
        trades.forEach(trade => {
          const userId = trade.userId;
          if (!userVolume[userId]) {
            userVolume[userId] = {
              userId,
              userName: trade.userName,
              userEmail: trade.userEmail,
              totalVolume: 0,
              totalTrades: 0
            };
          }
          userVolume[userId].totalVolume += trade.accountSize || 0;
          userVolume[userId].totalTrades += 1;
        });
        
        const topUsers = Object.values(userVolume)
          .sort((a, b) => b.totalVolume - a.totalVolume)
          .slice(0, 5);
        
        // Distribuição por exchange
        const exchangeDistribution = {};
        trades.forEach(trade => {
          const exchange = trade.exchange;
          if (!exchangeDistribution[exchange]) {
            exchangeDistribution[exchange] = 0;
          }
          exchangeDistribution[exchange]++;
        });
        
        // Estatísticas mensais (últimos 6 meses)
        const monthlyStats = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const monthTrades = trades.filter(trade => {
            const tradeDate = new Date(trade.createdAt);
            const tradeMonthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
            return tradeMonthKey === monthKey;
          });
          
          monthlyStats.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            trades: monthTrades.length,
            volume: monthTrades.reduce((sum, trade) => sum + (trade.accountSize || 0), 0)
          });
        }
        
        setDashboardData({
          overview,
          recentTrades,
          topUsers,
          exchangeDistribution,
          monthlyStats
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>📊 Dashboard Admin</h1>
        <p>Visão geral do sistema BitAcademy</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total de Usuários</h3>
            <div className="stat-number">{formatNumber(dashboardData.overview.totalUsers)}</div>
            <div className="stat-detail">
              {formatNumber(dashboardData.overview.activeUsers)} ativos
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total de Trades</h3>
            <div className="stat-number">{formatNumber(dashboardData.overview.totalTrades)}</div>
            <div className="stat-detail">
              {formatNumber(dashboardData.overview.activeTrades)} ativos
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Volume Total</h3>
            <div className="stat-number">{formatCurrency(dashboardData.overview.totalVolume)}</div>
            <div className="stat-detail">
              Média: {formatCurrency(dashboardData.overview.totalVolume / Math.max(dashboardData.overview.totalTrades, 1))}
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <h3>R/R Médio</h3>
            <div className="stat-number">{dashboardData.overview.avgRiskReward.toFixed(2)}</div>
            <div className="stat-detail">Risk/Reward Ratio</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Trades Recentes */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🔄 Trades Recentes</h3>
          </div>
          <div className="card-content">
            {dashboardData.recentTrades.length > 0 ? (
              <div className="recent-trades-list">
                {dashboardData.recentTrades.map(trade => (
                  <div key={trade.id} className="recent-trade-item">
                    <div className="trade-user">
                      <strong>{trade.userName}</strong>
                      <span>{trade.userEmail}</span>
                    </div>
                    <div className="trade-details">
                      <span className="trade-symbol">{trade.symbol}</span>
                      <span className="trade-exchange">{trade.exchange}</span>
                    </div>
                    <div className="trade-amount">
                      {formatCurrency(trade.accountSize)}
                    </div>
                    <div className="trade-date">
                      {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhum trade encontrado</p>
            )}
          </div>
        </div>

        {/* Top Usuários */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🏆 Top Usuários por Volume</h3>
          </div>
          <div className="card-content">
            {dashboardData.topUsers.length > 0 ? (
              <div className="top-users-list">
                {dashboardData.topUsers.map((user, index) => (
                  <div key={user.userId} className="top-user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <strong>{user.userName}</strong>
                      <span>{user.userEmail}</span>
                    </div>
                    <div className="user-stats">
                      <div>{formatCurrency(user.totalVolume)}</div>
                      <div>{user.totalTrades} trades</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhum usuário encontrado</p>
            )}
          </div>
        </div>

        {/* Distribuição por Exchange */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🏢 Distribuição por Exchange</h3>
          </div>
          <div className="card-content">
            {Object.keys(dashboardData.exchangeDistribution).length > 0 ? (
              <div className="exchange-distribution">
                {Object.entries(dashboardData.exchangeDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([exchange, count]) => {
                    const percentage = (count / dashboardData.overview.totalTrades * 100).toFixed(1);
                    return (
                      <div key={exchange} className="exchange-item">
                        <div className="exchange-name">{exchange}</div>
                        <div className="exchange-bar">
                          <div 
                            className="exchange-progress" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="exchange-stats">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p>Nenhuma exchange encontrada</p>
            )}
          </div>
        </div>

        {/* Estatísticas Mensais */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>📊 Evolução Mensal</h3>
          </div>
          <div className="card-content">
            <div className="monthly-stats">
              {dashboardData.monthlyStats.map(month => (
                <div key={month.month} className="month-item">
                  <div className="month-name">{month.month}</div>
                  <div className="month-trades">{month.trades} trades</div>
                  <div className="month-volume">{formatCurrency(month.volume)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;