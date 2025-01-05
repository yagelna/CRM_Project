import React, { useState, useEffect} from 'react'; 

// Offcanvas: Displays an offcanvas modal with RFQ details, history of the mpn from other rfqs and the availability of the part in the inventory.
const Offcanvas = ({id, title, rfqData}) => {

    const [data , setData] = useState({
        mpn: '',
        manufacturer: '',
        target_price: '',
        qty_requested: '',
        source: '',
        contact_object: {
            name: '',
            company_object: {
                name: '',
                country: ''
            }
        }
        
    });

    useEffect(() => {
        console.log("rfqData: ", rfqData);
        
    },
    [rfqData]);
    if (rfqData !== null) {
        
        return (
            <div className="offcanvas offcanvas-end" tabIndex="-1" id={id} aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">{rfqData.mpn}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <hr className='m-0'/>
                <div className="offcanvas-body">
                    <h6>RFQ Details</h6>
                    <div className="row">
                        <div className="col-6">
                            <p><span className="fw-bold">Manufacturer:</span> {rfqData.manufacturer}</p>
                            <p><span className="fw-bold">Target Price:</span> {rfqData.target_price}</p>
                            <p><span className="fw-bold">Requested Qty:</span> {rfqData.qty_requested}</p>
                            <p><span className="fw-bold">Source:</span> {rfqData.source}</p>
                        </div>
                        <div className="col-6">
                            <p><span className="fw-bold">Contact Name:</span> {rfqData.contact_object.name}</p>
                            <p><span className="fw-bold">Company Name:</span> {rfqData.contact_object.company_object.name}</p>
                            <p><span className="fw-bold">Country:</span> {rfqData.contact_object.company_object.country}</p>
                            <p><span className="fw-bold">Email:</span> {rfqData.contact_object.email}</p>
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
    }
};
export default Offcanvas;
