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

  // Demo data for preview (shows when backend data is empty)
  const demoLowStock = [
    { part_number: 'BRK-001', description: 'Brake Pad', quantity_on_hand: 2, min_stock: 10, location_bin: 'A-12' },
    { part_number: 'FLT-003', description: 'Oil Filter', quantity_on_hand: 1, min_stock: 8, location_bin: 'B-05' },
    { part_number: 'BAT-007', description: 'Battery', quantity_on_hand: 3, min_stock: 15, location_bin: 'C-08' },
    { part_number: 'HYD-002', description: 'Hydraulic Fluid', quantity_on_hand: 5, min_stock: 20, location_bin: 'D-03' }
  ];

  const demoMaintenanceAlerts = [
    { id: 1, equipment_name: 'Tow Tractor #5', equipment_type: 'Tow Tractor', maintenance_type: 'hour', status: 'overdue', remaining_value: -25, last_service_value: 1250, interval_value: 250 },
    { id: 2, equipment_name: 'GPU Unit #2', equipment_type: 'GPU', maintenance_type: 'hour', status: 'due_soon', remaining_value: 45, last_service_value: 800, interval_value: 200 },
    { id: 3, equipment_name: 'Battery Charger #3', equipment_type: 'Charger', maintenance_type: 'month', status: 'overdue', remaining_value: -5, last_service_date: '2025-01-15', interval_value: 6 },
    { id: 4, equipment_name: 'Hydraulic Test Stand', equipment_type: 'Test Equipment', maintenance_type: 'month', status: 'due_soon', remaining_value: 12, last_service_date: '2024-12-01', interval_value: 3 },
    { id: 5, equipment_name: 'Fire Extinguisher #1', equipment_type: 'Safety', maintenance_type: 'year', status: 'overdue', remaining_value: -2, last_service_year: 2023, interval_value: 1 },
    { id: 6, equipment_name: 'Annual Lift Inspection', equipment_type: 'Lifting Equipment', maintenance_type: 'year', status: 'due_soon', remaining_value: 0, last_service_year: 2024, interval_value: 1 }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch low stock parts from backend
      let lowStockData = [];
      try {
        const lowStockRes = await axios.get(`${API_URL}/api/reports/low-stock`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        lowStockData = lowStockRes.data;
      } catch (err) {
        console.log('Using demo low stock data');
        lowStockData = demoLowStock;
      }
      setLowStockParts(lowStockData.length > 0 ? lowStockData : demoLowStock);

      // Fetch maintenance data
      let maintenanceData = [];
      try {
        const maintenanceRes = await axios.get(`${API_URL}/api/gse-maintenance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        maintenanceData = maintenanceRes.data.equipment || [];
      } catch (err) {
        console.log('Using demo maintenance data');
        maintenanceData = demoMaintenanceAlerts;
      }
      
      // Filter for overdue and due soon ONLY
      let alerts = maintenanceData.filter(item => 
        item.status === 'overdue' || item.status === 'due_soon'
      );
      
      // If no alerts from backend, use demo alerts
      if (alerts.length === 0) {
        alerts = demoMaintenanceAlerts;
      }
      
      // Sort by urgency (overdue first, then by remaining value)
      const sortedAlerts = [...alerts].sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        const aRemaining = Math.abs(a.remaining_value || a.hours_remaining || a.days_remaining || a.years_remaining || 999999);
        const bRemaining = Math.abs(b.remaining_value || b.hours_remaining || b.days_remaining || b.years_remaining || 999999);
        return aRemaining - bRemaining;
      });
      
      setMaintenanceAlerts(sortedAlerts);

      // Fetch parts count
      let totalParts = 0;
      try {
        const partsRes = await axios.get(`${API_URL}/api/parts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        totalParts = partsRes.data.length;
      } catch (err) {
        totalParts = 25;
      }

      // Fetch pending approvals
      let pendingCount = 0;
      if (user?.role === 'admin' || user?.role === 'manager') {
        try {
          const pendingRes = await axios.get(`${API_URL}/api/requests/pending`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          pendingCount = pendingRes.data.requests?.length || 0;
        } catch (err) {
          pendingCount = 2;
        }
      }

      setStats({
        totalParts: totalParts,
        totalEquipment: maintenanceData.length > 0 ? maintenanceData.length : 12,
        lowStockCount: lowStockData.length > 0 ? lowStockData.length : demoLowStock.length,
        maintenanceAlertCount: sortedAlerts.length,
        pendingApprovals: pendingCount
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Use demo data on error
      setLowStockParts(demoLowStock);
      setMaintenanceAlerts(demoMaintenanceAlerts);
      setStats({
        totalParts: 25,
        totalEquipment: 12,
        lowStockCount: demoLowStock.length,
        maintenanceAlertCount: demoMaintenanceAlerts.length,
        pendingApprovals: 2
      });
      setLoading(false);
    }
  };

  const getMaintenanceTypeIcon = (type) => {
    switch(type) {
      case 'hour': return { icon: '⏱️', text: 'Hour-based', unit: 'hours' };
      case 'month': return { icon: '📅', text: 'Month-based', unit: 'days' };
      case 'year': return { icon: '📆', text: 'Year-based', unit: 'years' };
      default: return { icon: '🔧', text: type, unit: '' };
    }
  };

  const getRemainingDisplay = (item) => {
    const isOverdue = item.status === 'overdue';
    const remaining = Math.abs(item.remaining_value || item.hours_remaining || item.days_remaining || item.years_remaining || 0);
    
    if (item.maintenance_type === 'hour') {
      return isOverdue ? `${remaining} hours overdue` : `${remaining} hours remaining`;
    } else if (item.maintenance_type === 'month') {
      if (remaining >= 30) {
        const months = Math.floor(remaining / 30);
        const days = remaining % 30;
        if (isOverdue) {
          return `${months} month${months !== 1 ? 's' : ''}${days > 0 ? `, ${days} day${days !== 1 ? 's' : ''}` : ''} overdue`;
        }
        return `${months} month${months !== 1 ? 's' : ''}${days > 0 ? `, ${days} day${days !== 1 ? 's' : ''}` : ''} remaining`;
      }
      return isOverdue ? `${remaining} days overdue` : `${remaining} days remaining`;
    } else if (item.maintenance_type === 'year') {
      return isOverdue ? `${remaining} year${remaining !== 1 ? 's' : ''} overdue` : `${remaining} year${remaining !== 1 ? 's' : ''} remaining`;
    }
    return isOverdue ? 'Overdue' : 'Upcoming';
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', bg: '#fdeaea', text: '🔴 Overdue', border: '#e74c3c' };
      case 'due_soon':
        return { color: '#f39c12', bg: '#fef5e7', text: '🟡 Due Soon', border: '#f39c12' };
      default:
        return { color: '#95a5a6', bg: '#f5f5f5', text: status, border: '#95a5a6' };
    }
  };

  const getProgressPercentage = (item) => {
    const interval = item.interval_value || 250;
    let remaining = Math.abs(item.remaining_value || item.hours_remaining || item.days_remaining || item.years_remaining || 0);
    
    if (item.status === 'overdue') {
      return 100;
    }
    
    let used = interval - remaining;
    if (used < 0) used = 0;
    if (used > interval) used = interval;
    return Math.min(100, Math.max(0, (used / interval) * 100));
  };

  const getLastServiceDisplay = (item) => {
    if (item.last_service_value) {
      return `${item.last_service_value} hrs`;
    }
    if (item.last_service_date) {
      return new Date(item.last_service_date).toLocaleDateString();
    }
    if (item.last_service_year) {
      return item.last_service_year;
    }
    return 'Not recorded';
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
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.totalParts}</h3>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Total Parts</p>
        </div>
        
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
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
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>{part.part_number}</strong></td>
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
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Last Service</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Interval</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ border: '1px solid #e67e22', padding: '10px', textAlign: 'left' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceAlerts.map(item => {
                  const typeInfo = getMaintenanceTypeIcon(item.maintenance_type);
                  const statusStyle = getStatusStyle(item.status);
                  const remainingDisplay = getRemainingDisplay(item);
                  const progress = getProgressPercentage(item);
                  const lastService = getLastServiceDisplay(item);
                  const interval = item.interval_value || (item.maintenance_type === 'hour' ? 250 : item.maintenance_type === 'month' ? 6 : 1);
                  
                  return (
                    <tr key={item.id} style={{ backgroundColor: statusStyle.bg }}>
                      <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type || '-'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{typeInfo.icon} {typeInfo.text}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{lastService}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>Every {interval} {typeInfo.unit}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <span style={{ color: statusStyle.color, fontWeight: 'bold' }}>
                          {statusStyle.text}<br/>
                          <span style={{ fontSize: '11px' }}>({remainingDisplay})</span>
                        </span>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '10px', height: '8px', width: '100%' }}>
                          <div style={{ backgroundColor: statusStyle.color === '#e74c3c' ? '#e74c3c' : '#f39c12', width: `${progress}%`, height: '8px', borderRadius: '10px' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#666' }}>{Math.round(progress)}% used</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Info Note about Demo Data */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '5px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        ℹ️ Dashboard shows demo data for preview. Connect to backend for live data.
      </div>
    </div>
  );
};

export default Dashboard;