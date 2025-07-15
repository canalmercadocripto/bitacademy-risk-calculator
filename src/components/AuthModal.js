import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    countryCode: '+55'
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.lastName, formData.email, formData.password, formData.phone, formData.countryCode);
      }

      if (result.success) {
        onClose();
        setFormData({ name: '', lastName: '', email: '', password: '', phone: '', countryCode: '+55' });
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      const phoneValue = e.target.value;
      let detectedCountryCode = '+55'; // default Brazil
      
      // Auto-detect country code from phone number
      if (phoneValue.startsWith('+1')) detectedCountryCode = '+1';
      else if (phoneValue.startsWith('+44')) detectedCountryCode = '+44';
      else if (phoneValue.startsWith('+33')) detectedCountryCode = '+33';
      else if (phoneValue.startsWith('+49')) detectedCountryCode = '+49';
      else if (phoneValue.startsWith('+39')) detectedCountryCode = '+39';
      else if (phoneValue.startsWith('+34')) detectedCountryCode = '+34';
      else if (phoneValue.startsWith('+351')) detectedCountryCode = '+351';
      else if (phoneValue.startsWith('+55')) detectedCountryCode = '+55';
      
      setFormData({
        ...formData,
        phone: phoneValue,
        countryCode: detectedCountryCode
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handlePhoneChange = (phone, countryCode) => {
    setFormData({
      ...formData,
      phone,
      countryCode
    });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ name: '', lastName: '', email: '', password: '', phone: '', countryCode: '+55' });
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</h2>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Nome</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Sobrenome</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Digite o telefone com código do país (ex: +5511999999999)"
                required
                disabled={loading}
              />
              {formData.phone && (
                <div className="phone-detected">
                  País detectado: {formData.countryCode}
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>
              Não tem conta? 
              <button type="button" onClick={switchMode} className="link-btn">
                Criar conta
              </button>
            </p>
          ) : (
            <p>
              Já tem conta? 
              <button type="button" onClick={switchMode} className="link-btn">
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;