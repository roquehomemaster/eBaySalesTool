import React from 'react';
import { NavLink } from 'react-router-dom';
import './NavTabs.css';

const tabs = [
  { label: 'Items', path: '/' },
  { label: 'Sales', path: '/sales' },
  { label: 'Reports', path: '/reports' },
];

const NavTabs = () => (
  <nav className="app-nav">
    <ul>
      {tabs.map(tab => (
        <li key={tab.path}>
          <NavLink
            to={tab.path}
            className={({ isActive }) => isActive ? 'active' : ''}
            end={tab.path === '/'}
          >
            {tab.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default NavTabs;
