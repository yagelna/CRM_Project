import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';
const Sidebar = () => {
  return (
    <div className='wrapper'>
    <div className="d-flex flex-column flex-shrink-0" style={{width: '4.5rem'}}>
      <a href="/" className="d-block p-3 link-body-emphasis text-decoration-none text-center" data-bs-toggle="tooltip" data-bs-placement="right" title="Icon-only">
      <i className="bi bi-cpu" style={{fontSize: '1.5rem'}}></i>
      <span className="visually-hidden">Icon-only</span>
      </a>      
      <ul className="nav nav-pills nav-flush flex-column mb-auto text-center">

      <li className="nav-item">
        <a href="/dashboard" className="nav-link py-3 border-bottom rounded-0" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Dashboard" title="Dashboard">
          <i className="bi bi-speedometer2"></i>
        </a>
      </li>
      <li className="nav-item">
        <a href="/rfqs" className="nav-link py-3 border-bottom rounded-0" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Rfqs" data-bs-original-title="Rfqs">
          <i className="bi bi-file-earmark-text"></i>
        </a>
      </li>
      <li className="nav-item">
        <a href="/contacts" className="nav-link py-3 border-bottom rounded-0" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Contacts" data-bs-original-title="Contacts">
          <i className="bi bi-person"></i>
        </a>
      </li>
      <li className="nav-item">
        <a href="/companies" className="nav-link py-3 border-bottom rounded-0" aria-current="page" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Companies" title="Companies">
          <i className="bi bi-building"></i>
        </a>
      </li>
      <li className="nav-item">
        <a href="/inventory" className="nav-link py-3 border-bottom rounded-0" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="Companies" data-bs-original-title="Companies">
          <i className="bi bi-archive"></i>
        </a>
      </li>
      <li className="nav-item">
        <a href="/ai" className="nav-link py-3 border-bottom rounded-0" data-bs-toggle="tooltip" data-bs-placement="right" aria-label="AI" data-bs-original-title="AI">
          <i className="bi bi-lightbulb"></i>
        </a>
      </li>

    </ul>
    </div>
    </div>
  );
};

export default Sidebar;
