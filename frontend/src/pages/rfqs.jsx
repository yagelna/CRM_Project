import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);

    useEffect(() => { 
        axios.get('http://localhost:8000/api/rfqs')
            .then((response) => setRfqs(response.data))
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    }, []);

    return (
        <div>
            <h1>Rfqs Pagee</h1>
            <ul>
                {rfqs.map((rfq) => (
                    <li key={rfq.id}>{rfq.mpn} - {rfq.qty_requested}</li>
                ))}
            </ul>
        </div>
    );
}

export default Rfqs;