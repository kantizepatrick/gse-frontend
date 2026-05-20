import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Transactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);

  // Dynamic API URL - works with any IP address automatically
  const API_URL = `http://${window.location.hostname}:5000`;

  const fetchTransactions = useCallback(async () => {
    const response = await axios.get(`${API_URL}/api/transactions?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTransactions(response.data);
  }, [token, API_URL]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div>
      <h2>Transaction History</h2>
      <table className="data-table">
        <thead>
          <tr><th>Date</th><th>Part</th><th>Type</th><th>Qty</th><th>GSE/PO</th><th>Technician</th><th>By</th></tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{new Date(tx.created_at).toLocaleString()}</td>
              <td>{tx.part_number}</td>
              <td className={`tx-type-${tx.transaction_type.toLowerCase()}`}>{tx.transaction_type}</td>
              <td>{tx.quantity}</td>
              <td>{tx.gse_registration || tx.reference_number}</td>
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