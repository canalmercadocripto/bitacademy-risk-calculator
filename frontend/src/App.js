import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import RiskCalculator from './components/RiskCalculator';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import TradeHistory from './components/TradeHistory';
import UserTradeHistory from './components/UserTradeHistory';
import Analytics from './components/Analytics';
import Sidebar from './components/Sidebar';
import './styles/App.css';
import './styles/EnhancedResults.css';
import './styles/TradeMonitor.css';
import './styles/Sidebar.css';
import './styles/UserProfile.css';
import './styles/Analytics.css';
import './styles/UserTradeHistory.css';
import './styles/AdminDashboard.css';

const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('calculator');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

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
        return <UserTradeHistory />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminDashboard activeTab="users" />;
      case 'trades':
        return <AdminDashboard activeTab="trades" />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <AdminDashboard activeTab="settings" />;
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
          onViewChange={setCurrentView}
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