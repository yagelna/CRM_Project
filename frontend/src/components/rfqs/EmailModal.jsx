import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const EmailModal = ({ id, rfqData }) => {
    const [emailData, setEmailData] = useState({
        name: "",
        email: "",
        messageType: "",
    });

    useEffect(() => {
        if (rfqData) {
            setEmailData({
                name: rfqData.name,
                email: rfqData.email,
                messageType: "",
            });
        }

    }, []);

    const handleSendEmail = () => {
        console.log("Sending email:", emailData);
        // כאן תוסיף בקשת POST או API לשליחת המייל
    };

    return (
        <Modal id={id} title="Send Email">
            <form>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input type="text" className="form-control" id="name" value={emailData.name} onChange={(e) => setEmailData({ ...emailData, name: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" className="form-control" id="email" value={emailData.email} onChange={(e) => setEmailData({ ...emailData, email: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label htmlFor="messageType" className="form-label">Message Type</label>
                    <select className="form-select" id="messageType" value={emailData.messageType} onChange={(e) => setEmailData({ ...emailData, messageType: e.target.value })}>
                        <option value="">Select Message Type</option>
                        <option value="quote">Quote</option>
                        <option value="invoice">Invoice</option>
                        <option value="order">Order</option>
                    </select>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSendEmail}>Send Email</button>
            </form>
        </Modal>
    );
};

export default EmailModal;