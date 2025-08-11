import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SalesForm from './components/SalesForm';
import CatalogTable from './components/ItemTable';
import ProductResearch from './components/ProductResearch';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import Reports from './components/Reports';
import ListingTable from './components/ListingTable';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="/listings" element={<ListingTable />} />
          <Route path="/catalog" element={<CatalogTable />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/add-sale" element={<SalesForm />} />
          <Route path="/product-research" element={<ProductResearch />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;