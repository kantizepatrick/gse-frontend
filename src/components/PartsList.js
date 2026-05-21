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

  const API_URL = `http://${window.location.hostname}:5000`;

  const fetchParts = useCallback(async () => {
    const response = await axios.get(`${API_URL}/api/parts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setParts(response.data);
  }, [token, API_URL]);

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
      setError('Error: ' + (err.response?.data?.error || 'Part number may already exist'));
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
    setSelectedPart(selectedPart?.id === part.id ? null : part);
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
            <label>Manufacturer</label>
            <input type="text" value={newPart.manufacturer} onChange={(e) => setNewPart({...newPart, manufacturer: e.target.value})} />
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
            <input type="number" value