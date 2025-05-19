import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';
import Select from 'react-select';

const AddCRMAccountModal = ({ id, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        assigned_to: '',
        notes: '',
    });
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [newCompany, setNewCompany] = useState({
        name: '',
        address: '',
        website: '',
        domain: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCompanies();
        fetchUsers();
        console.log('AddCRMAccountModal mounted');
        console.log('Companies:', companies);
        console.log('Users:', users);
    }, []);
    
    const fetchCompanies = (query = '') => {
        axiosInstance.get(`api/company-search/?q=${query}`)
            .then((response) => setCompanies(response.data))
            .catch((error) => console.error('Error fetching companies:', error));
    };

    const fetchUsers = () => {
        axiosInstance.get('api/user/')
            .then((response) => setUsers(response.data))
            .catch((error) => console.error('Error fetching users:', error));
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

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/crm/accounts/', formData);
            if (onSuccess) onSuccess(response.data);
            showToast?.({ type: 'success', title: 'CRM Account Added', message: `${response.data.name} created successfully.` });
            document.getElementById(id + '_close')?.click(); // סגירת מודאל
            setFormData({ name: '', email: '', phone: '', company: '', assigned_to: '', notes: '' });
        } catch (error) {
            console.error('Error adding CRM account:', error);
            showToast?.({ type: 'danger', title: 'Error', message: 'Failed to add CRM Account.' });
        }
        setLoading(false);
    };

return (
    <Modal id={id} title="Add CRM Account" size="lg">
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <div className="mb-3">
                <label>Company</label>
                <Select
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    value={formData.company
                    ? { value: formData.company, label: companies.find(c => c.id === formData.company)?.name || '' }
                    : null
                    }
                    onInputChange={(value) => fetchCompanies(value)}
                    onChange={(selectedOption) => setFormData({ ...formData, company: selectedOption?.value })}
                    placeholder="Search or select a company..."
                    isClearable
                />
                </div>

                <div className="mb-3">
                <button type="button" className="btn btn-link p-0" onClick={() => setIsCreatingCompany(!isCreatingCompany)}>
                    {isCreatingCompany ? 'Cancel' : '+ Add New Company'}
                </button>
                </div>

                {isCreatingCompany && (
                <div className="card p-3 border bg-light-subtle">
                    <h6 className="mb-2 text-muted">Add New Company</h6>
                    {['name', 'address', 'website', 'domain', 'country'].map(field => (
                    <input
                        key={field}
                        type="text"
                        className="form-control mb-2"
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={newCompany[field]}
                        onChange={(e) => setNewCompany({ ...newCompany, [field]: e.target.value })}
                    />
                    ))}
                    <button type="button" className="btn btn-success btn-sm mt-2" onClick={handleCreateCompany}>
                    Save Company
                    </button>
                </div>
                )}

                <div className="mb-3">
                <label>Assigned To</label>
                <select
                    className="form-select"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                >
                    <option value="">-- Select user --</option>
                    {users.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name || ''} ({user.email})
                    </option>
                    ))}
                </select>
            </div>

            <div className='modal-footer'>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
            </div>
        </form>
    </Modal>
)
};


export default AddCRMAccountModal;