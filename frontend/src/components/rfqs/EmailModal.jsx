import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';
 
const EmailModal = ({ id, rfqData, mode}) => {
    // State for recipient details


    const [formData, setFormData] = useState({
            customer_name: ' ',
            email: ' ',
            company: ' ',
        });
    
    useEffect(() => {
        if(rfqData){
            console.log(rfqData);
            setFormData({
                customer_name: rfqData.contact_object?.name || '',
                email: rfqData.contact_object?.email || '',
                company: rfqData.contact_object?.company_object?.name || '',
            });
        }

    }, [rfqData]);


    return (
        <Modal id={id} title="Send Email">
            <div className="p-3">
                {/* Editable Recipient Details */}
                <div className="mb-3">
                    <label htmlFor="recipientName" className="form-label">Recipient Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="recipientName"
                        value={formData.customer_name}
                        onChange={(e) => setRecipientName(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="recipientEmail" className="form-label">Recipient Email</label>
                    <input
                        type="email"
                        className="form-control"
                        id="recipientEmail"
                        value={formData.email}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="companyName" className="form-label">Company Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="companyName"
                        value={formData.company}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>
            </div>

            {/* Email Template Tabs */}
            <div className="list-group list-group-horizontal" id="list-tab" role="tablist">
                <a className="list-group-item list-group-item-action active" data-bs-toggle="list" href="#quote-tab" role="tab">
                    Quote
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#tp-alert-tab" role="tab">
                    T/P Alert
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#no-stock-tab" role="tab">
                    No Stock
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#mov-requirement-tab" role="tab">
                    MOV Requirement
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#no-export-tab" role="tab">
                    No Export
                </a>
            </div>

            {/* Tab Content */}
            <div className="tab-content mt-3">
                <div className="tab-pane fade show active" id="quote-tab" role="tabpanel">
                    <p>Here you can draft and send a Quote email.</p>
                </div>
                <div className="tab-pane fade" id="tp-alert-tab" role="tabpanel">
                    <p>Here you can draft and send a T/P Alert email.</p>
                </div>
                <div className="tab-pane fade" id="no-stock-tab" role="tabpanel">
                    <p>Here you can notify the customer that the item is out of stock.</p>
                </div>
                <div className="tab-pane fade" id="mov-requirement-tab" role="tabpanel">
                    <p>Here you can communicate the MOV requirement to the customer.</p>
                </div>
                <div className="tab-pane fade" id="no-export-tab" role="tabpanel">
                    <p>Here you can notify the customer about export restrictions.</p>
                </div>
            </div>
        </Modal>
    );
};

export default EmailModal;