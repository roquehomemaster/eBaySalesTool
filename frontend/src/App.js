import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SalesForm from './components/SalesForm';
import SalesTable from './components/SalesTable';
import ProductResearch from './components/ProductResearch';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SalesTable />} />
          <Route path="/add-sale" element={<SalesForm />} />
          <Route path="/product-research" element={<ProductResearch />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;