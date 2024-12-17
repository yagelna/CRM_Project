import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddCompanyModal from '../components/companies/AddCompanyModal';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // fetch companies from the backend
  useEffect(() => {
    axios.get('http://localhost:8000/api/companies')
      .then((response) => {
        setCompanies(response.data);
        console.log(response.data);
      })
      .catch((error) => console.error('Error fetching companies: ' + error));
  }, []);

  // delete company by id
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      axios.delete(`http://localhost:8000/api/companies/${id}/`)
        .then((response) => {
          setCompanies(companies.filter((company) => company.id !== id));
        })
        .catch((error) => console.error('Error deleting company: ' + error));
    }
  };

  //update companies state after adding or editing an company
  const handleUpdateCompanies = (updatedCompany, mode) => {
    if (mode === 'create') {
      setCompanies((prevCompanies) => [...prevCompanies, updatedCompany]);
    } else if (mode === 'edit') {
      setCompanies((prevCompanies) =>
        prevCompanies.map((company) => (company.id === updatedCompany.id ? updatedCompany : company))
      );
    }
  };

  return (
    <div className='container mt-4'>
      <h1>Companies</h1>
      <div className="mb-3">
        <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addCompanyModal"> Add Company </button>
      </div>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Domain</th>
            <th>Country</th>
            <th>Full Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.name}</td>
              <td>{company.domain || "-"}</td>
              <td>{company.country || "-"}</td>
              <td>{company.address || "-"}</td>
              <td>
              <i className="bi bi-pencil-square text-primary me-3 hover-effect" role="button" title="Edit" data-bs-toggle="modal" data-bs-target="#EditCompanyModal" onClick={() => setSelectedCompany(company)}></i>
              <i className="bi bi-trash text-danger hover-effect" role="button" title="Delete" onClick={() => handleDelete(company.id)}></i>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddCompanyModal id="addCompanyModal" mode='create' handleUpdateCompanies={handleUpdateCompanies}/>
      <AddCompanyModal id="EditCompanyModal" mode='edit' companyData={selectedCompany} handleUpdateCompanies={handleUpdateCompanies}/>  
    </div>


  );
}

export default Companies;