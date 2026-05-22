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
      padding: '14px 25px',              // 👈 MEDIUM SIZE - INCREASED
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      gap: '20px'                        // 👈 MEDIUM GAP
    }}>
      {/* Navigation Links */}
      <div style={{ 
        display: 'flex', 
        gap: '20px',                     // 👈 MEDIUM GAP BETWEEN LINKS
        alignItems: 'center',
        flexWrap: 'nowrap',
        fontSize: '15px'                 // 👈 MEDIUM FONT SIZE
      }}>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>🏠 Dashboard</Link>
        <Link to="/parts" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>📦 Parts</Link>
        <Link to="/receive" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>📥 Receive</Link>
        <Link to="/issue" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>📤 Issue</Link>
        {isApprover && (
          <Link to="/approvals" style={{ color: '#f39c12', textDecoration: 'none', fontWeight: 'bold', padding: '6px 12px' }}>⏳ Approvals</Link>
        )}
        <Link to="/transactions" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>📜 History</Link>
        <Link to="/reports" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>📊 Reports</Link>
        {user?.role === 'admin' && (
          <Link to="/users" style={{ color: 'white', textDecoration: 'none', padding: '6px 12px' }}>👥 Users</Link>
        )}
      </div>
      
      {/* Right side - User info and buttons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px',
        fontSize: '14px'
      }}>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px' }}>👋 {user?.username} ({user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Storekeeper'})</span>
          <ChangePassword token={token} user={user} onLogout={onLogout} />
        </div>
        <button 
          onClick={handleLogout} 
          style={{
            padding: '7px 14px',          // 👈 MEDIUM BUTTON SIZE
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;