import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = ({ token }) => {
  const [lowStockParts, setLowStockParts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://gse-backend.onrender.com';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lowStockRes, transactionsRes] = await Promise.all([
          axios.get(`${API_URL}/api/reports/low-stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/transactions?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setLowStockParts(lowStockRes.data);
        setRecentTransactions(transactionsRes.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const exportToCSV = () => {
    const headers = ['Date', 'Part Number', 'Description', 'Type', 'Quantity', 'GSE/Reference', 'Technician', 'Created By'];
    const rows = recentTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.part_number,
      tx.description,
      tx.transaction_type,
      tx.quantity,
      tx.gse_registration || tx.reference_number || '-',
      tx.technician_name || '-',
      tx.created_by
    ]);
    const csvContent = [headers, ...rows