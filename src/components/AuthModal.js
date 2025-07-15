import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SimplePhoneInput from './SimplePhoneInput';

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
              <SimplePhoneInput
                value={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone) => setFormData(prev => ({...prev, phone}))}
                onCountryChange={(countryCode) => setFormData(prev => ({...prev, countryCode}))}
                disabled={loading}
                required
              />
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