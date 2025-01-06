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

    const [availability, setAvailability] = useState({
        exact_match: [],
        similar_parts: []
    });

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
        }
        
    }, [rfqData]);

    const fetchAvailability = async (mpn) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/inventory/search/${mpn}`);
            console.log("response [offcanvas]: ", response.data);
            setAvailability(
                {
                    exact_match: response.data.exact_match,
                    similar_parts: response.data.similar_parts
                }
            );
        } catch (error) {
            console.error('Error fetching availability: ' + error);
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
                    <p>Part is available in the inventory</p>
                    <hr/>
                    <h6>RFQ History</h6>
                    <p>History of the mpn from other rfqs</p>

                
                </div>
            </div>
        );
};
export default Offcanvas;
