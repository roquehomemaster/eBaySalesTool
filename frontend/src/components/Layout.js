import React, { useState } from 'react';
import './Layout.css';
import NavTabs from './NavTabs';
import SystemMessage from './SystemMessage';

const Layout = ({ children }) => {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState('info');

  // Example: setMessage('Welcome!') to show a message
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-logo">eBay Sales Tool</div>
        <NavTabs />
      </header>
      <main className="app-main">
        <SystemMessage message={message} type={type} onClose={() => setMessage(null)} />
        {children}
      </main>
      <footer className="app-footer">
        &copy; {new Date().getFullYear()} eBay Sales Tool | Version 1.0
      </footer>
    </div>
  );
};

export default Layout;
