import React, { useState, useEffect } from 'react';
import axios from 'axios';


const Contacts = () => {   
  const [contacts, setContacts] = useState([]); 
  useEffect (() => {
    axios.get('http://localhost:8000/api/contacts')
      .then((response) => {
        console.log(response.data); // בדוק את מבנה הנתונים כאן
        setContacts(response.data);
      })
      .catch((error) => console.error('Error fetching contacts: ' + error));
  }, []);

  return (
    <div>
      <h1>Contacts Page</h1>
      <h2> This is the contacts page</h2>
      <ul>
                  {contacts.map((contact) => (
                      <li key={contact.id}>{contact.name} - {contact.company}</li> 
                  ))}
      </ul>
      </div>



  );
}

export default Contacts;