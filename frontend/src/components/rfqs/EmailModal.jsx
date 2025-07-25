import React, { useState, useEffect} from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';
 
const EmailModal = ({ id, rfqData, autoFillData }) => {
    // State for recipient details
    const [formData, setFormData] = useState({
            id: '',
            customer_name: '',
            email:'',
            company_name: '',
            manufacturer: '',
            qty_offered: '',
            offered_price: '',
            date_code: '',
            mpn: '',
            notes: '',
            auto_quote_validity: 7,
        });

    const [activeTab, setActiveTab] = useState('quote');
    const [toast, setToast] = useState({ show: false, message: "", success: false });
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if(rfqData){
            console.log('rfqData[emailModal]:', rfqData);
            setFormData({
                id: rfqData.id || '',
                customer_name: rfqData.contact_object?.name || '',
                email: rfqData.contact_object?.email || '',
                company_name: rfqData.contact_object?.company_object?.name || '',
                manufacturer: rfqData.manufacturer || '',
                qty_offered: rfqData.qty_requested || '',
                offered_price: rfqData.offered_price || '',
                date_code: rfqData.date_code || '',
                mpn: rfqData.mpn || '',
                notes: rfqData.notes || '',
                auto_quote_validity: rfqData.auto_quote_validity || 7,
            });
            console.log('formData after update:', formData);
        }
        if(autoFillData){
            setFormData({
                ...formData,
                manufacturer: autoFillData.manufacturer || '',
                qty_offered: autoFillData.qty_offered || '',
                offered_price: autoFillData.offered_price || '',
                date_code: autoFillData.date_code || '',
            });
            console.log('formData after autoFill:', formData);
            
        }
    
    }, [rfqData, autoFillData]);

    const updateRfq = async (status) => {
        try {
            const { company_name, email, customer_name, mpn, ...updatedData } = formData;
            if (activeTab !== 'quote') {
                delete updatedData.auto_quote_validity;
            }
            console.log('updatedData:', updatedData);
            const res = await axiosInstance.patch(`api/rfqs/${rfqData.id}/`, {
                ...updatedData,
                status: status,
            });
            console.log("RFQ updated successfully:", res);
        } catch (error) {
            console.error("Error updating RFQ:", error);
        }
    }

    const handleSendEmail = async () => {
        if (activeTab === 'quote') {
            //list of missing fields
            const missingFields = [];
            if (!formData.manufacturer) missingFields.push('Manufacturer');
            if (!formData.date_code) missingFields.push('Date Code');
            if (!formData.qty_offered) missingFields.push('Qty/MOQ');
            if (!formData.offered_price) missingFields.push('Unit Price');
            if (missingFields.length > 0) {
                const confirmSend = window.confirm(`The following fields are missing:\n${missingFields.join(', ')}.\nAre you sure you want to send the email?`);
                if (!confirmSend) return;
            }
        }

        setLoading(true);
        
        try {
            console.log("Sending emaail with data:", formData, activeTab);
            const res = await axiosInstance.post('api/send-email/', {
                formData,
                template: activeTab,
            });
            console.log("Email sent successfully:", res);
            showToast({
                type: 'success',
                title: 'Email Sent',
                message: 'Email sent successfully!',
                icon: '📧'
            });
            const updatedStatus =
                activeTab === 'quote' ? 'Quote Sent' : 
                activeTab === 'lowtp' ? 'T/P Req Sent' : 
                activeTab === 'nostock' ? 'No Stock Alert Sent' : 
                activeTab === 'mov' ? 'MOV Requirement Sent' : 
                'No Export Alert Sent';
            updateRfq(updatedStatus);

            const modalElement = document.getElementById(id);
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
            }
        }

        } catch (error) {
            console.error("Error sending email:", error);
            showToast({
                type: 'danger',
                title: 'Email Failed',
                message: 'Failed to send email. Please try again.',
                icon: '❌'
            });
        } finally {
            setLoading(false);
        }
        console.log(formData);
    }

    return (
        <>
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
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
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
                    <a className="list-group-item list-group-item-action active" data-bs-toggle="list" href="#quote" role="tab" onClick={() => setActiveTab('quote')}>
                        Quote
                    </a>
                    <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#lowtp" role="tab" onClick={() => setActiveTab('lowtp')}>
                        T/P Request
                    </a>
                    <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#nostock" role="tab" onClick={() => setActiveTab('nostock')}>
                        No Stock
                    </a>
                    <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#mov" role="tab" onClick={() => setActiveTab('mov')}>
                        MOV Requirement
                    </a>
                    <a className="list-group-item list-group-item-action" data-bs-toggle="list" href="#noexport" role="tab" onClick={() => setActiveTab('noexport')}>
                        No Export
                    </a>
                </div>

                {/* Tab Content */}
                <div className="tab-content mt-3">
                    <div className="tab-pane fade show active" id="quote" role="tabpanel">
                        <p>Here you can draft and send a Quote email.</p>
                        <div className="row g-2 mt-2">
                            <div className="form-floating form-floating-sm mb-3 col-sm">
                                <input
                                    type="text"
                                    className="form-control input-sz"
                                    id="floatingMpn"
                                    placeholder="MPN"
                                    aria-label="MPN"
                                    value={formData.mpn}
                                    onChange={(e) => setFormData({ ...formData, mpn: e.target.value })} />
                                <label htmlFor="floatingMpn">MPN</label>
                            </div>
                            <div className="form-floating form-floating-sm mb-3 col-sm">
                                <select 
                                    className="form-select input-sz"
                                    id="floatingAutoQuoteValidity"
                                    value={formData.auto_quote_validity}
                                    onChange={(e) => setFormData({ ...formData, auto_quote_validity: parseInt(e.target.value) })}
                                >
                                    <option value={0}>Do Not Auto Quote</option>
                                    <option value="1">1 day</option>
                                    <option value="3">3 days</option>
                                    <option value="7">1 Week</option>
                                    <option value="14">2 Weeks</option>
                                    <option value="30">1 Month</option>
                                </select>
                                <label htmlFor="floatingAutoQuoteValidity">Auto Quote Validity</label>
                            </div>
                        </div>
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
                                    value={formData.qty_offered}
                                    onChange={(e) => setFormData({ ...formData, qty_offered: Number(e.target.value) })} />
                                <label htmlFor="floatingQty">Qty/MOQ</label>
                            </div>
                            <div className="form-floating form-floating-sm col-sm">
                                <input 
                                    type="number" 
                                    className="form-control input-sz"
                                    id="floatingUnitPrice"
                                    placeholder="Unit Price" 
                                    aria-label="Unit Price"
                                    value={formData.offered_price}
                                    onChange={(e) => setFormData({ ...formData, offered_price: Number(e.target.value) })} />
                                <label htmlFor="floatingUnitPrice">Unit Price</label>
                            </div>
                        </div>  
                        <div className="row g-2 mt-2">
                            <div className="form-floating form-floating-sm mb-3 col">
                                <textarea 
                                    className="form-control input-sz" 
                                    id="floatingNotes" 
                                    placeholder="Add notes here..." 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    style={{ height: "50px" }}
                                />
                                <label htmlFor="floatingNotes">Notes</label>
                            </div>
                        </div>
                    </div>
                    <div className="tab-pane fade" id="lowtp" role="tabpanel">
                        <p>Here you can draft and send a T/P Request email.</p>
                    </div>
                    <div className="tab-pane fade" id="nostock" role="tabpanel">
                        <p>Here you can notify the customer that the item is out of stock.</p>
                    </div>
                    <div className="tab-pane fade" id="mov" role="tabpanel">
                        <p>Here you can communicate the MOV requirement to the customer.</p>
                    </div>
                    <div className="tab-pane fade" id="noexport" role="tabpanel">
                        <p>Here you can notify the customer about export restrictions.</p>
                    </div>
                </div>
                <button className="btn btn-primary mt-3" onClick={handleSendEmail} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Sending...
                        </>
                    ) : 'Send Email'}
                    </button>
                <button className="btn btn-secondary mt-3 ms-3" data-bs-dismiss="modal" onClick={() => updateRfq('unattractive')}>Unattractive Offer</button>
            </Modal>
            {toast.show && (
                <div className={`toast-container position-fixed bottom-0 end-0 p-3`}>
                    <div className={`toast ${toast.success ? 'bg-success' : 'bg-danger'} text-white show`} role="alert" aria-live="assertive" aria-atomic="true">
                    <div className="toast-header">
                        <strong className="me-auto">{toast.success ? 'Success' : 'Error'}</strong>
                        <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close" onClick={() => setToast({ show: false })}></button>
                    </div>
                    <div className="toast-body">
                        {toast.message}
                    </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EmailModal;