import React, { useState } from 'react';
import axios from 'axios';

const IssuePart = ({ token }) => {
  const [formData, setFormData] = useState({
    part_number: '',
    quantity: '',
    gse_registration: '',
    technician_name: '',
    work_order: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'https://gse-backend.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/transactions/issue`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${response.data.message} Removed ${response.data.removed} units!`);
      setFormData({
        part_number: '',
        quantity: '',
        gse_registration: '',
        technician_name: '',
        work_order: '',
        notes: ''
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error issuing parts');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div>
      <h2>Issue Spare Parts</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Part Number *</label>
          <input type="text" required value={formData.part_number} onChange={(e) => setFormData({...formData, part_number: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <input type="number" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
        </div>
        <div className="form-group">
          <label>GSE Registration *</label>
          <input type="text" required value={formData.gse_registration} onChange={(e) => setFormData({...formData, gse_registration: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Technician Name</label>
          <input type="text" value={formData.technician_name} onChange={(e) => setFormData({...formData, technician_name: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Work Order</label>
          <input type="text" value={formData.work_order} onChange={(e) => setFormData({...formData, work_order: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>
        <button type="submit">Issue Parts</button>
        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default IssuePart;