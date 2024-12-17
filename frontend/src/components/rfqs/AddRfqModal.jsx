import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const AddRfqModal = ({ id, mode, rfqData, handleUpdateRfqs }) => {
    const [formData, setFormData] = useState({
        mpn: '',
        target_price: '',
        qty_requested: '',
        manufacturer: '',
        source: 'private',
    });

    useEffect(() => {
        if (mode === 'edit' && rfqData) {
            setFormData(rfqData);
        }
    }, [mode, rfqData]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            axios.post('http://localhost:8000/api/rfqs/', formData)
                .then((response) => {
                    console.log("Rfq added successfully: ", response.data);
                    handleUpdateRfqs(response.data, 'create');
                    setFormData({
                        mpn: '',
                        target_price: '',
                        qty_requested: '',
                        manufacturer: '',
                    });
                })
                .catch((error) => console.error('Error adding rfq: ' + error));
            }
        else if (mode === 'edit') {
            axios.put(`http://localhost:8000/api/rfqs/${rfqData.id}/`, formData)
                .then((response) => {
                    console.log("Rfq updated successfully: ", response.data);
                    handleUpdateRfqs(response.data, 'edit');
                })
                .catch((error) => console.error('Error updating rfq: ' + error));
        }     
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New RFQ' : 'Edit RFQ'}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="MPN"
                        value={formData.mpn}
                        onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Target Price"
                        value={formData.target_price}
                        onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Quantity"
                        value={formData.qty_requested}
                        onChange={(e) => setFormData({ ...formData, qty_requested: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                </div>
                <div className="modal-footer">
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">{mode === 'create' ? 'Create' : 'Update'}</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
                
            </form>
        </Modal>
    );
}

export default AddRfqModal;