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
    last_service_hours: 0,
    current_hours: 0,
    service_interval_hours: 250,
    last_service_date: '',
    service_interval_months: 6,
    last_service_year: new Date().getFullYear(),
    service_interval_years: 1,
    service_performed: '',
    technician_name: '',
    notes: ''
  });
  
  const [serviceData, setServiceData] = useState({
    current_hours: 0,
    service_performed: '',
    technician_name: '',
    notes: '',
    service_interval_hours: 250,
    service_interval_months: 6,
    service_interval_years: 1
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
      await axios.post(`${API_URL}/api/gse-maintenance`, newEquipment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Equipment added to maintenance schedule!');
      setShowAddForm(false);
      setNewEquipment({
        equipment_name: '',
        equipment_type: '',
        maintenance_type: 'hour',
        last_service_hours: 0,
        current_hours: 0,
        service_interval_hours: 250,
        last_service_date: '',
        service_interval_months: 6,
        last_service_year: new Date().getFullYear(),
        service_interval_years: 1,
        service_performed: '',
        technician_name: '',
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

  const handleRecordService = async (e, equipId) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/gse-maintenance/${equipId}/service`, {
        current_hours: parseInt(serviceData.current_hours),
        service_performed: serviceData.service_performed,
        technician_name: serviceData.technician_name,
        notes: serviceData.notes,
        service_interval_hours: serviceData.service_interval_hours,
        service_interval_months: serviceData.service_interval_months,
        service_interval_years: serviceData.service_interval_years
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Service recorded successfully!');
      setShowServiceForm(null);
      setServiceData({
        current_hours: 0,
        service_performed: '',
        technician_name: '',
        notes: '',
        service_interval_hours: 250,
        service_interval_months: 6,
        service_interval_years: 1
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

  const handleUpdateHours = async (equipId, currentHours) => {
    try {
      await axios.put(`${API_URL}/api/gse-maintenance/${equipId}/usage`, {
        current_hours: parseInt(currentHours)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEquipment();
    } catch (err) {
      console.error('Error updating hours:', err);
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
      case 'hour': return '⏱️ Hour';
      case 'month': return '📅 Month';
      case 'year': return '📆 Year';
      case 'none': return '⭕ None';
      default: return type;
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
      case 'no_maintenance':
        return { color: '#95a5a6', text: '⚪ No Maintenance', bg: '#f5f5f5' };
      default:
        return { color: '#95a5a6', text: status, bg: '#f5f5f5' };
    }
  };

  const getRemainingDisplay = (eq) => {
    if (eq.maintenance_type === 'hour') {
      return `${eq.hours_remaining || 0} hrs`;
    } else if (eq.maintenance_type === 'month') {
      return `${eq.days_remaining || 0} days`;
    } else if (eq.maintenance_type === 'year') {
      return `${eq.years_remaining || 0} yrs`;
    }
    return 'N/A';
  };

  const getNextDueDisplay = (eq) => {
    if (eq.maintenance_type === 'hour') {
      return `${eq.next_service_hours || 0} hrs`;
    } else if (eq.maintenance_type === 'month') {
      return eq.next_service_date || 'Not set';
    } else if (eq.maintenance_type === 'year') {
      return eq.next_service_year || 'Not set';
    }
    return 'No schedule';
  };

  const filteredEquipment = equipment.filter(eq => {
    if (filter !== 'all' && eq.status !== filter) return false;
    if (maintenanceTypeFilter !== 'all' && eq.maintenance_type !== maintenanceTypeFilter) return false;
    return true;
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🔧 GSE Maintenance Schedule</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          {showAddForm ? 'Cancel' : '+ Add Equipment'}
        </button>
      </div>

      {/* Filter Tabs - Status */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ backgroundColor: filter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Status</button>
        <button onClick={() => setFilter('overdue')} style={{ backgroundColor: filter === 'overdue' ? '#e74c3c' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🔴 Overdue</button>
        <button onClick={() => setFilter('due_soon')} style={{ backgroundColor: filter === 'due_soon' ? '#f39c12' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🟡 Due Soon</button>
        <button onClick={() => setFilter('upcoming')} style={{ backgroundColor: filter === 'upcoming' ? '#27ae60' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🟢 Upcoming</button>
      </div>
      
      {/* Filter Tabs - Maintenance Type */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setMaintenanceTypeFilter('all')} style={{ backgroundColor: maintenanceTypeFilter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>All Types</button>
        <button onClick={() => setMaintenanceTypeFilter('hour')} style={{ backgroundColor: maintenanceTypeFilter === 'hour' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>⏱️ Hour-based</button>
        <button onClick={() => setMaintenanceTypeFilter('month')} style={{ backgroundColor: maintenanceTypeFilter === 'month' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📅 Month-based</button>
        <button onClick={() => setMaintenanceTypeFilter('year')} style={{ backgroundColor: maintenanceTypeFilter === 'year' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>📆 Year-based</button>
        <button onClick={() => setMaintenanceTypeFilter('none')} style={{ backgroundColor: maintenanceTypeFilter === 'none' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>⭕ No Maintenance</button>
      </div>

      {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #f5c6cb' }}>{error}</div>}

      {/* Add Equipment Form */}
      {showAddForm && (
        <form onSubmit={handleAddEquipment} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
          <h3>Add GSE Equipment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><label style={{ fontWeight: 'bold' }}>Equipment Name *</label><input type="text" required value={newEquipment.equipment_name} onChange={(e) => setNewEquipment({...newEquipment, equipment_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
            <div><label style={{ fontWeight: 'bold' }}>Equipment Type</label><input type="text" value={newEquipment.equipment_type} onChange={(e) => setNewEquipment({...newEquipment, equipment_type: e.target.value})} placeholder="e.g., Tow Tractor, GPU" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
            <div><label style={{ fontWeight: 'bold' }}>Maintenance Type *</label>
              <select value={newEquipment.maintenance_type} onChange={(e) => setNewEquipment({...newEquipment, maintenance_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="hour">⏱️ Hour-based (operating hours)</option>
                <option value="month">📅 Month-based (calendar months)</option>
                <option value="year">📆 Year-based (calendar years)</option>
                <option value="none">⭕ No maintenance</option>
              </select>
            </div>
            <div></div>
          </div>
          
          {/* Hour-based fields */}
          {newEquipment.maintenance_type === 'hour' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div><label style={{ fontWeight: 'bold' }}>Last Service Hours</label><input type="number" value={newEquipment.last_service_hours} onChange={(e) => setNewEquipment({...newEquipment, last_service_hours: parseInt(e.target.value) || 0, current_hours: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
              <div><label style={{ fontWeight: 'bold' }}>Service Interval (hours)</label><input type="number" value={newEquipment.service_interval_hours} onChange={(e) => setNewEquipment({...newEquipment, service_interval_hours: parseInt(e.target.value) || 250})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
            </div>
          )}
          
          {/* Month-based fields */}
          {newEquipment.maintenance_type === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div><label style={{ fontWeight: 'bold' }}>Last Service Date</label><input type="date" value={newEquipment.last_service_date} onChange={(e) => setNewEquipment({...newEquipment, last_service_date: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
              <div><label style={{ fontWeight: 'bold' }}>Service Interval (months)</label><input type="number" value={newEquipment.service_interval_months} onChange={(e) => setNewEquipment({...newEquipment, service_interval_months: parseInt(e.target.value) || 6})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
            </div>
          )}
          
          {/* Year-based fields */}
          {newEquipment.maintenance_type === 'year' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div><label style={{ fontWeight: 'bold' }}>Last Service Year</label><input type="number" value={newEquipment.last_service_year} onChange={(e) => setNewEquipment({...newEquipment, last_service_year: parseInt(e.target.value) || new Date().getFullYear()})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
              <div><label style={{ fontWeight: 'bold' }}>Service Interval (years)</label><input type="number" value={newEquipment.service_interval_years} onChange={(e) => setNewEquipment({...newEquipment, service_interval_years: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} /></div>
            </div>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Initial Service Performed</label>
            <input type="text" value={newEquipment.service_performed} onChange={(e) => setNewEquipment({...newEquipment, service_performed: e.target.value})} placeholder="e.g., Initial inspection, Setup" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
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

      {/* Equipment Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Equipment</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maint Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Last Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Current</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Next Due</th>
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
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.maintenance_type === 'hour' && `${eq.last_service_hours} hrs`}
                    {eq.maintenance_type === 'month' && eq.last_service_date}
                    {eq.maintenance_type === 'year' && eq.last_service_year}
                    {eq.maintenance_type === 'none' && '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.maintenance_type === 'hour' ? (
                      canEdit ? (
                        <input type="number" value={eq.current_hours} onChange={(e) => handleUpdateHours(eq.id, e.target.value)} style={{ width: '80px', padding: '5px', borderRadius: '3px', border: '1px solid #ddd' }} />
                      ) : `${eq.current_hours} hrs`
                    ) : (
                      eq.maintenance_type === 'month' ? `${eq.days_remaining || 0} days left` :
                      eq.maintenance_type === 'year' ? `${eq.years_remaining || 0} yrs left` : '-'
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getNextDueDisplay(eq)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: eq.hours_remaining <= 0 || eq.days_remaining <= 0 || eq.years_remaining <= 0 ? '#e74c3c' : eq.hours_remaining <= 50 || eq.days_remaining <= 14 || eq.years_remaining === 0 ? '#f39c12' : '#27ae60' }}>{getRemainingDisplay(eq)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}><span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span></td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.maintenance_type !== 'none' && (
                      <button onClick={() => setShowServiceForm(eq)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>🔧 Record Service</button>
                    )}
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => handleDeleteEquipment(eq.id, eq.equipment_name)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>🗑️ Delete</button>
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
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Record Service for: {showServiceForm.equipment_name}</h3>
            <p>Maintenance Type: <strong>{getMaintenanceTypeIcon(showServiceForm.maintenance_type)}</strong></p>
            
            <form onSubmit={(e) => handleRecordService(e, showServiceForm.id)}>
              {showServiceForm.maintenance_type === 'hour' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold' }}>Current Hours *</label>
                    <input type="number" required value={serviceData.current_hours} onChange={(e) => setServiceData({...serviceData, current_hours: e.target.value})} placeholder={`Current: ${showServiceForm.current_hours} hrs`} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold' }}>Service Interval (hours)</label>
                    <input type="number" value={serviceData.service_interval_hours} onChange={(e) => setServiceData({...serviceData, service_interval_hours: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_hours} hrs`} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                  </div>
                </>
              )}
              
              {showServiceForm.maintenance_type === 'month' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold' }}>Service Interval (months)</label>
                  <input type="number" value={serviceData.service_interval_months} onChange={(e) => setServiceData({...serviceData, service_interval_months: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_months} months`} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
              
              {showServiceForm.maintenance_type === 'year' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold' }}>Service Interval (years)</label>
                  <input type="number" value={serviceData.service_interval_years} onChange={(e) => setServiceData({...serviceData, service_interval_years: parseInt(e.target.value)})} placeholder={`Current: ${showServiceForm.service_interval_years} years`} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Service Performed *</label>
                <input type="text" required value={serviceData.service_performed} onChange={(e) => setServiceData({...serviceData, service_performed: e.target.value})} placeholder="e.g., Oil change, Inspection, Calibration" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Technician Name</label>
                <input type="text" value={serviceData.technician_name} onChange={(e) => setServiceData({...serviceData, technician_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>Notes</label>
                <textarea value={serviceData.notes} onChange={(e) => setServiceData({...serviceData, notes: e.target.value})} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>Record Service</button>
                <button type="button" onClick={() => { setShowServiceForm(null); setServiceData({ current_hours: 0, service_performed: '', technician_name: '', notes: '', service_interval_hours: 250, service_interval_months: 6, service_interval_years: 1 }); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSEMaintenance;