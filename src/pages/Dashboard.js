import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    activeUsers: 0,
    systemHealth: 'Excelente'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simular dados do dashboard admin
      const mockStats = {
        totalUsers: 127,
        totalTrades: 2450,
        activeUsers: 42,
        systemHealth: 'Excelente',
        totalVolume: 'R$ 2.450.000',
        avgRiskReward: 2.3,
        successRate: 68.5
      };
      
      const mockActivity = [
        {
          id: 1,
          type: 'user_registration',
          user: 'João Silva',
          action: 'Novo usuário registrado',
          time: '2 minutos atrás',
          icon: '👤'
        },
        {
          id: 2,
          type: 'trade_created',
          user: 'Maria Santos',
          action: 'Trade BTC/USDT criado',
          time: '5 minutos atrás',
          icon: '💰'
        },
        {
          id: 3,
          type: 'system_update',
          user: 'Sistema',
          action: 'Backup automático realizado',
          time: '1 hora atrás',
          icon: '🔧'
        },
        {
          id: 4,
          type: 'trade_closed',
          user: 'Carlos Lima',
          action: 'Trade ETH/USDT finalizado (+R$ 250)',
          time: '2 horas atrás',
          icon: '✅'
        }
      ];
      
      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👑 Painel Administrativo - BitAcademy</h1>
        <p>Bem-vindo, {user.name}! Aqui está o resumo do sistema.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total de Usuários</h3>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-change positive">+12 este mês</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total de Trades</h3>
            <div className="stat-number">{stats.totalTrades}</div>
            <div className="stat-change positive">+156 esta semana</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Usuários Ativos</h3>
            <div className="stat-number">{stats.activeUsers}</div>
            <div className="stat-change neutral">Últimas 24h</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Taxa de Sucesso</h3>
            <div className="stat-number">{stats.successRate}%</div>
            <div className="stat-change positive">+2.3% vs mês anterior</div>
          </div>
        </div>
      </div>

      {/* Gráficos e Métricas */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>📊 Métricas do Sistema</h2>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Volume Total Negociado:</span>
              <span className="metric-value">{stats.totalVolume}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Risk/Reward Médio:</span>
              <span className="metric-value">{stats.avgRiskReward}:1</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Saúde do Sistema:</span>
              <span className="metric-value status-excellent">{stats.systemHealth}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Uptime:</span>
              <span className="metric-value">99.9%</span>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>🔔 Atividade Recente</h2>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-user">por {activity.user}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Performance (Placeholder) */}
      <div className="dashboard-section full-width">
        <h2>📈 Performance Semanal</h2>
        <div className="chart-placeholder">
          <div className="chart-bars">
            <div className="chart-bar" style={{height: '60%'}}>
              <span className="bar-label">Seg</span>
            </div>
            <div className="chart-bar" style={{height: '80%'}}>
              <span className="bar-label">Ter</span>
            </div>
            <div className="chart-bar" style={{height: '45%'}}>
              <span className="bar-label">Qua</span>
            </div>
            <div className="chart-bar" style={{height: '90%'}}>
              <span className="bar-label">Qui</span>
            </div>
            <div className="chart-bar" style={{height: '75%'}}>
              <span className="bar-label">Sex</span>
            </div>
            <div className="chart-bar" style={{height: '65%'}}>
              <span className="bar-label">Sáb</span>
            </div>
            <div className="chart-bar" style={{height: '55%'}}>
              <span className="bar-label">Dom</span>
            </div>
          </div>
          <div className="chart-legend">
            <span>📊 Trades por dia da semana</span>
          </div>
        </div>
      </div>

      {/* Actions rápidas */}
      <div className="dashboard-section">
        <h2>⚡ Ações Rápidas</h2>
        <div className="quick-actions">
          <button className="quick-action-btn">
            <span className="action-icon">👥</span>
            <span>Gerenciar Usuários</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">📊</span>
            <span>Ver Analytics</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">⚙️</span>
            <span>Configurações</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">💾</span>
            <span>Backup Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;