import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const BulkEmailModal = ({ id, rfqs = [] }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [filteredRfqs, setFilteredRfqs] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const modalEl = document.getElementById(id);
        if (!modalEl) return;

        const handleModalOpen = () => {
            setFilteredRfqs(rfqs.filter((rfq) => rfq.contact_object?.email));
            setSelectedTemplate('');
        };

        modalEl.addEventListener('shown.bs.modal', handleModalOpen);

        return () => {
            modalEl.removeEventListener('shown.bs.modal', handleModalOpen);
        };
    }, [id, rfqs]);

    const handleRemoveRfq = (id) => {
        setFilteredRfqs((prev) => prev.filter((rfq) => rfq.id !== id));
    };

    const handleSend = () => {
        setSending(true);
    
        const payload = {
            template: selectedTemplate,
            rfq_ids: filteredRfqs.map((rfq) => rfq.id),
        };
    
        axiosInstance.post('/api/rfqs/bulk-email/', payload)
            .then(res => {
                const { success_count, failed_ids } = res.data;
    
                if (success_count === 0) {
                    showToast({
                        type: 'danger',
                        title: 'Failed to Send',
                        message: 'No emails were sent.',
                    });
                } else if (failed_ids.length > 0) {
                    showToast({
                        type: 'warning',
                        title: 'Partial Success',
                        message: `${success_count} sent, ${failed_ids.length} failed.`,
                    });
                } else {
                    showToast({
                        type: 'success',
                        title: 'Success',
                        message: `All ${success_count} emails sent successfully 🎉`,
                    });
                }
    
                const modalEl = document.getElementById(id);
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
            })
            .catch(err => {
                console.error(err);
                showToast({
                    type: 'danger',
                    title: 'Server Error',
                    message: 'Something went wrong while sending emails.',
                    icon: '🔥'
                });
            })
            .finally(() => setSending(false));
    };

    return (
        <Modal
            id={id}
            size="modal-lg"
            title={
                <>
                    <h5 className="modal-title mb-1">Send Bulk Email</h5>
                    <p className="text-muted mb-0">
                        Send email to <b>{filteredRfqs.length}</b> of {rfqs.length} selected RFQs
                    </p>
                </>
            }
        >
            <div className="mb-3">
                <label className="form-label">Email Template</label>
                <select
                    className="form-select"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                    <option value="">Select an email template</option>
                    <option value="lowtp">T/P Request</option>
                    <option value="reminder">Reminder</option>
                    <option value="nostock">No Stock</option>
                    <option value="noexport">No Export</option>
                    <option value="mov">MOV Requirement</option>
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label">Recipients</label>
                <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredRfqs.length === 0 ? (
                        <div className="text-muted fst-italic px-2 py-2">
                            No valid recipients to send email.
                        </div>
                    ) : (
                        filteredRfqs.map((rfq) => (
                            <div key={rfq.id} className="list-group-item position-relative">
                                <button
                                    type="button"
                                    className="btn-close position-absolute end-0 top-50 translate-middle-y me-2"
                                    aria-label="Remove"
                                    title="Remove"
                                    onClick={() => handleRemoveRfq(rfq.id)}
                                ></button>

                                <div className="fw-semibold text-primary mb-1 pe-4">
                                    {rfq.mpn} – {rfq.contact_object?.company_name}
                                </div>
                                <div className="text-muted small pe-4">
                                    <i className="bi bi-envelope me-1"></i>
                                    {rfq.contact_object?.name} – {rfq.contact_object?.email}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="d-flex justify-content-end">
                <button className="btn btn-outline-secondary me-2" data-bs-dismiss="modal">
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    disabled={!selectedTemplate || filteredRfqs.length === 0 || sending}
                    onClick={handleSend}
                    // data-bs-dismiss="modal"
                >
                    {sending ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                        </>
                    ) : (
                        `Send ${filteredRfqs.length} Email${filteredRfqs.length > 1 ? 's' : ''}`
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default BulkEmailModal;