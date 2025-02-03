import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';

const AddCompanyModal = ({ id, mode, companyData, handleUpdateCompanies }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        website: '',
        domain: '',
        country: '',
    });

    useEffect(() => {
        if (mode === 'edit' && companyData) {
            setFormData(companyData);
        }
    }, [mode, companyData]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            axiosInstance.post('api/companies/', formData)
                .then((response) => {
                    console.log("Company added successfully: ", response.data);
                    handleUpdateCompanies(response.data, 'create');
                    setFormData({
                        name: '',
                        address: '',
                        website: '',
                        domain: '',
                        country: '',
                    });
                })
                .catch((error) => console.error('Error adding company: ' + error));
            }
        else if (mode === 'edit') {
            axiosInstance.put(`api/companies/${companyData.id}/`, formData)
                .then((response) => {
                    console.log("Company updated successfully: ", response.data);
                    handleUpdateCompanies(response.data, 'edit');
                })
                .catch((error) => console.error('Error updating company: ' + error));
        }     
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New Company' : 'Edit Company'}>
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
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Domain"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                </div>
                <div className='modal-footer'>
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">{mode === 'create' ? 'Create' : 'Update'}</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
            </form>
        </Modal>
    );
}

export default AddCompanyModal;