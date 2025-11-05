import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/common/sidebar';
import Contacts from './pages/contacts';
import Companies from './pages/companies';
import Inventory from './pages/inventory';
import Rfqs from './pages/rfqs';
import Dashboard from './pages/dashboard';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import AI from './pages/ai';
import Settings from './pages/settings';
import CRMAccounts from './pages/CRM';
import Quotes from './pages/quotes';
import Orders from './pages/orders';
import AccountSettings from './components/settings/AccountSettings';
import ExportSettings from './components/settings/ExportSettings';
import EmailTemplates from './components/settings/EmailTemplates';
import Connections from './components/settings/connections';
import { AuthProvider } from './context/AuthContext';
import PermissionGate from './components/common/PermissionGate';
import NoAccessCard from './components/common/NoAccessCard';

function App() {
  // Determine if the sidebar should be hidden based on the current location
  const location = useLocation();
  const noSidebar = (location.pathname === '/login' || location.pathname === '/register');
  return (
    <div className="App">
      {!noSidebar && <Sidebar />}
      <div className={`content ${noSidebar ? 'full-width' : ''}`}>
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
          <Route path="/crm" element={
            <PermissionGate anyOfPerms={['*.access_crm']}>
              <CRMAccounts />
            </PermissionGate>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Settings dashboard + subpages */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/account" element={<AccountSettings />} />
          <Route path="/settings/export" element={<ExportSettings />} />
          <Route path="/settings/templates" element={<EmailTemplates />} />
          <Route path="/settings/connections" element={<Connections />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/crm/quotes" element={
            <PermissionGate anyOfPerms={['*.access_crm']}>
              <Quotes />
            </PermissionGate>
          } />
          <Route path="/orders" element={<Orders />} />


          {/* </Route> */}
        </Routes>
      </div>
      <div className="toast-container position-fixed bottom-0 end-0 p-3" id="toast-container"></div>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;
