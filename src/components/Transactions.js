import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/transactions?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [token]);

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div>
      <h2>Transaction History</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Part</th>
            <th>Type</th>
            <th>Qty</th>
            <th>GSE/PO</th>
            <th>Technician</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{new Date(tx.created_at).toLocaleString()}</td>
              <td>{tx.part_number}</td>
              <td className={`tx-type-${tx.transaction_type.toLowerCase()}`}>{tx.transaction_type}</td>
              <td>{tx.quantity}</td>
              <td>{tx.gse_registration || tx.reference_number || '-'}</td>
              <td>{tx.technician_name || '-'}</td>
              <td>{tx.created_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;