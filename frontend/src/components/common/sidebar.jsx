import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

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
      <a href="/" className="d-block p-3 link-dark text-decoration-none text-center" data-bs-placement="right" title="Icon-only">
        <i className="bi bi-cpu" style={{ fontSize: '1.5rem' }}></i>
        <span className="visually-hidden">Icon-only</span>
      </a>
      
      {/* Navigation Links */}
      <ul className="nav nav-pills nav-flush flex-column mb-auto text-center">
        <li className="nav-item">
          <Link to="/dashboard" className="nav-link py-3 border-bottom" title="Dashboard" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-speedometer2" style={{ fontSize: '1.2rem' }}></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/rfqs" className="nav-link py-3 border-bottom" title="RFQs" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-file-earmark-text" style={{ fontSize: '1.2rem' }}></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/contacts" className="nav-link py-3 border-bottom" title="Contacts" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-person" style={{ fontSize: '1.2rem' }}></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/companies" className="nav-link py-3 border-bottom" title="Companies" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-building" style={{ fontSize: '1.2rem' }}></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/inventory" className="nav-link py-3 border-bottom" title="Inventory" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-archive" style={{ fontSize: '1.2rem' }}></i>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/ai" className="nav-link py-3 border-bottom" title="AI" data-bs-toggle="tooltip" data-bs-placement="right">
            <i className="bi bi-lightbulb" style={{ fontSize: '1.2rem' }}></i>
          </Link>
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
