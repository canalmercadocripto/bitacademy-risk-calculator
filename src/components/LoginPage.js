import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import PhoneInput from './PhoneInput';
import './LoginPage.css';

const LoginPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    countryCode: '+55'
  });

  // Validação em tempo real
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.email = 'Email inválido';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (value.length < 6) {
          errors.password = 'Senha deve ter pelo menos 6 caracteres';
        } else {
          delete errors.password;
        }
        checkPasswordStrength(value);
        break;
      case 'name':
      case 'lastName':
        if (value.trim().length < 2) {
          errors[name] = 'Deve ter pelo menos 2 caracteres';
        } else {
          delete errors[name];
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  // Verificar força da senha
  const checkPasswordStrength = (password) => {
    let strength = '';
    if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)) {
      strength = 'good';
    } else if (password.length >= 6) {
      strength = 'medium';
    } else if (password.length > 0) {
      strength = 'weak';
    }
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos os campos antes de enviar
    const fields = Object.keys(formData);
    fields.forEach(field => {
      if (formData[field]) {
        validateField(field, formData[field]);
      }
    });
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    if (mode === 'login') {
      await login(formData.email, formData.password);
    } else {
      await register(formData.name, formData.lastName, formData.email, formData.password, formData.phone, formData.countryCode);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validação em tempo real
    validateField(name, value);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ name: '', lastName: '', email: '', password: '', phone: '', countryCode: '+55' });
    setValidationErrors({});
    setPasswordStrength('');
    setShowPassword(false);
  };

  // Auto-complete do email salvo
  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    }
  }, [rememberMe]);

  // Salvar email se "Lembrar-me" estiver marcado
  useEffect(() => {
    if (rememberMe && formData.email) {
      localStorage.setItem('rememberedEmail', formData.email);
    }
  }, [formData.email, rememberMe]);

  return (
    <div className="login-container">
      {/* Header com tema */}
      <header className="login-header">
        <h1>🚀 Calculadora de Gerenciamento de Risco</h1>
        <div className="theme-toggle" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-text">
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-wrapper">
          {/* Seção de Informações */}
          <div className="login-info">
            <div className="login-hero">
              <span className="login-hero-icon">💰</span>
              <h2>Trading Profissional Começa Aqui</h2>
              <p>
                Calculadora avançada de risk management utilizada por traders profissionais. 
                Gerencie seus riscos com precisão matemática e tome decisões baseadas em dados.
              </p>
            </div>

            <div className="login-features">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <span className="feature-text">Cálculos de risco precisos</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span className="feature-text">Interface rápida e intuitiva</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <span className="feature-text">Analytics avançados</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <span className="feature-text">Dados seguros e privados</span>
              </div>
            </div>

            {/* Aviso Profissional */}
            <div className="professional-notice">
              <span className="notice-icon">📈</span>
              <h3 className="notice-title">Calculadora Profissional</h3>
              <p className="notice-text">
                Ferramenta completa de risk management para traders profissionais.
              </p>
              <div className="notice-info">
                <p>
                  ✅ <strong>Totalmente funcional e otimizada</strong><br/>
                  Cadastre-se agora e comece a usar imediatamente!
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Login/Registro */}
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title">
                {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'}
              </h2>
              <p className="form-subtitle">
                {mode === 'login' 
                  ? 'Acesse sua calculadora profissional'
                  : 'Tenha acesso completo à plataforma'
                }
              </p>
            </div>

            {/* Toggle entre Login/Register */}
            <div className="mode-toggle">
              <button 
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => mode !== 'login' && switchMode()}
              >
                Login
              </button>
              <button 
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => mode !== 'register' && switchMode()}
              >
                Registrar
              </button>
            </div>


            {/* Formulário */}
            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-field half">
                  <div className="field-group">
                    <label className="field-label">Nome</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="field-input"
                      placeholder="Seu nome"
                      autoComplete="given-name"
                    />
                    {validationErrors.name && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="field-group">
                    <label className="field-label">Sobrenome</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="field-input"
                      placeholder="Seu sobrenome"
                      autoComplete="family-name"
                    />
                    {validationErrors.lastName && (
                      <div className="field-error">
                        <span>⚠️</span> {validationErrors.lastName}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-field">
                <div className="field-group">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="field-input"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <div className="field-error">
                      <span>⚠️</span> {validationErrors.email}
                    </div>
                  )}
                  {!validationErrors.email && formData.email && (
                    <div className="field-success">
                      <span>✅</span> Email válido
                    </div>
                  )}
                </div>
              </div>

              <div className="form-field">
                <div className="field-group">
                  <label className="field-label">Senha</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      disabled={loading}
                      className="field-input"
                      placeholder="Mínimo 6 caracteres"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <div className="field-error">
                      <span>⚠️</span> {validationErrors.password}
                    </div>
                  )}
                  {passwordStrength && mode === 'register' && (
                    <div className="password-strength">
                      <div className={`password-strength-bar strength-${passwordStrength}`}></div>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'register' && (
                <div className="form-field">
                  <div className="field-group">
                    <label className="field-label">Telefone</label>
                    <PhoneInput
                      value={formData.phone}
                      countryCode={formData.countryCode}
                      onChange={(phone) => setFormData({...formData, phone})}
                      onCountryCodeChange={(countryCode) => setFormData({...formData, countryCode})}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="form-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Lembrar-me
                    </span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || Object.keys(validationErrors).length > 0}
                className="submit-button"
                aria-label={mode === 'login' ? 'Fazer login' : 'Criar conta'}
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
              </button>
            </form>

            {/* Footer do Formulário */}
            <div className="form-footer">
              {mode === 'login' ? (
                <p>
                  Ainda não tem conta?{' '}
                  <button 
                    type="button" 
                    onClick={switchMode}
                    className="switch-mode-btn"
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
                    className="switch-mode-btn"
                  >
                    Fazer login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;