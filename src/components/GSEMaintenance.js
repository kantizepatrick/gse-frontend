import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GSEMaintenance = ({ token, user }) => {
  const [equipment, setEquipment] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(null);
  const [showHoursModal, setShowHoursModal] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [hoursUpdate, setHoursUpdate] = useState({});
  
  const [newEquipment, setNewEquipment] = useState({
    equipment_name: '',
    equipment_type: '',
    use_hour_based: false,
    use_date_based: false,
    service_interval_months: 6,
    hours_threshold: 600,
    last_service_date: new Date().toISOString().split('T')[0],
    last_service_hours: 0
  });
  
  const [serviceData, setServiceData] = useState({
    service_performed: '',
    technician_name: '',
    notes: '',
    service_date: new Date().toISOString().split('T')[0],
    current_hours: ''
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

  const updateCurrentHours = async (equipId, currentHours) => {
    try {
      await axios.put(`${API_URL}/api/gse-maintenance/${equipId}/hours`, {
        current_hours: parseInt(currentHours)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Hours updated successfully!');
      fetchEquipment();
      setShowHoursModal(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating hours');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        equipment_name: newEquipment.equipment_name,
        equipment_type: newEquipment.equipment_type,
        use_hour_based: newEquipment.use_hour_based,
        use_date_based: newEquipment.use_date_based,
        service_interval_months: newEquipment.service_interval_months,
        hours_threshold: newEquipment.hours_threshold,
        last_service_date: newEquipment.last_service_date,
        last_service_hours: newEquipment.last_service_hours
      };
      
      await axios.post(`${API_URL}/api/gse-maintenance`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Equipment added to maintenance schedule!');
      setShowAddForm(false);
      setNewEquipment({
        equipment_name: '',
        equipment_type: '',
        use_hour_based: false,
        use_date_based: false,
        service_interval_months: 6,
        hours_threshold: 600,
        last_service_date: new Date().toISOString().split('T')[0],
        last_service_hours: 0
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
      const payload = {
        service_performed: serviceData.service_performed,
        technician_name: serviceData.technician_name,
        notes: serviceData.notes,
        service_date: serviceData.service_date,
        current_hours: serviceData.current_hours
      };
      
      const response = await axios.post(`${API_URL}/api/gse-maintenance/${equipId}/service`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(response.data.message || '✅ Service recorded successfully!');
      setShowServiceForm(null);
      setServiceData({
        service_performed: '',
        technician_name: '',
        notes: '',
        service_date: new Date().toISOString().split('T')[0],
        current_hours: ''
      });
      fetchEquipment();
      setTimeout(() => setMessage(''), 5000);
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

  const getMaintenanceTypeIcon = (eq) => {
    if (eq.use_hour_based && eq.use_date_based) return '⏱️+📅 Dual (Hours & Date)';
    if (eq.use_hour_based) return '⏱️ Hour-based';
    if (eq.use_date_based) return '📅 Date-based';
    return '⭕ No Maintenance';
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
        return { color: '#95a5a6', text: '⚪ NO MAINTENANCE', bg: '#f5f5f5' };
      default:
        return { color: '#95a5a6', text: status, bg: '#f5f5f5' };
    }
  };

  const filteredEquipment = equipment.filter(eq => {
    if (filter !== 'all' && eq.status !== filter) return false;
    return true;
  });

  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🔧 GSE Maintenance Schedule</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          {showAddForm ? 'Cancel' : '+ Add Equipment'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ backgroundColor: filter === 'all' ? '#3498db' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>All Status</button>
        <button onClick={() => setFilter('overdue')} style={{ backgroundColor: filter === 'overdue' ? '#e74c3c' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>🔴 Overdue</button>
        <button onClick={() => setFilter('due_soon')} style={{ backgroundColor: filter === 'due_soon' ? '#f39c12' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>🟡 Due Soon</button>
        <button onClick={() => setFilter('serviced')} style={{ backgroundColor: filter === 'serviced' ? '#27ae60' : '#95a5a6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>✅ Serviced</button>
      </div>

      <div style={{ backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #bee5eb' }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          <strong>📊 Dual Condition Maintenance (Manual Hour Entry):</strong><br />
          ⏱️ <strong>Hour-based:</strong> Due Soon when ≤ 40 hours to target | Overdue when exceeded<br />
          📅 <strong>Date-based:</strong> Due Soon when ≤ 4 days to service date | Overdue when passed<br />
          🔔 <strong>Alert triggers based on whichever condition comes FIRST</strong><br />
          📝 <strong>Hour Entry:</strong> Click "Update Hours" to manually enter current meter reading daily
        </p>
      </div>

      {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #f5c6cb' }}>{error}</div>}

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
          </div>
          
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Maintenance Type</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
              <label><input type="checkbox" checked={newEquipment.use_hour_based} onChange={(e) => setNewEquipment({...newEquipment, use_hour_based: e.target.checked})} /> ⏱️ Hour-based</label>
              <label><input type="checkbox" checked={newEquipment.use_date_based} onChange={(e) => setNewEquipment({...newEquipment, use_date_based: e.target.checked})} /> 📅 Date-based</label>
            </div>
          </div>
          
          {newEquipment.use_hour_based && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Hours Threshold (Next service at X hours)</label>
              <input type="number" value={newEquipment.hours_threshold} onChange={(e) => setNewEquipment({...newEquipment, hours_threshold: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              <small>⚠️ Due Soon when current hours ≤ 40 hours to this threshold</small>
            </div>
          )}
          
          {newEquipment.use_date_based && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Service Interval (months)</label>
              <input type="number" value={newEquipment.service_interval_months} onChange={(e) => setNewEquipment({...newEquipment, service_interval_months: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              <small>⚠️ Due Soon when ≤ 4 days to service date</small>
            </div>
          )}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Last Service Date</label>
            <input type="date" value={newEquipment.last_service_date} onChange={(e) => setNewEquipment({...newEquipment, last_service_date: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          
          {newEquipment.use_hour_based && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold' }}>Current Hours (Meter Reading)</label>
              <input type="number" value={newEquipment.last_service_hours} onChange={(e) => setNewEquipment({...newEquipment, last_service_hours: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
          )}
          
          <button type="submit" disabled={loading} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Add Equipment</button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Equipment</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maint Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Last Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Current / Target</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Next Service</th>
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
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getMaintenanceTypeIcon(eq)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                    {eq.last_service_date || 'Not recorded'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                    {eq.use_hour_based ? `${eq.current_hours || 0} / ${eq.hours_threshold || 0} hrs` : '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                    {eq.next_due_display || 'Not scheduled'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.text}</span>
                    {eq.alert_reason && <div style={{ fontSize: '11px', color: statusStyle.color }}>{eq.alert_reason}</div>}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {eq.use_hour_based && (
                      <button onClick={() => setShowHoursModal(eq)} style={{ backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                        📝 Update Hours
                      </button>
                    )}
                    <button onClick={() => {
                      setShowServiceForm(eq);
                      setServiceData({
                        ...serviceData,
                        service_date: new Date().toISOString().split('T')[0],
                        current_hours: eq.current_hours || 0
                      });
                    }} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                      🔧 Record Service
                    </button>
                    {canDelete && (
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

      {/* Update Hours Modal */}
      {showHoursModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3>📝 Update Current Hours</h3>
            <p>Equipment: <strong>{showHoursModal.equipment_name}</strong></p>
            <p>Target Hours: <strong>{showHoursModal.hours_threshold} hrs</strong></p>
            <p>Current Hours: <strong>{showHoursModal.current_hours} hrs</strong></p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>New Current Hours:</label>
              <input 
                type="number" 
                value={hoursUpdate[showHoursModal.id] || showHoursModal.current_hours}
                onChange={(e) => setHoursUpdate({...hoursUpdate, [showHoursModal.id]: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => updateCurrentHours(showHoursModal.id, hoursUpdate[showHoursModal.id] || showHoursModal.current_hours)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>
                ✅ Update
              </button>
              <button onClick={() => setShowHoursModal(null)} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Service Modal */}
      {showServiceForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '650px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>🔧 Record Service for: {showServiceForm.equipment_name}</h3>
            
            <form onSubmit={(e) => handleRecordService(e, showServiceForm.id)}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📅 Service Date *</label>
                <input type="date" required value={serviceData.service_date} onChange={(e) => setServiceData({...serviceData, service_date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              {showServiceForm.use_hour_based && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>⏱️ Current Hours (Meter Reading)</label>
                  <input type="number" value={serviceData.current_hours} onChange={(e) => setServiceData({...serviceData, current_hours: e.target.value})} placeholder="Current meter reading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Service Performed *</label>
                <input type="text" required value={serviceData.service_performed} onChange={(e) => setServiceData({...serviceData, service_performed: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Technician Name</label>
                <input type="text" value={serviceData.technician_name} onChange={(e) => setServiceData({...serviceData, technician_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Notes</label>
                <textarea value={serviceData.notes} onChange={(e) => setServiceData({...serviceData, notes: e.target.value})} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                <strong>📋 Preview:</strong><br />
                {showServiceForm.use_hour_based && showServiceForm.use_date_based && (
                  <span>Dual condition: Service will be due when EITHER hours reach {showServiceForm.hours_threshold} OR date reaches next service date</span>
                )}
                {showServiceForm.use_hour_based && !showServiceForm.use_date_based && (
                  <span>Hour-based: Next service at {showServiceForm.hours_threshold} hours</span>
                )}
                {!showServiceForm.use_hour_based && showServiceForm.use_date_based && (
                  <span>Date-based: Next service in {showServiceForm.service_interval_months} months</span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" disabled={loading} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>
                  {loading ? 'Saving...' : '✅ Record Service'}
                </button>
                <button type="button" onClick={() => { setShowServiceForm(null); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '5px', cursor: 'pointer' }}>
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