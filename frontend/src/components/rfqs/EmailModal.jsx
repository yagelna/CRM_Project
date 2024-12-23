import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const EmailModal = () => {
    const [emailData, setEmailData] = useState({
        name: "",
        email: "",
        messageType: "",
    });

    useEffect(() => {
        const handleOpenEmailModal = (event) => {
            const data = event.detail.data;
            setEmailData({
                name: data.name || "",
                email: data.email || "",
                messageType: "",
            });
        };

        window.addEventListener("openEmailModal", handleOpenEmailModal);
        return () => {
            window.removeEventListener("openEmailModal", handleOpenEmailModal);
        };
    }, []);

    const handleSendEmail = () => {
        console.log("Sending email:", emailData);
        // כאן תוסיף בקשת POST או API לשליחת המייל
    };

    return (
        <div
            className="modal fade"
            id="emailModal"
            tabIndex="-1"
            aria-labelledby="emailModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="emailModalLabel">
                            Send Email
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">
                                Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                value={emailData.name}
                                onChange={(e) =>
                                    setEmailData({
                                        ...emailData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={emailData.email}
                                onChange={(e) =>
                                    setEmailData({
                                        ...emailData,
                                        email: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="messageType" className="form-label">
                                Message Type
                            </label>
                            <select
                                className="form-select"
                                id="messageType"
                                value={emailData.messageType}
                                onChange={(e) =>
                                    setEmailData({
                                        ...emailData,
                                        messageType: e.target.value,
                                    })
                                }
                            >
                                <option value="">Select message type</option>
                                <option value="quote">Send Quote</option>
                                <option value="targetPrice">
                                    Request Target Price
                                </option>
                                <option value="outOfStock">
                                    Out of Stock Notification
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSendEmail}
                        >
                            Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;