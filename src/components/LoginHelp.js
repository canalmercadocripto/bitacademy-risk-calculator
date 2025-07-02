import React, { useState } from 'react';

const LoginHelp = () => {
  const [showCredentials, setShowCredentials] = useState(false);

  const validCredentials = [
    { 
      email: 'admin@bitacademy.com', 
      password: 'Admin123456!',
      description: 'Administrador Principal (Senha Forte)'
    },
    { 
      email: 'admin@bitacademy.com', 
      password: 'admin123',
      description: 'Administrador Principal (Senha Simples)'
    },
    { 
      email: 'admin@seudominio.com', 
      password: 'Admin123456!',
      description: 'Admin Alternativo (Senha Forte)'
    },
    { 
      email: 'admin@seudominio.com', 
      password: 'admin123',
      description: 'Admin Alternativo (Senha Simples)'
    }
  ];

  return (
    <div className="login-help">
      <button 
        type="button" 
        onClick={() => setShowCredentials(!showCredentials)}
        className="help-toggle-btn"
      >
        {showCredentials ? '🙈 Ocultar' : '👁️ Ver'} Credenciais de Teste
      </button>
      
      {showCredentials && (
        <div className="credentials-list">
          <h4>🔑 Credenciais Válidas para Login:</h4>
          {validCredentials.map((cred, index) => (
            <div key={index} className="credential-item">
              <div className="credential-info">
                <strong>📧 Email:</strong> {cred.email}<br/>
                <strong>🔒 Senha:</strong> {cred.password}<br/>
                <small>({cred.description})</small>
              </div>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${cred.email}\n${cred.password}`);
                  alert('Credenciais copiadas para a área de transferência!');
                }}
                className="copy-btn"
                title="Copiar credenciais"
              >
                📋
              </button>
            </div>
          ))}
          <div className="help-note">
            <strong>💡 Dica:</strong> Use qualquer uma das combinações acima para fazer login. 
            As credenciais funcionam tanto via API quanto em modo offline.
          </div>
        </div>
      )}
      
      <style jsx>{`
        .login-help {
          margin-top: 1rem;
          text-align: center;
        }
        
        .help-toggle-btn {
          background: var(--info-color);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .help-toggle-btn:hover {
          opacity: 0.8;
        }
        
        .credentials-list {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          text-align: left;
        }
        
        .credentials-list h4 {
          color: var(--text-primary);
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .credential-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: var(--bg-primary);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        
        .credential-info {
          flex: 1;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .credential-info strong {
          color: var(--text-primary);
        }
        
        .credential-info small {
          color: var(--text-secondary);
          font-style: italic;
        }
        
        .copy-btn {
          background: var(--success-color);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-left: 1rem;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .copy-btn:hover {
          opacity: 0.8;
        }
        
        .help-note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--warning-bg);
          color: var(--warning-color);
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default LoginHelp;