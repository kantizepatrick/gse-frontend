import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token, user }) => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParts: 0,
    totalTransactions: 0,
    pendingApprovals: 0
  });

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const lowStockRes = await axios.get(`${API_URL}/api/reports/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockParts(lowStockRes.data);

      const maintenanceRes = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMaintenance = maintenanceRes.data.equipment || [];
      const alerts = allMaintenance.filter(item => 
        item.status === 'overdue' || item.status === 'due_soon'
      );
      setMaintenanceAlerts(alerts);

      const partsRes = await axios.get(`${API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let pendingCount = 0;
      if (user?.role === 'admin' || user?.role === 'manager') {
        const pendingRes = await axios.get(`${API_URL}/api/requests/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        pendingCount = pendingRes.data.requests?.length || 0;
      }

      setStats({
        totalParts: partsRes.data.length,
        totalTransactions: 0,
        pendingApprovals: pendingCount
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const getMaintenanceTypeIcon = (type) => {
    switch(type) {
      case 'hour': return '⏱️ Hour-based';
      case 'month': return '📅 Month-based';
      case 'year': return '📆 Year-based';
      case 'none': return '⭕ No maintenance';
      default: return type;
    }
  };

  // CLEANED: Removed "DUE SOON" and "OVERDUE" text from remaining column
  const getRemainingDisplay = (item) => {
    if (item.maintenance_type === 'hour') {
      const hrs = item.remaining_hours || 0;
      const days = item.days_remaining || 0;
      
      if (item.status === 'overdue') {
        if (hrs > 0 && days > 0) {
          return `${Math.abs(hrs)} hours overdue / ${Math.abs(days)} days overdue`;
        } else if (hrs > 0) {
          return `${Math.abs(hrs)} hours overdue`;
        } else if (days > 0) {
          return `${Math.abs(days)} days overdue`;
        }
        return 'Overdue';
      }
      if (item.status === 'due_soon') {
        if (hrs > 0 && days > 0) {
          return `${hrs} hours / ${days} days remaining`;
        } else if (hrs > 0) {
          return `${hrs} hours remaining`;
        } else if (days > 0) {
          return `${days} days remaining`;
        }
        return 'Due soon';
      }
      if (hrs > 0 && days > 0) {
        return `${hrs} hours / ${days} days until service`;
      } else if (hrs > 0) {
        return `${hrs} hours until service`;
      } else if (days > 0) {
        return `${days} days until service`;
      }
      return 'Up to date';
    } else if (item.maintenance_type === 'month') {
      const days = item.days_remaining || 0;
      if (item.status === 'overdue') {
        return `${Math.abs(days)} days overdue`;
      }
      if (item.status === 'due_soon') {
        return `${days} days remaining`;
      }
      return `${days} days until service`;
    } else if (item.maintenance_type === 'year') {
      const days = item.days_remaining_year || 0;
      const years = item.years_remaining || 0;
      if (item.status === 'overdue') {
        return `${Math.abs(years)} years overdue`;
      }
      if (item.status === 'due_soon') {
        if (days > 0) {
          return `${days} days remaining`;
        }
        return `Due this year`;
      }
      if (days > 0 && days < 365) {
        return `${days} days until service`;
      }
      return `${years} years until service`;
    }
    return 'N/A';
  };

  const getAlertReason = (item) => {
    if (item.alert_reason) {
      return item.alert_reason;
    }
    if (item.maintenance_type === 'hour' && item.status === 'due_soon') {
      const hrs = item.remaining_hours || 0;
      const days = item.days_remaining || 0;
      if (hrs > 0 && days > 0) {
        return `${hrs} hours OR ${days} days remaining`;
      } else if (hrs > 0) {
        return `${hrs} hours remaining`;
      } else if (days > 0) {
        return `${days} days remaining`;
      }
    } else if (item.maintenance_type === 'hour' && item.status === 'overdue') {
      const hrs = item.remaining_hours || 0;
      const days = item.days_remaining || 0;
      if (hrs <= 0 && days <= 0) {
        return `Both hours and date overdue`;
      } else if (hrs <= 0) {
        return `Hours exceeded target`;
      } else if (days <= 0) {
        return `Service date passed`;
      }
    }
    return '';
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', bg: '#fdeaea', text: '🔴 OVERDUE' };
      case 'due_soon':
        return { color: '#f39c12', bg: '#fef5e7', text: '🟡 DUE SOON' };
      default:
        return { color: '#95a5a6', bg: '#f5f5f5', text: status };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard...</div>;
  }

  const isApprover = user?.role === 'admin' || user?.role === 'manager';

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
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.totalParts}</h3>
          <p style={{ margin: '5px 0 0' }}>Total Parts</p>
        </div>
        
        {isApprover && (
          <div style={{
            backgroundColor: stats.pendingApprovals > 0 ? '#e74c3c' : '#27ae60',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.pendingApprovals}</h3>
            <p style={{ margin: '5px 0 0' }}>Pending Approvals</p>
          </div>
        )}
        
        <div style={{
          backgroundColor: lowStockParts.length > 0 ? '#e74c3c' : '#27ae60',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{lowStockParts.length}</h3>
          <p style={{ margin: '5px 0 0' }}>Low Stock Alerts</p>
        </div>
        
        <div style={{
          backgroundColor: maintenanceAlerts.length > 0 ? '#f39c12' : '#27ae60',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{maintenanceAlerts.length}</h3>
          <p style={{ margin: '5px 0 0' }}>Maintenance Alerts</p>
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
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => (
                  <tr key={part.part_number} style={{ backgroundColor: '#fdeaea' }}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.part_number}</table>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.description}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: '#e74c3c' }}>{part.quantity_on_hand}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.min_stock}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.location_bin || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Alerts Section - Cleaned */}
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        border: maintenanceAlerts.length > 0 ? '2px solid #f39c12' : '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔧 Maintenance Alerts</span>
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
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Remaining</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Alert Reason</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map(item => {
                  const statusStyle = getStatusStyle(item.status);
                  const remainingDisplay = getRemainingDisplay(item);
                  const alertReason = getAlertReason(item);
                  
                  return (
                    <tr key={item.id} style={{ backgroundColor: statusStyle.bg }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(item.maintenance_type)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>
                        {remainingDisplay}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', color: statusStyle.color }}>
                        {alertReason}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: '#e8f4fd',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px',
        border: '1px solid #bde0fe'
      }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          <strong>🔔 How Alerts Work (Dual Condition):</strong><br />
          ⏱️ <strong>Hour-based:</strong> Alert triggers when ≤ 40 hours remaining to target OR ≤ 4 days to service date – <strong>whichever comes FIRST</strong><br />
          📅 <strong>Month-based:</strong> Alert triggers when ≤ 4 days remaining to service date<br />
          📆 <strong>Year-based:</strong> Alert triggers when ≤ 30 days remaining to service year<br />
          🟡 <strong>Due Soon:</strong> Service is approaching | 🔴 <strong>Overdue:</strong> Service date passed OR hours exceeded target
        </p>
      </div>
    </div>
  );
};

export default Dashboard;