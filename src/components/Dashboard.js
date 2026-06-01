import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token, user }) => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch maintenance data and filter for overdue and due soon only
      const maintenanceRes = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMaintenance = maintenanceRes.data.equipment || [];
      
      // Filter for overdue and due soon ONLY
      const overdueAndDueSoon = allMaintenance.filter(item => 
        item.status === 'overdue' || item.status === 'due_soon'
      );
      
      // Sort by urgency (overdue first, then by remaining value)
      const sortedAlerts = [...overdueAndDueSoon].sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        const aRemaining = a.hours_remaining || a.days_remaining || a.years_remaining || a.remaining_value || 999999;
        const bRemaining = b.hours_remaining || b.days_remaining || b.years_remaining || b.remaining_value || 999999;
        return aRemaining - bRemaining;
      });
      
      setMaintenanceAlerts(sortedAlerts);
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

  const getRemainingDisplay = (item) => {
    if (item.maintenance_type === 'hour') {
      const remaining = item.hours_remaining || item.remaining_value || 0;
      return `${remaining} hour${remaining !== 1 ? 's' : ''}`;
    } else if (item.maintenance_type === 'month') {
      const remaining = item.days_remaining || item.remaining_value || 0;
      if (remaining >= 30) {
        const months = Math.floor(remaining / 30);
        const days = remaining % 30;
        return `${months} month${months !== 1 ? 's' : ''}${days > 0 ? `, ${days} day${days !== 1 ? 's' : ''}` : ''}`;
      }
      return `${remaining} day${remaining !== 1 ? 's' : ''}`;
    } else if (item.maintenance_type === 'year') {
      const remaining = item.years_remaining || item.remaining_value || 0;
      return `${remaining} year${remaining !== 1 ? 's' : ''}`;
    }
    return 'N/A';
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', bg: '#fdeaea', text: '🔴 Overdue' };
      case 'due_soon':
        return { color: '#f39c12', bg: '#fef5e7', text: '🟡 Due Soon' };
      default:
        return { color: '#95a5a6', bg: '#f5f5f5', text: status };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard...</div>;
  }

  const totalAlerts = lowStockParts.length + maintenanceAlerts.length;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Dashboard</h2>
        <p style={{ color: '#666' }}>
          Welcome back, <strong>{user?.full_name || user?.username}</strong>!
          {totalAlerts > 0 && (
            <span style={{ marginLeft: '10px', color: '#e74c3c' }}>
              You have {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''} requiring attention.
            </span>
          )}
        </p>
      </div>

      {/* Low Stock Alerts Section */}
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        border: lowStockParts.length > 0 ? '2px solid #e74c3c' : '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>⚠️ Low Stock Alerts</h3>
          {lowStockParts.length > 0 && (
            <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              {lowStockParts.length}
            </span>
          )}
        </div>
        
        {lowStockParts.length === 0 ? (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '15px', 
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            ✅ All parts are at or above minimum stock levels.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Part Number</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Description</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Current Stock</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Min Stock</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Location</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Status</th>
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

      {/* Maintenance Alerts Section - ONLY Overdue & Due Soon */}
      <div style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        border: maintenanceAlerts.length > 0 ? '2px solid #f39c12' : '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>🔧 Maintenance Alerts</h3>
          {maintenanceAlerts.length > 0 && (
            <span style={{ backgroundColor: '#f39c12', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              {maintenanceAlerts.length}
            </span>
          )}
        </div>
        
        {maintenanceAlerts.length === 0 ? (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '15px', 
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            ✅ No overdue or due soon maintenance items. All equipment is on track.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f39c12', color: 'white' }}>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Equipment</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Maintenance Type</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Remaining</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Last Service</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map(item => {
                  const statusStyle = getStatusStyle(item.status);
                  const remaining = getRemainingDisplay(item);
                  
                  let lastServiceDisplay = 'Not recorded';
                  if (item.last_service_value) {
                    lastServiceDisplay = `${item.last_service_value} hrs`;
                  } else if (item.last_service_date) {
                    lastServiceDisplay = new Date(item.last_service_date).toLocaleDateString();
                  } else if (item.last_service_year) {
                    lastServiceDisplay = item.last_service_year;
                  }
                  
                  return (
                    <tr key={item.id} style={{ backgroundColor: statusStyle.bg }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(item.maintenance_type)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>{remaining}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span></td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>{lastServiceDisplay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;