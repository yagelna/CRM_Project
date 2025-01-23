import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Contacts from './pages/contacts';
import Companies from './pages/companies';
import Inventory from './pages/inventory';
import Rfqs from './pages/rfqs';
import Dashboard from './pages/dashboard';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import ProtectedRoute from './components/ProtectedRoutes'; 

function App() {
  // Determine if the sidebar should be hidden based on the current location
  const location = useLocation();
  const noSidebar = !(location.pathname === '/rfqs' || location.pathname === '/contacts' || location.pathname === '/companies' || location.pathname === '/inventory' || location.pathname === '/dashboard');

  return (
    <div className="App">
      {!noSidebar && <Sidebar />}
      <div className="content">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Rfqs />} />
          
          {/* Protected routes */}
          {/* <Route element={<ProtectedRoute />} > */}
            <Route path="/rfqs" element={<Rfqs />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
          {/* </Route> */}
        </Routes>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
