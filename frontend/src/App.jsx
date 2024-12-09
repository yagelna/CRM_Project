import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Contacts from './pages/contacts';
import Companies from './pages/companies';
import Inventory from './pages/inventory';
import Rfqs from './pages/rfqs';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="content">

          <Routes>
            <Route path="/rfqs" element={<Rfqs />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/" element={<h1>Dashboard</h1>} />
          </Routes>
        </div>  
      </div>
    </Router>
  );
}

export default App;