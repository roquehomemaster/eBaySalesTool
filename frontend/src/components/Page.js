import React from 'react';
import './Page.css';

const Page = ({ title, children }) => (
  <div className="page-container">
    <h2 className="page-title">{title}</h2>
    {children}
  </div>
);

export default Page;
