import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddContactModal from '../components/contacts/AddContactModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';
import ContactOffcanvas from '../components/contacts/ContactOffcanvas';

ModuleRegistry.registerModules([AllCommunityModule]);

const Contacts = () => {   
  const [contacts, setContacts] = useState([]); 
  const [selectedContact, setSelectedContact] = useState(null);
  const gridRef = useRef();
  const myTheme = themeQuartz
  .withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
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
    { field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      cellRenderer: "actionCellRenderer",
      cellRendererParams: {
        handleDelete: handleDelete,
        handleEdit: (contact) => setSelectedContact(contact),
        mouduleName: "Contact",
      },
      pinned: "right",
            width: 126,
            filter: false,
            sortable: false,
            cellStyle: { textAlign: 'center' }
    },
  ]);

  const gridOptions = {
    defaultColDef: {
      domLayout: 'normal',
    },
    enableCellTextSelection: true,
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
    <div className='container mt-4'>
      <h1>Contacts</h1>
      <div className="mb-3">
        <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addContactModal"> Add Contact </button>
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
          rowData={contacts}
          theme={myTheme}
          pagination={true}
          paginationPageSize={20}
          components={{ actionCellRenderer: ActionCellRenderer }}
          overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}
        />
      </div>
      <AddContactModal id="addContactModal" mode="create" handleUpdateContacts={handleUpdateContacts} />
      <AddContactModal id="EditContactModal" mode="edit" contactData={selectedContact} handleUpdateContacts={handleUpdateContacts}  />
      <ContactOffcanvas id="contactOffcanvas" contactData={selectedContact} onDeleteRequest={handleDelete} />
    </div>

  );
}

export default Contacts;