import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from '../../assets/Icon-01.png';
import './sidebar.css';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isCrmMenuOpen, setIsCrmMenuOpen] = useState(false);
  const isCrmAccountsActive = location.pathname === '/crm';
  const isCrmTasksActive = location.pathname === '/crm/tasks';
  const isCrmInteractionsActive = location.pathname === '/crm/interactions';

  useEffect(() => {
    setIsCrmMenuOpen(false);
  }, [location.pathname]);

  const closeCrmMenu = () => {
    setIsCrmMenuOpen(false);
  };

  const renderNavLink = (to, label, iconClass) => (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link sidebar-nav-link border-bottom ${isActive ? 'active' : ''}`}
    >
      <i className={`${iconClass} sidebar-icon`}></i>
      <span className="sidebar-nav-label">{label}</span>
    </NavLink>
  );

  return (
    <aside className='d-flex flex-column flex-shrink-0 sidebar' style={{ width: '4.5rem' }}>
      {/* Top Icon */}
      <a href="/" className="d-block p-3 text-decoration-none text-center">
        <img src={Logo} alt="DotzHub" style={{ width: '38px', height: 'auto' }} />
      </a>
      
      {/* Navigation Links */}
      <ul className="nav nav-pills nav-flush flex-column mb-auto text-center">
        <li className="nav-item">
          {renderNavLink('/dashboard', 'Dashboard', 'bi bi-speedometer2')}
        </li>
        <li className="nav-item">
          {renderNavLink('/rfqs', 'RFQs', 'bi bi-file-earmark-text')}
        </li>
        <li className="nav-item">
          {renderNavLink('/contacts', 'Contacts', 'bi bi-person')}
        </li>
        <li className="nav-item">
          {renderNavLink('/companies', 'Companies', 'bi bi-building')}
        </li>
        <li className="nav-item">
          {renderNavLink('/inventory', 'Inventory', 'bi bi-archive')}
        </li>
        <li
          className={`nav-item crm-nav-item ${isCrmMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={() => setIsCrmMenuOpen(true)}
          onMouseLeave={() => setIsCrmMenuOpen(false)}
        >
          <button
            type="button"
            className="nav-link sidebar-nav-link border-bottom crm-trigger-button"
            aria-haspopup="true"
            aria-expanded={isCrmMenuOpen}
          >
            <i className="bi bi-people sidebar-icon"></i>
            <span className="sidebar-nav-label">CRM</span>
          </button>

          <div className="crm-submenu shadow-sm">
            <NavLink
              to="/crm"
              end
              className={`crm-submenu-link ${isCrmAccountsActive ? 'active' : ''}`}
              onClick={closeCrmMenu}
            >
              Accounts
            </NavLink>
            <NavLink
              to="/crm/tasks"
              className={`crm-submenu-link ${isCrmTasksActive ? 'active' : ''}`}
              onClick={closeCrmMenu}
            >
              Tasks
            </NavLink>
            <NavLink
              to="/crm/interactions"
              className={`crm-submenu-link ${isCrmInteractionsActive ? 'active' : ''}`}
              onClick={closeCrmMenu}
            >
              Interactions
            </NavLink>
          </div>
        </li>
        <li className="nav-item">
          {renderNavLink('/ai', 'AI', 'bi bi-lightbulb')}
        </li>
        <li className="nav-item">
          {renderNavLink('/crm/quotes', 'Quotes', 'bi bi-receipt')}
        </li>
        <li className="nav-item">
          {renderNavLink('/orders', 'Orders', 'bi bi-bag')}
        </li>
      </ul>
      
      {/* User Dropdown */}
      <div className="dropdown border-top">
        <a href="#" className="d-flex align-items-center justify-content-center p-3 link-dark text-decoration-none dropdown-toggle" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://github.com/mdo.png" alt="User" width="24" height="24" className="rounded-circle" />
        </a>
        <ul className="dropdown-menu text-small shadow" aria-labelledby="dropdownUser">
          <li><Link className="dropdown-item" to="/settings">Settings</Link></li>
          <li><hr className="dropdown-divider" /></li>
          <li><Link className="dropdown-item" to="#" onClick={logout}>Sign out</Link></li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
