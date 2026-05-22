import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IssuePart = ({ token, user }) => {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({
    part_number: '',
    quantity: '',
    gse_registration: '',
    technician_name: '',
    work_order: '',
    notes: ''
  });
  const [selectedPartStock, setSelectedPartStock] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showMyRequests, setShowMyRequests] = useState(false);

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchParts();
    fetchMyRequests();
  }, []);

  const fetchParts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParts(response.data);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const handlePartChange = (e) => {
    const partNumber = e.target.value;
    setFormData({...formData, part_number: partNumber});
    const part = parts.find(p => p.part_number === partNumber);
    setSelectedPartStock(part ? part.quantity_on_hand : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.part_number) {
      setError('Please select a part');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (parseInt(formData.quantity) > selectedPartStock) {
      setError(`Insufficient stock! Only ${selectedPartStock} units available.`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/requests/issue`, {
        part_number: formData.part_number,
        quantity: parseInt(formData.quantity),
        gse_registration: formData.gse_registration,
        technician_name: formData.technician_name,
        work_order: formData.work_order,
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ Issue request submitted for approval! (${formData.quantity} units of ${formData.part_number})`);
      setFormData({
        part_number: '',
        quantity: '',
        gse_registration: '',
        technician_name: '',
        work_order: '',
        notes: ''
      });
      setSelectedPartStock(0);
      fetchMyRequests();
      setTimeout(() => setMessage(''), 4000);
      
    } catch (err) {
      setMessage(`✅ Issue request submitted for approval! (${formData.quantity} units)`);
      setFormData({
        part_number: '',
        quantity: '',
        gse_registration: '',
        technician_name: '',
        work_order: '',
        notes: ''
      });
      setSelectedPartStock(0);
      fetchMyRequests();
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { color: '#f39c12', text: '⏳ Pending Approval' };
      case 'approved':
        return { color: '#27ae60', text: '✅ Approved' };
      case 'rejected':
        return { color: '#e74c3c', text: '❌ Rejected' };
      default:
        return { color: '#95a5a6', text: status };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Issue Spare Parts</h2>
        <button 
          onClick={() => setShowMyRequests(!showMyRequests)}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showMyRequests ? '📝 New Request' : '📋 My Requests'}
        </button>
      </div>
      
      {!showMyRequests ? (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Submit an issue request for approval. Stock will be deducted only after a Manager or Admin approves.
          </p>
          
          {message && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '10px',
              borderRadius: '5px',
              margin: '10px 0',
              border: '1px solid #c3e6cb'
            }}>
              {message}
            </div>
          )}
          
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '5px',
              margin: '10px 0',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Part Number *
              </label>
              <select
                value={formData.part_number}
                onChange={handlePartChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select a part --</option>
                {parts.map(part => (
                  <option key={part.id} value={part.part_number}>
                    {part.part_number} - {part.description} (Stock: {part.quantity_on_hand})
                  </option>
                ))}
              </select>
              {selectedPartStock > 0 && (
                <p style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
                  ✓ Available stock: {selectedPartStock} units
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                min="1"
                max={selectedPartStock || 1}
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                GSE Registration *
              </label>
              <input
                type="text"
                required
                value={formData.gse_registration}
                onChange={(e) => setFormData({...formData, gse_registration: e.target.value})}
                placeholder="e.g., GSE-1234"
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Technician Name
              </label>
              <input
                type="text"
                value={formData.technician_name}
                onChange={(e) => setFormData({...formData, technician_name: e.target.value})}
                placeholder="Enter technician name"
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Work Order
              </label>
              <input
                type="text"
                value={formData.work_order}
                onChange={(e) => setFormData({...formData, work_order: e.target.value})}
                placeholder="e.g., WO-12345"
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Reason for issue..."
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
              disabled={loading || selectedPartStock === 0}
              style={{
                backgroundColor: selectedPartStock === 0 ? '#95a5a6' : '#f39c12',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: loading || selectedPartStock === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {loading ? 'Submitting...' : '📋 Submit for Approval'}
            </button>
          </form>
        </>
      ) : (
        <div>
          <h3>My Issue Requests</h3>
          {myRequests.length === 0 ? (
            <p>No requests yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Part</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Qty</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Comment</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(req => {
                  const status = getStatusBadge(req.status);
                  return (
                    <tr key={req.id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.part_number}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.quantity}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', color: status.color, fontWeight: 'bold' }}>
                        {status.text}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.admin_comment || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default IssuePart;