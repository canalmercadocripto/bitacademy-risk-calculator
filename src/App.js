import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import RiskCalculator from './components/RiskCalculator';
import LoginPage from './components/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AdminTrades from './pages/AdminTrades';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import MarketOverview from './pages/MarketOverview';
import EconomicCalendar from './pages/EconomicCalendar';
import Sidebar from './components/Sidebar';
import './styles/App.css';
import './styles/EnhancedResults.css';
import './styles/TradeMonitor.css';
import './styles/Sidebar.css';
import './styles/Dashboard.css';
import './styles/AdminPages.css';
import './styles/Settings.css';
import './styles/Analytics.css';
import './styles/AnalyticsExtended.css';
import './styles/AdminDashboard.css';
import './styles/MarketOverview.css';

const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState(() => {
    // Recuperar última view do localStorage ou usar 'calculator' como padrão
    return localStorage.getItem('currentView') || 'calculator';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Recuperar estado do sidebar do localStorage
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
  };

  // Limpar localStorage quando usuário faz logout
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem('currentView');
      localStorage.removeItem('sidebarCollapsed');
    }
  }, [isAuthenticated]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '4rem' }}>⏳</div>
          <div style={{ 
            color: 'var(--text-secondary)',
            fontSize: '1.2rem'
          }}>
            Verificando acesso...
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Renderizar conteúdo baseado na view atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'calculator':
        return <RiskCalculator />;
      case 'history':
        return <History />;
      case 'market-overview':
        return <MarketOverview />;
      case 'economic-calendar':
        return <EconomicCalendar />;
      case 'profile':
        return <Profile />;
      case 'dashboard':
        return <Dashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'users':
        return <Users />;
      case 'trades':
        return <AdminTrades />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <RiskCalculator />;
    }
  };

  return (
    <div className="App">
      <div className="app-layout">
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {renderCurrentView()}
        </main>
        
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          onToggleTheme={toggleTheme}
          theme={theme}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}

export default App;