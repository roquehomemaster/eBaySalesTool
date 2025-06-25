import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SalesForm from './components/SalesForm';
import ItemTable from './components/ItemTable';
import ProductResearch from './components/ProductResearch';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import Reports from './components/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ItemTable />} />
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