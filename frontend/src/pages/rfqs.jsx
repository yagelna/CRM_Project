import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddRfqModal from '../components/rfqs/AddRfqModal';

const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);

    // fetch rfqs from the backend
    useEffect(() => { 
        axios.get('http://localhost:8000/api/rfqs') 
            .then((response) => {
                setRfqs(response.data);
                console.log(response.data);
            })
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    }, []);

    // delete rfq by id
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this rfq?')) {
            axios.delete(`http://localhost:8000/api/rfqs/${id}/`)    
                .then((response) => {
                    setRfqs(rfqs.filter((rfq) => rfq.id !== id));
                })
                .catch((error) => console.error('Error deleting rfq: ' + error));
            }
    };

    //update rfqs state after adding or editing an rfq
    const handleUpdateRfqs = (updatedRfq, mode) => { 
        if (mode === 'create') {
            setRfqs((prevRfqs) => [...prevRfqs, updatedRfq]);
        } else if (mode === 'edit') {
            setRfqs((prevRfqs) =>
                prevRfqs.map((rfq) => (rfq.id === updatedRfq.id ? updatedRfq : rfq))
            );
        }
    };

    return (
        <div className='container mt-4'> 
            <h1>Rfqs</h1>
            
            <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addRfqModal"> Add RFQ </button>
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>MPN</th>
                        <th>Target Price</th>
                        <th>Quantity</th>
                        <th>Manufacturer</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rfqs.map((rfq) => (
                        <tr key={rfq.id}>
                            <td>{rfq.mpn}</td>
                            <td>{rfq.target_price}$</td>
                            <td>{rfq.qty_requested}</td>
                            <td>{rfq.manufacturer}</td>
                            <td>
                            <i className="bi bi-pencil-square text-primary me-3 hover-effect" role="button" title="Edit" data-bs-toggle="modal" data-bs-target="#EditRfqModal" onClick={() => setSelectedRfq(rfq)}></i>
                            <i className="bi bi-trash text-danger hover-effect" role="button" title="Delete" onClick={() => handleDelete(rfq.id)}></i>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <AddRfqModal id="addRfqModal" mode="create" handleUpdateRfqs={handleUpdateRfqs}/>
            <AddRfqModal id="EditRfqModal" mode="edit" rfqData={selectedRfq} handleUpdateRfqs = {handleUpdateRfqs}/>

        </div>
    );
}

export default Rfqs;