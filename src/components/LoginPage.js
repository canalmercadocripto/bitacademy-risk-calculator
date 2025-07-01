import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import PhoneInput from './PhoneInput';

const LoginPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    countryCode: '+55'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'login') {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.lastName, formData.email, formData.password, formData.phone, formData.countryCode);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ name: '', lastName: '', email: '', password: '', phone: '', countryCode: '+55' });
  };

  return (
    <div className="App">
      {/* Header com tema */}
      <div className="header">
        <h1>🚀 Calculadora de Gerenciamento de Risco</h1>
        <div className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-text">
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </span>
        </div>
      </div>

      {/* Container centralizado */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-container)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: 'var(--shadow-heavy)',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '500px'
        }}>
          {/* Logo e Título */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>💰</div>
            <h2 style={{
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              fontSize: '1.8rem'
            }}>
              {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'}
            </h2>
            <p style={{
              color: 'var(--text-placeholder)',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              {mode === 'login' 
                ? 'Acesse sua calculadora profissional de risk management'
                : 'Crie sua conta e tenha acesso completo à plataforma'
              }
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            {mode === 'register' && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s ease'
                    }}
                    placeholder="Seu nome"
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s ease'
                    }}
                    placeholder="Seu sobrenome"
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease'
                }}
                placeholder="seu@email.com"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s ease'
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Telefone
                </label>
                <PhoneInput
                  value={formData.phone}
                  countryCode={formData.countryCode}
                  onChange={(phone) => setFormData({...formData, phone})}
                  onCountryCodeChange={(countryCode) => setFormData({...formData, countryCode})}
                  disabled={loading}
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          {/* Switch entre login/register */}
          <div style={{
            textAlign: 'center',
            color: 'var(--text-placeholder)',
            marginBottom: '2rem'
          }}>
            {mode === 'login' ? (
              <p>
                Ainda não tem conta?{' '}
                <button 
                  type="button" 
                  onClick={switchMode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '500'
                  }}
                >
                  Criar conta agora
                </button>
              </p>
            ) : (
              <p>
                Já tem conta?{' '}
                <button 
                  type="button" 
                  onClick={switchMode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '500'
                  }}
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;