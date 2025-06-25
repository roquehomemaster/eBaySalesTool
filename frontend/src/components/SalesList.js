import React, { useEffect, useState } from 'react';
import Page from './Page';
import SystemMessage from './SystemMessage';
import apiService from '../services/apiService';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await apiService.getSales();
        setSales(response.sales || response); // handle both {sales:[]} and []
        setMessage(null);
      } catch (error) {
        setMessage('Error fetching sales. Please try again later.');
        setMessageType('error');
        setSales([]);
      }
    };
    fetchSales();
  }, []);

  return (
    <Page title="Sales List">
      <SystemMessage message={message} type={messageType} onClose={() => setMessage(null)} />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Buyer</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr><td colSpan="6" style={{textAlign:'center'}}>No sales found.</td></tr>
          ) : (
            sales.map((sale, idx) => (
              <tr key={sale.id || idx}>
                <td>{sale.date || '-'}</td>
                <td>{sale.itemName || '-'}</td>
                <td>{sale.quantity || '-'}</td>
                <td>{sale.price || '-'}</td>
                <td>{sale.total || '-'}</td>
                <td>{sale.buyer || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Page>
  );
};

export default SalesList;
