import React, { useState, useEffect} from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import Select from 'react-select';

const AddRfqModal = ({ id, mode, rfqData, handleUpdateRfqs }) => {
    const [formData, setFormData] = useState({
        mpn: '',
        target_price: '',
        qty_requested: '',
        manufacturer: '',
        date_code: '',
        source: 'Private',
        company: null,
        contact: null,
    });
    const [companies, setCompanies] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [isCreatingContact, setIsCreatingContact] = useState(false);
    const [newCompany, setNewCompany] = useState({
        name: '',
        address: '',
        website: '',
        domain: '',
        country: '',
    });
    const [newContact, setNewContact] = useState({
        name: '',
        email: '',
        phone: '',
        company: null,
    });

    useEffect(() => {
        if (mode === 'edit' && rfqData) {
            setFormData(rfqData);
        }
    }, [mode, rfqData]);

    useEffect(() => {
        fetchCompanies('');
      }, []);
    
    const fetchCompanies = (query = '') => {
        axiosInstance.get(`api/company-search/?q=${query}`)
            .then((response) => setCompanies(response.data))
            .catch((error) => console.error('Error fetching companies:', error));
    };

    const fetchContacts = (companyId) => {
        axiosInstance.get(`api/contacts/?company_id=${companyId}`)
            .then((response) => setContacts(response.data))
            .catch((error) => console.error('Error fetching contacts:', error));
    };

    const handleCreateCompany = () => {
        axiosInstance.post('api/companies/', newCompany)
            .then((response) => {
                console.log("Company created successfully: ", response.data);
                setCompanies((prevCompanies) => [...prevCompanies, response.data]);
                setFormData({ ...formData, company: response.data.id });
                setIsCreatingCompany(false); // close the new company form
                setNewCompany({ name: '', address: '', website: '', domain: '', country: '' });
            })
            .catch((error) => console.error('Error creating company: ' + error));
    };

    const handleCreateContact = () => {
        axiosInstance.post('api/contacts/', newContact)
            .then((response) => {
                console.log("Contact created successfully: ", response.data);
                setContacts((prevContacts) => [...prevContacts, response.data]);
                setFormData({ ...formData, contact: response.data.id });
                setIsCreatingContact(false); // close the new contact form
                setNewContact({ name: '', email: '', phone: '', company: null });
            })
            .catch((error) => console.error('Error creating contact: ' + error));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        const request = mode === 'create'
            ? axiosInstance.post('api/rfqs/', formData)
            : axiosInstance.put(`api/rfqs/${rfqData.id}/`, formData);
        request
            .then((response) => {
                console.log(`Rfq ${mode === 'create' ? 'created' : 'updated'} successfully`);
                handleUpdateRfqs(response.data, mode);
                setFormData({
                    mpn: '',
                    target_price: '',
                    qty_requested: '',
                    manufacturer: '',
                    date_code: '',
                    source: 'Private',
                    company: null,
                    contact: null,
                });
            })
            .catch((error) => console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} rfq: ${error}`)); 
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New RFQ' : 'Edit RFQ'}>
            <form onSubmit={handleSubmit}>
                <div className="form-floating form-floating-sm mb-3">
                    <input
                        type="text"
                        className="form-control input-sz"
                        id = "floatingInput"
                        placeholder="MPN"
                        value={formData.mpn}
                        onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                    />
                    <label htmlFor="floatingInput">MPN</label>
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <input
                        type="number"
                        step="0.01"
                        className="form-control input-sz"
                        id = "floatingInput"
                        placeholder="Target Price"
                        value={formData.target_price}
                        onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                    />
                    <label htmlFor="floatingInput">Target Price</label>
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <input
                        type="number"
                        className="form-control input-sz"
                        id = "floatingInput"
                        placeholder="Quantity"
                        value={formData.qty_requested}
                        onChange={(e) => setFormData({ ...formData, qty_requested: e.target.value })}
                    />
                    <label htmlFor="floatingInput">Quantity</label>
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <input
                        type="text"
                        className="form-control input-sz"
                        id = "floatingInput"
                        placeholder="Manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                    <label htmlFor="floatingInput">Manufacturer</label>
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <input
                        type="text"
                        className="form-control input-sz"
                        id = "floatingInput"
                        placeholder="Date Code"
                        value={formData.date_code}
                        onChange={(e) => setFormData({ ...formData, date_code: e.target.value })}
                    />
                    <label htmlFor="floatingInput">Date Code</label>
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <select
                        className="form-select input-sz"
                        id="floatingSelect"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                        <option value="Private">Private</option>
                        <option value="netCOMPONENTS">netCOMPONENTS</option>
                        <option value="IC Source">IC Source</option>
                        <option value="Website">Website</option>

                    </select>
                    <label htmlFor="floatingSelect">Source</label>
                </div>
                <div className="mb-3">
                    <Select
                        options={companies.map((company) => ({ value: company.id, label: company.name }))}
                        value={formData.company
                            ? { value: formData.company, label: companies.find(c => c.id === formData.company)?.name || '' }
                            : null
                        }
                        onInputChange={(value) => fetchCompanies(value)}
                        onChange={(selectedOption) => {
                            setFormData({ ...formData, company: selectedOption.value })
                            fetchContacts(selectedOption.value);
                        }}
                        placeholder="Search for a company..."
                        isClearable
                    />
                    <button type="button" className="btn btn-link mt-2" onClick={() => setIsCreatingCompany(!isCreatingCompany)}>
                        {isCreatingCompany ? 'Cancel' : '+ Add New Company'}
                    </button>
                </div>

                {isCreatingCompany && (
                    <div className="card p-3 mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Company Name"
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Address"
                            value={newCompany.address}
                            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Website"
                            value={newCompany.website}
                            onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Domain"
                            value={newCompany.domain}
                            onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Country"
                            value={newCompany.country}
                            onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                        />
                        <button type="button" className="btn btn-primary mt-2" onClick={handleCreateCompany}>Create Company</button>
                    </div>
                )}

                <div className="mb-3">
                    <Select
                        options={contacts.map((contact) => ({ value: contact.id, label: contact.name }))}
                        value={formData.contact
                            ? { value: formData.contact, label: contacts.find(c => c.id === formData.contact)?.name || '' }
                            : null
                        }
                        onChange={(selectedOption) => setFormData({ ...formData, contact: selectedOption.value })}
                        placeholder="Search for a contact..."
                        isClearable
                    />
                    <button type="button" className="btn btn-link mt-2" onClick={() => setIsCreatingContact(!isCreatingContact)}>
                        {isCreatingContact ? 'Cancel' : '+ Add New Contact'}
                    </button>
                </div>
                {isCreatingContact && (
                    <div className="card p-3 mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Name"
                            value={newContact.name}
                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        />
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Email"
                            value={newContact.email}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Phone"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                        <button type="button" className="btn btn-primary mt-2" onClick={handleCreateContact}>Create Contact</button>
                    </div>
                )}
                                  
                <div className="modal-footer">
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">{mode === 'create' ? 'Create' : 'Update'}</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
                
            </form>
        </Modal>
    );
}

export default AddRfqModal;