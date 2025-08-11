import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import SystemMessage from './SystemMessage';
import Page from './Page';

const ListingTable = () => {
  const [listings, setListings] = useState([]);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await apiService.getListings();
        let entries = [];
        if (Array.isArray(response)) {
          entries = response;
        } else if (response && Array.isArray(response.listings)) {
          entries = response.listings;
        } else if (response && response.data && Array.isArray(response.data.listings)) {
          entries = response.data.listings;
        }
        setListings(entries);
        if (!entries.length) {
          setMessage('No listings available');
          setMessageType('info');
        } else {
          setMessage(null);
        }
      } catch (error) {
        setMessage('Error fetching listings. Please try again later.');
        setMessageType('error');
        setListings([]);
      }
    };
    fetchListings();
  }, []);

  return (
    <Page title="eBay Listings">
      <SystemMessage message={message} type={messageType} onClose={() => setMessage(null)} />
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Listing Price</th>
            <th>Status</th>
            <th>Item ID</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          {listings.length > 0 ? (
            listings.map(listing => (
              <tr key={listing.listing_id}>
                <td>{listing.title}</td>
                <td>{listing.listing_price}</td>
                <td>{listing.status}</td>
                <td>{listing.item_id}</td>
                <td>{listing.created_at ? new Date(listing.created_at).toLocaleString() : ''}</td>
                <td>{listing.updated_at ? new Date(listing.updated_at).toLocaleString() : ''}</td>
              </tr>
            ))
          ) : null}
        </tbody>
      </table>
    </Page>
  );
};

export default ListingTable;
