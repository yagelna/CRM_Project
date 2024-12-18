import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import UploadBulkModal from '../components/inventory/UploadBulkModal';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    // fetch inventory from the backend
    useEffect(() => { 
        axios.get('http://localhost:8000/api/inventory') 
            .then((response) => {
                setInventory(response.data);
                console.log(response.data);
            })
            .catch((error) => console.error('Error fetching inventory: ' + error));
    }, []);

    // delete inventory by id
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this inventory?')) {
            axios.delete(`http://localhost:8000/api/inventory/${id}/`)    
                .then((response) => {
                    setInventory(inventory.filter((inventory) => inventory.id !== id));
                })
                .catch((error) => console.error('Error deleting inventory: ' + error));
            }
    };

    //update inventory state after adding or editing an inventory
    const handleUpdateInventory = (updatedInventory, mode) => { 
        if (mode === 'create') {
            setInventory((prevInventory) => [...prevInventory, updatedInventory]);
        } else if (mode === 'edit') {
            setInventory((prevInventory) =>
                prevInventory.map((inventory) => (inventory.id === updatedInventory.id ? updatedInventory : inventory))
            );
        }
    };

    return (
        <div className='container mt-4'>
            <h1>Inventory</h1>
            <div className="mb-3">
                <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addInventoryModal"> Add Item </button>
                <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#UploadBulkModal"> Upload Bulk Inventory </button>
            </div>
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>MPN</th>
                        <th>Manufacturer</th>
                        <th>Quantity</th>
                        <th>Date Code</th>
                        <th>Supplier</th>
                        <th>Location</th>
                        <th>Cost</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((item) => (
                        <tr key={item.id}>
                            <td>{item.mpn}</td>
                            <td>{item.manufacturer}</td>
                            <td>{item.quantity}</td>
                            <td>{item.date_code}</td>
                            <td>{item.supplier}</td>
                            <td>{item.location}</td>
                            <td>{item.cost}</td>
                            <td>
                                <i className="bi bi-pencil-square text-primary me-3 hover-effect" role="button" title="Edit" data-bs-toggle="modal" data-bs-target="#EditInventoryModal" onClick={() => setSelectedItem(item)}></i>
                                <i className="bi bi-trash text-danger hover-effect" role="button" title="Delete" onClick={() => handleDelete(item.id)}></i>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <AddInventoryModal id="addInventoryModal" mode="create" handleUpdateInventory={handleUpdateInventory}/>
            <AddInventoryModal id="EditInventoryModal" mode="edit" itemData={selectedItem} handleUpdateInventory={handleUpdateInventory}/>
            <UploadBulkModal id="UploadBulkModal"/>
        </div>
    );
}

export default Inventory;