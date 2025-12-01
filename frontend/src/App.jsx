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
import SettingsAccess from './components/settings/ManageUsersAccess';
import { AuthProvider } from './context/AuthContext';
import PermissionGate from './components/common/PermissionGate';

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
          <Route path="/rfqs" element={
            <PermissionGate anyOfGroups={['rfqs_access']}>
              <Rfqs />
            </PermissionGate>
          } />
          <Route path="/contacts" element={
            <PermissionGate anyOfGroups={['contacts_access']}>
              <Contacts />
            </PermissionGate>
          } />
          <Route path="/companies" element={
            <PermissionGate anyOfGroups={['companies_access']}>
              <Companies />
            </PermissionGate>
          } />
          <Route path="/inventory" element={
            <PermissionGate anyOfGroups={['inventory_access']}>
              <Inventory />
            </PermissionGate>
          } />
          <Route path="/crm" element={
            <PermissionGate anyOfGroups={['crm_access']}>
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
          <Route path="/settings/access" element={<SettingsAccess />} />
          <Route path="/ai" element={
            <PermissionGate anyOfGroups={['ai_access']}>
              <AI />
            </PermissionGate>
          } />
          <Route path="/crm/quotes" element={
            <PermissionGate anyOfGroups={['crm_access']}>
              <Quotes />
            </PermissionGate>
          } />
          <Route path="/orders" element={
            <PermissionGate anyOfGroups={['orders_access']}>
              <Orders />
            </PermissionGate>
          } />

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
