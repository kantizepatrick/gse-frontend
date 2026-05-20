import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = ({ token, user, onLogout }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Dynamic API URL - works with any IP address automatically
  const API_URL = `http://${window.location.hostname}:5000`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Password changed successfully! Logging out...');
      setError('');
      
      setTimeout(() => {
        onLogout();
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error changing password');
      setMessage('');
    }
  };

  return (
    <div>
      <button 
        onClick={() => setShowForm(!showForm)} 
        style={{ backgroundColor: '#3498db', padding: '5px 15px', fontSize: '14px', marginLeft: '10px' }}
      >
        🔑 Change Password
      </button>

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h3>Change Password</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Current Password *</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password * (min 4 characters)</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              {message && <div className="success">{message}</div>}
              {error && <div className="error">{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" style={{ backgroundColor: '#27ae60' }}>Change Password</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: '#95a5a6' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;