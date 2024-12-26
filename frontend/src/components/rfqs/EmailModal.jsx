import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';
 
const EmailModal = ({ id, rfqData, mode}) => {
    // State for recipient details
    const [formData, setFormData] = useState({
            customer_name: '',
            email:'',
            company: '',
            manufacturer: '',
            qty: '',
            unit_price: '',
            date_code: '',
            mpn: '',
        });

    const [activeTab, setActiveTab] = useState('quote-tab');
    
    useEffect(() => {
        if(rfqData){
            console.log('rfqData:', rfqData);
            setFormData({
                customer_name: rfqData.contact_object?.name || '',
                email: rfqData.contact_object?.email || '',
                company: rfqData.contact_object?.company_object?.name || '',
                manufacturer: rfqData.manufacturer || '',
                qty: rfqData.qty_requested || '',
                unit_price: rfqData.offered_price || '',
                date_code: rfqData.date_code || '',
                mpn: rfqData.mpn || '',
            });
            console.log('formData after update:', formData);
        }
    }, [rfqData]);

    const handleSendEmail = () => {
        if (activeTab === 'quote-tab') {
            //list of missing fields
            const missingFields = [];
            if (!formData.manufacturer) missingFields.push('Manufacturer');
            if (!formData.date_code) missingFields.push('Date Code');
            if (!formData.qty) missingFields.push('Qty/MOQ');
            if (!formData.unit_price) missingFields.push('Unit Price');
            if (missingFields.length > 0) {
                const confirmSend = window.confirm(`The following fields are missing:\n${missingFields.join(', ')}.\nAre you sure you want to send the email?`);
                if (!confirmSend) return;
            }
        }
        console.log("trying to send email")
        try {
            const res = axios.post('http://localhost:8000/api/send-email/', {
                formData,
                template: activeTab,
            });
            console.log("Email sent successfully:", res);
            // TODO: show a success message to the user
            // TODO: if changes were made to the RFQ, update the RFQ in the database
        } catch (error) {
            console.error("Error sending email:", error);
        }
        console.log(formData);
    }


    return (
        <Modal id={id} title={`Send Email - ${formData.mpn}`}>
            <div className="p-3">
                <div className="form-floating form-floating-sm mb-3">
                    <input 
                        type="email"
                        className="form-control input-sz"
                        id="floatingInput"
                        placeholder="Email address" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    <label htmlFor="floatingInput">Email address</label>    
                </div>
                <div className="form-floating form-floating-sm mb-3">
                    <input 
                        type="text"
                        className="form-control input-sz" 
                        id="floatingCompany" 
                        placeholder="Company" 
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                    <label htmlFor="floatingCompany">Company</label>
                </div>
                <div className="form-floating form-floating-sm mb-1">
                    <input type="text" 
                        className="form-control input-sz" 
                        id="floatingContact" 
                        placeholder="Contact" 
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} />
                    <label htmlFor="floatingContact">Contact</label>
                </div>

            </div>

            {/* Email Template Tabs */}
            <div className="list-group list-group-horizontal" id="list-tab" role="tablist">
                <a className="list-group-item list-group-item-action active" data-bs-toggle="list" href="#quote-tab" role="tab" onClick={() => setActiveTab('quote-tab')}>
                    Quote
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#tp-alert-tab" role="tab" onClick={() => setActiveTab('tp-alert-tab')}>
                    T/P Alert
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#no-stock-tab" role="tab" onClick={() => setActiveTab('no-stock-tab')}>
                    No Stock
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#mov-requirement-tab" role="tab" onClick={() => setActiveTab('mov-requirement-tab')}>
                    MOV Requirement
                </a>
                <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#no-export-tab" role="tab" onClick={() => setActiveTab('no-export-tab')}>
                    No Export
                </a>
            </div>

            {/* Tab Content */}
            <div className="tab-content mt-3">
                <div className="tab-pane fade show active" id="quote-tab" role="tabpanel">
                    <p>Here you can draft and send a Quote email.</p>
                    <div className="row g-2">
                        <div className="form-floating form-floating-sm col-sm">
                            <input 
                                type="text" 
                                className="form-control input-sz"
                                id="floatingMfg"
                                placeholder="Mfg" 
                                aria-label="Mfg"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
                            <label htmlFor="floatingMfg">Mfg</label>
                        </div>
                        <div className="form-floating form-floating-sm col-sm">
                            <input type="text" 
                                className="form-control input-sz"
                                id="floatingDC"
                                placeholder="Date Code" 
                                aria-label="Date Code"
                                value={formData.date_code}
                                onChange={(e) => setFormData({ ...formData, date_code: e.target.value })} />
                            <label htmlFor="floatingDC">Date Code</label>
                        </div>
                    </div>
                    <div className="row g-2 mt-2">
                        <div className="form-floating form-floating-sm col-sm">
                            <input 
                                type="text" 
                                className="form-control input-sz"
                                id="floatingQty"
                                placeholder="Qty/MOQ" 
                                aria-label="Qty/MOQ"
                                value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })} />
                            <label htmlFor="floatingQty">Qty/MOQ</label>
                        </div>
                        <div className="form-floating form-floating-sm col-sm">
                            <input 
                                type="number" 
                                className="form-control input-sz"
                                id="floatingUnitPrice"
                                placeholder="Unit Price" 
                                aria-label="Unit Price"
                                value={formData.unit_price}
                                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })} />
                            <label htmlFor="floatingUnitPrice">Unit Price</label>
                        </div>
                    </div>  
                    
                  
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
            <button className="btn btn-primary mt-3" onClick={handleSendEmail}>Send Email</button>
        </Modal>
    );
};

export default EmailModal;