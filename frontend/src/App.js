import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SalesForm from './components/SalesForm';
import SalesTable from './components/SalesTable';
import ProductResearch from './components/ProductResearch';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={SalesTable} />
          <Route path="/add-sale" component={SalesForm} />
          <Route path="/product-research" component={ProductResearch} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;