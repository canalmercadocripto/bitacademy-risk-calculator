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

          {/* Aviso Criativo e Profissional */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
              Trading Profissional Começa Aqui
            </h3>
            <p style={{ margin: '0', fontSize: '0.9rem', opacity: '0.9', lineHeight: '1.4' }}>
              Calculadora avançada de risk management utilizada por traders profissionais. 
              Gerencie seus riscos com precisão matemática.
            </p>
            <div style={{
              marginTop: '1rem',
              padding: '0.8rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ margin: '0', fontSize: '0.8rem', opacity: '0.8' }}>
                ⚠️ <strong>Algumas funcionalidades ainda estão em desenvolvimento</strong><br/>
                Cadastre-se agora e tenha acesso antecipado às novidades!
              </p>
            </div>
          </div>

          {/* Redes Sociais e Comunidade */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              🚀 Junte-se à Nossa Comunidade
            </h4>
            
            {/* Botão WhatsApp Comunidade */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => window.open('https://chat.whatsapp.com/HFQr8lBjqpb8GvN6K6J9y4', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  maxWidth: '300px'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                📱 Entrar no WhatsApp - Notícias Trading
              </button>
            </div>
            
            {/* Botões Redes Sociais */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => window.open('https://instagram.com/bitacademy', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #E4405F 0%, #C13584 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(228, 64, 95, 0.3)'
                }}
              >
                📷 Instagram
              </button>
              
              <button
                type="button"
                onClick={() => window.open('https://youtube.com/@bitacademy', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(255, 0, 0, 0.3)'
                }}
              >
                📺 YouTube
              </button>
              
              <button
                type="button"
                onClick={() => window.open('https://twitter.com/bitacademy', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 3px 10px rgba(29, 161, 242, 0.3)'
                }}
              >
                🐦 Twitter
              </button>
            </div>
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