import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch real users from database
      const response = await fetch('/api/users?action=list');
      const data = await response.json();
      
      if (data.success) {
        // Transform database format to UI format
        const transformedUsers = data.data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at.split('T')[0], // Format date
          lastLogin: user.updated_at || user.created_at,
          totalTrades: 0 // TODO: Get from trades table
        }));
        setUsers(transformedUsers);
      } else {
        console.error('Erro ao buscar usuários:', data.message);
        alert('Erro ao carregar usuários: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro de conexão ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!newUser.name || !newUser.email || !newUser.phone) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }
      
      // Gerar senha se não fornecida
      const password = newUser.password || 'TempPass123!';
      
      // Criar usuário via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          password: password,
          role: newUser.role
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recarregar lista de usuários
        await fetchUsers();
        setNewUser({ name: '', email: '', phone: '', role: 'user', password: '' });
        setShowAddUser(false);
        alert(`Usuário criado com sucesso! Senha: ${password}`);
      } else {
        alert('Erro ao criar usuário: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro de conexão ao criar usuário');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!editingUser.name || !editingUser.email || !editingUser.phone) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }
      
      // Editar usuário via API
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          role: editingUser.role,
          isActive: editingUser.isActive
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recarregar lista de usuários
        await fetchUsers();
        setEditingUser(null);
        alert('Usuário atualizado com sucesso!');
      } else {
        alert('Erro ao editar usuário: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      alert('Erro de conexão ao editar usuário');
    }
  };

  const handleChangePassword = async (userId) => {
    const newPassword = prompt('Digite a nova senha (mínimo 8 caracteres):');
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    
    try {
      // Alterar senha via API
      const response = await fetch('/api/users?action=password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Senha alterada com sucesso!');
      } else {
        alert('Erro ao alterar senha: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro de conexão ao alterar senha');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      // Alterar status via API
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          isActive: !currentStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recarregar lista de usuários
        await fetchUsers();
        alert(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
      } else {
        alert('Erro ao alterar status: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro de conexão ao alterar status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }
    
    try {
      // Deletar usuário via API
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recarregar lista de usuários
        await fetchUsers();
        alert('Usuário deletado com sucesso!');
      } else {
        alert('Erro ao deletar usuário: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro de conexão ao deletar usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="users-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>👥 Gestão de Usuários</h1>
        <p>Gerencie todos os usuários do sistema BitAcademy</p>
      </div>

      {/* Filtros e Ações */}
      <div className="users-controls">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="🔍 Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuários</option>
          </select>
        </div>
        
        <button
          className="add-user-btn"
          onClick={() => setShowAddUser(true)}
        >
          ➕ Adicionar Usuário
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="users-stats">
        <div className="stat-item">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Total de Usuários</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{users.filter(u => u.isActive).length}</span>
          <span className="stat-label">Usuários Ativos</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{users.filter(u => u.role === 'admin').length}</span>
          <span className="stat-label">Administradores</span>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="users-list">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card ${!user.isActive ? 'inactive' : ''}`}>
            <div className="user-info">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <h3>{user.name}</h3>
                <p className="user-email">{user.email}</p>
                <p className="user-phone">{user.phone}</p>
                <div className="user-meta">
                  <span className={`user-role ${user.role}`}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                  </span>
                  <span className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? '🟢 Ativo' : '🔴 Inativo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="user-stats">
              <div className="stat">
                <span className="stat-label">Trades:</span>
                <span className="stat-value">{user.totalTrades}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Membro desde:</span>
                <span className="stat-value">{user.createdAt}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Último login:</span>
                <span className="stat-value">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                </span>
              </div>
            </div>
            
            <div className="user-actions">
              <button
                className={`toggle-status-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                onClick={() => handleToggleActive(user.id, user.isActive)}
              >
                {user.isActive ? '⏸️ Desativar' : '▶️ Ativar'}
              </button>
              
              <button
                className="edit-user-btn"
                onClick={() => setEditingUser({...user})}
              >
                ✏️ Editar
              </button>
              
              <button
                className="change-password-btn"
                onClick={() => handleChangePassword(user.id)}
              >
                🔑 Senha
              </button>
              
              {user.id !== 1 && ( // Não permitir deletar o admin principal
                <button
                  className="delete-user-btn"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  🗑️ Deletar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar Usuário */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>➕ Adicionar Novo Usuário</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Nome Completo:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Telefone:</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({...prev, phone: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Senha Inicial:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                  placeholder="Deixe vazio para senha automática"
                />
              </div>
              
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value}))}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddUser(false)}>
                  Cancelar
                </button>
                <button type="submit">
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>✏️ Editar Usuário</h2>
            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Nome Completo:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => ({...prev, email: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Telefone:</label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser(prev => ({...prev, phone: e.target.value}))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => ({...prev, role: e.target.value}))}
                  disabled={editingUser.id === 1} // Não permitir alterar role do admin principal
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editingUser.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditingUser(prev => ({...prev, isActive: e.target.value === 'active'}))}
                  disabled={editingUser.id === 1} // Não permitir desativar admin principal
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;