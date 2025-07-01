import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const UserMenu = ({ onShowHistory, onShowAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="user-menu">
        <button 
          className="auth-btn login-btn"
          onClick={() => onShowAuth('login')}
        >
          Entrar
        </button>
        <button 
          className="auth-btn register-btn"
          onClick={() => onShowAuth('register')}
        >
          Criar Conta
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <div className="user-dropdown">
        <button 
          className="user-avatar"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {user.name.charAt(0).toUpperCase()}
        </button>
        
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <button 
              className="dropdown-item"
              onClick={() => {
                onShowHistory();
                setShowDropdown(false);
              }}
            >
              📊 Meu Histórico
            </button>
            
            <button 
              className="dropdown-item"
              onClick={handleLogout}
            >
              🚪 Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;