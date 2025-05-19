import React, { useEffect, useState } from 'react';
import axiosInstance from '../../AxiosInstance';

const CRMOffcanvas = ({ id, account, onDelete, onClose }) => {
    const [accountData, setAccountData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        assigned_to: '',
        status: '',
        notes: '',
        created_at: '',
    });

    const [interactions, setInteractions] = useState([]);
    const [newInteraction, setNewInteraction] = useState({
        type: 'note',
        summary: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (account) {
            setAccountData({
                name: account.name || '',
                email: account.email || '',
                phone: account.phone || '',
                company: account.company_details?.name || '',
                assigned_to: account.assigned_to_name || '',
                status: account.status || '',
                notes: account.notes || '',
                created_at: account.created_at || '',
            });
            setInteractions(account.interactions || []);
        }
    }, [account]);

    const handleSubmitInteraction = async () => {
        if (!account?.id) return;
        setSubmitting(true);
        try {
            const response = await axiosInstance.post(`/api/crm/interactions/`, {
                account: account.id,
                type: newInteraction.type,
                summary: newInteraction.summary,
            });
            setInteractions(prev => [response.data, ...prev]);
            setNewInteraction({ type: 'note', summary: '' });
        } catch (error) {
            console.error('Failed to add interaction:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteInteraction = async (id) => {
        if (!window.confirm('Are you sure you want to delete this interaction?')) return;
        try {
            await axiosInstance.delete(`/api/crm/interactions/${id}/`);
            setInteractions(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error('Failed to delete interaction:', error);
        }
    };

    const handleDelete = () => {
        if (!account || !account.id) return;
        onDelete(account.id);
    };

    return (
        <div className="offcanvas offcanvas-end crm-offcanvas" tabIndex="-1" id={id} aria-labelledby={`${id}Label`}>
            <div className="offcanvas-header d-block">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 className="offcanvas-title mb-0" id={`${id}Label`}>
                            {accountData.name || 'CRM Account'}
                        </h5>
                        <small className="text-muted">{accountData.company}</small>
                    </div>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
                </div>
            </div>
            <hr className='m-0' />

            <div className="offcanvas-body">
                <div className="d-flex justify-content-end mb-3 gap-2">
                    <button className="btn btn-outline-warning btn-sm">
                        <i className="bi bi-pencil me-1" />
                        Edit
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-plus-circle me-1" />
                        Add Interaction
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-clipboard-plus me-1" />
                        Add Task
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                        <i className="bi bi-trash me-1" />
                        Delete
                    </button>
                </div>

                {/* Row 1: Client Info & Summary */}
                <div className="row gy-3">
                    <div className="col-md-6">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h6 className="card-title text-primary">Client Info</h6>
                                <p><strong>Email:</strong> {accountData.email || <span className="text-muted">N/A</span>}</p>
                                <p><strong>Phone:</strong> {accountData.phone || <span className="text-muted">N/A</span>}</p>
                                <p><strong>Company:</strong> {accountData.company || <span className="text-muted">Unlinked</span>}</p>
                                <p><strong>Assigned To:</strong> {accountData.assigned_to || <span className="text-muted">Unassigned</span>}</p>
                                <p><strong>Status:</strong> <span className={`badge bg-${getStatusColor(accountData.status)}`}>{accountData.status}</span></p>
                                <p><strong>Created:</strong> {accountData.created_at ? new Date(accountData.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card shadow-sm bg-light">
                            <div className="card-body">
                                <h6 className="card-title text-primary">Summary</h6>
                                <p><strong>Interactions:</strong> <span className="badge bg-secondary">{interactions.length}</span></p>
                                <p><strong>Open Tasks:</strong> <span className="badge bg-warning text-dark">3</span></p>
                                <p><strong>Notes:</strong> {accountData.notes ? accountData.notes.slice(0, 80) + '...' : <span className="text-muted">None</span>}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="row mt-4">
                    <div className="col-12">
                        <ul className="nav nav-tabs" id="crmTabs" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button className="nav-link active" id="interactions-tab" data-bs-toggle="tab" data-bs-target="#interactions" type="button" role="tab">
                                    Interactions
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className="nav-link" id="tasks-tab" data-bs-toggle="tab" data-bs-target="#tasks" type="button" role="tab">
                                    Tasks
                                </button>
                            </li>
                        </ul>

                        <div className="tab-content border border-top-0 p-3 rounded-bottom" id="crmTabsContent">
                            {/* Interactions Tab */}
                            <div className="tab-pane fade show active" id="interactions" role="tabpanel">
                                {/* Add Form */}
                                <div className="border p-3 mb-3 rounded bg-light">
                                    <h6>Add New Interaction</h6>
                                    <div className="mb-2">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={newInteraction.type}
                                            onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                                        >
                                            <option value="note">Note</option>
                                            <option value="email">Email</option>
                                            <option value="call">Call</option>
                                            <option value="meeting">Meeting</option>
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Summary</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={newInteraction.summary}
                                            onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        disabled={submitting || !newInteraction.summary}
                                        onClick={handleSubmitInteraction}
                                    >
                                        {submitting ? 'Saving...' : 'Save Interaction'}
                                    </button>
                                </div>

                                {/* Interactions List */}
                                {interactions.length === 0 ? (
                                    <p className="text-muted">No interactions found.</p>
                                ) : (
                                    <div className="list-group">
                                        {interactions.map((interaction, idx) => (
                                            <div key={idx} className="list-group-item list-group-item-action flex-column align-items-start mb-2 border rounded">
                                                {/* כותרת עליונה עם סוג האינטראקציה + תאריך בצד ימין */}
                                                <div className="d-flex w-100 justify-content-between align-items-center">
                                                    <h6 className="mb-1">
                                                        <span className={`badge bg-${getInteractionColor(interaction.type)} me-2`}>
                                                            {interaction.type.toUpperCase()}
                                                        </span>
                                                    </h6>
                                                    <small className="text-muted">
                                                        {new Date(interaction.timestamp).toLocaleString('en-GB', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </small>
                                                </div>

                                                <p
                                                    style={{
                                                        whiteSpace: 'pre-wrap',
                                                        direction: isRTL(interaction.summary) ? 'rtl' : 'ltr',
                                                        textAlign: isRTL(interaction.summary) ? 'right' : 'left'
                                                    }}
                                                >
                                                    {interaction.summary}
                                                </p>

                                                {/* שורת מידע תחתונה: By + כפתור מחיקה בצד ימין */}
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">By: {interaction.added_by_name || 'Unknown'}</small>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Delete"
                                                        onClick={() => handleDeleteInteraction(interaction.id)}
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tasks Tab */}
                            <div className="tab-pane fade" id="tasks" role="tabpanel">
                                <p className="text-muted">Coming soon: Task list...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Button */}
                <div className="text-end mt-4">
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                        Delete Account
                        <i className="bi bi-trash ms-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

function getStatusColor(status) {
    switch (status) {
        case 'active': return 'success';
        case 'new': return 'primary';
        case 'slow': return 'warning';
        case 'inactive': return 'secondary';
        case 'archived': return 'dark';
        default: return 'light';
    }
}

function getInteractionColor(type) {
    switch (type) {
        case 'email': return 'info';
        case 'call': return 'primary';
        case 'meeting': return 'success';
        case 'note': return 'secondary';
        default: return 'light';
    }
}

function isRTL(text) {
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF]/; // Hebrew + Arabic range
  return rtlChars.test(text);
}

export default CRMOffcanvas;