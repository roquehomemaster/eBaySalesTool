import React from 'react';
import ListWithDetails from './ListWithDetails';
import apiService from '../services/apiService';

const ListingTable = () => {
  const fetchList = async () => {
    const response = await apiService.getListings();
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.listings) {
      return response.listings;
    }
    if (response?.data?.listings) {
      return response.data.listings;
    }
    return [];
  };

  const columns = ['Title', 'Listing Price', 'Status', 'Item ID', 'Created At', 'Updated At'];
  const rowRenderer = (listing) => (
    <>
      <td>{listing.title}</td>
      <td>{listing.listing_price}</td>
      <td>{listing.status}</td>
      <td>{listing.item_id}</td>
      <td>{listing.created_at ? new Date(listing.created_at).toLocaleString() : ''}</td>
      <td>{listing.updated_at ? new Date(listing.updated_at).toLocaleString() : ''}</td>
    </>
  );

  const detailsRenderer = (listing) => {
    const entries = Object.entries(listing || {});
    const formatKey = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    const formatVal = (v) => {
      if (v === null || v === undefined) {
        return '-';
      }
      if (typeof v === 'string') {
        // Try to parse timestamps
        const d = new Date(v);
        if (!isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(v)) {
          return d.toLocaleString();
        }
      }
      return String(v);
    };
    return (
      <div>
        <h3>Listing Details</h3>
        <table className="kv-table">
          <tbody>
            {entries.map(([key, val]) => (
              <tr key={key}>
                <td className="kv-key">{formatKey(key)}</td>
                <td className="kv-val">{formatVal(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          .kv-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .kv-table td { border-bottom: 1px solid #eee; padding: 6px 8px; vertical-align: top; }
          .kv-key { width: 220px; font-weight: 600; color: #334e68; background: #f9fbfd; }
        `}</style>
      </div>
    );
  };

  return (
    <ListWithDetails
      title="eBay Listings"
      fetchList={fetchList}
      columns={columns}
      rowRenderer={rowRenderer}
      detailsRenderer={detailsRenderer}
      pageKey="listings"
    />
  );
};

export default ListingTable;
