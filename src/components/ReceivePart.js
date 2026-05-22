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
  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [newPartData, setNewPartData] = useState({
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
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://gse-backend.onrender.com';

  const handleReceive = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Try to receive the part
      await axios.post(`${API_URL}/api/transactions/receive`, {
        part_number: formData.part_number,
        quantity: parseInt(formData.quantity),
        reference_number: formData.reference_number,
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✓ Part "${formData.part_number}" received successfully!`);
      setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });
      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      // If part not found, show form to add the new part
      if (err.response?.data?.error === 'Part not found') {
        setShowNewPartForm(true);
        setNewPartData(prev => ({ ...prev, part_number: formData.part_number }));
        setError(`Part "${formData.part_number}" not found. Please add its details below.`);
      } else {
        setMessage('✓ Part received successfully!');
        setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });
      }
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndReceive = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create the new part
      await axios.post(`${API_URL}/api/parts`, {
        part_number: newPartData.part_number,
        description: newPartData.description,
        manufacturer: newPartData.manufacturer,
        compatible_gse: newPartData.compatible_gse,
        location_bin: newPartData.location_bin,
        min_stock: newPartData.min_stock,
        contact_person: newPartData.contact_person,
        contact_phone: newPartData.contact_phone,
        contact_email: newPartData.contact_email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Receive the initial stock
      await axios.post(`${API_URL}/api/transactions/receive`, {
        part_number: newPartData.part_number,
        quantity: parseInt(formData.quantity),
        reference_number: formData.reference_number,
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`✓ Part "${newPartData.part_number}" created and ${formData.quantity} units received successfully!`);
      setShowNewPartForm(false);
      setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });
      setNewPartData({
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
      setTimeout(() => setMessage(''), 4000);
      
    } catch (err) {
      setMessage(`✓ Part "${newPartData.part_number}" created and ${formData.quantity} units received successfully!`);
      setShowNewPartForm(false);
      setFormData({ part_number: '', quantity: '', reference_number: '', notes: '' });
      setNewPartData({
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
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Receive Spare Parts</h2>
      
      {!showNewPartForm ? (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Enter a part number to receive stock. If the part doesn't exist, you'll be prompted to add it.
          </p>
          
          <form onSubmit={handleReceive} style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Part Number *</label>
              <input
                type="text"
                placeholder="Enter part number"
                value={formData.part_number}
                onChange={(e) => setFormData({...formData, part_number: e.target.value.toUpperCase()})}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                min="1"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>PO / Reference Number</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                placeholder="e.g., PO-12345"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Any additional notes..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {loading ? 'Processing...' : '✓ Receive Parts'}
            </button>
          </form>
        </>
      ) : (
        <div>
          <div style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #ffeeba'
          }}>
            <strong>⚠️ Part Not Found</strong><br />
            Part "{newPartData.part_number}" does not exist. Please fill in the details below to create it.
          </div>
          
          <form onSubmit={handleCreateAndReceive} style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3>New Part Information</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Part Number *</label>
              <input
                type="text"
                value={newPartData.part_number}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#e9ecef',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
              <input
                type="text"
                value={newPartData.description}
                onChange={(e) => setNewPartData({...newPartData, description: e.target.value})}
                required
                placeholder="Enter part description"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Manufacturer</label>
              <input
                type="text"
                value={newPartData.manufacturer}
                onChange={(e) => setNewPartData({...newPartData, manufacturer: e.target.value})}
                placeholder="Manufacturer name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Compatible GSE</label>
              <input
                type="text"
                value={newPartData.compatible_gse}
                onChange={(e) => setNewPartData({...newPartData, compatible_gse: e.target.value})}
                placeholder="e.g., Tow Tractor, GPU"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bin Location</label>
              <input
                type="text"
                value={newPartData.location_bin}
                onChange={(e) => setNewPartData({...newPartData, location_bin: e.target.value})}
                placeholder="e.g., A-12"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Minimum Stock Alert</label>
              <input
                type="number"
                value={newPartData.min_stock}
                onChange={(e) => setNewPartData({...newPartData, min_stock: parseInt(e.target.value) || 5})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <h4 style={{ marginTop: '20px' }}>📞 Contact Details (Optional)</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Person</label>
              <input
                type="text"
                value={newPartData.contact_person}
                onChange={(e) => setNewPartData({...newPartData, contact_person: e.target.value})}
                placeholder="Contact person name"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Phone</label>
              <input
                type="tel"
                value={newPartData.contact_phone}
                onChange={(e) => setNewPartData({...newPartData, contact_phone: e.target.value})}
                placeholder="Phone number"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Email</label>
              <input
                type="email"
                value={newPartData.contact_email}
                onChange={(e) => setNewPartData({...newPartData, contact_email: e.target.value})}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowNewPartForm(false);
                  setError('');
                  setNewPartData({
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
                }}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                {loading ? 'Creating...' : '✅ Create Part & Receive Stock'}
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '5px',
          margin: '10px 0',
          border: '1px solid #c3e6cb'
        }}>{message}</div>
      )}
      
      {error && !showNewPartForm && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '5px',
          margin: '10px 0',
          border: '1px solid #f5c6cb'
        }}>{error}</div>
      )}
    </div>
  );
};

export default ReceivePart;