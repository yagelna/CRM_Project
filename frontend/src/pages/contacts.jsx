import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddContactModal from '../components/contacts/AddContactModal';


const Contacts = () => {   
  const [contacts, setContacts] = useState([]); 
  const [selectedContact, setSelectedContact] = useState(null);
  // fetch contacts from the backend
  useEffect (() => {
    axios.get('http://localhost:8000/api/contacts')
      .then((response) => {
        console.log(response.data);
        setContacts(response.data);
      })
      .catch((error) => console.error('Error fetching contacts: ' + error));
  }, []);

  // delete contact by id
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      axios.delete(`http://localhost:8000/api/contacts/${id}/`)
        .then((response) => {
          setContacts(contacts.filter((contact) => contact.id !== id));
        })
        .catch((error) => console.error('Error deleting contact: ' + error));
    }
  };

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

  return (
    <div className='container mt-4'>
      <h1>Contacts</h1>
      <div className="mb-3">
        <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addContactModal"> Add Contact </button>
      </div>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>{contact.name}</td>
              <td>{contact.email}</td>
              <td>{contact.phone}</td>
              <td>{contact.company}</td>
              <td>
                <i className="bi bi-pencil-square text-primary me-3 hover-effect" role="button" title="Edit" data-bs-toggle="modal" data-bs-target="#EditContactModal" onClick={() => setSelectedContact(contact)}></i>
                <i className="bi bi-trash text-danger hover-effect" role="button" title="Delete" onClick={() => handleDelete(contact.id)}></i>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddContactModal id="addContactModal" mode="create" handleUpdateContacts={handleUpdateContacts} />
      <AddContactModal id="EditContactModal" mode="edit" contactData={selectedContact} handleUpdateContacts={handleUpdateContacts}  />
    </div>

  );
}

export default Contacts;