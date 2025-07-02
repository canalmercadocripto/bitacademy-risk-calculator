import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    system: {
      maintenanceMode: false,
      maxTradesPerUser: 1000,
      defaultRiskPercentage: 2,
      supportedExchanges: ['binance', 'bybit', 'bingx', 'bitget'],
      appVersion: '2.0.0'
    },
    email: {
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      enableNotifications: true
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 24,
      enableTwoFactor: false,
      maxLoginAttempts: 5
    },
    backup: {
      autoBackup: true,
      backupInterval: 24,
      retentionPeriod: 30,
      lastBackup: '2024-12-02 03:00:00'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('system');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Simular carregamento das configurações
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleRunBackup = async () => {
    try {
      const confirmed = window.confirm('Deseja executar o backup manual do sistema?');
      if (!confirmed) return;
      
      // Simular backup
      const backupData = {
        timestamp: new Date().toISOString(),
        type: 'manual',
        size: '2.5MB',
        tables: ['users', 'trades', 'settings', 'activity_logs']
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_manual_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setSettings(prev => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: new Date().toLocaleString('pt-BR')
        }
      }));
      
      alert('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao executar backup:', error);
      alert('Erro ao executar backup');
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Configurações do Sistema</h1>
        <p>Gerencie todas as configurações da plataforma BitAcademy</p>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          🔧 Sistema
        </button>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Segurança
        </button>
        <button
          className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          💾 Backup
        </button>
      </div>

      {/* Sistema */}
      {activeTab === 'system' && (
        <div className="settings-section">
          <h2>🔧 Configurações do Sistema</h2>
          
          <div className="setting-group">
            <h3>Modo de Manutenção</h3>
            <div className="setting-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.system.maintenanceMode}
                  onChange={(e) => updateSetting('system', 'maintenanceMode', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span className="setting-label">
                {settings.system.maintenanceMode ? 'Sistema em manutenção' : 'Sistema operacional'}
              </span>
            </div>
          </div>

          <div className="setting-group">
            <h3>Limites de Uso</h3>
            <div className="setting-item">
              <label>Máximo de trades por usuário:</label>
              <input
                type="number"
                value={settings.system.maxTradesPerUser}
                onChange={(e) => updateSetting('system', 'maxTradesPerUser', parseInt(e.target.value))}
                min="1"
                max="10000"
              />
            </div>
            
            <div className="setting-item">
              <label>Porcentagem de risco padrão (%):</label>
              <input
                type="number"
                value={settings.system.defaultRiskPercentage}
                onChange={(e) => updateSetting('system', 'defaultRiskPercentage', parseFloat(e.target.value))}
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
          </div>

          <div className="setting-group">
            <h3>Exchanges Suportadas</h3>
            <div className="exchanges-list">
              {['binance', 'bybit', 'bingx', 'bitget'].map(exchange => (
                <div key={exchange} className="setting-item">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.system.supportedExchanges.includes(exchange)}
                      onChange={(e) => {
                        const newExchanges = e.target.checked
                          ? [...settings.system.supportedExchanges, exchange]
                          : settings.system.supportedExchanges.filter(ex => ex !== exchange);
                        updateSetting('system', 'supportedExchanges', newExchanges);
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="setting-label">{exchange.charAt(0).toUpperCase() + exchange.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>Informações da Aplicação</h3>
            <div className="setting-item">
              <label>Versão da aplicação:</label>
              <input
                type="text"
                value={settings.system.appVersion}
                onChange={(e) => updateSetting('system', 'appVersion', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Email */}
      {activeTab === 'email' && (
        <div className="settings-section">
          <h2>📧 Configurações de Email</h2>
          
          <div className="setting-group">
            <h3>Servidor SMTP</h3>
            <div className="setting-item">
              <label>Servidor SMTP:</label>
              <input
                type="text"
                value={settings.email.smtpServer}
                onChange={(e) => updateSetting('email', 'smtpServer', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="setting-item">
              <label>Porta SMTP:</label>
              <input
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                min="1"
                max="65535"
              />
            </div>
            
            <div className="setting-item">
              <label>Usuário SMTP:</label>
              <input
                type="email"
                value={settings.email.smtpUser}
                onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="setting-item">
              <label>Senha SMTP:</label>
              <input
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="setting-group">
            <h3>Notificações</h3>
            <div className="setting-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.email.enableNotifications}
                  onChange={(e) => updateSetting('email', 'enableNotifications', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span className="setting-label">Habilitar notificações por email</span>
            </div>
          </div>

          <div className="setting-actions">
            <button className="test-email-btn">
              📧 Testar Configuração de Email
            </button>
          </div>
        </div>
      )}

      {/* Segurança */}
      {activeTab === 'security' && (
        <div className="settings-section">
          <h2>🔒 Configurações de Segurança</h2>
          
          <div className="setting-group">
            <h3>Senhas</h3>
            <div className="setting-item">
              <label>Tamanho mínimo da senha:</label>
              <input
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                min="6"
                max="32"
              />
            </div>
          </div>

          <div className="setting-group">
            <h3>Sessões</h3>
            <div className="setting-item">
              <label>Timeout da sessão (horas):</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                min="1"
                max="168"
              />
            </div>
          </div>

          <div className="setting-group">
            <h3>Autenticação</h3>
            <div className="setting-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.security.enableTwoFactor}
                  onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span className="setting-label">Habilitar autenticação de dois fatores</span>
            </div>
            
            <div className="setting-item">
              <label>Máximo de tentativas de login:</label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
          </div>

          <div className="security-actions">
            <button className="security-action-btn">
              🔑 Forçar Logout de Todos os Usuários
            </button>
            <button className="security-action-btn">
              🔒 Gerar Nova Chave JWT
            </button>
          </div>
        </div>
      )}

      {/* Backup */}
      {activeTab === 'backup' && (
        <div className="settings-section">
          <h2>💾 Configurações de Backup</h2>
          
          <div className="setting-group">
            <h3>Backup Automático</h3>
            <div className="setting-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.backup.autoBackup}
                  onChange={(e) => updateSetting('backup', 'autoBackup', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span className="setting-label">Habilitar backup automático</span>
            </div>
            
            <div className="setting-item">
              <label>Intervalo de backup (horas):</label>
              <input
                type="number"
                value={settings.backup.backupInterval}
                onChange={(e) => updateSetting('backup', 'backupInterval', parseInt(e.target.value))}
                min="1"
                max="168"
                disabled={!settings.backup.autoBackup}
              />
            </div>
            
            <div className="setting-item">
              <label>Período de retenção (dias):</label>
              <input
                type="number"
                value={settings.backup.retentionPeriod}
                onChange={(e) => updateSetting('backup', 'retentionPeriod', parseInt(e.target.value))}
                min="7"
                max="365"
              />
            </div>
          </div>

          <div className="setting-group">
            <h3>Status do Backup</h3>
            <div className="backup-status">
              <div className="status-item">
                <span className="status-label">Último backup:</span>
                <span className="status-value">{settings.backup.lastBackup}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Próximo backup:</span>
                <span className="status-value">Em 18 horas</span>
              </div>
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className="status-value status-ok">🟢 Funcionando</span>
              </div>
            </div>
          </div>

          <div className="backup-actions">
            <button className="backup-action-btn" onClick={handleRunBackup}>
              💾 Executar Backup Manual
            </button>
            <button className="backup-action-btn">
              📁 Ver Histórico de Backups
            </button>
            <button className="backup-action-btn">
              🔄 Restaurar Backup
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="settings-footer">
        <button 
          className="save-settings-btn"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>
    </div>
  );
};

export default Settings;