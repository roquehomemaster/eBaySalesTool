import React from 'react';

/* UrlCatalog
 * Simple static list of important application URLs (frontend & backend) for quick admin reference.
 * If environment variables define backend host/port, uses them; else assumes same origin.
 */
const UrlCatalog = () => {
  // Determine backend base: prefer explicit env var; otherwise if frontend is on 3000 assume backend on 5000
  const inferredOrigin = (() => {
    const { protocol, hostname, port } = window.location;
    if (process.env.REACT_APP_BACKEND_BASE) {
      return process.env.REACT_APP_BACKEND_BASE.replace(/\/$/, '');
    }
    if (port === '3000') {
      return `${protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  })();
  const backendBase = inferredOrigin.replace(/\/$/, '');
  const rows = [
    { label: 'Frontend Listings', url: '/listings' },
    { label: 'Frontend Catalog', url: '/catalog' },
    { label: 'Frontend Sales', url: '/sales' },
    { label: 'Frontend Reports', url: '/reports' },
    { label: 'Admin App Config', url: '/admin/appconfig' },
  { label: 'Swagger UI', url: backendBase + '/api-docs' },
  { label: 'eBay Admin API Base', url: backendBase + '/api/admin/ebay' },
    { label: 'Health Check', url: backendBase + '/api/health' },
    { label: 'Populate DB (POST)', url: backendBase + '/api/populate-database' },
    { label: 'Catalog API', url: backendBase + '/api/catalog' },
    { label: 'Listing API', url: backendBase + '/api/listings' },
    { label: 'Ownership API', url: backendBase + '/api/ownership' },
    { label: 'Sales API', url: backendBase + '/api/sales' },
    { label: 'Customers API', url: backendBase + '/api/customers' },
    { label: 'App Config API', url: backendBase + '/api/appconfig' },
  ];
  return (
    <div style={{ marginTop: 32 }}>
      <h3>Application URLs</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #ccc' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid #ccc' }}>URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <td style={{ padding: '4px 6px', verticalAlign: 'top' }}>{r.label}</td>
              <td style={{ padding: '4px 6px' }}>
                {r.url.startsWith('http') ? (
                  <a href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
                ) : (
                  <code>{r.url}</code>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
  Backend base assumed: {backendBase}. Set REACT_APP_BACKEND_BASE to override (e.g. http://localhost:5000).
      </p>
    </div>
  );
};

export default UrlCatalog;
