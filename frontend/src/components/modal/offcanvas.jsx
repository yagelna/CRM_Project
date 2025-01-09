import React, { useState, useEffect} from 'react'; 
import axios from 'axios';

// Offcanvas: Displays an offcanvas modal with RFQ details, history of the mpn from other rfqs and the availability of the part in the inventory.
const Offcanvas = ({id, title, rfqData}) => {

    const [Data , setData] = useState({
        mpn: '',
        manufacturer: '',
        target_price: '',
        qty_requested: '',
        source: '',
        contact_object: {
            name: '',
            email: '',
            company_object: {
                name: '',
                country: ''
            }
        }
        
    });

    const [inventoryData, setInventoryData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);
    const [historyError, setHistoryError] = useState(null);

    useEffect(() => {
        if(rfqData){
            console.log("rfqData [offcanvas]: ", rfqData);
            setData({
                mpn: rfqData.mpn,
                manufacturer: rfqData.manufacturer,
                target_price: rfqData.target_price,
                qty_requested: rfqData.qty_requested,
                source: rfqData.source,
                contact_object: {
                    name: rfqData.contact_object.name,
                    email: rfqData.contact_object.email,
                    company_object: {
                        name: rfqData.contact_object.company_object.name,
                        country: rfqData.contact_object.company_object.country
                    }
                }
            });

            fetchAvailability(rfqData.mpn);
            fetchHistory(rfqData.mpn);
        }
        
    }, [rfqData]);

    const fetchAvailability = async (mpn) => {
        setInventoryLoading(true);
        setInventoryError(null);
        try {
            const encodedMpn = encodeURIComponent(mpn);
            const response = await axios.get(`http://localhost:8000/api/inventory/search/${encodedMpn}/`);
            if(response.data){
                setInventoryData(response.data);
            }
        } catch (inventoryError) {
            console.error('Error fetching availability: ' + inventoryError);
            setInventoryError('Error fetching availability');
        }
        finally {
            setInventoryLoading(false);
        }
    }

    const fetchHistory = async (mpn) => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const encodedMpn = encodeURIComponent(mpn);
            const response = await axios.get(`http://localhost:8000/api/rfqs/search/${encodedMpn}/`);
            console.log("response [history]: ", response.data);
            if(response.data){
                setHistoryData(response.data);
            }
        } catch (historyError) {
            console.error('Error fetching history: ' + historyError);
            setHistoryError('Error fetching history');
        }
        finally {
            setHistoryLoading(false);
        }
    }

        return (
            <div className="offcanvas offcanvas-end" tabIndex="-1" id={id} aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">{Data.mpn}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <hr className='m-0'/>
                <div className="offcanvas-body">
                    <h6>RFQ Details</h6>
                    <div className="row">
                        <div className="col-6">
                            <p><span className="fw-bold">Manufacturer:</span> {Data.manufacturer}</p>
                            <p><span className="fw-bold">Target Price:</span> {Data.target_price}</p>
                            <p><span className="fw-bold">Requested Qty:</span> {Data.qty_requested}</p>
                            <p><span className="fw-bold">Source:</span> {Data.source}</p>
                        </div>
                        <div className="col-6">
                            <p><span className="fw-bold">Contact Name:</span> {Data.contact_object.name}</p>
                            <p><span className="fw-bold">Company Name:</span> {Data.contact_object.company_object.name}</p>
                            <p><span className="fw-bold">Country:</span> {Data.contact_object.company_object.country}</p>
                            <p><span className="fw-bold">Email:</span> {Data.contact_object.email}</p>
                        </div>
                    </div>
                    <hr/>
                    <h6>Part Availability</h6>
                    {inventoryLoading && <p>Loading...</p>}
                    {inventoryError && <p className="text-danger">{inventoryError}</p>}
                    {!inventoryLoading && inventoryData.length === 0 && <p>No matching inventory found.</p>}
                    {!inventoryLoading && inventoryData.length > 0 && (
                        <table className="table">
                        <thead>
                            <tr style={{fontSize: '0.9rem'}}>
                            <th scope="col">Supplier</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">D/C</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryData.map((item) => (
                            <tr key={item.id} style={{fontSize: '0.9rem'}}>
                                <td>{item.supplier || '-'}</td>
                                <td>{item.quantity || '-'}</td>
                                <td>{(!item.date_code || item.date_code === 'nan') ? '-' : item.date_code}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                    <hr/>
                    <h6>RFQ History</h6>
                    {historyLoading && <p>Loading...</p>}
                    {historyError && <p className="text-danger">{historyError}</p>}
                    {!historyLoading && historyData.length === 1 && <p>No history found.</p>}
                    {!historyLoading && historyData.length > 1 && (
                        <table className="table">
                        <thead>
                            <tr style={{fontSize: '0.8rem'}}>
                            <th scope="col">Company</th>
                            <th scope="col">Target Price</th>
                            <th scope="col">Offered Price</th>
                            <th scope="col">Requested Qty</th>
                            <th scope="col">Offered Qty</th>
                            <th scope="col">Status</th>
                            <th scope="col">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.map((item) => (
                            item.id !== rfqData.id &&
                            <tr key={item.id} style={{fontSize: '0.8rem'}}>
                                <td>{item.contact_object.company_name || '-'}</td>
                                <td>{item.target_price || '-'}</td>
                                <td>{item.offered_price || '-'}</td>
                                <td>{item.qty_requested || '-'}</td>
                                <td>{item.qty_offered || '-'}</td>
                                <td>{item.status || '-'}</td>
                                <td>{item.created_at || '-'}</td>
                               
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
};
export default Offcanvas;
