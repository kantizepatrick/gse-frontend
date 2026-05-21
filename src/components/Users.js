import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Users = ({ token, user }) => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'storekeeper',
    email: ''
  });

  // Dynamic API URL - works with any IP address automatically
  const API_URL = `http://${window.location.hostname}:5000`;

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`User "${newUser.username}" created successfully!`);
      setShowAddForm(false);
      setNewUser({ username: '', password: '', full_name: '', role: 'storekeeper', email: '' });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        role: editingUser.role,
        email: editingUser.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`User "${editingUser.username}" updated successfully!`);
      setShowEditForm(false);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Delete user "${username}"?`)) {
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`User "${username}" deleted`);
        fetchUsers();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting user');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Enter new password for "${username}":`, 'password123');
    if (newPassword && newPassword.length >= 4) {
      try {
        await axios.post(`${API_URL}/api/admin/reset-password`, {
          user_id: userId,
          new_password: newPassword
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`Password for "${username}" reset to: ${newPassword}`);
        setTimeout(() => setMessage(''), 4000);
      } catch (err) {
        setError(err.response?.data?.error || 'Error resetting password');
        setTimeout(() => setError(''), 3000);
      }
    } else if (newPassword) {
      setError('Password must be at least 4 characters');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditForm = (user) => {
    setEditingUser({ ...user });
    setShowEditForm(true);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return '#e74c3c';
      case 'manager': return '#f39c12';
      default: return '#27ae60';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>User Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60' }}>
          {showAddForm ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} className="form-container">
          <h3>Create New User</h3>
          <div className="form-group">
            <label>Username *</label>
            <input type="text" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
              <option value="storekeeper">Storekeeper</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Email (for password reset)</label>
            <input type="email" placeholder="user@example.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
          </div>
          <button type="submit">Create User</button>
        </form>
      )}

      {showEditForm && editingUser && (
        <form onSubmit={handleEditUser} className="form-container">
          <h3>Edit User: {editingUser.username}</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={editingUser.full_name || ''} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
              <option value="storekeeper">Storekeeper</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Email (for password reset)</label>
            <input type="email" placeholder="user@example.com" value={editingUser.email || ''} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ backgroundColor: '#f39c12' }}>Save Changes</button>
            <button type="button" onClick={() => { setShowEditForm(false); setEditingUser(null); }} style={{ backgroundColor: '#95a5a6' }}>Cancel</button>
          </div>
        </form>
      )}

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username} {u.username === user.username && '(You)'}</td>
              <td>{u.full_name || '-'}</td>
              <td>{u.email || '-'}</td>
              <td style={{ color: getRoleBadgeColor(u.role), fontWeight: 'bold' }}>{u.role.toUpperCase()}</td>
              <td>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button onClick={() => openEditForm(u)} style={{ backgroundColor: '#f39c12', padding: '5px 10px' }}>
                    ✏️ Edit
                  </button>
                  {u.username !== user.username && (
                    <>
                      <button onClick={() => handleResetPassword(u.id, u.username)} style={{ backgroundColor: '#3498db', padding: '5px 10px' }}>
                        🔑 Reset PW
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.username)} style={{ backgroundColor: '#e74c3c', padding: '5px 10px' }}>
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;