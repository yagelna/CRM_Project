import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddRfqModal from '../components/rfqs/AddRfqModal';

const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);

    useEffect(() => { 
        axios.get('http://localhost:8000/api/rfqs') 
            .then((response) => {
                setRfqs(response.data);
                console.log(response.data);
            })
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    }, []);

    return (
        <div>
            <h1>Rfqs Pagee</h1>
            <ul>
                {rfqs.map((rfq) => (
                    <li key={rfq.id}>{rfq.mpn} - {rfq.qty_requested} - {rfq.customer_name} from {rfq.company_object?.name}</li>
                ))}
            </ul>
            <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#addRfqModal"
            >
                Add RFQ
            </button>

            {/* ה-Modal */}
            <AddRfqModal id="addRfqModal" />

        </div>
    );
}

export default Rfqs;