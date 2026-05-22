import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PendingApprovals = ({ token, user }) => {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState({});

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load pending requests');
    }
  };

  const handleAction = async (requestId, action) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/requests/${requestId}/${action}`, {
        comment: comment[requestId] || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`Request ${action}ed successfully!`);
      fetchPendingRequests();
      setComment({});
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Error ${action}ing request`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Access Denied</h3>
        <p>Only Managers and Admins can access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Pending Issue Approvals</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Review and approve/reject issue requests from storekeepers. Stock will be deducted only after approval.
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
      
      {requests.length === 0 ? (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '40px',
          textAlign: 'center',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <p>No pending requests to approve.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Requested By</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Part #</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Description</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Qty</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Current Stock</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>GSE Reg</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Technician</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Work Order</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Notes</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Comment</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.requested_by_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.part_number}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.description || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{req.quantity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.current_stock}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.gse_registration || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.technician_name || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.work_order || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{req.notes || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <input
                      type="text"
                      placeholder="Optional comment"
                      value={comment[req.id] || ''}
                      onChange={(e) => setComment({...comment, [req.id]: e.target.value})}
                      style={{
                        width: '150px',
                        padding: '5px',
                        borderRadius: '3px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={loading}
                      style={{
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        marginRight: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={loading}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;