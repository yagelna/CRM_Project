import React, { useState, useEffect} from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { CONFIG } from '../../config';

const AddInventoryModal = ({ id, mode, itemData, handleUpdateInventory }) => {
    const [formData, setFormData] = useState({
        mpn: '',
        manufacturer: '',
        quantity: '',
        date_code: '',
        supplier: CONFIG.DEFAULT_SUPPLIER,
        location: '',
        price: '',
        url: null,
    });

    const [customSupplier, setCustomSupplier] = useState('');
    useEffect(() => {
        if (mode === 'edit' && itemData) {
            setFormData({
                ...itemData,
                supplier: itemData.supplier === CONFIG.DEFAULT_SUPPLIER ? CONFIG.DEFAULT_SUPPLIER : "Other", // קביעה אוטומטית של הספק
            });
            if (itemData.supplier !== CONFIG.DEFAULT_SUPPLIER) {
                setCustomSupplier(itemData.supplier);
            }
        }
    }, [mode, itemData]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const dataToSubmit = {
            ...formData,
            supplier: formData.supplier === 'Other' ? customSupplier : formData.supplier,
            date_code: formData.date_code === 'nan' ? null : formData.date_code,
            url: formData.url === 'nan' ? null : formData.url,
        };
        if (mode === 'create') {
            axiosInstance.post('api/inventory/', dataToSubmit)
                .then((response) => {
                    console.log("Inventory Item added successfully: ", response.data);
                    handleUpdateInventory(response.data, 'create');
                    setFormData({
                        mpn: '',
                        manufacturer: '',
                        quantity: '',
                        date_code: '',
                        supplier: CONFIG.DEFAULT_SUPPLIER,
                        location: '',
                        price: '',
                    });
                    setCustomSupplier('');
                })
                .catch((error) => {
                    if (error.response) {
                        console.error("Error adding inventory:", JSON.stringify(error.response.data, null, 2));
                    }
                });
            }
        else if (mode === 'edit') {
            console.log("Updating inventory item: ", dataToSubmit);
            axiosInstance.put(`api/inventory/${itemData.id}/`, dataToSubmit)
                .then((response) => {
                    console.log("Inventory updated successfully: ", response.data);
                    handleUpdateInventory(response.data, 'edit');
                })
                .catch((error) => console.error('Error updating inventory: ' + error));
        }     
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New Inventory Item' : 'Edit Inventory Item'}>
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
                        placeholder="Manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="number"
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
                        placeholder="Date Code"
                        value={formData.date_code}
                        onChange={(e) => setFormData({ ...formData, date_code: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label>Supplier</label>
                    <select
                        className="form-select"
                        value={formData.supplier || "Other"}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, supplier: value });
                            if (value !== CONFIG.DEFAULT_SUPPLIER) {
                                setCustomSupplier(''); 
                            }
                        }}
                    >
                        <option value={CONFIG.DEFAULT_SUPPLIER}>{CONFIG.DEFAULT_SUPPLIER} (Stock)</option>
                        <option value="Other">Other (Available)</option>
                    </select>
                </div>

                {formData.supplier === "Other" && (
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Supplier Name"
                            value={customSupplier}
                            onChange={(e) => setCustomSupplier(e.target.value)}
                        />
                    </div>
                )}
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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

export default AddInventoryModal;