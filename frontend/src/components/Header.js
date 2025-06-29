import React from 'react';

const Header = ({ theme, onToggleTheme }) => {
  return (
    <div className="header">
      <h1>🚀 Calculadora de Gerenciamento de Risco</h1>
      <div className="theme-toggle" onClick={onToggleTheme}>
        <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span className="theme-toggle-text">
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </span>
      </div>
    </div>
  );
};

export default Header;