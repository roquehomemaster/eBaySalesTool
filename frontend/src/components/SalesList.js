import React from 'react';
import ListWithDetails from './ListWithDetails';
import apiService from '../services/apiService';

const SalesList = () => {
  const fetchList = async () => {
    const response = await apiService.getSales();
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.sales)) {
      return response.sales;
    }
    return [];
  };

  const columns = ['Date', 'Item', 'Quantity', 'Price', 'Total', 'Buyer'];
  const rowRenderer = (sale) => (
    <>
      <td>{sale.date || '-'}</td>
      <td>{sale.itemName || '-'}</td>
      <td>{sale.quantity || '-'}</td>
      <td>{sale.price || '-'}</td>
      <td>{sale.total || '-'}</td>
      <td>{sale.buyer || '-'}</td>
    </>
  );

  const detailsRenderer = (sale) => (
    <div>
      <h3>Sale Details</h3>
      <p><strong>Date:</strong> {sale.date || '-'}</p>
      <p><strong>Item:</strong> {sale.itemName || '-'}</p>
      <p><strong>Quantity:</strong> {sale.quantity || '-'}</p>
      <p><strong>Price:</strong> {sale.price || '-'}</p>
      <p><strong>Total:</strong> {sale.total || '-'}</p>
      <p><strong>Buyer:</strong> {sale.buyer || '-'}</p>
    </div>
  );

  return (
    <ListWithDetails
      title="Sales List"
      fetchList={fetchList}
      columns={columns}
      rowRenderer={rowRenderer}
      detailsRenderer={detailsRenderer}
      pageKey="sales"
      filterConfig={{
        Date: { type: 'text', placeholder: 'date' },
        Item: { type: 'text', placeholder: 'item' },
        Quantity: { type: 'text', placeholder: 'qty' },
        Price: { type: 'text', placeholder: 'price' },
        Total: { type: 'text', placeholder: 'total' },
        Buyer: { type: 'text', placeholder: 'buyer' }
      }}
    />
  );
};

export default SalesList;
