import React from 'react';
import UrlCatalog from './UrlCatalog';

const AdminUrls = () => {
  return (
    <div className="admin-urls" style={{ padding: '1rem' }}>
      <h2>Application URLs</h2>
      <p style={{ marginTop: 0 }}>Quick reference for important frontend and backend endpoints.</p>
      <UrlCatalog />
    </div>
  );
};

export default AdminUrls;
