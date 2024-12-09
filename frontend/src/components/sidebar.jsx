import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';
const Sidebar = () => {
  return (
    <div className="sidebar-wrapper"> 
      <aside id="sidebar">
        <div className="d-flex">
          <button id='toggle-btn' type='button'>
            <i class="bi bi-list"></i>
          </button>
          <div className="sidebar-logo">
            <a href="#">HubConductor</a>
          </div>
        </div>
        <ul className='sidebar-nav'>
          <li className='sidebar-item'>
            <a href="#" className='sidebar-link'>
              <i class="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li className='sidebar-item'>
            <a href="#" className='sidebar-link'>
              <i class="bi bi-person-lines-fill"></i>
              <span>Contacts</span>
            </a>
          </li>
        </ul>
        <div className="btn-group dropup">
          
          <i className="bi bi-person-circle dropdown-toggle" data-bs-toggle="dropdown" ria-expanded="false"></i>
          <ul className="dropdown-menu">
            <li> <a href="#" className='dropdown-item'>Action</a></li>
            <li> <a href="#" className='dropdown-item'>Another action</a></li>
            <li> <a href="#" className='dropdown-item'>Something else here</a></li>
            <li><hr class="dropdown-divider" /></li>
            <li> <a href="#" className='dropdown-item'>Separated link</a></li>
          </ul>
        </div>  
  
      </aside>

    </div>
  );
};

export default Sidebar;
