import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token, user }) => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParts: 0,
    totalEquipment: 0,
    lowStockCount: 0,
    maintenanceAlertCount: 0,
    pendingApprovals: 0
  });

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch low stock parts
      const lowStockRes = await axios.get(`${API_URL}/api/reports/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockParts(lowStockRes.data || []);

      // Fetch maintenance data
      const maintenanceRes = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allMaintenance = maintenanceRes.data.equipment || [];
      
      // Filter for overdue and due soon ONLY
      const overdueAndDueSoon = allMaintenance.filter(item => 
        item.status === 'overdue' || item.status === 'due_soon'
      );
      
      // Format maintenance alerts
      const formattedAlerts = overdueAndDueSoon.map(item => ({
        id: item.id,
        equipment_name: item.equipment_name,
        equipment_type: item.equipment_type || '-',
        maintenance_type: item.maintenance_type,
        status: item.status,
        last_service: getLastServiceDisplay(item),
        interval: getIntervalDisplay(item),
        next_due: getNextDueDisplay(item),
        remaining: getRemainingText(item)
      }));
      
      // Sort by urgency (overdue first, then by remaining value)
      const sortedAlerts = [...formattedAlerts].sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        return 0;
      });
      
      setMaintenanceAlerts(sortedAlerts);

      // Fetch parts count
      const partsRes = await axios.get(`${API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch pending approvals
      let pendingCount = 0;
      if (user?.role === 'admin' || user?.role === 'manager') {
        const pendingRes = await axios.get(`${API_URL}/api/requests/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        pendingCount = pendingRes.data.requests?.length || 0;
      }

      setStats({
        totalParts: partsRes.data.length,
        totalEquipment: allMaintenance.length,
        lowStockCount: lowStockRes.data?.length || 0,
        maintenanceAlertCount: sortedAlerts.length,
        pendingApprovals: pendingCount
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const getLastServiceDisplay = (item) => {
    if (item.last_service_value) {
      return `${item.last_service_value} hrs`;
    }
    if (item.last_service_date) {
      const date = new Date(item.last_service_date);
      return date.toLocaleDateString();
    }
    if (item.last_service_year) {
      return item.last_service_year;
    }
    return 'Not recorded';
  };

  const getIntervalDisplay = (item) => {
    if (item.maintenance_type === 'hour') {
      return `${item.service_interval_hours || item.interval_value || 250} hrs`;
    } else if (item.maintenance_type === 'month') {
      return `${item.service_interval_months || item.interval_value || 6} months`;
    } else if (item.maintenance_type === 'year') {
      return `${item.service_interval_years || item.interval_value || 1} year(s)`;
    }
    return '-';
  };

  const getNextDueDisplay = (item) => {
    if (item.maintenance_type === 'hour') {
      const lastHours = item.last_service_value || 0;
      const interval = item.service_interval_hours || item.interval_value || 250;
      const nextDue = lastHours + interval;
      return `${nextDue} hrs`;
    } else if (item.maintenance_type === 'month') {
      if (item.next_service_date) {
        const date = new Date(item.next_service_date);
        return date.toLocaleDateString();
      }
      return 'Calculating...';
    } else if (item.maintenance_type === 'year') {
      return item.next_service_year || 'Calculating...';
    }
    return '-';
  };

  const getRemainingText = (item) => {
    const isOverdue = item.status === 'overdue';
    
    if (item.maintenance_type === 'hour') {
      const remaining = item.hours_remaining || item.remaining_value || 0;
      const absRemaining = Math.abs(remaining);
      return isOverdue ? `${absRemaining} hrs overdue` : `${absRemaining} hrs remaining`;
    } else if (item.maintenance_type === 'month') {
      const remaining = item.days_remaining || item.remaining_value || 0;
      const absRemaining = Math.abs(remaining);
      if (absRemaining >= 30) {
        const months = Math.floor(absRemaining / 30);
        const days = absRemaining % 30;
        if (isOverdue) {
          return `${months}m ${days}d overdue`;
        }
        return `${months}m ${days}d remaining`;
      }
      return isOverdue ? `${absRemaining} days overdue` : `${absRemaining} days remaining`;
    } else if (item.maintenance_type === 'year') {
      const remaining = item.years_remaining || item.remaining_value || 0;
      const absRemaining = Math.abs(remaining);
      return isOverdue ? `${absRemaining} year(s) overdue` : `${absRemaining} year(s) remaining`;
    }
    return isOverdue ? 'Overdue' : 'Upcoming';
  };

  const getMaintenanceTypeIcon = (type) => {
    switch(type) {
      case 'hour': return '⏱️ Hours';
      case 'month': return '📅 Months';
      case 'year': return '📆 Years';
      default: return type;
    }
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
  const totalAlerts = stats.lowStockCount + stats.maintenanceAlertCount;

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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.totalParts}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Total Parts</p>
        </div>
        
        <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.totalEquipment}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Equipment Tracked</p>
        </div>
        
        {isApprover && (
          <div style={{
            backgroundColor: stats.pendingApprovals > 0 ? '#e74c3c' : '#27ae60',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.pendingApprovals}</h3>
            <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Pending Approvals</p>
          </div>
        )}
        
        <div style={{
            backgroundColor: stats.lowStockCount > 0 ? '#e74c3c' : '#27ae60',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.lowStockCount}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Low Stock Alerts</p>
        </div>
        
        <div style={{
            backgroundColor: stats.maintenanceAlertCount > 0 ? '#f39c12' : '#27ae60',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.maintenanceAlertCount}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Maintenance Alerts</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>⚠️ Low Stock Alerts</h3>
          {lowStockParts.length > 0 && (
            <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              {lowStockParts.length}
            </span>
          )}
        </div>
        
        {lowStockParts.length === 0 ? (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
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
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Shortage</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Location</th>
                  <th style={{ border: '1px solid #c0392b', padding: '10px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => {
                  const shortage = part.min_stock - part.quantity_on_hand;
                  return (
                    <tr key={part.part_number} style={{ backgroundColor: '#fdeaea' }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{part.part_number}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.description}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: '#e74c3c', fontSize: '16px' }}>{part.quantity_on_hand}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.min_stock}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: '#e74c3c' }}>↓ {shortage} units</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{part.location_bin || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '3px', fontSize: '12px' }}>⚠️ CRITICAL</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Alerts Section - Overdue & Due Soon */}
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
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
            ✅ No overdue or due soon maintenance items. All equipment is on track.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f39c12', color: 'white' }}>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Equipment</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Maint Type</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Last Service</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Interval</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Next Due</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Remaining</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map(item => {
                  const statusStyle = getStatusStyle(item.status);
                  return (
                    <tr key={item.id} style={{ backgroundColor: statusStyle.bg }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(item.maintenance_type)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.last_service}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.interval}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.next_due}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>{item.remaining}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <span style={{ backgroundColor: statusStyle.color === '#e74c3c' ? '#e74c3c' : '#f39c12', color: 'white', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                          {statusStyle.text}
                        </span>
                      </td>
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