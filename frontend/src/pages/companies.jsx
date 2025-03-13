import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddCompanyModal from '../components/companies/AddCompanyModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';
import CompanyOffcanvas from '../components/companies/CompanyOffcanvas';

ModuleRegistry.registerModules([AllCommunityModule]);

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const gridRef = useRef();
  const myTheme = themeQuartz
  .withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
    });
  // delete company by id
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Company with ID: ${id}?`)) {
      axiosInstance.delete(`api/companies/${id}/`)
        .then((response) => {
          console.log('Company deleted successfully');
          setCompanies(companies.filter((company) => company.id !== id));
          setSelectedCompany(null);
        })
        .catch((error) => console.error('Error deleting company: ' + error));
    }
  };

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "name",
      headerName: "Name",
      cellRenderer: (params) => (
        <a
          href="#companyOffcanvas"
          data-bs-toggle="offcanvas"
          className="link-opacity-50-hover fw-medium"
          onClick={() => { setSelectedCompany(params.data) }}
        >
          {params.value}
        </a>
      ),
      flex: 1.5},
    { field: "domain", headerName: "Domain", flex: 1 },
    {
      field: "website", headerName: "Website", flex: 1,
      cellRenderer: (params) => {
        const rawValue = params.value || ""; // אם הערך null או undefined, נשתמש במחרוזת ריקה
        const url = rawValue.startsWith("http") ? rawValue : `https://${rawValue}`;
    
        return rawValue ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="link-opacity-50-hover fw-medium"
          >
            {rawValue}
          </a>
        ) : (
          rawValue
        );
      }
    
    },
    { field: "country", headerName: "Country", flex: 1 },
    { field: "address", headerName: "Full Address", flex: 1 },

    { field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', flex: 1 },
    
  ]);

  const gridOptions = {
    defaultColDef: {
      domLayout: 'normal',
    },
    enableCellTextSelection: true,
  };

  // fetch companies from the backend
  const fetchCompanies = () => {
    axiosInstance.get('api/companies')
      .then((response) => {
        setCompanies(response.data);
      })
      .catch((error) => console.error('Error fetching companies: ' + error));
  };
  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const onFilterTextBoxChanged = useCallback(() => {
      gridRef.current.api.setGridOption(
        "quickFilterText",
        document.getElementById("filter-text-box").value,
      );
    }, []);

  return (
    <div className='container mt-4'>
      <h1>Companies</h1>
      <div className="mb-3">
        <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addCompanyModal"> Add Company </button>
        <span>Quick Filter:</span>
        <input
            type="text"
            id="filter-text-box"
            placeholder="Filter..."
            onInput={onFilterTextBoxChanged}
        />
      </div>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={colDefs}
          gridOptions={gridOptions}
          rowData={companies}
          components={{ actionCellRenderer: ActionCellRenderer }}
          theme={myTheme}
          pagination={true}
          paginationPageSize={20}
          overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}
        />
      </div>
      <AddCompanyModal id="addCompanyModal" mode='create' handleUpdateCompanies={handleUpdateCompanies}/>
      <AddCompanyModal id="EditCompanyModal" mode='edit' companyData={selectedCompany} handleUpdateCompanies={handleUpdateCompanies}/>  
      <CompanyOffcanvas id="companyOffcanvas" companyData={selectedCompany} onDeleteRequest={handleDelete}/>
    </div>


  );
}

export default Companies;