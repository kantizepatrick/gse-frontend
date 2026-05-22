import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = ({ token, user, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use Render backend URL
  const API_URL = 'https://gse-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('❌ New passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (newPassword.length < 4) {
      setError('❌ Password must be at least 4 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('❌ New password cannot be the same as current password');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Password changed successfully! Logging out...');
      setError('');
      
      setTimeout(() => {
        onLogout();
      }, 2000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error changing password';
      setError(`❌ ${errorMsg}`);
      setMessage('');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => setShowForm(!showForm)} 
        style={{ 
          backgroundColor: '#3498db', 
          padding: '8px 15px', 
          fontSize: '14px', 
          marginLeft: '10px',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
      >
        🔑 Change Password
      </button>

      {showForm && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '8px', 
            width: '450px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Change Password</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              User: <strong style={{ color: '#3498db' }}>{user?.username}</strong> ({user?.role})
            </p>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  Current Password *
                </label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  New Password * (min 4 characters)
                </label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                {newPassword && newPassword.length < 4 && (
                  <p style={{ fontSize: '12px', color: '#e74c3c', marginTop: '5px' }}>
                    ⚠️ Password must be at least 4 characters
                  </p>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                  Confirm New Password *
                </label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ fontSize: '12px', color: '#e74c3c', marginTop: '5px' }}>
                    ⚠️ Passwords do not match
                  </p>
                )}
              </div>
              
              {message && (
                <div style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  border: '1px solid #c3e6cb'
                }}>
                  {message}
                </div>
              )}
              
              {error && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  border: '1px solid #f5c6cb'
                }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flex: 1,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : 'Change Password'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setMessage('');
                    setError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }} 
                  style={{
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
            
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '12px', color: '#999', textAlign: 'center' }}>
              <p>Default passwords: admin123, manager123, keeper123</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;