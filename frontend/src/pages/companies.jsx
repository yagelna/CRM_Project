import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddCompanyModal from '../components/companies/AddCompanyModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';

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
    axiosInstance.delete(`api/companies/${id}/`)
      .then((response) => {
        setCompanies(companies.filter((company) => company.id !== id));
        fetchCompanies();
      })
      .catch((error) => console.error('Error deleting company: ' + error));
  };

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "name", headerName: "Name"},
    { field: "domain", headerName: "Domain" },
    { field: "country", headerName: "Country"},
    { field: "address", headerName: "Full Address" },
    {
      field: "actions",
      headerName: "Actions",
      cellRenderer: "actionCellRenderer",
      cellRendererParams: {
        handleDelete: handleDelete,
        handleEdit: (company) => setSelectedCompany(company),
        mouduleName: "Company",
      },
      pinned: "right",
            width: 126,
            filter: false,
            sortable: false,
            cellStyle: { textAlign: 'center' }
    },
  ]);

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
          rowData={companies}
          components={{ actionCellRenderer: ActionCellRenderer }}
          theme={myTheme}
          pagination={true}
          paginationPageSize={20}
          overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading Data...</div>'}
        />
      </div>
      <AddCompanyModal id="addCompanyModal" mode='create' handleUpdateCompanies={handleUpdateCompanies}/>
      <AddCompanyModal id="EditCompanyModal" mode='edit' companyData={selectedCompany} handleUpdateCompanies={handleUpdateCompanies}/>  
    </div>


  );
}

export default Companies;