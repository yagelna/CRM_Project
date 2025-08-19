import React, { useEffect, useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';

const QuoteOffcanvas = ({ id, quote, onClose, refresh}) => {
    // const [quote, setQuote] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (quote) {
            console.log('Quote data loaded:', quote);
        }
    }, [quote]);

    // const fetchQuoteDetails = async () => {
    //     try {
    //         console.log('Fetching quote data for ID:', quoteId);
    //         const response = await axiosInstance.get(`api/crm/quotes/${quoteId}/`);
    //         setQuote(response.data);
    //         console.log('Quote data loaded:', response.data);
    //     } catch (error) {
    //         showToast({ type: 'error', title: 'Error', message: 'Failed to load quote data' });
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const getTotalValue = () => {
        if (!quote?.items) return 0;
        return quote.items.reduce((sum, item) => {
            return sum + (item.qty_offered && item.unit_price ? item.qty_offered * item.unit_price : 0);
        }, 0);
    };

    const handleSendQuote = async () => {
        if (!quote?.id) {
            showToast({ type: 'error', title: 'Error', message: 'Quote ID is missing' });
            return;
        }
        setIsSending(true);
        try {
            const response = await axiosInstance.post(`api/crm/quotes/${quote.id}/send/`);
            showToast({ type: 'success', title: 'Success', message: 'Quote sent successfully' });
            refresh(); // Refresh the quote list or details
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to send quote' });
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteQuote = async () => {
        if (!quote?.id) {
            showToast({ type: 'error', title: 'Error', message: 'Quote ID is missing' });
            return;
        }
        if (!window.confirm('Are you sure you want to delete this quote?')) return;
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`api/crm/quotes/${quote.id}/`);
            showToast({ type: 'success', title: 'Success', message: 'Quote deleted successfully' });
            refresh(); // Refresh the quote list or details
            onClose(); // Close the offcanvas after deletion
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to delete quote' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="offcanvas offcanvas-end lg-offcanvas" tabIndex="-1" id={id} aria-labelledby={`${id}Label`}>
            <div className="offcanvas-header">
                <h5 className="offcanvas-title">
                    {quote ? `Quote #${quote.id}` : 'Loading...'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" onClick={onClose}></button>
                
            </div>

            <div className="offcanvas-body">
                {!quote ? (
                    <div className="text-center mt-4">Loading...</div>
                ) : (
                    <>
                        {/* Top Section */}
                        <div className="row align-items-stretch mb-4">
                            {/* Quote Details */}
                            <div className="col-md-8 d-flex">
                                <div className="card border-1 shadow-sm mb-3 w-100 h-100">
                                    <div className="card-body">
                                        <h5 className="mb-4 mt-">Quote Details</h5>
                                        <div className="row g-3">
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Contact</div>
                                                <div className="fw-bold">{quote.crm_account_name}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Company</div>
                                                <div className="fw-bold">{quote.company_name || 'N/A'}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Contact Email</div>
                                                <div className="fw-bold">{quote.crm_account_email || 'N/A'}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Created At</div>
                                                <div>{new Date(quote.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Sent At</div>
                                                <div>{quote.sent_at ? new Date(quote.sent_at).toLocaleDateString() : 'Not Sent'}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Last Updated</div>
                                                <div>{new Date(quote.updated_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="col-sm-12">
                                                <div className="text-muted small">Interaction</div>
                                                {quote.interaction_title ? (
                                                    <div className="mt-3">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <p className="mb-0">
                                                                <strong>Interaction:</strong> {quote.interaction_title} ({quote.interaction_type})
                                                            </p>
                                                            <button
                                                                className="btn btn-sm"
                                                                type="button"
                                                                onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                                                                aria-expanded={isSummaryOpen}
                                                                aria-controls="interactionSummary"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#interactionSummary"
                                                            >
                                                                <span className="me-2">{isSummaryOpen ? "Hide Summary" : "Show Summary"}</span>
                                                                <i className={`bi bi-chevron-${isSummaryOpen ? "up" : "down"} rotate-icon`} />
                                                            </button>
                                                        </div>

                                                        <div className="collapse mt-2" id="interactionSummary">
                                                            <div className="card card-body bg-light border-0 py-2 px-3 preserve-newlines" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                                                {quote.interaction_summary}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted mt-2"><strong>Interaction:</strong> No interaction linked to this quote</p>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Summary + Actions */}
                            <div className="col-md-4">
                                <div className="card border-1 shadow-sm mb-3 h-100">
                                    <div className="card-body">
                                        <h5 className="ms-2 mb-4">Summary</h5>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                <div className='text-muted'>
                                                    Status
                                                </div>
                                                <div>
                                                    <span className={`badge bg-${quote.status === 'sent' ? 'success' : 'secondary'}`}>{quote.status}</span>
                                                </div>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                <div className='text-muted'>
                                                    Items
                                                </div>
                                                <div>
                                                    <span className="fw-bold">{quote.items?.length || 0}</span>
                                                </div>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                <div className='text-muted'>
                                                    Total Value
                                                </div>
                                                <div>
                                                    <span className="fw-bold">${getTotalValue().toFixed(2)}</span>
                                                </div>
                                            </li>
                                            <li className="list-group-item justify-content-between align-items-center mt-2">
                                                <div className='fw-bold'>
                                                    Quick Actions
                                                </div>
                                                <div className="d-grid gap-2 mt-3">
                                                    <button className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#EditQuoteModal">
                                                    Edit Quote</button>
                                                    <button className="btn btn-outline-success" onClick={handleSendQuote} disabled={isSending}>
                                                        {isSending ? 'Sending...' : 'Send Quote'}
                                                    </button>
                                                    <button className="btn btn-outline-secondary" data-bs-dismiss="offcanvas" onClick={handleDeleteQuote} disabled={isDeleting}>
                                                        {isDeleting ? 'Deleting...' : 'Delete Quote'}
                                                    </button>
                                                </div>
                                            </li>

                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="card border-1 shadow-sm">
                            <div className="card-body">
                                <h5 className="mb-3">Quote Items</h5>
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead className="">
                                            <tr>
                                                <th>#</th>
                                                <th>MPN</th>
                                                <th>Manufacturer</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Date Code</th>
                                                <th>Lead Time (days)</th>
                                                <th>Stock Source</th>
                                                <th>Remarks</th>
                                                <th>Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quote.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{idx + 1}</td>
                                                    <td>{item.mpn}</td>
                                                    <td>{item.manufacturer}</td>
                                                    <td>{item.qty_offered}</td>
                                                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                                                    <td>{item.date_code}</td>
                                                    <td>{item.lead_time}</td>
                                                    <td>{item.stock_source}</td>
                                                    <td>{item.remarks}</td>
                                                    <td>${(item.qty_offered * item.unit_price).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

}
export default QuoteOffcanvas;
