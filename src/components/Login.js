import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/logo.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Use Render backend URL
  const API_URL = 'https://gse-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/login`, { username, password });
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/forgot-password`, { username: resetUsername });
      setResetMessage('If account exists, reset code has been sent.');
      setResetError('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
        setResetUsername('');
      }, 3000);
    } catch (err) {
      setResetError('Error requesting password reset');
      setResetMessage('');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      setResetError('Password must be at least 4 characters');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/reset-password`, {
        username: resetUsername,
        reset_code: resetToken,
        new_password: newPassword
      });
      setResetMessage('Password reset successful! Please login with your new password.');
      setResetError('');
      setTimeout(() => {
        setShowResetForm(false);
        setShowForgotPassword(false);
        setResetMessage('');
        setResetUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
      }, 3000);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Error resetting password');
      setResetMessage('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Company Logo */}
        <div className="logo-container">
          <img 
            src={logo} 
            alt="Core Aviation Services" 
            className="login-logo"
          />
        </div>
        
        <h2>GSE Spare Parts Inventory</h2>
        
        {!showForgotPassword ? (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            {error && <div className="error">{error}</div>}
            <div className="forgot-password-link">
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                style={{ background: 'none', color: '#3498db', padding: '10px 0 0 0', fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : !showResetForm ? (
          <form onSubmit={handleRequestReset}>
            <h3>Reset Password</h3>
            <p style={{ fontSize: '12px', marginBottom: '15px' }}>
              Enter your username to receive a reset code
            </p>
            <input
              type="text"
              placeholder="Username"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
              required
            />
            <button type="submit">Send Reset Code</button>
            {resetMessage && <div className="success">{resetMessage}</div>}
            {resetError && <div className="error">{resetError}</div>}
            <button 
              type="button" 
              onClick={() => {
                setShowForgotPassword(false);
                setResetMessage('');
                setResetError('');
              }}
              style={{ background: 'none', color: '#666', marginTop: '10px', border: 'none', cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <h3>Create New Password</h3>
            <p style={{ fontSize: '12px', marginBottom: '15px' }}>
              Enter your reset code and new password
            </p>
            <input
              type="text"
              placeholder="Reset Code"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password (min 4 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit">Reset Password</button>
            {resetMessage && <div className="success">{resetMessage}</div>}
            {resetError && <div className="error">{resetError}</div>}
            <button 
              type="button" 
              onClick={() => {
                setShowResetForm(false);
                setResetMessage('');
                setResetError('');
              }}
              style={{ background: 'none', color: '#666', marginTop: '10px', border: 'none', cursor: 'pointer' }}
            >
              Back
            </button>
          </form>
        )}
        
        <div className="demo-credentials">
          <p>Demo: admin / admin123 | manager / manager123 | storekeeper / keeper123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;