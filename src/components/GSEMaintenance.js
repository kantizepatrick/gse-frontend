import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GSEMaintenance = ({ token, user }) => {
  const [equipment, setEquipment] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [newEquipment, setNewEquipment] = useState({
    equipment_name: '',
    equipment_type: '',
    maintenance_type: 'hour',
    service_interval_hours: 250,
    last_service_date: new Date().toISOString().split('T')[0],
    service_interval_months: 6,
    last_service_year: new Date().getFullYear(),
    service_interval_years: 1,
    service_performed: '',
    technician_name: '',
    notes: ''
  });
  
  const [serviceData, setServiceData] = useState({
    service_performed: '',
    technician_name: '',
    notes: '',
    service_interval_hours: 250,
    service_interval_months: 6,
    service_interval_years: 1,
    update_method: 'date',
    custom_service_date: new Date().toISOString().split('T')[0],
    custom_current_hours: ''
  });

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchEquipment();
    const interval = setInterval(() => {
      fetchEquipment();
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEquipment(response.data.equipment || []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to load maintenance data');
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/gse-maintenance`, newEquipment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Equipment added to maintenance schedule!');
      setShowAddForm(false);
      fetchEquipment();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding equipment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordService = async (e, equipId) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentEquip = equipment.find(eq => eq.id === equipId);
      const payload = {
        service_performed: serviceData.service_performed,
        technician_name: serviceData.technician_name,
        notes: serviceData.notes
      };
      
      if (currentEquip.maintenance_type === 'hour') {
        payload.service_interval_hours = parseInt(serviceData.service_interval_hours);
        
        if (serviceData.update_method === 'hours' && serviceData.custom_current_hours) {
          payload.custom_current_hours = parseInt(serviceData.custom_current_hours);
        } else {
          payload.custom_service_date = serviceData.custom_service_date;
        }
      } else if (currentEquip.maintenance_type === 'month') {
        payload.service_interval_months = parseInt(serviceData.service_interval_months);
        payload.custom_service_date = serviceData.custom_service_date;
      } else if (currentEquip.maintenance_type === 'year') {
        payload.service_interval_years = parseInt(serviceData.service_interval_years);
        payload.custom_service_date = serviceData.custom_service_date;
      }
      
      await axios.post(`${API_URL}/api/gse-maintenance/${equipId}/service`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Service recorded successfully! Status updated to SERVICED.');
      setShowServiceForm(null);
      setServiceData({
        service_performed: '',
        technician_name: '',
        notes: '',
        service_interval_hours: 250,
        service_interval_months: 6,
        service_interval_years: 1,
        update_method: 'date',
        custom_service_date: new Date().toISOString().split('T')[0],
        custom_current_hours: ''
      });
      fetchEquipment();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Error recording service:', err);
      setError(err.response?.data?.error || 'Error recording service');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipId, equipName) => {
    if (window.confirm(`Delete "${equipName}" from maintenance schedule?`)) {
      try {
        await axios.delete(`${API_URL}/api/gse-maintenance/${equipId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`"${equipName}" removed from schedule`);
        fetchEquipment();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting equipment');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getMaintenanceTypeIcon = (type) => {
    switch(type) {
      case 'hour': return '⏱️ Hour (10 hrs/day)';
      case 'month': return '📅 Month';
      case 'year': return '📆 Year';
      case 'none': return '⭕ None';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', text: '🔴 OVERDUE', bg: '#fdeaea' };
      case 'due_soon':
        return { color: '#f39c12', text: '🟡 DUE SOON', bg: '#fef5e7' };
      case 'serviced':
        return { color: '#27ae60', text: '✅ SERVICED', bg: '#eafaf1' };
      case 'no_maintenance':
        return { color: '#95a5a6', text: '⚪ No Maintenance', bg: '#f5f5f5' };
      default:
        return { color: '#95a5a6', text: status, bg: '#f5f5f5' };
    }
  };

  const getStatusDescription = (eq) => {
    if (eq.maintenance_type === 'hour') {
      if (eq.status === 'overdue') return `🔴 OVERDUE by ${eq.daysOverdue || 0} days (${Math.abs(eq.remaining_hours || 0)} hours)`;
      if (eq.status === 'due_soon') return `🟡 DUE SOON - Only ${eq.remaining_hours || 0} hours remaining (≤ 40 hours)`;
      return `✅ SERVICED - ${eq.current_hours || 0} hours used, next service in ${eq.remaining_hours || 0} hours`;
    } else if (eq.maintenance_type === 'month') {
      if (eq.status === 'overdue') return `🔴 OVERDUE by ${eq.daysOverdue || 0} days`;
      if (eq.status === 'due_soon') return `🟡 DUE SOON - Only ${eq.days_remaining || 0} days remaining (≤ 4 days)`;
      return `✅ SERVICED - Next service in ${eq.days_remaining || 0} days`;
    } else if (eq.maintenance_type === 'year') {
      if (eq.status === 'overdue') return '🔴 OVERDUE - Service year passed';
      if (eq.status === 'due_soon') return '🟡 DUE SOON - Service due this year';
      return `✅ SERVICED - Next service in ${eq.years_remaining || 0} years`;
    }
    return '';
  };

  const getRemainingDisplay = (eq) => {
    if (eq.maintenance_type === 'hour') {
      const hrs = eq.remaining_hours || 0;
      const days = Math.ceil(hrs / 10);
      if (eq.status === 'overdue') {
        return `🔴 ${Math.abs(hrs)} hrs overdue (${eq.daysOverdue || 0} days)`;
      }
      if (eq.status === 'due_soon') {
        return `🟡 ${hrs} hrs left (${days} days) - DUE SOON!`;
      }
      return `✅ ${hrs} hrs (${days} days) until next service`;
    } else if (eq.maintenance_type === 'month') {
      const days = eq.days_remaining || 0;
      const weeks = (days / 7).toFixed(1);
      if (eq.status === 'overdue') {
        return `🔴 ${eq.daysOverdue || 0} days overdue`;
      }
      if (eq.status === 'due_soon') {
        return `🟡 ${days} days (${weeks} weeks) - DUE SOON!`;
      }
      return `✅ ${days} days (${weeks} weeks) until next service`;
    } else if (eq.maintenance_type === 'year') {
      if (eq.status === 'overdue') return '🔴 OVERDUE';
      if (eq.status === 'due_soon') return '🟡 DUE THIS YEAR';
      return `✅ ${eq.years_remaining || 0} yrs until next service`;
    }
    return 'N/A';
  };

  const calculateNextDuePreview = () => {
    if (!showServiceForm) return '';
    
    if (showServiceForm.maintenance_type === 'hour') {
      if (serviceData.update_method === 'hours' && serviceData.custom_current_hours) {
        const currentHours = parseInt(serviceData.custom_current_hours);
        const intervalHours = parseInt(serviceData.service_interval_hours);
        const nextHours = currentHours + intervalHours;
        const hoursUntilDue = intervalHours;
        
        if (hoursUntilDue <= 40) {
          return `⚠️ DUE SOON: ${hoursUntilDue} hours from now (Next service at ${nextHours} hours)`;
        }
        return `Next service due at ${nextHours} hours (${hoursUntilDue} hours from now)`;
      } else {
        const serviceDate = new Date(serviceData.custom_service_date);
        const daysToAdd = Math.ceil(serviceData.service_interval_hours / 10);
        const nextDate = new Date(serviceDate);
        nextDate.setDate(serviceDate.getDate() + daysToAdd);
        const today = new Date();
        const daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        const hoursUntilDue = daysUntilDue * 10;
        
        if (hoursUntilDue <= 40) {
          return `⚠️ DUE SOON: ${hoursUntilDue} hours remaining (Due on ${nextDate.toLocaleDateString()})`;
        }
        return `Next service due on ${nextDate.toLocaleDateString()} (${daysUntilDue} days from now)`;
      }
    } else if (showServiceForm.maintenance_type === 'month') {
      const serviceDate = new Date(serviceData.custom_service_date);
      const nextDate = new Date(serviceDate);
      nextDate.setDate(serviceDate.getDate() + parseInt(serviceData.service_interval_months) * 30);
      const today = new Date();
      const daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 4) {
        return `⚠️ DUE SOON: ${daysUntilDue} days remaining (Due on ${nextDate.toLocaleDateString()})`;
      }
      return `Next service due on ${nextDate.toLocaleDateString()} (${daysUntilDue} days from now)`;
    } else if (showServiceForm.maintenance_type === 'year') {
      const serviceYear = parseInt(serviceData.custom_service_date.split('-')[0]);
      const nextYear = serviceYear + parseInt(serviceData.service_interval_years);
      const currentYear = new Date().getFullYear();
      
      if (nextYear === currentYear) {
        return `⚠️ DUE SOON: Service due THIS YEAR (${nextYear})`;
      }
      return `Next service due in year ${nextYear} (${nextYear - currentYear} years from now)`;
    }
    return '';
  };

  const filteredEquipment = equipment.filter(eq => {
    if (filter !== 'all' && eq.status !== filter) return false;
    if (maintenanceTypeFilter !== 'all' && eq.maintenance_type !== maintenanceTypeFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🔧 GSE Maintenance Schedule</h2>
        <div>
          <span style={{ fontSize: '12px', color: '#666', marginRight: '10px' }}>
            🔄 Auto-updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
            {showAddForm ? 'Cancel' : '+ Add Equipment'}
          </button>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ backgroundColor: filter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Status</button>
        <button onClick={() => setFilter('overdue')} style={{ backgroundColor: filter === 'overdue' ? '#e74c3c' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🔴 Overdue</button>
        <button onClick={() => setFilter('due_soon')} style={{ backgroundColor: filter === 'due_soon' ? '#f39c12' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🟡 Due Soon</button>
        <button onClick={() => setFilter('serviced')} style={{ backgroundColor: filter === 'serviced' ? '#27ae60' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✅ Serviced</button>
      </div>
      
      {/* Maintenance Type Filter Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setMaintenanceTypeFilter('all')} style={{ backgroundColor: maintenanceTypeFilter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Types</button>
        <button onClick={() => setMaintenanceTypeFilter('hour')} style={{ backgroundColor: maintenanceTypeFilter === 'hour' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>⏱️ Hour-based</button>
        <button onClick={() => setMaintenanceTypeFilter('month')} style={{ backgroundColor: maintenanceTypeFilter === 'month' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📅 Month-based</button>
        <button onClick={() => setMaintenanceTypeFilter('year')} style={{ backgroundColor: maintenanceTypeFilter === 'year' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📆 Year-based</button>
        <button onClick={() => setMaintenanceTypeFilter('none')} style={{ backgroundColor: maintenanceTypeFilter === 'none' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>⭕ No Maintenance</button>
      </div>

      {/* Info Banner */}
      <div style={{ backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #bee5eb' }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          <strong>🔄 Status Definitions:</strong><br />
          ✅ <strong>SERVICED:</strong> Equipment has been recently serviced, next service is more than 4 days away or more than 40 hours remaining<br />
          🟡 <strong>DUE SOON:</strong> Service needed within 4 days or 40 hours<br />
          🔴 <strong>OVERDUE:</strong> Service date has passed or hours exceeded<br />
          📅 <strong>Automatic calculation:</strong> Next service = Last service date + Interval
        </p>
      </div>

      {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #f5c6cb' }}>{error}</div>}

      {/* Add Equipment Form */}
      {showAddForm && (
        <form onSubmit={handleAddEquipment} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
          <h3>Add GSE Equipment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold' }}>Equipment Name *</label>
              <input type="text" required value={newEquipment.equipment_name} onChange={(e) => setNewEquipment({...newEquipment, equipment_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>Equipment Type</label>
              <input type="text" value={newEquipment.equipment_type} onChange={(e) => setNewEquipment({...newEquipment, equipment_type: e.target.value})} placeholder="e.g., Tow Tractor, GPU" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>Maintenance Type *</label>
              <select value={newEquipment.maintenance_type} onChange={(e) => setNewEquipment({...newEquipment, maintenance_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="hour">⏱️ Hour-based (10 hours/day)</option>
                <option value="month">📅 Month-based</option>
                <option value="year">📆 Year-based</option>
                <option value="none">⭕ No maintenance</option>
              </select>
            </div>
            <div></div>
          </div>
          
          {newEquipment.maintenance_type === 'hour' && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Service Interval (hours)</label>
              <input type="number" value={newEquipment.service_interval_hours} onChange={(e) => setNewEquipment({...newEquipment, service_interval_hours: parseInt(e.target.value) || 250})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              <small style={{ color: '#666' }}>Hours increase by 10 every day from service date</small>
            </div>
          )}
          
          {newEquipment.maintenance_type === 'month' && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Service Interval (months)</label>
              <input type="number" value={newEquipment.service_interval_months} onChange={(e) => setNewEquipment({...newEquipment, service_interval_months: parseInt(e.target.value) || 6})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
          )}
          
          {newEquipment.maintenance_type === 'year' && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Service Interval (years)</label>
              <input type="number" value={newEquipment.service_interval_years} onChange={(e) => setNewEquipment({...newEquipment, service_interval_years: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Initial Service Performed</label>
            <input type="text" value={newEquipment.service_performed} onChange={(e) => setNewEquipment({...newEquipment, service_performed: e.target.value})} placeholder="e.g., Initial inspection" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Technician Name</label>
            <input type="text" value={newEquipment.technician_name} onChange={(e) => setNewEquipment({...newEquipment, technician_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Notes</label>
            <textarea value={newEquipment.notes} onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})} rows="2" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Add Equipment</button>
        </form>
      )}

      {/* Main Equipment Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Equipment</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maint Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>📅 Last Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>⏰ Current Status</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Interval</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Remaining</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.map(eq => {
              const statusStyle = getStatusBadge(eq.status);
              return (
                <tr key={eq.id} style={{ backgroundColor: statusStyle.bg }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{eq.equipment_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{eq.equipment_type || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(eq.maintenance_type)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                    {eq.maintenance_type === 'hour' && eq.last_service_date && `${eq.last_service_date} (${eq.current_hours || 0} hrs used)`}
                    {eq.maintenance_type === 'hour' && !eq.last_service_date && 'Not recorded'}
                    {eq.maintenance_type === 'month' && (eq.last_service_date || 'Not recorded')}
                    {eq.maintenance_type === 'year' && (eq.last_service_year || 'Not recorded')}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', color: '#666' }}>
                    {getStatusDescription(eq)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.maintenance_type === 'hour' && `${eq.service_interval_hours || 250} hrs`}
                    {eq.maintenance_type === 'month' && `${eq.service_interval_months || 6} months`}
                    {eq.maintenance_type === 'year' && `${eq.service_interval_years || 1} year(s)`}
                    {eq.maintenance_type === 'none' && '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>
                    {getRemainingDisplay(eq)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.maintenance_type !== 'none' && (
                      <button onClick={() => {
                        setShowServiceForm(eq);
                        setServiceData({
                          ...serviceData,
                          service_interval_hours: eq.service_interval_hours || 250,
                          service_interval_months: eq.service_interval_months || 6,
                          service_interval_years: eq.service_interval_years || 1,
                          custom_service_date: new Date().toISOString().split('T')[0],
                          custom_current_hours: eq.current_hours || 0,
                          update_method: 'date'
                        });
                      }} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                        🔧 Record Service
                      </button>
                    )}
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => handleDeleteEquipment(eq.id, eq.equipment_name)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Service Modal */}
      {showServiceForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '650px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>🔧 Record Service for: {showServiceForm.equipment_name}</h3>
            <p>Maintenance Type: <strong>{getMaintenanceTypeIcon(showServiceForm.maintenance_type)}</strong></p>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Current last service: {showServiceForm.last_service_date || showServiceForm.last_service_year || 'Not recorded'}
            </p>
            
            <form onSubmit={(e) => handleRecordService(e, showServiceForm.id)}>
              
              {showServiceForm.maintenance_type === 'hour' && (
                <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '1px solid #bde0fe' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📌 How do you want to update?</label>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '5px', backgroundColor: serviceData.update_method === 'date' ? '#d4edda' : 'transparent' }}>
                      <input type="radio" name="updateMethod" checked={serviceData.update_method === 'date'} onChange={() => setServiceData({...serviceData, update_method: 'date'})} />
                      📅 <strong>Update by Date</strong>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '5px', backgroundColor: serviceData.update_method === 'hours' ? '#d4edda' : 'transparent' }}>
                      <input type="radio" name="updateMethod" checked={serviceData.update_method === 'hours'} onChange={() => setServiceData({...serviceData, update_method: 'hours'})} />
                      ⏱️ <strong>Update by Hours</strong>
                    </label>
                  </div>
                </div>
              )}
              
              {(serviceData.update_method === 'date' || showServiceForm.maintenance_type !== 'hour') && (
                <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #bde0fe' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0066cc' }}>📅 Update by Service Date</h4>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Service Date:</label>
                    <input type="date" value={serviceData.custom_service_date} onChange={(e) => setServiceData({...serviceData, custom_service_date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
                    <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                      {showServiceForm.maintenance_type === 'hour' ? '⏱️ System will calculate current hours as (days from this date) × 10 hours/day' : '📅 Next service will be calculated from this date'}
                    </small>
                  </div>
                </div>
              )}
              
              {showServiceForm.maintenance_type === 'hour' && serviceData.update_method === 'hours' && (
                <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f0fff0', borderRadius: '8px', border: '1px solid #b8e6b8' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>⏱️ Update by Current Hours</h4>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Current Hours on Equipment:</label>
                    <input type="number" value={serviceData.custom_current_hours} onChange={(e) => setServiceData({...serviceData, custom_current_hours: e.target.value})} placeholder={`Current reading: ${showServiceForm.current_hours || 0} hours`} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
                    <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>⏱️ This will be saved as the last service hours.</small>
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#fff8f0', borderRadius: '8px', border: '1px solid #ffe0b3' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#e65100' }}>⚙️ Change Service Interval (Optional)</h4>
                {showServiceForm.maintenance_type === 'hour' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Service Interval (hours):</label>
                    <input type="number" value={serviceData.service_interval_hours} onChange={(e) => setServiceData({...serviceData, service_interval_hours: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_hours || 250} hours`} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
                    <small>⚠️ DUE SOON when ≤ 40 hours remaining</small>
                  </div>
                )}
                {showServiceForm.maintenance_type === 'month' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Service Interval (months):</label>
                    <input type="number" value={serviceData.service_interval_months} onChange={(e) => setServiceData({...serviceData, service_interval_months: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_months || 6} months`} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
                    <small>⚠️ DUE SOON when ≤ 4 days remaining</small>
                  </div>
                )}
                {showServiceForm.maintenance_type === 'year' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Service Interval (years):</label>
                    <input type="number" value={serviceData.service_interval_years} onChange={(e) => setServiceData({...serviceData, service_interval_years: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_years || 1} years`} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Service Performed *</label>
                <input type="text" required value={serviceData.service_performed} onChange={(e) => setServiceData({...serviceData, service_performed: e.target.value})} placeholder="e.g., Oil change, Inspection, Calibration" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Technician Name</label>
                <input type="text" value={serviceData.technician_name} onChange={(e) => setServiceData({...serviceData, technician_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }} />
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Notes</label>
                <textarea value={serviceData.notes} onChange={(e) => setServiceData({...serviceData, notes: e.target.value})} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }} />
              </div>
              
              <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '2px solid #2196f3' }}>
                <strong style={{ fontSize: '14px' }}>📋 PREVIEW - Next Service Will Be Due:</strong><br />
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066cc' }}>{calculateNextDuePreview()}</span>
                <br />
                <small style={{ color: '#666' }}>Status will be set to ✅ SERVICED after recording</small>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" disabled={loading} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '5px', cursor: 'pointer', flex: 1, fontSize: '16px', fontWeight: 'bold' }}>
                  {loading ? 'Saving...' : '✅ Record Service & Set Status to SERVICED'}
                </button>
                <button type="button" onClick={() => { setShowServiceForm(null); setServiceData({ service_performed: '', technician_name: '', notes: '', service_interval_hours: 250, service_interval_months: 6, service_interval_years: 1, update_method: 'date', custom_service_date: new Date().toISOString().split('T')[0], custom_current_hours: '' }); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSEMaintenance;