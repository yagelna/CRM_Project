import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import Logo from '../../assets/Icon-01.png';
import './sidebar.css';

const Sidebar = () => {
  useEffect(() => {
    // Enable Bootstrap tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltips = [];
    
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      const tooltipInstance = new bootstrap.Tooltip(tooltipTriggerEl);
      tooltips.push(tooltipInstance);
      
      // Hide tooltip on click
      tooltipTriggerEl.addEventListener('click', () => {
        tooltipInstance.hide();
      });
    });
  }, []);


  return (
    <aside className='d-flex flex-column flex-shrink-0 sidebar' style={{ width: '4.5rem' }}>
      {/* Top Icon */}
      <a href="/" className="d-block p-3 text-decoration-none text-center">
        <img src={Logo} alt="DotzHub" style={{ width: '38px', height: 'auto' }} />
      </a>
      
      {/* Navigation Links */}
      <ul className="nav nav-pills nav-flush flex-column mb-auto text-center">
        <li className="nav-item">
        <NavLink 
          to="/dashboard"
          className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`}
          title="Dashboard"
          data-bs-toggle="tooltip"
          data-bs-placement="right"
        >
          <i className="bi bi-speedometer2 sidebar-icon"></i>
        </NavLink>

        </li>
        <li className="nav-item">
          <NavLink to="/rfqs" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="RFQs" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-file-earmark-text sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/contacts" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="Contacts" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-person sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/companies" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="Companies" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-building sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/inventory" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="Inventory" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-archive sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/crm" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="CRM" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-people sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/ai" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="AI" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-lightbulb sidebar-icon"></i>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/crm/quotes" className={({ isActive }) => `nav-link py-3 border-bottom ${isActive ? 'active' : ''}`} title="Quotes" data-bs-toggle="tooltip" data-bs-placement="right">
            <i class="bi bi-receipt sidebar-icon"></i>

          </NavLink>
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
          <li><Link className="dropdown-item" to="#">Sign out</Link></li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
