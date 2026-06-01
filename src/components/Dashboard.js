import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token, user }) => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParts: 0,
    lowStockCount: 0,
    maintenanceAlertCount: 0
  });

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch low stock parts
      const lowStockRes = await axios.get(`${API_URL}/api/reports/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockParts(lowStockRes.data);

      // Fetch maintenance data
      const maintenanceRes = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMaintenance = maintenanceRes.data.equipment || [];
      
      // Filter for alerts: overdue, due_soon, and upcoming with remaining
      const alerts = allMaintenance.filter(item => 
        item.status === 'overdue' || item.status === 'due_soon' || item.status === 'upcoming'
      );
      
      // Sort by remaining value (most urgent first)
      const sortedAlerts = [...alerts].sort((a, b) => {
        const aRemaining = a.remaining_value || a.hours_remaining || a.days_remaining || a.years_remaining || 999999;
        const bRemaining = b.remaining_value || b.hours_remaining || b.days_remaining || b.years_remaining || 999999;
        return aRemaining - bRemaining;
      });
      
      setMaintenanceAlerts(sortedAlerts);

      // Fetch parts count
      const partsRes = await axios.get(`${API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        totalParts: partsRes.data.length,
        lowStockCount: lowStockRes.data.length,
        maintenanceAlertCount: sortedAlerts.length
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const getMaintenanceTypeIcon = (type) => {
    switch(type) {
      case 'hour': return '⏱️ Hours';
      case 'month': return '📅 Days';
      case 'year': return '📆 Years';
      default: return type;
    }
  };

  const getRemainingValue = (item) => {
    const remaining = item.remaining_value || item.hours_remaining || item.days_remaining || item.years_remaining || 0;
    
    if (item.maintenance_type === 'hour') {
      return { value: remaining, unit: 'hours', display: `${remaining} hour${remaining !== 1 ? 's' : ''}` };
    } else if (item.maintenance_type === 'month') {
      const days = remaining;
      if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return { 
          value: days, 
          unit: 'days', 
          display: `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`
        };
      }
      return { value: days, unit: 'days', display: `${days} day${days !== 1 ? 's' : ''}` };
    } else if (item.maintenance_type === 'year') {
      return { value: remaining, unit: 'years', display: `${remaining} year${remaining !== 1 ? 's' : ''}` };
    }
    return { value: 0, unit: '', display: 'N/A' };
  };

  const getStatusStyle = (status, remainingValue) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', bg: '#fdeaea', text: '🔴 Overdue', border: '#e74c3c' };
      case 'due_soon':
        return { color: '#f39c12', bg: '#fef5e7', text: '🟡 Due Soon', border: '#f39c12' };
      case 'upcoming':
        if (remainingValue <= 30) {
          return { color: '#f39c12', bg: '#fef5e7', text: '🟡 Coming Soon', border: '#f39c12' };
        }
        return { color: '#27ae60', bg: '#eafaf1', text: '🟢 Upcoming', border: '#27ae60' };
      default:
        return { color: '#95a5a6', bg: '#f5f5f5', text: status, border: '#95a5a6' };
    }
  };

  const getProgressPercentage = (item) => {
    const interval = item.interval_value || item.service_interval_hours || 250;
    const remaining = item.remaining_value || item.hours_remaining || item.days_remaining || item.years_remaining || 0;
    const used = interval - remaining;
    if (interval <= 0) return 0;
    let percentage = (used / interval) * 100;
    if (item.status === 'overdue') percentage = 100;
    return Math.min(100, Math.max(0, percentage));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back, <strong>{user?.full_name || user?.username}</strong>!</p>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.totalParts}</h3>
          <p style={{ margin: '5px 0 0' }}>Total Parts</p>
        </div>
        
        <div style={{
          backgroundColor: stats.lowStockCount > 0 ? '#e74c3c' : '#27ae60',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.lowStockCount}</h3>
          <p style={{ margin: '5px 0 0' }}>Low Stock Alerts</p>
        </div>
        
        <div style={{
          backgroundColor: stats.maintenanceAlertCount > 0 ? '#f39c12' : '#27ae60',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.maintenanceAlertCount}</h3>
          <p style={{ margin: '5px 0 0' }}>Maintenance Items</p>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        border: lowStockParts.length > 0 ? '2px solid #e74c3c' : '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️ Low Stock Alerts</span>
          {lowStockParts.length > 0 && <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{lowStockParts.length}</span>}
        </h3>
        
        {lowStockParts.length === 0 ? (
          <p style={{ color: '#666' }}>✅ All parts are at or above minimum stock levels.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Part Number</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Description</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Current Stock</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Min Stock</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Location</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => (
                  <tr key={part.part_number} style={{ backgroundColor: '#fdeaea' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.part_number}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.description}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: '#e74c3c' }}>{part.quantity_on_hand}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.min_stock}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.location_bin || '-'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ color: '#e74c3c', fontWeight: 'bold' }}>⚠️ Critical</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Alerts Section */}
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        border: maintenanceAlerts.length > 0 ? '2px solid #f39c12' : '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔧 Maintenance Schedule</span>
          {maintenanceAlerts.length > 0 && <span style={{ backgroundColor: '#f39c12', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{maintenanceAlerts.length}</span>}
        </h3>
        
        {maintenanceAlerts.length === 0 ? (
          <p style={{ color: '#666' }}>✅ All equipment maintenance is up to date.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Equipment</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Maintenance Type</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Interval</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Remaining</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Progress</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Last Service</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map(item => {
                  const remaining = getRemainingValue(item);
                  const progress = getProgressPercentage(item);
                  let statusStyle;
                  
                  if (item.status === 'overdue') {
                    statusStyle = { color: '#e74c3c', text: '🔴 Overdue', bg: '#fdeaea' };
                  } else if (item.status === 'due_soon') {
                    statusStyle = { color: '#f39c12', text: '🟡 Due Soon', bg: '#fef5e7' };
                  } else {
                    if (remaining.value <= 30 && item.maintenance_type === 'month') {
                      statusStyle = { color: '#f39c12', text: '🟡 Coming Soon', bg: '#fef5e7' };
                    } else if (remaining.value <= 50 && item.maintenance_type === 'hour') {
                      statusStyle = { color: '#f39c12', text: '🟡 Coming Soon', bg: '#fef5e7' };
                    } else {
                      statusStyle = { color: '#27ae60', text: '🟢 Upcoming', bg: '#eafaf1' };
                    }
                  }
                  
                  return (
                    <tr key={item.id} style={{ backgroundColor: statusStyle.bg }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(item.maintenance_type)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.interval_value || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>{remaining.display}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '10px', height: '8px', width: '100%' }}>
                          <div style={{ backgroundColor: statusStyle.color === '#e74c3c' ? '#e74c3c' : statusStyle.color === '#f39c12' ? '#f39c12' : '#27ae60', width: `${progress}%`, height: '8px', borderRadius: '10px' }}></div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span></td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                        {item.last_service_value ? `${item.last_service_value} hrs` : 
                         item.last_service_date ? new Date(item.last_service_date).toLocaleDateString() : 
                         item.last_service_year || 'Not recorded'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/receive'}>
          <span style={{ fontSize: '24px' }}>📥</span>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>Receive Parts</p>
        </div>
        
        <div style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/issue'}>
          <span style={{ fontSize: '24px' }}>📤</span>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>Issue Parts</p>
        </div>
        
        <div style={{
          backgroundColor: '#f39c12',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/maintenance'}>
          <span style={{ fontSize: '24px' }}>🔧</span>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>Maintenance Schedule</p>
        </div>
        
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/reports'}>
          <span style={{ fontSize: '24px' }}>📊</span>
          <p style={{ margin: '5px 0 0', fontWeight: 'bold' }}>View Reports</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;