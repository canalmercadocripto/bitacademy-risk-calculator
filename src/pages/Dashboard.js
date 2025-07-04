import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    activeUsers: 0,
    systemHealth: 'Excelente',
    totalVolume: 0,
    avgRiskReward: 0,
    successRate: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const [chartData, setChartData] = useState({
    trades: null,
    users: null,
    volume: null,
    exchanges: null,
    performance: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeNow: 0,
    tradesLast24h: 0,
    volumeLast24h: 0,
    serverUptime: '99.9%'
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Update real-time metrics every 30 seconds
    const interval = setInterval(() => {
      fetchRealTimeMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Get comprehensive analytics data
      const [analyticsResponse, activityResponse] = await Promise.all([
        fetch('/api/analytics?view=overview&period=30d', { headers }).catch(() => ({ json: () => ({ success: false }) })),
        fetch('/api/activity-logs?limit=10', { headers }).catch(() => ({ json: () => ({ success: false }) }))
      ]);
      
      const analyticsData = await analyticsResponse.json();
      const activityData = await activityResponse.json();
      
      if (analyticsData.success) {
        const overview = analyticsData.data.overview || {};
        setStats({
          totalUsers: overview.totalUsers || 42,
          totalTrades: overview.totalTrades || 1847,
          activeUsers: overview.activeUsers || 28,
          systemHealth: 'Excelente',
          totalVolume: overview.totalVolume || 2845000,
          avgRiskReward: overview.avgRiskReward || 2.4,
          successRate: overview.successRate || 68.7,
          totalRevenue: overview.totalRevenue || 15420,
          growthRate: overview.growthRate || 12.3
        });
      } else {
        // Use mock data for demo
        setStats({
          totalUsers: 42,
          totalTrades: 1847,
          activeUsers: 28,
          systemHealth: 'Excelente',
          totalVolume: 2845000,
          avgRiskReward: 2.4,
          successRate: 68.7,
          totalRevenue: 15420,
          growthRate: 12.3
        });
      }
      
      // Generate chart data
      generateMockChartData();
      
      if (activityData.success) {
        setRecentActivity(activityData.data || generateMockActivity());
      } else {
        setRecentActivity(generateMockActivity());
      }
      
      fetchRealTimeMetrics();
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Use mock data on error for demo purposes
      setStats({
        totalUsers: 42,
        totalTrades: 1847,
        activeUsers: 28,
        systemHealth: 'Excelente',
        totalVolume: 2845000,
        avgRiskReward: 2.4,
        successRate: 68.7,
        totalRevenue: 15420,
        growthRate: 12.3
      });
      generateMockChartData();
      setRecentActivity(generateMockActivity());
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRealTimeMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch('/api/analytics/realtime', { headers });
      const data = await response.json();
      
      if (data.success) {
        setRealTimeMetrics(data.data);
      } else {
        // Mock real-time data
        setRealTimeMetrics({
          activeNow: Math.floor(Math.random() * 15) + 5,
          tradesLast24h: Math.floor(Math.random() * 50) + 120,
          volumeLast24h: Math.floor(Math.random() * 100000) + 50000,
          serverUptime: '99.9%'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar métricas em tempo real:', error);
      // Mock real-time data on error
      setRealTimeMetrics({
        activeNow: Math.floor(Math.random() * 15) + 5,
        tradesLast24h: Math.floor(Math.random() * 50) + 120,
        volumeLast24h: Math.floor(Math.random() * 100000) + 50000,
        serverUptime: '99.9%'
      });
    }
  };
  
  const generateMockChartData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    setChartData({
      trades: {
        labels: last30Days,
        datasets: [{
          label: 'Trades por Dia',
          data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 20),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      users: {
        labels: last30Days.slice(-7),
        datasets: [{
          label: 'Novos Usuários',
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 1),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2
        }]
      },
      exchanges: {
        labels: ['Binance', 'Bybit', 'BingX', 'Bitget', 'Manual'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(255, 193, 7, 0.8)',
            'rgba(255, 107, 53, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderWidth: 0
        }]
      },
      performance: {
        labels: ['Risk Management', 'Execution Speed', 'Accuracy', 'User Satisfaction', 'Uptime'],
        datasets: [{
          label: 'Performance Score',
          data: [85, 92, 78, 89, 99],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }]
      }
    });
  };
  
  const generateMockActivity = () => {
    return [
      { id: 1, icon: '👤', action: 'Novo usuário registrado', user: 'João Silva', time: 'há 2 minutos' },
      { id: 2, icon: '💰', action: 'Trade calculado - BTCUSDT', user: 'Maria Santos', time: 'há 5 minutos' },
      { id: 3, icon: '📊', action: 'Relatório exportado', user: 'Admin', time: 'há 10 minutos' },
      { id: 4, icon: '⚙️', action: 'Configuração alterada', user: 'Admin', time: 'há 15 minutos' },
      { id: 5, icon: '🔄', action: 'Sistema atualizado', user: 'Sistema', time: 'há 1 hora' }
    ];
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard premium...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">👑 Dashboard Analytics Pro</h1>
          <p className="dashboard-subtitle">
            Bem-vindo, {user.name}! Métricas avançadas e insights em tempo real do sistema BitAcademy.
          </p>
        </div>
        <div className="header-stats">
          <div className="live-indicator">
            <div className="pulse-dot"></div>
            <span>Sistema Online</span>
          </div>
        </div>
      </header>

      {/* Real-time Metrics Bar */}
      <div className="realtime-bar">
        <div className="realtime-metric">
          <span className="metric-icon">👥</span>
          <div className="metric-data">
            <span className="metric-value">{realTimeMetrics.activeNow}</span>
            <span className="metric-label">Online Agora</span>
          </div>
        </div>
        <div className="realtime-metric">
          <span className="metric-icon">⚡</span>
          <div className="metric-data">
            <span className="metric-value">{realTimeMetrics.tradesLast24h}</span>
            <span className="metric-label">Trades 24h</span>
          </div>
        </div>
        <div className="realtime-metric">
          <span className="metric-icon">💰</span>
          <div className="metric-data">
            <span className="metric-value">${(realTimeMetrics.volumeLast24h / 1000).toFixed(0)}K</span>
            <span className="metric-label">Volume 24h</span>
          </div>
        </div>
        <div className="realtime-metric">
          <span className="metric-icon">🚀</span>
          <div className="metric-data">
            <span className="metric-value">{realTimeMetrics.serverUptime}</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">👥</div>
            <div className="stat-trend positive">+{stats.growthRate}%</div>
          </div>
          <div className="stat-content">
            <h3>Total de Usuários</h3>
            <div className="stat-number">{stats.totalUsers.toLocaleString()}</div>
            <div className="stat-description">Crescimento mensal</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <div className="stat-trend positive">+24%</div>
          </div>
          <div className="stat-content">
            <h3>Total de Trades</h3>
            <div className="stat-number">{stats.totalTrades.toLocaleString()}</div>
            <div className="stat-description">Esta semana</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">📊</div>
            <div className="stat-trend positive">+8%</div>
          </div>
          <div className="stat-content">
            <h3>Volume Total</h3>
            <div className="stat-number">${(stats.totalVolume / 1000000).toFixed(1)}M</div>
            <div className="stat-description">Últimos 30 dias</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon">🎯</div>
            <div className="stat-trend positive">+2.3%</div>
          </div>
          <div className="stat-content">
            <h3>Taxa de Sucesso</h3>
            <div className="stat-number">{stats.successRate}%</div>
            <div className="stat-description">Risk/Reward: {stats.avgRiskReward}:1</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Trades Timeline */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>📈 Atividade de Trades - Últimos 30 dias</h3>
            <div className="chart-controls">
              <span className="chart-period">30 Dias</span>
            </div>
          </div>
          <div className="chart-container">
            {chartData.trades && (
              <Line 
                data={chartData.trades}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Users Growth */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>👥 Novos Usuários</h3>
            <span className="chart-subtitle">Última Semana</span>
          </div>
          <div className="chart-container">
            {chartData.users && (
              <Bar 
                data={chartData.users}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Exchanges Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>🏢 Exchanges Populares</h3>
            <span className="chart-subtitle">Distribuição de Uso</span>
          </div>
          <div className="chart-container">
            {chartData.exchanges && (
              <Doughnut 
                data={chartData.exchanges}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        usePointStyle: true
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Performance Radar */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>⚡ Performance do Sistema</h3>
            <span className="chart-subtitle">Métricas Principais</span>
          </div>
          <div className="chart-container">
            {chartData.performance && (
              <Radar 
                data={chartData.performance}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      pointLabels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                          size: 12
                        }
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        backdropColor: 'transparent'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Activity Feed */}
        <div className="activity-card">
          <div className="activity-header">
            <h3>🔔 Atividade Recente</h3>
            <span className="activity-count">{recentActivity.length} eventos</span>
          </div>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-details">
                    <span className="activity-user">por {activity.user}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-card">
          <div className="actions-header">
            <h3>⚡ Ações Rápidas</h3>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary">
              <span className="action-icon">👥</span>
              <span>Gerenciar Usuários</span>
            </button>
            <button className="action-btn success">
              <span className="action-icon">📊</span>
              <span>Analytics Completo</span>
            </button>
            <button className="action-btn warning">
              <span className="action-icon">⚙️</span>
              <span>Configurações</span>
            </button>
            <button className="action-btn info">
              <span className="action-icon">💾</span>
              <span>Backup Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;