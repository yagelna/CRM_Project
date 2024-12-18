import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const AddInventoryModal = ({ id, mode, itemData, handleUpdateInventory }) => {
    const [formData, setFormData] = useState({
        mpn: '',
        manufacturer: '',
        quantity: '',
        date_code: '',
        supplier: 'FlyChips',
        location: '',
        cost: '',
    });

    const [customSupplier, setCustomSupplier] = useState('');
    useEffect(() => {
        if (mode === 'edit' && itemData) {
            setFormData({
                ...itemData,
                supplier: itemData.supplier === "FlyChips" ? "FlyChips" : "Other", // קביעה אוטומטית של הספק
            });
            if (itemData.supplier !== "FlyChips") {
                setCustomSupplier(itemData.supplier); // אם זה "Other", להגדיר את שם הספק
            }
        }
    }, [mode, itemData]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const dataToSubmit = {
            ...formData,
            supplier: formData.supplier === 'Other' ? customSupplier : formData.supplier,
        };
        if (mode === 'create') {
            axios.post('http://localhost:8000/api/inventory/', dataToSubmit)
                .then((response) => {
                    console.log("Inventory Item added successfully: ", response.data);
                    handleUpdateInventory(response.data, 'create');
                    setFormData({
                        mpn: '',
                        manufacturer: '',
                        quantity: '',
                        date_code: '',
                        supplier: 'FlyChips',
                        location: '',
                        cost: '',
                    });
                    setCustomSupplier('');
                })
                .catch((error) => console.error('Error adding inventory item: ' + error));
            }
        else if (mode === 'edit') {
            axios.put(`http://localhost:8000/api/inventory/${itemData.id}/`, dataToSubmit)
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
                        placeholder="Date Code"
                        value={formData.date_code}
                        onChange={(e) => setFormData({ ...formData, date_code: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label>Supplier</label>
                    <select
                        className="form-select"
                        value={formData.supplier || "Other"} // אם אין ספק, ברירת המחדל היא "Other"
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData({ ...formData, supplier: value });
                            if (value !== "FlyChips") {
                                setCustomSupplier(''); // איפוס customSupplier אם בוחרים ב-FlyChips
                            }
                        }}
                    >
                        <option value="FlyChips">FlyChips (Stock)</option>
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
                        type="text"
                        className="form-control"
                        placeholder="Cost"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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