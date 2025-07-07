import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ currentView, onViewChange, onToggleTheme, theme, onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    // Itens para todos os usuários
    {
      id: 'calculator',
      label: 'Calculadora',
      icon: '🧮',
      description: 'Risk Management'
    },
    {
      id: 'history',
      label: 'Meu Histórico',
      icon: '📊',
      description: 'Trades e Cálculos'
    },
    {
      id: 'profile',
      label: 'Meu Perfil',
      icon: '👤',
      description: 'Configurações Pessoais'
    },
    // Itens apenas para admin
    ...(user?.role === 'admin' ? [
      {
        id: 'divider',
        type: 'divider',
        label: 'Administração'
      },
      {
        id: 'admin-dashboard',
        label: 'Dashboard Admin',
        icon: '📊',
        description: 'Visão Geral do Sistema'
      },
      {
        id: 'users',
        label: '👥 Gestão de Usuários',
        icon: '👥',
        description: 'Gerenciar Usuários'
      },
      {
        id: 'trades',
        label: '💰 Histórico de Trades',
        icon: '💰',
        description: 'Todos os Trades'
      },
      {
        id: 'analytics',
        label: '📈 Analytics Avançado',
        icon: '📈',
        description: 'Relatórios e Métricas'
      }
    ] : [])
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header do Sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? '▶️' : '◀️'}
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand">
            <span className="brand-icon">🚀</span>
            <span className="brand-text">BitAcademy</span>
          </div>
        )}
      </div>

      {/* Perfil do Usuário */}
      <div className="sidebar-user">
        <div className="user-avatar-section">
          <div className="user-avatar-large">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
              </div>
              <div className="user-email">{user.email}</div>
            </div>
          )}
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (item.type === 'divider') {
            return (
              <div key={item.id} className="nav-divider">
                {!isCollapsed && <span className="divider-label">{item.label}</span>}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && (
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer do Sidebar */}
      <div className="sidebar-footer">
        <button
          className="nav-item theme-toggle-sidebar"
          onClick={onToggleTheme}
          title={isCollapsed ? 'Alternar Tema' : ''}
        >
          <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {!isCollapsed && (
            <div className="nav-content">
              <span className="nav-label">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            </div>
          )}
        </button>

        <button
          className="nav-item logout-btn"
          onClick={handleLogout}
          title={isCollapsed ? 'Sair' : ''}
        >
          <span className="nav-icon">🚪</span>
          {!isCollapsed && (
            <div className="nav-content">
              <span className="nav-label">Sair</span>
              <span className="nav-description">Fazer Logout</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;