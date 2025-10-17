import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddContactModal from '../components/contacts/AddContactModal';
import ExportModal from '../components/contacts/ExportModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ContactOffcanvas from '../components/contacts/ContactOffcanvas';

ModuleRegistry.registerModules([AllCommunityModule]);

const Contacts = () => {   
  const [contacts, setContacts] = useState([]); 
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef();
  const myTheme = themeQuartz
  .withParams({
    browserColorScheme: "light",
    headerBackgroundColor: "#5A34F1",
    headerTextColor:"#ffffff",
});

  // delete contact by id
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Contact with ID: ${id}?`)) {
      axiosInstance.delete(`api/contacts/${id}/`)
        .then((response) => {
          console.log('Contact deleted successfully');
          setContacts(contacts.filter((contact) => contact.id !== id));
          setSelectedContact(null);
        })
        .catch((error) => console.error('Error deleting contact: ' + error));
    }
  };  

  const handleDeleteSelected = () => {
    console.log("delete selected rows");
    if (selectedRows.length === 0) {
      console.log("No rows selected for deletion");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected contacts?`)) {
      const idsToDelete = selectedRows.map((contact) => contact.id);
      axiosInstance.delete('api/contacts/bulk-delete/', { data: { ids: idsToDelete } })
        .then((response) => {
          console.log('Contacts deleted successfully');
          setContacts(contacts.filter((contact) => !idsToDelete.includes(contact.id)));
          setSelectedRows([]);
        })
        .catch((error) => console.error('Error deleting contacts: ' + error));
    }
  }

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "name", headerName: "Name",
      cellRenderer: (params) => (
        <a
          href="#contactOffcanvas"
          data-bs-toggle="offcanvas"
          className="link-opacity-50-hover fw-medium"
          onClick={() => { setSelectedContact(params.data) }}
        >
          {params.value}
        </a>
      ),
      flex: 1},
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "company_name", headerName: "Company", flex: 1 },
    { field: "updated_at", headerName: "Updated At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', flex: 1 },
    { field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', flex: 1 },
  ]);

  const onSelectionChanged = (event) =>{
    const selectedData = event.api.getSelectedRows();
    console.log("selection changed, " + selectedData.length + " rows selected");
    setSelectedRows(selectedData);
    console.log("selected rows: ", selectedRows);
};

  const gridOptions = {
    defaultColDef: {
      domLayout: 'normal',
    },
    enableCellTextSelection: true,
    rowSelection: {
      mode: 'multiRow',
      selectAll: 'filtered',
  },
  onSelectionChanged,
};

  // fetch contacts from the backend
  const fetchContacts = () => {
    axiosInstance.get('api/contacts')
      .then((response) => {
        setContacts(response.data);
      })
      .catch((error) => console.error('Error fetching contacts: ' + error));
  };

  useEffect(() => {
    fetchContacts();
  }, []);


  //update contacts state after adding or editing an contact
  const handleUpdateContacts = (updatedContact, mode) => {
    if (mode === 'create') {
      setContacts((prevContacts) => [...prevContacts, updatedContact]);
    } else if (mode === 'edit') {
      setContacts((prevContacts) =>
        prevContacts.map((contact) => (contact.id === updatedContact.id ? updatedContact : contact))
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
    <div className='module-container'>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2>Contacts</h2>
          <p className="text-muted">Manage your customer and supplier contacts</p>
        </div>
        <div>
          <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addContactModal">
            + Add Contact
          </button>
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#ExportContacts">
            Export
          </button>
        </div>
        
      </div>
      <div>
        <div className="d-flex align-items-center">
            <input
              type="text"
              id="filter-text-box"
              className="form-control"
              placeholder="Search..."
              onInput={onFilterTextBoxChanged}
              style={{ width: '200px' }}
          />
          {selectedRows.length > 0 && (
            <div className="d-flex align-items-center ms-auto">
                <span className="me-2 text-muted small">{selectedRows.length} of {contacts.length} selected</span>
                <button className="btn btn-outline-danger btn-sm me-2" onClick={handleDeleteSelected}>
                    <i className="bi bi-trash"></i> 
                    Delete
                </button>
    
            </div>
        )}
        </div>
      </div>
      <div className="card border-0 shadow-sm mb-4 mt-2">
        <div className="card-body p-2">
          <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              columnDefs={colDefs}
              gridOptions={gridOptions}
              rowData={contacts}
              theme={myTheme}
              pagination={true}
              paginationPageSize={20}
              overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}
            />
          </div>
      </div>
      </div>
      <ExportModal 
        id="ExportContacts"
        selectedRows={selectedRows}
        totalCount={contacts.length}
        entityLabel='Contacts'
        allFields= {[
          { label: 'Name', value: 'name' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Company Name', value: 'company__name' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Created At', value: 'created_at' },
        ]}
        exportEndpoint='api/contacts/export/'
      />
      <AddContactModal id="addContactModal" mode="create" handleUpdateContacts={handleUpdateContacts} />
      <AddContactModal id="EditContactModal" mode="edit" contactData={selectedContact} handleUpdateContacts={handleUpdateContacts}  />
      <ContactOffcanvas id="contactOffcanvas" contactData={selectedContact} onDeleteRequest={handleDelete} />
    </div>

  );
}

export default Contacts;