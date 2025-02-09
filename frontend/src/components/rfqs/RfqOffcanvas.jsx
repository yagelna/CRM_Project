import React, { useState, useEffect} from 'react'; 
import axiosInstance from '../../AxiosInstance';

// Offcanvas: Displays an offcanvas modal with RFQ details, history of the mpn from other rfqs and the availability of the part in the inventory.
const Offcanvas = ({id, rfqData, handleAutoFill}) => {

    const [Data , setData] = useState({
        mpn: '',
        manufacturer: '',
        target_price: '',
        qty_requested: '',
        offered_price: '',
        source: '',
        date_code: '',
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
        console.log("offcanvas useEffect: ");
        if(rfqData){
            console.log("rfqData [offcanvas]: ", rfqData);
            setData({
                mpn: rfqData.mpn,
                manufacturer: rfqData.manufacturer,
                target_price: rfqData.target_price,
                qty_requested: rfqData.qty_requested,
                offered_price: rfqData.offered_price,
                source: rfqData.source,
                date_code: rfqData.date_code,
                contact_object: {
                    name: rfqData.contact_object.name,
                    email: rfqData.contact_object.email,
                    company_object: {
                        name: rfqData.contact_object.company_object.name,
                        country: rfqData.contact_object.company_object.country
                    }
                }
            });

            const accordionElements = document.querySelectorAll('.accordion-collapse'); 
            const accordionButtons = document.querySelectorAll('.accordion-button');
            accordionElements.forEach((element, index) => {
                if (index === 0) {
                    element.classList.add('show');
                    accordionButtons[index].classList.remove('collapsed');
                }
                else {
                    element.classList.remove('show');
                    accordionButtons[index].classList.add('collapsed');
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
            const response = await axiosInstance.get(`api/inventory/search-similar/${encodedMpn}/`);
            console.log("response [inventory]: ", response.data);
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
            const response = await axiosInstance.get(`api/rfqs/search/${encodedMpn}/`);
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
            <button type="button" className="btn btn-primary btn-sm mb-2" data-bs-toggle="modal" data-bs-target="#SendEmailModal">
                Send Quote 
                <i className="bi bi-envelope ms-2"></i>
            </button>
            <div className="accordion" id="accordionExample">
            <div className="accordion-item">
                <h2 className="accordion-header">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                RFQ Details
                </button>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                <div className="row">
                <div className="col-6">
                    <p><span className="fw-bold">Manufacturer:</span> {Data.manufacturer}</p>
                    <p><span className="fw-bold">Target Price:</span> {Data.target_price}</p>
                    <p><span className="fw-bold">Requested Qty:</span> {Data.qty_requested}</p>
                    <p><span className="fw-bold">Offered Price:</span> {Data.offered_price}</p>
                    <p><span className="fw-bold">Source:</span> {Data.source}</p>
                </div>
                <div className="col-6">
                    <p><span className="fw-bold">Contact Name:</span> {Data.contact_object.name}</p>
                    <p><span className="fw-bold">Company Name:</span> {Data.contact_object.company_object.name}</p>
                    <p><span className="fw-bold">Country:</span> {Data.contact_object.company_object.country}</p>
                    <p><span className="fw-bold">Email:</span> {Data.contact_object.email}</p>
                    <p><span className="fw-bold">Date Code:</span> {Data.date_code}</p>
                </div>
                </div>

                </div>
                </div>
            </div>
            <div className="accordion-item">
                <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                Part Availability
                </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                {inventoryLoading && <p>Loading...</p>}
                {inventoryError && <p className="text-danger">{inventoryError}</p>}
                {!inventoryLoading && inventoryData.length === 0 && <p>No matching inventory found.</p>}
                {!inventoryLoading && inventoryData.length > 0 && (
                    <table className="table">
                    <thead>
                    <tr style={{fontSize: '0.8rem'}}>
                    <th scope="col">MPN</th>
                    <th scope="col">Total Qty</th>
                    <th scope="col">Mfg</th>
                    <th scope="col">Supplier</th>
                    <th scope="col">D/C</th>
                    <th scope="col">Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {inventoryData.map((item) => (
                    <tr key={item.id} className={item.similarity_score === 1 ? 'table-item table-success' : 'table-item'}>
                        <td>{item.mpn || '-'}</td>
                        <td>{item.total_quantity || '-'}</td>
                        <td>{item.manufacturer || '-'}</td>
                        <td>{item.supplier_quantities || '-'}</td>
                        <td>{item.supplier_dc || '-'}</td>
                        <td>{item.supplier_prices || '-'}</td>
                    </tr>
                    ))}
                    </tbody>
                    </table>
                )}
                </div>
                </div>
            </div>
            <div className="accordion-item">
                <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                RFQ History
                </button>
                </h2>
                <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                {historyLoading && <p>Loading...</p>}
                {historyError && <p className="text-danger">{historyError}</p>}
                {!historyLoading && historyData.length === 1 && <p>No history found.</p>}
                {!historyLoading && historyData.length > 1 && (
                    <table className="table">
                    <thead>
                    <tr style={{fontSize: '0.8rem'}}>
                    <th scope="col"></th>
                    <th scope="col">Company</th>
                    <th scope="col">Target Price</th>
                    <th scope="col">Offered Price</th>
                    <th scope="col">Requested Qty</th>
                    <th scope="col">Offered Qty</th>
                    <th scope="col">Date Code</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {historyData.map((item) => (
                    item.id !== rfqData.id &&
                    <tr key={item.id} style={{fontSize: '0.8rem'}}>
                        <td>
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                data-bs-toggle="modal"
                                data-bs-target="#SendEmailModal"
                                onClick={() => handleAutoFill(item)}
                                title="Auto Fill Email Modal">
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </td>
                        <td>{item.contact_object.company_name || '-'}</td>
                        <td>{item.target_price || '-'}</td>
                        <td>{item.offered_price || '-'}</td>
                        <td>{item.qty_requested || '-'}</td>
                        <td>{item.qty_offered || '-'}</td>
                        <td>{item.date_code || '-'}</td>
                        <td>{item.status || '-'}</td>
                        <td>{new Date(item.created_at).toISOString().split('T')[0] || '-'}</td>
                    </tr>
                    ))}
                    </tbody>
                    </table>
                )}
                </div>
                </div>
            </div>
            </div>
            </div>
            </div>
        );
};
export default Offcanvas;
