    import React, { useState, useEffect} from 'react'; 
    import axiosInstance from '../../AxiosInstance';
    import { showToast } from '../common/toast';


    // Offcanvas: Displays an offcanvas modal with RFQ details, history of the mpn from other rfqs and the availability of the part in the inventory.
    const Offcanvas = ({id, rfqData, handleAutoFill, onDeleteRequest, refreshRfqs}) => {
        
        const [Data , setData] = useState({
            mpn: '',
            manufacturer: '',
            target_price: '',
            qty_requested: '',
            offered_price: '',
            source: '',
            date_code: '',
            auto_quote_deadline: '',
            customer_name: '',
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
        const externalSites = [
            { name: 'netComponents', baseUrl: 'https://www.netcomponents.com/search/result?PartsSearched%5b0%5d.PartNumber=', icon: 'bi bi-link-45deg' },
            { name: 'IC Source', baseUrl: 'https://icsource.com/members/Search/SearchNew.aspx?part=', icon: 'bi bi-link-45deg' },
            { name: 'FindChips', baseUrl: 'https://www.findchips.com/search/', icon: 'bi bi-link-45deg' },
            { name: 'Digi-Key', baseUrl: 'https://www.digikey.com/en/products/result?keywords=', icon: 'bi bi-link-45deg' },
            { name: 'Mouser', baseUrl: 'https://www.mouser.com/Search/Refine?Keyword=', icon: 'bi bi-link-45deg' },
            { name: 'OEMsTrade', baseUrl: 'https://www.oemstrade.com/search/', icon: 'bi bi-link-45deg' },
            { name: 'Octopart', baseUrl: 'https://octopart.com/search?q=', icon: 'bi bi-globe2' },
            { name: 'Google', baseUrl: 'https://www.google.com/search?q=', icon: 'bi bi-google' },
        ]

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
                    auto_quote_deadline: rfqData.auto_quote_deadline,
                    contact_object: {
                        name: rfqData.contact_object?.name || '',
                        email: rfqData.contact_object?.email || '',
                        company_object: {
                            name: rfqData.contact_object?.company_object?.name || '',
                            country: rfqData.contact_object?.company_object?.country || ''
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
        
        
        const deadline = Data.auto_quote_deadline ? new Date(Data.auto_quote_deadline) : null;
        const isAutoQuoteActive = deadline && deadline > new Date();    

        const updateRfqStatus = async (status) => {
            try {
                const res = await axiosInstance.patch(`api/rfqs/${rfqData.id}/`, {
                    status: status,
                });
                console.log("RFQ updated successfully:", res);
            } catch (error) {
                console.error("Error updating RFQ:", error);
            }
        }

        const handleSendEmail = async (template) => {
            const { contact_object, ...formData } = rfqData;
            const { email } = contact_object; 
            formData.email = email;
            if (    rfqData.status !== 'Quote Sent' && rfqData.status !== 'Reminder Sent' && template === 'reminder') {
                window.alert('Cannot send reminder email for RFQs that have not sent quotes.');
                return;
            }

            console.log("formData [send email]: ", formData);
            try {
                const res = await axiosInstance.post('api/send-email/', {
                    formData,
                    template: template,
                });
                const updatedStatus = template === 'lowtp' ? 'T/P Request Sent' : template === 'reminder' ? 'Reminder Sent' : '';
                updateRfqStatus(updatedStatus);
                showToast({
                    type: 'success',
                    title: 'Success',
                    message: `Email sent successfully!`,
                });

            } catch (error) {
                console.error("Error sending email:", error);
                showToast({
                    type: 'danger',
                    title: 'Failed to Send',
                    message: 'No emails were sent.',
                });
            }
        }

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

        const handleDelete = () => {
            if (!rfqData || !rfqData.id) {
                console.error('RFQ data is missing or invalid.');
                return;
            }
            onDeleteRequest(rfqData.id);
        };

        const handleDisableAutoQuote = async () => {
            if (!rfqData || !rfqData.id) return;
            try {
                await axiosInstance.post('api/rfqs/disable-auto-quotes/', { mpn: rfqData.mpn });
                setData((prev) => ({
                    ...prev,
                    auto_quote_deadline: null
                }));
                if (refreshRfqs) refreshRfqs();
        
            } catch (error) {
                console.error("Failed to disable auto-quote:", error);
                alert("Error disabling auto-quote");
            }
        };
        


        return (
            <div className="offcanvas offcanvas-end" data-bs-backdrop="true" tabIndex="-1" id={id} aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">{Data.mpn}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>  
                <hr className='m-0'/>
                <div className="offcanvas-body">
                    {/* send quote button */}
                    <button type="button" className="btn btn-primary btn-sm mb-2 me-2" data-bs-toggle="modal" data-bs-target="#SendEmailModal">
                        Send Quote 
                        <i className="bi bi-envelope ms-2"></i>
                    </button>
                    {/* edit rfq button */}
                    <button type="button" className="btn btn-warning btn-sm mb-2 me-2" data-bs-toggle="modal" data-bs-target="#EditRfqModal">
                        Edit RFQ
                        <i className="bi bi-pencil ms-2"></i>
                    </button>
                    {/* unattractive offer button */}
                    <button type="button" className="btn btn-secondary btn-sm mb-2 me-2" data-bs-dismiss="offcanvas" aria-label="Unattractive Offer" onClick={() => updateRfqStatus('unattractive')}>
                        Unattractive Offer
                        <i className="bi bi-eye-slash ms-2"></i>
                    </button>
                    {/* T/P button */}
                    <button type="button" className="btn btn-success btn-sm mb-2 me-2" data-bs-dismiss="offcanvas" aria-label="Target Price" onClick={() => handleSendEmail('lowtp')}>
                        T/P Request
                        <i className="bi bi-bullseye ms-2"></i>
                    </button>
                    <button type="button" className="btn btn-info btn-sm mb-2 me-2" data-bs-dismiss="offcanvas" aria-label="Quote Reminder" onClick={() => handleSendEmail('reminder')}>
                        Quote Reminder
                        <i className="bi bi-alarm ms-2"></i>
                    </button>
                    {/* delete rfq button */}
                    <button type="button" className="btn btn-danger btn-sm mb-2" data-bs-dismiss="offcanvas" aria-label="Delete" onClick={handleDelete}>
                        Delete RFQ
                        <i className="bi bi-trash ms-2"></i>
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
                                        <hr />
    <p className="d-flex align-items-center">
        <span className="fw-bold me-2">Auto Quote:</span>
        {isAutoQuoteActive ? (    
            <>
                <i className="bi bi-lightning-charge-fill text-success me-1" title="Auto-Quote Active"></i>
                <span className="text-success me-2">Active until {new Date(Data.auto_quote_deadline).toLocaleDateString()}</span>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={handleDisableAutoQuote}>
                    Disable
                    <i className="bi bi-slash-circle ms-1"></i>
                </button>
            </>
        ) : (
            <>
                <i className="bi bi-slash-circle text-muted me-1" title="Auto-Quote Disabled"></i>
                <span className="text-muted">No auto-quote</span>
            </>
        )}
    </p>
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
                                <th scope="col">Cost</th>
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
                                    <td>{item.supplier_cost || '-'}</td>
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
                                    (rfqData && item.id !== rfqData.id) &&
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
                                        <td>{item.contact_object?.company_name || '-'}</td>
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
                        <div className="accordion-item">
                            <h2 className="accordion-header">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                External Search Links
                                </button>
                            </h2>
                            <div id="collapseFour" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                <div className="accordion-body">

                                    <div className="d-flex flex-wrap gap-2">
                                        {externalSites.map((site) => (
                                        <a
                                            key={site.name}
                                            className="btn btn-outline-secondary d-flex align-items-center"
                                            href={site.baseUrl + encodeURIComponent(Data.mpn)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <i className={site.icon + ' me-1'}></i>
                                            {site.name}
                                        </a>
                                        ))}
                                    </div>
                                </div>
                                </div>
                        </div>    
                    </div>
                </div>
            </div>
        );
    };
    export default Offcanvas;
