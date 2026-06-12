import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const GSEMaintenance = forwardRef(({ token, user, onMaintenanceUpdate }, ref) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [newEquipment, setNewEquipment] = useState({
    equipment_name: '',
    equipment_type: '',
    maintenance_type: 'hour',
    service_interval_hours: 250,
    service_interval_months: 6,
    service_interval_years: 1,
    last_service_date: new Date().toISOString().split('T')[0],
    last_service_hours: 0,
    service_performed: '',
    technician_name: '',
    notes: ''
  });
  
  const [editData, setEditData] = useState({
    equipment_name: '',
    equipment_type: '',
    maintenance_type: 'hour',
    service_interval_hours: 250,
    service_interval_months: 6,
    service_interval_years: 1
  });
  
  const [serviceData, setServiceData] = useState({
    service_performed: '',
    technician_name: '',
    notes: '',
    service_date: new Date().toISOString().split('T')[0],
    current_hours: '',
    target_hours: '',
    months_interval: '',  // For month-based maintenance - user enters this
    service_interval_months: ''  // For storing the interval
  });

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/gse-maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEquipment(response.data.equipment || []);
      setError('');
    } catch (err) {
      console.error('Error fetching maintenance:', err);
      setError('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useImperativeHandle(ref, () => ({
    fetchEquipment: () => fetchEquipment()
  }));

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/gse-maintenance`, newEquipment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Equipment added successfully!');
      setShowAddModal(false);
      setNewEquipment({
        equipment_name: '',
        equipment_type: '',
        maintenance_type: 'hour',
        service_interval_hours: 250,
        service_interval_months: 6,
        service_interval_years: 1,
        last_service_date: new Date().toISOString().split('T')[0],
        last_service_hours: 0,
        service_performed: '',
        technician_name: '',
        notes: ''
      });
      fetchEquipment();
      if (onMaintenanceUpdate) onMaintenanceUpdate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding equipment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditEquipment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/gse-maintenance/${selectedEquipment.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Equipment updated successfully!');
      setShowEditModal(false);
      setSelectedEquipment(null);
      fetchEquipment();
      if (onMaintenanceUpdate) onMaintenanceUpdate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating equipment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRecordService = async () => {
    if (!selectedEquipment) return;
    
    try {
      let payload = {};
      
      if (selectedEquipment.maintenance_type === 'hour') {
        payload = {
          service_performed: serviceData.service_performed,
          technician_name: serviceData.technician_name,
          notes: serviceData.notes,
          service_date: serviceData.service_date,
          current_hours: parseInt(serviceData.current_hours),
          target_hours: parseInt(serviceData.target_hours),
          months_interval: serviceData.months_interval || 0
        };
      } else if (selectedEquipment.maintenance_type === 'month') {
        // IMPORTANT: Get the interval from months_interval (what user typed)
        const interval = parseInt(serviceData.months_interval || serviceData.service_interval_months);
        
        if (!interval || interval <= 0) {
          setError('Please enter the number of months until next service (e.g., 1, 2, 3, 4, 6, 12)');
          setTimeout(() => setError(''), 3000);
          return;
        }
        
        payload = {
          service_performed: serviceData.service_performed,
          technician_name: serviceData.technician_name,
          notes: serviceData.notes,
          service_date: serviceData.service_date,
          months_interval: interval,  // This is the key field - what user typed
          service_interval_months: interval
        };
        
        console.log('📝 Recording month-based service with interval:', interval, 'months');
        
      } else if (selectedEquipment.maintenance_type === 'year') {
        payload = {
          service_performed: serviceData.service_performed,
          technician_name: serviceData.technician_name,
          notes: serviceData.notes,
          service_date: serviceData.service_date,
          service_interval_years: parseInt(serviceData.service_interval_years) || 1
        };
      }
      
      const response = await axios.post(
        `${API_URL}/api/gse-maintenance/${selectedEquipment.id}/service`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(response.data.message || '✅ Service recorded successfully!');
      setShowServiceModal(false);
      setSelectedEquipment(null);
      setServiceData({
        service_performed: '',
        technician_name: '',
        notes: '',
        service_date: new Date().toISOString().split('T')[0],
        current_hours: '',
        target_hours: '',
        months_interval: '',
        service_interval_months: ''
      });
      fetchEquipment();
      if (onMaintenanceUpdate) onMaintenanceUpdate();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Error recording service:', err);
      setError(err.response?.data?.error || 'Error recording service');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteEquipment = async () => {
    try {
      await axios.delete(`${API_URL}/api/gse-maintenance/${showDeleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ "${showDeleteConfirm.equipment_name}" removed from maintenance schedule`);
      setShowDeleteConfirm(null);
      fetchEquipment();
      if (onMaintenanceUpdate) onMaintenanceUpdate();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting equipment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const fetchAttachments = async (maintenanceId) => {
    try {
      const response = await axios.get(`${API_URL}/api/maintenance-attachments/${maintenanceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttachments(response.data);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    }
  };

  const handleUploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedEquipment) return;
    
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        await axios.post(`${API_URL}/api/maintenance-attachment/${selectedEquipment.id}`, {
          filename: file.name,
          file_data: base64String,
          file_type: file.type
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAttachments(selectedEquipment.id);
        setMessage('✅ File uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error uploading file');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownloadFile = async (attachmentId, filename) => {
    try {
      const response = await axios.get(`${API_URL}/api/maintenance-attachment/${attachmentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error downloading file');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteFile = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete(`${API_URL}/api/maintenance-attachment/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAttachments(selectedEquipment.id);
      setMessage('✅ File deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Error deleting file');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditModal = (item) => {
    setSelectedEquipment(item);
    setEditData({
      equipment_name: item.equipment_name,
      equipment_type: item.equipment_type || '',
      maintenance_type: item.maintenance_type,
      service_interval_hours: item.service_interval_hours || 250,
      service_interval_months: item.service_interval_months || 6,
      service_interval_years: item.service_interval_years || 1
    });
    setShowEditModal(true);
  };

  const openServiceModal = (item) => {
    setSelectedEquipment(item);
    setServiceData({
      service_performed: '',
      technician_name: '',
      notes: '',
      service_date: new Date().toISOString().split('T')[0],
      current_hours: item.current_hours || '',
      target_hours: item.target_hours || item.service_interval_hours || '',
      months_interval: '',  // Start empty - user must enter
      service_interval_months: item.service_interval_months || ''
    });
    setShowServiceModal(true);
  };

  const openFilesModal = async (item) => {
    setSelectedEquipment(item);
    await fetchAttachments(item.id);
    setShowFilesModal(true);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'overdue':
        return <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>🔴 OVERDUE</span>;
      case 'due_soon':
        return <span style={{ backgroundColor: '#f39c12', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>🟡 DUE SOON</span>;
      case 'no_maintenance':
        return <span style={{ backgroundColor: '#95a5a6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>⚪ NO MAINTENANCE</span>;
      default:
        return <span style={{ backgroundColor: '#27ae60', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>✅ SERVICED</span>;
    }
  };

  // Calculate preview for month-based maintenance
  const getMonthPreview = () => {
    const interval = serviceData.months_interval || serviceData.service_interval_months;
    const serviceDate = serviceData.service_date;
    
    if (interval && serviceDate) {
      const date = new Date(serviceDate);
      date.setMonth(date.getMonth() + parseInt(interval));
      return date.toLocaleDateString();
    }
    return 'Select interval and service date';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading maintenance schedule...</div>;
  }

  const canEditDelete = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>🔧 GSE Maintenance Schedule</h2>
        {canEditDelete && (
          <button onClick={() => setShowAddModal(true)} style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            + Add Equipment
          </button>
        )}
      </div>

      {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #c3e6cb' }}>{message}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0', border: '1px solid #f5c6cb' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Equipment</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Last Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Next Service</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Actions</th>
             </tr>
          </thead>
          <tbody>
            {equipment.map(item => (
              <tr key={item.id} style={{ backgroundColor: item.status === 'overdue' ? '#fdeaea' : (item.status === 'due_soon' ? '#fef5e7' : 'white') }}>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.equipment_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.equipment_type || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.current_service_display || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.next_service_column || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getStatusBadge(item.status)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button onClick={() => openFilesModal(item)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                    📎 Files
                  </button>
                  {canEditDelete && (
                    <>
                      <button onClick={() => openEditModal(item)} style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                      {item.maintenance_type !== 'none' && (
                        <button onClick={() => openServiceModal(item)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>
                          🔧 Record Service
                        </button>
                      )}
                      <button onClick={() => setShowDeleteConfirm(item)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleAddEquipment} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Add Equipment to Maintenance</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Equipment Name *</label>
              <input type="text" required value={newEquipment.equipment_name} onChange={(e) => setNewEquipment({...newEquipment, equipment_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Equipment Type</label>
              <input type="text" value={newEquipment.equipment_type} onChange={(e) => setNewEquipment({...newEquipment, equipment_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Maintenance Type *</label>
              <select value={newEquipment.maintenance_type} onChange={(e) => setNewEquipment({...newEquipment, maintenance_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="hour">⏱️ Hour-based (operating hours)</option>
                <option value="month">📅 Month-based (calendar months)</option>
                <option value="year">📆 Year-based (calendar years)</option>
                <option value="none">⭕ No maintenance required</option>
              </select>
            </div>

            {newEquipment.maintenance_type === 'hour' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (hours)</label>
                <input type="number" value={newEquipment.service_interval_hours} onChange={(e) => setNewEquipment({...newEquipment, service_interval_hours: parseInt(e.target.value) || 250})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}

            {newEquipment.maintenance_type === 'month' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (months)</label>
                <input type="number" value={newEquipment.service_interval_months} onChange={(e) => setNewEquipment({...newEquipment, service_interval_months: parseInt(e.target.value) || 6})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}

            {newEquipment.maintenance_type === 'year' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (years)</label>
                <input type="number" value={newEquipment.service_interval_years} onChange={(e) => setNewEquipment({...newEquipment, service_interval_years: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Add Equipment</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {showEditModal && selectedEquipment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleEditEquipment} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Edit Equipment: {selectedEquipment.equipment_name}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Equipment Name *</label>
              <input type="text" required value={editData.equipment_name} onChange={(e) => setEditData({...editData, equipment_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Equipment Type</label>
              <input type="text" value={editData.equipment_type} onChange={(e) => setEditData({...editData, equipment_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Maintenance Type *</label>
              <select value={editData.maintenance_type} onChange={(e) => setEditData({...editData, maintenance_type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="hour">⏱️ Hour-based</option>
                <option value="month">📅 Month-based</option>
                <option value="year">📆 Year-based</option>
                <option value="none">⭕ No maintenance</option>
              </select>
            </div>

            {editData.maintenance_type === 'hour' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (hours)</label>
                <input type="number" value={editData.service_interval_hours} onChange={(e) => setEditData({...editData, service_interval_hours: parseInt(e.target.value) || 250})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}

            {editData.maintenance_type === 'month' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (months)</label>
                <input type="number" value={editData.service_interval_months} onChange={(e) => setEditData({...editData, service_interval_months: parseInt(e.target.value) || 6})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}

            {editData.maintenance_type === 'year' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Interval (years)</label>
                <input type="number" value={editData.service_interval_years} onChange={(e) => setEditData({...editData, service_interval_years: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Save Changes</button>
              <button type="button" onClick={() => { setShowEditModal(false); setSelectedEquipment(null); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Record Service Modal - FIXED for month-based */}
      {showServiceModal && selectedEquipment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={(e) => { e.preventDefault(); handleRecordService(); }} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Record Service for: {selectedEquipment.equipment_name}</h3>
            <p>Maintenance Type: {selectedEquipment.maintenance_type === 'hour' ? '⏱️ Hour-based' : (selectedEquipment.maintenance_type === 'month' ? '📅 Month-based' : '📆 Year-based')}</p>
            <hr />
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📅 Service Date *</label>
              <input type="date" required value={serviceData.service_date} onChange={(e) => setServiceData({...serviceData, service_date: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              <small style={{ color: '#666' }}>Date when service was performed</small>
            </div>

            {selectedEquipment.maintenance_type === 'hour' && (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>⏱️ Current Hours (Meter Reading) *</label>
                  <input type="number" required value={serviceData.current_hours} onChange={(e) => setServiceData({...serviceData, current_hours: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🎯 Target Hours (Service Interval)</label>
                  <input type="number" value={serviceData.target_hours} onChange={(e) => setServiceData({...serviceData, target_hours: e.target.value})} placeholder={selectedEquipment.service_interval_hours} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              </>
            )}

            {selectedEquipment.maintenance_type === 'month' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📅 Service Interval (months) *</label>
                <input 
                  type="number" 
                  required 
                  value={serviceData.months_interval || ''} 
                  onChange={(e) => {
                    const interval = parseInt(e.target.value);
                    setServiceData({
                      ...serviceData,
                      months_interval: interval,
                      service_interval_months: interval
                    });
                  }}
                  placeholder="Enter number of months (e.g., 1, 2, 3, 4, 6, 12)"
                  min="1"
                  step="1"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Current interval in database: {selectedEquipment.service_interval_months || 'Not set'} months
                  <br />
                  <strong>Enter the number of months until next service</strong>
                </small>
              </div>
            )}

            {selectedEquipment.maintenance_type === 'year' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📆 Service Interval (years)</label>
                <input type="number" value={serviceData.service_interval_years} onChange={(e) => setServiceData({...serviceData, service_interval_years: e.target.value})} placeholder={selectedEquipment.service_interval_years} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            )}

            {/* Calculation Preview for month-based */}
            {selectedEquipment.maintenance_type === 'month' && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                <strong>📋 Calculation Preview:</strong><br />
                Service Date: {serviceData.service_date}<br />
                Interval: <strong>{serviceData.months_interval || serviceData.service_interval_months || '?'}</strong> months<br />
                → Next service due on: <strong>{getMonthPreview()}</strong>
              </div>
            )}

            {selectedEquipment.maintenance_type === 'hour' && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
                <strong>📋 Calculation Preview:</strong><br />
                Service Date: {serviceData.service_date}<br />
                Current Hours: {serviceData.current_hours || '?'} hrs<br />
                Target Hours: {serviceData.target_hours || selectedEquipment.service_interval_hours || '?'} hrs<br />
                → Next service when meter reaches: {((parseInt(serviceData.current_hours) || 0) + (parseInt(serviceData.target_hours) || selectedEquipment.service_interval_hours || 0))} hrs
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Performed *</label>
              <input type="text" required value={serviceData.service_performed} onChange={(e) => setServiceData({...serviceData, service_performed: e.target.value})} placeholder="e.g., Oil change, Inspection, Calibration" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Technician Name</label>
              <input type="text" value={serviceData.technician_name} onChange={(e) => setServiceData({...serviceData, technician_name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
              <textarea value={serviceData.notes} onChange={(e) => setServiceData({...serviceData, notes: e.target.value})} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>✅ Record Service</button>
              <button type="button" onClick={() => { setShowServiceModal(false); setSelectedEquipment(null); }} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedEquipment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>📎 Attachments - {selectedEquipment.equipment_name}</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload File</label>
              <input type="file" onChange={handleUploadFile} disabled={uploading} style={{ width: '100%' }} />
              {uploading && <small>Uploading...</small>}
            </div>
            
            <hr />
            
            <h4>Uploaded Files:</h4>
            {attachments.length === 0 ? (
              <p>No files uploaded yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {attachments.map(file => (
                  <li key={file.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      📄 {file.original_filename} ({(file.file_size / 1024).toFixed(1)} KB)
                      <br />
                      <small>Uploaded by: {file.uploaded_by} on {new Date(file.created_at).toLocaleString()}</small>
                    </span>
                    <div>
                      <button onClick={() => handleDownloadFile(file.id, file.original_filename)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', marginRight: '5px', cursor: 'pointer' }}>Download</button>
                      {canEditDelete && (
                        <button onClick={() => handleDeleteFile(file.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowFilesModal(false)} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete:</p>
            <p><strong>{showDeleteConfirm.equipment_name}</strong></p>
            <p style={{ color: 'red' }}>⚠️ This will also delete all attachments and checklists!</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={handleDeleteEquipment} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '3px', cursor: 'pointer' }}>Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GSEMaintenance;