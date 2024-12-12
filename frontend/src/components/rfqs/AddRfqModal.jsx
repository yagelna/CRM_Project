import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const AddRfqModal = ({ id }) => {
    const [formData, setFormData] = useState({
        mpn: '',
        target_price: '',
        quantity: '',
        manufacturer: '',
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/api/rfqs/', formData)
            .then((response) => {
                console.log("Rfq added successfully: ", response.data);
                setFormData({
                    mpn: '',
                    target_price: '',
                    quantity: '',
                    manufacturer: '',
                });
            })
            .catch((error) => console.error('Error adding rfq: ' + error));
    };

    return (
        <Modal id={id} title="Createe New RFQQQ">
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
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">Create</button>
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
                
            </form>
        </Modal>
    );
}

export default AddRfqModal;