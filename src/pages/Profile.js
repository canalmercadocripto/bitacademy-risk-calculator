import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/authApi';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    preferences: {
      defaultRisk: 2,
      defaultAccountSize: 1000,
      notifications: true,
      darkMode: false,
      language: 'pt-BR'
    }
  });
  const [stats, setStats] = useState({
    totalCalculations: 0,
    avgRiskReward: 0,
    totalRisk: 0,
    totalPotential: 0,
    favoriteExchange: '',
    joinDate: ''
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        preferences: {
          defaultRisk: user.preferences?.defaultRisk || 2,
          defaultAccountSize: user.preferences?.defaultAccountSize || 1000,
          notifications: user.preferences?.notifications ?? true,
          darkMode: user.preferences?.darkMode || false,
          language: user.preferences?.language || 'pt-BR'
        }
      });
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    try {
      const response = await userApi.getProfile(token);
      if (response.success) {
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await userApi.updateProfile(profileData, token);
      if (response.success) {
        updateUser(response.data);
        setEditing(false);
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="not-authenticated">
          <h2>Acesso Restrito</h2>
          <p>Faça login para ver seu perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {profileData.name ? profileData.name.charAt(0).toUpperCase() : '👤'}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profileData.name || 'Usuário'}</h1>
          <p className="profile-email">{profileData.email}</p>
          <p className="profile-joined">
            📅 Membro desde {formatDate(stats.joinDate || new Date())}
          </p>
        </div>
        <div className="profile-actions">
          {!editing ? (
            <button 
              onClick={() => setEditing(true)}
              className="btn-primary"
            >
              ✏️ Editar Perfil
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="btn-save"
              >
                {loading ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
              <button 
                onClick={() => setEditing(false)}
                className="btn-cancel"
              >
                ❌ Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas do Usuário */}
      <div className="stats-section">
        <h2>📊 Suas Estatísticas</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🧮</div>
            <div className="stat-content">
              <h3>Total de Cálculos</h3>
              <div className="stat-value">{stats.totalCalculations || 0}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <h3>R/R Médio</h3>
              <div className="stat-value">{(stats.avgRiskReward || 0).toFixed(2)}:1</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <h3>Risco Total</h3>
              <div className="stat-value">{formatCurrency(stats.totalRisk || 0)}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Potencial Total</h3>
              <div className="stat-value">{formatCurrency(stats.totalPotential || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="section">
        <h2>👤 Informações Pessoais</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Nome Completo</label>
            {editing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
              />
            ) : (
              <div className="form-value">{profileData.name || 'Não informado'}</div>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="form-value readonly">{profileData.email}</div>
            <small>O email não pode ser alterado</small>
          </div>

          <div className="form-group">
            <label>Telefone</label>
            {editing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            ) : (
              <div className="form-value">{profileData.phone || 'Não informado'}</div>
            )}
          </div>

          <div className="form-group full-width">
            <label>Biografia</label>
            {editing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={3}
              />
            ) : (
              <div className="form-value">{profileData.bio || 'Nenhuma biografia adicionada'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className="section">
        <h2>⚙️ Preferências</h2>
        <div className="preferences-grid">
          <div className="pref-group">
            <label>Risco Padrão (%)</label>
            {editing ? (
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={profileData.preferences.defaultRisk}
                onChange={(e) => handleInputChange('preferences.defaultRisk', parseFloat(e.target.value))}
              />
            ) : (
              <div className="pref-value">{profileData.preferences.defaultRisk}%</div>
            )}
          </div>

          <div className="pref-group">
            <label>Tamanho de Conta Padrão</label>
            {editing ? (
              <input
                type="number"
                min="100"
                step="100"
                value={profileData.preferences.defaultAccountSize}
                onChange={(e) => handleInputChange('preferences.defaultAccountSize', parseFloat(e.target.value))}
              />
            ) : (
              <div className="pref-value">{formatCurrency(profileData.preferences.defaultAccountSize)}</div>
            )}
          </div>

          <div className="pref-group">
            <label>Idioma</label>
            {editing ? (
              <select
                value={profileData.preferences.language}
                onChange={(e) => handleInputChange('preferences.language', e.target.value)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            ) : (
              <div className="pref-value">
                {profileData.preferences.language === 'pt-BR' ? 'Português (Brasil)' : 
                 profileData.preferences.language === 'en-US' ? 'English (US)' : 'Español'}
              </div>
            )}
          </div>

          <div className="pref-group">
            <label>Exchange Favorita</label>
            <div className="pref-value">{stats.favoriteExchange || 'Nenhuma'}</div>
          </div>
        </div>

        {editing && (
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={profileData.preferences.notifications}
                onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
              />
              <span className="checkmark"></span>
              Receber notificações por email
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={profileData.preferences.darkMode}
                onChange={(e) => handleInputChange('preferences.darkMode', e.target.checked)}
              />
              <span className="checkmark"></span>
              Modo escuro (experimental)
            </label>
          </div>
        )}
      </div>

      {/* Segurança */}
      <div className="section">
        <h2>🔒 Segurança</h2>
        <div className="security-options">
          <button className="security-btn">
            🔑 Alterar Senha
          </button>
          <button className="security-btn">
            📱 Configurar 2FA
          </button>
          <button className="security-btn danger">
            🗑️ Excluir Conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;