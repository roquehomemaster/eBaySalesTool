import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const tabs = [
  { label: 'App Config', path: 'appconfig' },
  { label: 'App URLs', path: 'urls' },
  { label: 'eBay Integration', path: 'ebay' }
];

const AdminLayout = () => {
  const loc = useLocation();
  return (
    <div className="admin-layout" style={{ padding: '1rem' }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>
      <div className="admin-subtabs">
        {tabs.map(t => (
          <NavLink key={t.path}
            to={t.path}
            className={({ isActive }) => 'admin-subtab' + (isActive ? ' active' : '')}
            end>
            {t.label}
          </NavLink>
        ))}
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
