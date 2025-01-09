import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AddContactModal from '../components/contacts/AddContactModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';

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
    axios.delete(`http://localhost:8000/api/contacts/${id}/`)
      .then((response) => {
        setContacts(contacts.filter((contact) => contact.id !== id));
        fetchContacts();
      })
      .catch((error) => console.error('Error deleting contact: ' + error));
  };  

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "name", headerName: "Name"},
    { field: "email", headerName: "Email" },
    { field: "phone", headerName: "Phone"},
    { field: "company_name", headerName: "Company" },
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

  // fetch contacts from the backend
  const fetchContacts = () => {
    axios.get('http://localhost:8000/api/contacts')
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
          rowData={contacts}
          theme={myTheme}
          pagination={true}
          paginationPageSize={20}
          components={{ actionCellRenderer: ActionCellRenderer }}
          overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading Data...</div>'}
        />
      </div>
      <AddContactModal id="addContactModal" mode="create" handleUpdateContacts={handleUpdateContacts} />
      <AddContactModal id="EditContactModal" mode="edit" contactData={selectedContact} handleUpdateContacts={handleUpdateContacts}  />
    </div>

  );
}

export default Contacts;