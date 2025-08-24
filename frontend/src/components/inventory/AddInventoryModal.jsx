import React, { useState, useEffect} from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { CONFIG } from '../../config';

const initialForm = {
  mpn: '',
  manufacturer: '',
  quantity: '',
  date_code: '',
  supplier: CONFIG.DEFAULT_SUPPLIER,
  location: '',
  price: '',
  cost: '',
  url: '',
  break_qty_a: '',
  price_a: '',
};

const AddInventoryModal = ({ id, mode, itemData, handleUpdateInventory }) => {
    const [formData, setFormData] = useState(initialForm);
    const [customSupplier, setCustomSupplier] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && itemData) {
            setFormData({
                ...initialForm,
                ...itemData,
                supplier: itemData.supplier === CONFIG.DEFAULT_SUPPLIER ? CONFIG.DEFAULT_SUPPLIER : "Other",
            });
            setCustomSupplier(itemData.supplier !== CONFIG.DEFAULT_SUPPLIER ? itemData.supplier : '');
        }
        else if (mode === 'create') {
            setFormData(initialForm);
            setCustomSupplier('');
        }
    }, [mode, itemData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const dataToSubmit = {
            ...formData,
            supplier: formData.supplier === 'Other' ? customSupplier : formData.supplier,
            date_code: formData.date_code === 'nan' ? null : formData.date_code,
            url: formData.url === 'nan' ? null : formData.url,
            break_qty_a: formData.break_qty_a === '' ? null : parseInt(formData.break_qty_a),
            price_a: formData.price_a === '' ? null : parseFloat(formData.price_a),
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
                        cost: '',
                        url: null,
                        break_qty_a: '',
                        price_a: '',
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
                    setFormData({
                        mpn: '',
                        manufacturer: '',
                        quantity: '',
                        date_code: '',
                        supplier: CONFIG.DEFAULT_SUPPLIER,
                        location: '',
                        price: '',
                        cost: '',
                        url: null,
                        break_qty_a: '',
                        price_a: '',
                    });
                    setCustomSupplier('');
                })
                .catch((error) => console.error('Error updating inventory: ' + error));
            setSubmitting(false);   
        }
    };

    return (
        <Modal id={id} title={mode === 'create' ? 'Create New Inventory Item' : 'Edit Inventory Item'} onClose={() => { setFormData(initialForm); setCustomSupplier(''); }}>
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
                        type='number'
                        step="0.01"
                        className="form-control"
                        placeholder="Cost"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
                <div className="row mb-3">
                    <div className="col">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Break Qty A"
                            value={formData.break_qty_a}
                            onChange={(e) => setFormData({ ...formData, break_qty_a: e.target.value })}
                        />
                    </div>
                    <div className="col">
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            placeholder="Price A"
                            value={formData.price_a}
                            onChange={(e) => setFormData({ ...formData, price_a: e.target.value })}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">{mode === 'create' ? 'Create' : 'Update'}</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={() => setFormData(initialForm)}>
                        Discard
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default AddInventoryModal;