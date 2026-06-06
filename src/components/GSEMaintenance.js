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
  
  const [newEquipment, setNewEquipment] = useState({
    equipment_name: '',
    equipment_type: '',
    maintenance_type: 'hour',
    interval_value: 250,
    notes: ''
  });
  
  const [serviceData, setServiceData] = useState({
    current_value: 0,
    service_performed: '',
    technician_name: '',
    notes: ''
  });

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchEquipment();
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
      await axios.post(`${API_URL}/api/gse-maintenance`, {
        equipment_name: newEquipment.equipment_name,
        equipment_type: newEquipment.equipment_type,
        maintenance_type: newEquipment.maintenance_type,
        interval_value: parseInt(newEquipment.interval_value),
        notes: newEquipment.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Equipment added to maintenance schedule!');
      setShowAddForm(false);
      setNewEquipment({
        equipment_name: '',
        equipment_type: '',
        maintenance_type: 'hour',
        interval_value: 250,
        notes: ''
      });
      fetchEquipment();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding equipment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordService = async (e, item) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/gse-maintenance/${item.id}/service`, {
        service_performed: serviceData.service_performed,
        technician_name: serviceData.technician_name,
        notes: serviceData.notes,
        current_value: parseInt(serviceData.current_value) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Service recorded successfully! Maintenance schedule updated.');
      setShowServiceForm(null);
      setServiceData({
        current_value: 0,
        service_performed: '',
        technician_name: '',
        notes: ''
      });
      fetchEquipment();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error recording service');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (item) => {
    if (window.confirm(`Delete "${item.equipment_name}" from maintenance schedule?`)) {
      try {
        await axios.delete(`${API_URL}/api/gse-maintenance/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`"${item.equipment_name}" removed from schedule`);
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
      case 'hour': return { icon: '⏱️', text: 'Hour-based', unit: 'hours' };
      case 'month': return { icon: '📅', text: 'Month-based', unit: 'months' };
      case 'year': return { icon: '📆', text: 'Year-based', unit: 'years' };
      default: return { icon: '🔧', text: type, unit: '' };
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'overdue':
        return { color: '#e74c3c', text: '🔴 Overdue', bg: '#fdeaea' };
      case 'due_soon':
        return { color: '#f39c12', text: '🟡 Due Soon', bg: '#fef5e7' };
      case 'upcoming':
        return { color: '#27ae60', text: '🟢 Upcoming', bg: '#eafaf1' };
      default:
        return { color: '#95a5a6', text: status, bg: '#f5f5f5' };
    }
  };

  const getRemainingDisplay = (item) => {
    const type = getMaintenanceTypeIcon(item.maintenance_type);
    const remaining = item.hours_remaining || item.days_remaining || item.years_remaining || item.remaining_value || 0;
    
    if (item.maintenance_type === 'hour') {
      return `${remaining} ${type.unit}`;
    } else if (item.maintenance_type === 'month') {
      const days = remaining;
      if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
      }
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (item.maintenance_type === 'year') {
      return `${remaining} year${remaining !== 1 ? 's' : ''}`;
    }
    return 'N/A';
  };

  const getProgressPercentage = (item) => {
    const interval = item.service_interval_hours || item.service_interval_months || item.service_interval_years || item.interval_value || 250;
    const remaining = item.hours_remaining || item.days_remaining || item.years_remaining || item.remaining_value || 0;
    const used = interval - remaining;
    if (interval <= 0) return 0;
    let percentage = (used / interval) * 100;
    if (item.status === 'overdue') percentage = 100;
    return Math.min(100, Math.max(0, percentage));
  };

  const getLastServiceDisplay = (item) => {
    if (item.last_service_hours) {
      return `${item.last_service_hours} hrs`;
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

  const getNextDueDisplay = (item) => {
    if (item.maintenance_type === 'hour') {
      return `${item.next_service_hours || 0} hrs`;
    }
    if (item.maintenance_type === 'month') {
      if (item.next_service_date) {
        const date = new Date(item.next_service_date);
        return date.toLocaleDateString();
      }
      return 'Calculating...';
    }
    if (item.maintenance_type === 'year') {
      return item.next_service_year || 'Calculating...';
    }
    return '-';
  };

  const filteredEquipment = equipment.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (maintenanceTypeFilter !== 'all' && item.maintenance_type !== maintenanceTypeFilter) return false;
    return true;
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🔧 GSE Maintenance Schedule</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          {showAddForm ? 'Cancel' : '+ Add Equipment'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ backgroundColor: filter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Status</button>
        <button onClick={() => setFilter('overdue')} style={{ backgroundColor: filter === 'overdue' ? '#e74c3c' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🔴 Overdue</button>
        <button onClick={() => setFilter('due_soon')} style={{ backgroundColor: filter === 'due_soon' ? '#f39c12' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🟡 Due Soon</button>
        <button onClick={() => setFilter('upcoming')} style={{ backgroundColor: filter === 'upcoming' ? '#27ae60' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🟢 Upcoming</button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setMaintenanceTypeFilter('all')} style={{ backgroundColor: maintenanceTypeFilter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Types</button>
        <button onClick={() => setMaintenanceTypeFilter('hour')} style={{ backgroundColor: maintenanceTypeFilter === 'hour' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>⏱️ Hour-based</button>
        <button onClick={() => setMaintenanceTypeFilter('month')} style={{ backgroundColor: maintenanceTypeFilter === 'month' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📅 Month-based</button>
        <button onClick={() => setMaintenanceTypeFilter('year')} style={{ backgroundColor: maintenanceTypeFilter === 'year' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📆 Year-based</button>
      </div>

      {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #f5c6cb' }}>{error}</div>}

      {/* Add Equipment Form */}
      {showAddForm && (
        <form onSubmit={handleAddEquipment} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
          <h3>Add Equipment to Maintenance Schedule</h3>
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
                <option value="hour">⏱️ Hour-based (operating hours)</option>
                <option value="month">📅 Month-based (calendar months)</option>
                <option value="year">📆 Year-based (calendar years)</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>Service Interval</label>
              <input type="number" value={newEquipment.interval_value} onChange={(e) => setNewEquipment({...newEquipment, interval_value: parseInt(e.target.value) || 250})} 
                placeholder={newEquipment.maintenance_type === 'hour' ? 'e.g., 250 hours' : newEquipment.maintenance_type === 'month' ? 'e.g., 6 months' : 'e.g., 1 year'} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Notes</label>
            <textarea value={newEquipment.notes} onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})} rows="2" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Add Equipment</button>
        </form>
      )}

      {/* Equipment Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Equipment</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maint Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Last Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Interval</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Next Due</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Remaining</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Progress</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.map(eq => {
              const typeInfo = getMaintenanceTypeIcon(eq.maintenance_type);
              const statusStyle = getStatusBadge(eq.status);
              const progress = getProgressPercentage(eq);
              const remaining = getRemainingDisplay(eq);
              const lastService = getLastServiceDisplay(eq);
              const nextDue = getNextDueDisplay(eq);
              const interval = eq.service_interval_hours || eq.service_interval_months || eq.service_interval_years || eq.interval_value || '-';
              
              return (
                <tr key={eq.id} style={{ backgroundColor: statusStyle.bg }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{eq.equipment_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{eq.equipment_type || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{typeInfo.icon} {typeInfo.text}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{lastService}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{interval} {typeInfo.unit}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{nextDue}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: statusStyle.color }}>{remaining}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>
                    <div style={{ backgroundColor: '#e0e0e0', borderRadius: '10px', height: '8px', width: '100%' }}>
                      <div style={{ backgroundColor: statusStyle.color === '#e74c3c' ? '#e74c3c' : statusStyle.color === '#f39c12' ? '#f39c12' : '#27ae60', width: `${progress}%`, height: '8px', borderRadius: '10px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#666' }}>{Math.round(progress)}% used</span>
                  </tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span></td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={() => setShowServiceForm(eq)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>🔧 Record Service</button>
                    {canEdit && (
                      <button onClick={() => handleDeleteEquipment(eq)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>🗑️ Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Service Modal - NO CHECKLIST OPTION */}
      {showServiceForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Record Service for: {showServiceForm.equipment_name}</h3>
            <p>Maintenance Type: <strong>{getMaintenanceTypeIcon(showServiceForm.maintenance_type).icon} {getMaintenanceTypeIcon(showServiceForm.maintenance_type).text}</strong></p>
            <p>Current Status: <strong style={{ color: getStatusBadge(showServiceForm.status).color }}>{getStatusBadge(showServiceForm.status).text}</strong></p>
            
            <form onSubmit={(e) => handleRecordService(e, showServiceForm)}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Current {getMaintenanceTypeIcon(showServiceForm.maintenance_type).unit.toUpperCase()} Value *</label>
                <input type="number" required value={serviceData.current_value} onChange={(e) => setServiceData({...serviceData, current_value: e.target.value})} 
                  placeholder={`Enter current ${getMaintenanceTypeIcon(showServiceForm.maintenance_type).unit}`}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                <small style={{ color: '#666' }}>This will reset the remaining {getMaintenanceTypeIcon(showServiceForm.maintenance_type).unit} and update next due date.</small>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Service Performed *</label>
                <input type="text" required value={serviceData.service_performed} onChange={(e) => setServiceData({...serviceData, service_performed: e.target.value})} 
                  placeholder="e.g., Oil change, Calibration, Inspection"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Technician Name</label>
                <input type="text" value={serviceData.technician_name} onChange={(e) => setServiceData({...serviceData, technician_name: e.target.value})} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>Notes</label>
                <textarea value={serviceData.notes} onChange={(e) => setServiceData({...serviceData, notes: e.target.value})} rows="3" 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>Record Service</button>
                <button type="button" onClick={() => { setShowServiceForm(null); setServiceData({ current_value: 0, service_performed: '', technician_name: '', notes: '' }); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ How it works:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                <li>Enter the current {getMaintenanceTypeIcon(showServiceForm.maintenance_type).unit} value</li>
                <li>The system will calculate the next service due date</li>
                <li>Remaining {getMaintenanceTypeIcon(showServiceForm.maintenance_type).unit} will be reset to the interval value</li>
                <li>Status will update to "Upcoming" after service</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSEMaintenance;