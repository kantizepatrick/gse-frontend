import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PartsList = ({ token, user }) => {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [newPart, setNewPart] = useState({
    part_number: '',
    description: '',
    manufacturer: '',
    compatible_gse: '',
    location_bin: '',
    min_stock: 5,
    contact_person: '',
    contact_phone: '',
    contact_email: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const API_URL = 'https://gse-backend.onrender.com';

  const fetchParts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParts(response.data);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/parts`, newPart, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Part added successfully!');
      setShowAddForm(false);
      setNewPart({
        part_number: '',
        description: '',
        manufacturer: '',
        compatible_gse: '',
        location_bin: '',
        min_stock: 5,
        contact_person: '',
        contact_phone: '',
        contact_email: ''
      });
      fetchParts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Part number may already exist';
      setError('Error: ' + errorMsg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditPart = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/parts/${editingPart.id}`, {
        contact_person: editingPart.contact_person,
        contact_phone: editingPart.contact_phone,
        contact_email: editingPart.contact_email,
        location_bin: editingPart.location_bin,
        min_stock: editingPart.min_stock
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Part "${editingPart.part_number}" updated successfully!`);
      setShowEditForm(false);
      setEditingPart(null);
      fetchParts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Error updating part');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeletePart = async (part) => {
    try {
      await axios.delete(`${API_URL}/api/parts/${part.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Part "${part.part_number}" deleted successfully!`);
      setShowDeleteConfirm(null);
      fetchParts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Error deleting part');
      setTimeout(() => setError(''), 3000);
    }
  };

  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  const showContactDetails = (part) => {
    setSelectedPart(part);
  };

  const closeContactDetails = () => {
    setSelectedPart(null);
  };

  const openEditForm = (part) => {
    setEditingPart({ ...part });
    setShowEditForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Parts Catalog</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ backgroundColor: '#27ae60' }}>
          {showAddForm ? 'Cancel' : '+ Add New Part'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPart} className="form-container">
          <h3>Add New Spare Part</h3>
          <div className="form-group">
            <label>Part Number *</label>
            <input type="text" required value={newPart.part_number} onChange={(e) => setNewPart({...newPart, part_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <input type="text" required value={newPart.description} onChange={(e) => setNewPart({...newPart, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Manufacturer *</label>
            <input type="text" required value={newPart.manufacturer} onChange={(e) => setNewPart({...newPart, manufacturer: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Compatible GSE</label>
            <input type="text" placeholder="e.g., Tow Tractor, GPU" value={newPart.compatible_gse} onChange={(e) => setNewPart({...newPart, compatible_gse: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Bin Location</label>
            <input type="text" placeholder="e.g., A-12" value={newPart.location_bin} onChange={(e) => setNewPart({...newPart, location_bin: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Minimum Stock</label>
            <input type="number" value={newPart.min_stock} onChange={(e) => setNewPart({...newPart, min_stock: parseInt(e.target.value) || 5})} />
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>📞 Manufacturer Contact Details</h4>
          <div className="form-group">
            <label>Contact Person</label>
            <input type="text" placeholder="e.g., John Smith" value={newPart.contact_person} onChange={(e) => setNewPart({...newPart, contact_person: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input type="tel" placeholder="e.g., +1 234 567 8900" value={newPart.contact_phone} onChange={(e) => setNewPart({...newPart, contact_phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input type="email" placeholder="e.g., sales@manufacturer.com" value={newPart.contact_email} onChange={(e) => setNewPart({...newPart, contact_email: e.target.value})} />
          </div>
          
          <button type="submit">Save Part</button>
        </form>
      )}

      {/* Edit Contact Form - Available to ALL USERS */}
      {showEditForm && editingPart && (
        <form onSubmit={handleEditPart} className="form-container">
          <h3>Edit Contact Details for: {editingPart.part_number}</h3>
          <p><strong>Description:</strong> {editingPart.description}</p>
          <p><strong>Manufacturer:</strong> {editingPart.manufacturer}</p>
          <hr />
          <h4>📞 Contact Information</h4>
          <div className="form-group">
            <label>Contact Person</label>
            <input type="text" value={editingPart.contact_person || ''} onChange={(e) => setEditingPart({...editingPart, contact_person: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input type="tel" value={editingPart.contact_phone || ''} onChange={(e) => setEditingPart({...editingPart, contact_phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input type="email" value={editingPart.contact_email || ''} onChange={(e) => setEditingPart({...editingPart, contact_email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Bin Location</label>
            <input type="text" value={editingPart.location_bin || ''} onChange={(e) => setEditingPart({...editingPart, location_bin: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Minimum Stock</label>
            <input type="number" value={editingPart.min_stock || 5} onChange={(e) => setEditingPart({...editingPart, min_stock: parseInt(e.target.value) || 5})} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ backgroundColor: '#f39c12' }}>Save Changes</button>
            <button type="button" onClick={() => { setShowEditForm(false); setEditingPart(null); }} style={{ backgroundColor: '#95a5a6' }}>Cancel</button>
          </div>
        </form>
      )}

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Search parts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ margin: '20px 0', padding: '8px', width: '300px' }}
      />
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Part #</th>
            <th>Description</th>
            <th>Manufacturer</th>
            <th>Location</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {parts.filter(p => p.part_number.toLowerCase().includes(search.toLowerCase()) || 
            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))).map(part => (
            <tr key={part.id} className={part.quantity_on_hand <= part.min_stock ? 'alert-row' : ''}>
              <td>{part.part_number}</td>
              <td>{part.description || '-'}</td>
              <td>{part.manufacturer || '-'}</td>
              <td>{part.location_bin || '-'}</td>
              <td style={{ fontWeight: 'bold', color: part.quantity_on_hand <= part.min_stock ? 'red' : 'green' }}>
                {part.quantity_on_hand}
              </td>
              <td>{part.min_stock}</td>
              <td>
                <button 
                  onClick={() => showContactDetails(part)}
                  style={{ backgroundColor: '#3498db', padding: '5px 10px', marginRight: '5px', cursor: 'pointer' }}
                >
                  📞 View
                </button>
              </td>
              <td>
                <button 
                  onClick={() => openEditForm(part)}
                  style={{ backgroundColor: '#f39c12', padding: '5px 10px', marginRight: '5px', cursor: 'pointer' }}
                >
                  ✏️ Edit
                </button>
                {canDelete && (
                  <button 
                    onClick={() => setShowDeleteConfirm(part)}
                    style={{ backgroundColor: '#e74c3c', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Contact Details Modal */}
      {selectedPart && (
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
            maxWidth: '450px',
            width: '90%'
          }}>
            <h3>📞 Manufacturer Contact</h3>
            <hr />
            <p><strong>Part Number:</strong> {selectedPart.part_number}</p>
            <p><strong>Description:</strong> {selectedPart.description}</p>
            <p><strong>Manufacturer:</strong> {selectedPart.manufacturer || 'N/A'}</p>
            <hr />
            <h4>Contact Details:</h4>
            <p><strong>👤 Contact Person:</strong> {selectedPart.contact_person || 'Not provided'}</p>
            <p><strong>📞 Phone:</strong> {selectedPart.contact_phone ? <a href={`tel:${selectedPart.contact_phone}`}>{selectedPart.contact_phone}</a> : 'Not provided'}</p>
            <p><strong>📧 Email:</strong> {selectedPart.contact_email ? <a href={`mailto:${selectedPart.contact_email}`}>{selectedPart.contact_email}</a> : 'Not provided'}</p>
            <hr />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={closeContactDetails} style={{ backgroundColor: '#95a5a6', cursor: 'pointer' }}>Close</button>
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
            <p><strong>{showDeleteConfirm.part_number}</strong><br/>{showDeleteConfirm.description}</p>
            <p style={{ color: 'red' }}>⚠️ This action cannot be undone!</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={() => handleDeletePart(showDeleteConfirm)} style={{ backgroundColor: '#e74c3c', cursor: 'pointer' }}>
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ backgroundColor: '#95a5a6', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsList;