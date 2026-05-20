import React, { useState } from 'react';
import axios from 'axios';

const ReceivePart = ({ token }) => {
  const [mode, setMode] = useState('receive');
  const [formData, setFormData] = useState({
    part_number: '',
    quantity: '',
    reference_number: '',
    notes: ''
  });
  const [newPartData, setNewPartData] = useState({
    part_number: '',
    description: '',
    manufacturer: '',
    compatible_gse: '',
    location_bin: '',
    min_stock: 5
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'https://gse-backend.onrender.com';

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/transactions/receive`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Parts received successfully!');
      setError('');
      setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error receiving parts');
      setMessage('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddAndReceive = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/parts`, {
        part_number: newPartData.part_number,
        description: newPartData.description,
        manufacturer: newPartData.manufacturer,
        compatible_gse: newPartData.compatible_gse,
        location_bin: newPartData.location_bin,
        min_stock: newPartData.min_stock
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await axios.post(`${API_URL}/api/transactions/receive`, {
        part_number: newPartData.part_number,
        quantity: formData.quantity,
        reference_number: formData.reference_number,
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`Part "${newPartData.part_number}" added and ${formData.quantity} units received!`);
      setError('');

      setNewPartData({
        part_number: '',
        description: '',
        manufacturer: '',
        compatible_gse: '',
        location_bin: '',
        min_stock: 5
      });
      setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });

      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding part. Part number may already exist.');
      setMessage('');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setMode('receive')} style={{ backgroundColor: mode === 'receive' ? '#3498db' : '#95a5a6' }}>
          📦 Receive Existing Part
        </button>
        <button onClick={() => setMode('add_receive')} style={{ backgroundColor: mode === 'add_receive' ? '#27ae60' : '#95a5a6' }}>
          ➕ Add New Part + Receive
        </button>
      </div>

      {mode === 'receive' ? (
        <div>
          <h2>Receive Spare Parts (Existing Part)</h2>
          <form onSubmit={handleReceive} className="form-container">
            <div className="form-group">
              <label>Part Number *</label>
              <input type="text" placeholder="Scan or type existing part number" value={formData.part_number} onChange={(e) => setFormData({...formData, part_number: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>PO / Reference Number</label>
              <input type="text" value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
            <button type="submit">Receive Parts</button>
          </form>
        </div>
      ) : (
        <div>
          <h2>➕ Add New Part & Receive Initial Stock</h2>
          <form onSubmit={handleAddAndReceive} className="form-container">
            <h3>Part Information</h3>
            <div className="form-group">
              <label>Part Number *</label>
              <input type="text" placeholder="e.g., SNS-999" value={newPartData.part_number} onChange={(e) => setNewPartData({...newPartData, part_number: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <input type="text" placeholder="Part description" value={newPartData.description} onChange={(e) => setNewPartData({...newPartData, description: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Manufacturer</label>
              <input type="text" placeholder="e.g., Parker, Honeywell" value={newPartData.manufacturer} onChange={(e) => setNewPartData({...newPartData, manufacturer: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Compatible GSE</label>
              <input type="text" placeholder="e.g., Tow Tractor, GPU" value={newPartData.compatible_gse} onChange={(e) => setNewPartData({...newPartData, compatible_gse: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Bin Location</label>
              <input type="text" placeholder="e.g., A-12" value={newPartData.location_bin} onChange={(e) => setNewPartData({...newPartData, location_bin: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Minimum Stock Alert</label>
              <input type="number" value={newPartData.min_stock} onChange={(e) => setNewPartData({...newPartData, min_stock: parseInt(e.target.value)})} />
            </div>

            <hr style={{ margin: '20px 0' }} />

            <h3>Initial Stock Information</h3>
            <div className="form-group">
              <label>Initial Quantity *</label>
              <input type="number" placeholder="How many units?" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>PO / Reference Number</label>
              <input type="text" placeholder="Purchase order number" value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Any additional notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>

            <button type="submit" style={{ backgroundColor: '#27ae60' }}>✅ Add Part & Receive Stock</button>
          </form>
        </div>
      )}

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ReceivePart;