import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../modal/modal';
import Select from 'react-select';

const AddContactModal = ({ id, mode, contactData, handleUpdateContacts }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: null,
    });
    const [companies, setCompanies] = useState([]);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [newCompany, setNewCompany] = useState({
        name: '',
        address: '',
        website: '',
        domain: '',
        country: '',
    });

    useEffect(() => {
        fetchCompanies();
        if (mode === 'edit' && contactData) {
            setFormData(contactData);
        }
    }, [mode, contactData]);
    
    const fetchCompanies = (query = '') => {
        axios.get(`http://localhost:8000/api/company-search/?q=${query}`)
            .then((response) => setCompanies(response.data))
            .catch((error) => console.error('Error fetching companies:', error));
    };

    const handleCreateCompany = () => {
        axios.post('http://localhost:8000/api/companies/', newCompany)
            .then((response) => {
                console.log("Company created successfully: ", response.data);
                setCompanies((prevCompanies) => [...prevCompanies, response.data]);
                setFormData({ ...formData, company: response.data.id });
                setIsCreatingCompany(false); // close the new company form
                setNewCompany({ name: '', address: '', website: '', domain: '', country: '' });
            })
            .catch((error) => console.error('Error creating company: ' + error));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            axios.post('http://localhost:8000/api/contacts/', formData)
                .then((response) => {
                    console.log("Contact added successfully: ", response.data);
                    handleUpdateContacts(response.data, 'create');
                    setFormData({
                        name: '',
                        email: '',
                        phone: '',
                    });
                })
                .catch((error) => console.error('Error adding contact: ' + error));
            }
        else if (mode === 'edit') {
            axios.put(`http://localhost:8000/api/contacts/${contactData.id}/`, formData)
                .then((response) => {
                    console.log("Contact updated successfully: ", response.data);
                    handleUpdateContacts(response.data, 'edit');
                })
                .catch((error) => console.error('Error updating contact: ' + error));
        }     
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New Contact' : 'Edit Contact'}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label>Company</label>
                    <Select
                        options={companies.map((company) => ({ value: company.id, label: company.name }))}
                        value={formData.company
                            ? { value: formData.company, label: companies.find(c => c.id === formData.company)?.name || '' }
                            : null
                        }
                        onInputChange={(value) => fetchCompanies(value)}
                        onChange={(selectedOption) => setFormData({ ...formData, company: selectedOption.value })}
                        placeholder="Search for a company..."
                        isClearable
                    />
                </div>
                
                <div className="mb-3">
                <button type="button" className="btn btn-link mt-2" onClick={() => setIsCreatingCompany(!isCreatingCompany)}>
                        {isCreatingCompany ? 'Cancel' : '+ Add New Company'}
                    </button>
                </div>
                {/* New Company Form */}
                {isCreatingCompany && (
                    <div className="card p-3 mb-3">
                    <h5 className="mb-3">Add New Company</h5>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Company Name"
                            value={newCompany.name}
                        onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Address"
                            value={newCompany.address}
                            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Website"
                            value={newCompany.website}
                            onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Domain"
                            value={newCompany.domain}
                            onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Country"
                            value={newCompany.country}
                            onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                        />
                    </div>
                    <button type="button" className="btn btn-success" onClick={handleCreateCompany}>
                        Save New Company
                    </button>
                </div>
                )}

                
                <div className='modal-footer'>
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">{mode === 'create' ? 'Create' : 'Update'}</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
            </form>
        </Modal>
    );
}

export default AddContactModal;