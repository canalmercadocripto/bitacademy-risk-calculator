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
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Mock users data
      const mockUsers = [
        {
          id: 1,
          name: 'Admin BitAcademy',
          email: 'admin@bitacademy.com',
          phone: '+5511999999999',
          role: 'admin',
          isActive: true,
          createdAt: '2024-01-15',
          lastLogin: '2024-12-02 14:30:00',
          totalTrades: 0
        },
        {
          id: 2,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '+5511888888888',
          role: 'user',
          isActive: true,
          createdAt: '2024-11-20',
          lastLogin: '2024-12-02 09:15:00',
          totalTrades: 45
        },
        {
          id: 3,
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '+5511777777777',
          role: 'user',
          isActive: true,
          createdAt: '2024-11-25',
          lastLogin: '2024-12-01 16:20:00',
          totalTrades: 32
        },
        {
          id: 4,
          name: 'Carlos Lima',
          email: 'carlos@email.com',
          phone: '+5511666666666',
          role: 'user',
          isActive: false,
          createdAt: '2024-10-10',
          lastLogin: '2024-11-15 10:00:00',
          totalTrades: 12
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Simular criação de usuário
      const user = {
        id: Date.now(),
        ...newUser,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null,
        totalTrades: 0
      };
      
      setUsers(prev => [user, ...prev]);
      setNewUser({ name: '', email: '', phone: '', role: 'user' });
      setShowAddUser(false);
      
      alert('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: !currentStatus } : u
      ));
      
      alert(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }
    
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
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
                onClick={() => setEditingUser(user)}
              >
                ✏️ Editar
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
    </div>
  );
};

export default Users;