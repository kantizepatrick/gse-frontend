import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setLoading(false);
    }
  };

  const getTransactionTypeBadge = (type) => {
    if (type === 'RECEIVE') {
      return { color: '#27ae60', bg: '#eafaf1', text: '📥 RECEIVE' };
    } else {
      return { color: '#3498db', bg: '#e8f4fd', text: '📤 ISSUE' };
    }
  };

  // Helper to extract maintenance type from notes
  const getMaintenanceType = (notes) => {
    if (!notes) return null;
    
    if (notes.includes('🔧 Preventive Maintenance')) {
      return { type: 'preventive', icon: '🔧', text: 'Preventive Maintenance', color: '#27ae60', bg: '#eafaf1' };
    }
    if (notes.includes('🛠️ Corrective Maintenance')) {
      return { type: 'corrective', icon: '🛠️', text: 'Corrective Maintenance', color: '#e74c3c', bg: '#fdeaea' };
    }
    return null;
  };

  // Helper to clean notes (remove maintenance type prefix)
  const cleanNotes = (notes) => {
    if (!notes) return '';
    return notes
      .replace('🔧 Preventive Maintenance - ', '')
      .replace('🛠️ Corrective Maintenance - ', '')
      .replace('🔧 Preventive Maintenance', '')
      .replace('🛠️ Corrective Maintenance', '');
  };

  const filteredTransactions = transactions.filter(trans => {
    if (filter !== 'all' && trans.transaction_type !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (trans.part_number && trans.part_number.toLowerCase().includes(searchLower)) ||
        (trans.description && trans.description.toLowerCase().includes(searchLower)) ||
        (trans.gse_registration && trans.gse_registration.toLowerCase().includes(searchLower)) ||
        (trans.technician_name && trans.technician_name.toLowerCase().includes(searchLower)) ||
        (trans.work_order && trans.work_order.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading transactions...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>📜 Transaction History</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search by part, GSE, technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '250px'
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="all">All Transactions</option>
            <option value="RECEIVE">📥 Receive Only</option>
            <option value="ISSUE">📤 Issue Only</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No transactions found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Part Number</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Description</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Maintenance Type</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Quantity</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>GSE Registration</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Technician</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Work Order</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Notes</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Created By</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(trans => {
                const typeStyle = getTransactionTypeBadge(trans.transaction_type);
                const maintType = getMaintenanceType(trans.notes);
                const cleanNote = cleanNotes(trans.notes);
                
                return (
                  <tr key={trans.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {new Date(trans.created_at).toLocaleString()}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <span style={{ color: typeStyle.color, fontWeight: 'bold' }}>{typeStyle.text}</span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                      {trans.part_number}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {trans.description || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {maintType ? (
                        <span style={{ 
                          backgroundColor: maintType.bg, 
                          color: maintType.color, 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-block'
                        }}>
                          {maintType.icon} {maintType.text}
                        </span>
                      ) : (
                        <span style={{ color: '#95a5a6', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                      {trans.transaction_type === 'RECEIVE' ? `+${trans.quantity}` : `-${trans.quantity}`}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {trans.gse_registration || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {trans.technician_name || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {trans.work_order || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {cleanNote || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                      {trans.created_by || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h4>📊 Transaction Summary</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <strong>Total Transactions:</strong> {filteredTransactions.length}
          </div>
          <div>
            <strong>📥 Receives:</strong> {filteredTransactions.filter(t => t.transaction_type === 'RECEIVE').length}
          </div>
          <div>
            <strong>📤 Issues:</strong> {filteredTransactions.filter(t => t.transaction_type === 'ISSUE').length}
          </div>
          <div>
            <strong>🔧 Preventive Maintenance:</strong> {filteredTransactions.filter(t => t.notes && t.notes.includes('Preventive Maintenance')).length}
          </div>
          <div>
            <strong>🛠️ Corrective Maintenance:</strong> {filteredTransactions.filter(t => t.notes && t.notes.includes('Corrective Maintenance')).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;