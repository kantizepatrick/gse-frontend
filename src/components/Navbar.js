import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChangePassword from './ChangePassword';

const Navbar = ({ user, token, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isApprover = user?.role === 'admin' || user?.role === 'manager';

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '8px 15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      gap: '10px'
    }}>
      {/* Navigation Links - Compact */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center',
        flexWrap: 'nowrap',
        fontSize: '13px'
      }}>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>🏠</Link>
        <Link to="/parts" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>📦 Parts</Link>
        <Link to="/receive" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>📥 Receive</Link>
        <Link to="/issue" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>📤 Issue</Link>
        {isApprover && (
          <Link to="/approvals" style={{ color: '#f39c12', textDecoration: 'none', fontWeight: 'bold', padding: '5px 8px' }}>⏳ Approvals</Link>
        )}
        <Link to="/transactions" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>📜 History</Link>
        <Link to="/reports" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>📊 Reports</Link>
        {user?.role === 'admin' && (
          <Link to="/users" style={{ color: 'white', textDecoration: 'none', padding: '5px 8px' }}>👥 Users</Link>
        )}
      </div>
      
      {/* Right side - User info and buttons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '13px'
      }}>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👋 {user?.username} ({user?.role === 'admin' ? 'A' : user?.role === 'manager' ? 'M' : 'S'})</span>
          <ChangePassword token={token} user={user} onLogout={onLogout} />
        </div>
        <button 
          onClick={handleLogout} 
          style={{
            padding: '4px 8px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;