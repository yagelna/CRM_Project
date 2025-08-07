import React, { useEffect, useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import DOMPurify from 'dompurify';
import QuoteReplyModal from './QuoteReplyModal';


const GmailThreadViewer = ({ threadId, crmAccountId }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyToMessageId, setReplyToMessageId] = useState(null);
    const [threadIdForReply, setThreadIdForReply] = useState(null);
    const [subjectForReply, setSubjectForReply] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);

    const fetchThread = async () => {
    setLoading(true);
    try {
        const res = await axiosInstance.get(`/api/crm/gmail/threads/${threadId}/`);
        setMessages(res.data.messages || []);
    } catch (err) {
        console.error('Failed to fetch Gmail thread:', err);
        setError('Failed to load thread');
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        if (!threadId) return;
        fetchThread();
    }, [threadId]);

    if (loading) return <div>Loading Gmail thread...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (messages.length === 0) return <div>No messages found in this thread.</div>;

    return (
        <div className="accordion mt-2" id="gmailAccordion">
            {messages.map((msg, idx) => {
                const itemId = `accordion-item-${idx}`;
                const headingId = `heading-${idx}`;
                const collapseId = `collapse-${idx}`;
                return (
                    <div className="accordion-item" key={idx}>
                        <h2 className="accordion-header" id={headingId}>
                            <button
                                className="accordion-button collapsed flex-row-reverse"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${collapseId}`}
                                aria-expanded="false"
                                aria-controls={collapseId}
                                style={{
                                    backgroundColor: '#f6f2ff',
                                    borderBottom: '1px solid #dee2e6',
                                    padding: '1rem'
                                }}
                            >
                                <div className="w-100 d-flex justify-content-between align-items-start ms-3">
                                    {/* Left Side – Content */}
                                    <div className="text-start">
                                        <p className="mb-1">
                                            <i className="bi bi-envelope-fill me-1 text-primary" />
                                            <strong>From:</strong> {msg.from}
                                        </p>
                                        <p className="mb-1"><strong>To:</strong> {msg.to}</p>
                                        <p className="mb-0"><strong>Subject:</strong> {msg.subject}</p>
                                    </div>

                                    {/* Right Side – Date */}
                                    <div className="text-end">
                                        <small className="text-muted">
                                            {new Date(msg.date).toLocaleDateString()} , {new Date(msg.date).toLocaleTimeString()}
                                        </small>
                                    </div>
                                </div>
                            </button>






                        </h2>
                        <div
                            id={collapseId}
                            className="accordion-collapse collapse"
                            aria-labelledby={headingId}
                            data-bs-parent="#gmailAccordion"
                        >
                            <div className="accordion-body">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(msg.body || '[No content]')
                                    }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                />
                                <hr />
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: '#FF6C2F',
                                        color: 'white',
                                        borderRadius: '20px',
                                        padding: '4px 12px',
                                        fontWeight: '500',
                                    }}
                                    onClick={() => {
                                        setReplyToMessageId(msg.real_message_id);
                                        setThreadIdForReply(threadId);
                                        setSubjectForReply(msg.subject);
                                        setShowReplyModal(true);
                                    }}
                                >
                                    <i className="bi bi-reply me-1" />
                                    Reply
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            <QuoteReplyModal
  show={showReplyModal}
  onClose={() => setShowReplyModal(false)}
  threadId={threadIdForReply}
  messageId={replyToMessageId}
  subject={subjectForReply}
  crmAccountId={crmAccountId}
/>
        </div>
        
    );
};

export default GmailThreadViewer;
