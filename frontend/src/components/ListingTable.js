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

  const detailsRenderer = (listing) => (
    <div>
      <h3>{listing.title}</h3>
      <p><strong>Price:</strong> {listing.listing_price}</p>
      <p><strong>Status:</strong> {listing.status}</p>
      <p><strong>Item ID:</strong> {listing.item_id}</p>
      <p><strong>Created:</strong> {listing.created_at ? new Date(listing.created_at).toLocaleString() : '-'}</p>
      <p><strong>Updated:</strong> {listing.updated_at ? new Date(listing.updated_at).toLocaleString() : '-'}</p>
    </div>
  );

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
