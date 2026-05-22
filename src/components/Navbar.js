import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isApprover = user?.role === 'admin' || user?.role === 'manager';

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>🏠 Dashboard</Link>
        <Link to="/parts" style={{ color: 'white', textDecoration: 'none' }}>📦 Parts Catalog</Link>
        <Link to="/receive" style={{ color: 'white', textDecoration: 'none' }}>📥 Receive Parts</Link>
        <Link to="/issue" style={{ color: 'white', textDecoration: 'none' }}>📤 Issue Parts</Link>
        {isApprover && (
          <Link to="/approvals" style={{ color: '#f39c12', textDecoration: 'none', fontWeight: 'bold' }}>📋 Pending Approvals</Link>
        )}
        <Link to="/transactions" style={{ color: 'white', textDecoration: 'none' }}>📜 Transactions</Link>
        <Link to="/reports" style={{ color: 'white', textDecoration: 'none' }}>📊 Reports</Link>
        {user?.role === 'admin' && (
          <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>👥 Users</Link>
        )}
      </div>
      <div style={{ color: 'white' }}>
        <span>👋 {user?.full_name || user?.username} ({user?.role})</span>
        <button onClick={handleLogout} style={{
          marginLeft: '15px',
          padding: '5px 10px',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;