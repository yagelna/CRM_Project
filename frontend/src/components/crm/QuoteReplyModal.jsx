import React, { useEffect, useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';
import QuoteModal from '../quotes/QuoteModal';


const QuoteReplyModal = ({ show, onClose, threadId, messageId, subject, crmAccountId }) => {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);  // Preview quote
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (crmAccountId && show) {
      axiosInstance.get(`api/crm/quotes/?crm_account=${crmAccountId}`)
        .then(res => setQuotes(res.data))
        .catch(() => showToast({ type: 'error', message: 'Failed to load quotes' }));
    }
  }, [crmAccountId, show]);

  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === parseInt(selectedQuoteId));
      setSelectedQuote(quote);
    } else {
      setSelectedQuote(null);
    }
  }, [selectedQuoteId, quotes]);


  const handleSend = async () => {
    console.log('Sending quote reply with', threadId, messageId, selectedQuoteId, subject);
    if (!selectedQuoteId) {
      showToast({ type: 'warning', message: 'Please select a quote' });
      return;
    }

    setIsSending(true);
    try {
      const res = await axiosInstance.post(`api/crm/quotes/${selectedQuoteId}/send-reply/`, {
        thread_id: threadId,
        message_id: messageId,
        subject: subject,
      });

      showToast({ type: 'success', message: 'Quote sent successfully!' });
      onClose();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Failed to send quote' });
    } finally {
      setIsSending(false);
    }
  };

  const openAddQuoteModal = () => {
  onClose();

  setTimeout(() => {
    const modalEl = document.getElementById("AddQuoteModal");
    if (modalEl) {
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    } else {
      console.error("AddQuoteModal not found in DOM");
    }
  }, 300); 
};

  if (!show) return null;

   return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Send Quote as Reply</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label>Select Quote</label>
            <select
              className="form-select mb-3"
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
            >
              <option value="">-- Select Quote --</option>
              {quotes.map(q => {
                const total = q.items?.reduce((sum, i) => sum + (i.qty_offered * i.unit_price), 0).toFixed(2);
                return (
                  <option key={q.id} value={q.id}>
                    #{q.id.toString().padStart(5, '0')} | {q.status} | {q.items.length} items | ${total}
                  </option>
                );
              })}
            </select>

            {/* Preview Section */}
            {selectedQuote && (
              <div className="card mt-3">
                <div className="card-body">
                  <h6 className="card-title">Quote Preview</h6>
                  <p><strong>Contact:</strong> {selectedQuote.crm_account_name}</p>
                  <p><strong>Company:</strong> {selectedQuote.company_name || 'N/A'}</p>
                  <p><strong>Status:</strong> {selectedQuote.status}</p>

                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>MPN</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item.mpn}</td>
                            <td>{item.qty_offered}</td>
                            <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                            <td>${(item.qty_offered * item.unit_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* New Quote Button */}
            <div className="mt-3">
              <button
  className="btn btn-outline-primary btn-sm"
  onClick={openAddQuoteModal}
>
  + New Quote
</button>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSend} disabled={isSending || !selectedQuoteId}>
              {isSending ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default QuoteReplyModal;