import React, { useEffect, useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import AddInteractionModal from './AddInteractionModal';
import EditInteractionModal from './EditInteractionModal';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';
import { showToast } from '../common/toast';
import GmailThreadViewer from './GmailThreadViewer';
import QuoteModal from '../quotes/QuoteModal';

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
    const [tasks, setTasks] = useState([]);
    const [newInteraction, setNewInteraction] = useState({
        type: 'note',
        summary: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [taskBeingEdited, setTaskBeingEdited] = useState(null);
    const [interactionBeingEdited, setInteractionBeingEdited] = useState(null);
    const [openThreads, setOpenThreads] = useState([]);
    const [defaultQuoteData, setDefaultQuoteData] = useState(null);

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
                last_interaction: account.last_interaction || '',
            });
            setInteractions(account.interactions || []);
            setTasks(account.tasks || []);
        }
    }, [account]);

    const refreshAccount = async () => {
        try {
            const response = await axiosInstance.get(`/api/crm/accounts/${account.id}/`);
            const updatedAccount = response.data;
            setAccountData({
                name: updatedAccount.name || '',
                email: updatedAccount.email || '',
                phone: updatedAccount.phone || '',
                company: updatedAccount.company_details?.name || '',
                assigned_to: updatedAccount.assigned_to_name || '',
                status: updatedAccount.status || '',
                notes: updatedAccount.notes || '',
                created_at: updatedAccount.created_at || '',
                last_interaction: updatedAccount.last_interaction || '',
            });
        } catch (error) {
            console.error('Failed to refresh account:', error);
        }
    };

    const toggleThread = (interactionId) => {
        setOpenThreads(prev =>
            prev.includes(interactionId)
                ? prev.filter(id => id !== interactionId)
                : [...prev, interactionId]
        );
    };

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
        refreshAccount();
    };

    const handleDelete = () => {
        if (!account || !account.id) return;
        onDelete(account.id);
    };

    const toggleTaskCompleted = async (taskId, currentStatus) => {
        try {
            await axiosInstance.patch(`/api/crm/tasks/${taskId}/`, {
                is_completed: !currentStatus
            });
            setTasks(prev =>
                prev.map(task => task.id === taskId ? { ...task, is_completed: !currentStatus } : task)
            );
        } catch (error) {
            console.error('Failed to update task status:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await axiosInstance.delete(`/api/crm/tasks/${taskId}/`);
            setTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    return (
        <>
            <div className="offcanvas offcanvas-end lg-offcanvas" tabIndex="-1" id={id} aria-labelledby={`${id}Label`}>
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
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#addInteractionModal"
                        >
                            <i className="bi bi-plus-circle me-1" />
                            Add Interaction
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#addTaskModal"
                        >
                            <i className="bi bi-clipboard-plus me-1" />
                            Add Task
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                            <i className="bi bi-trash me-1" />
                            Delete Account
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
                                    <p><strong>Open Tasks:</strong> <span className="badge bg-warning text-dark">{tasks.filter(t => !t.is_completed).length}</span></p>
                                    <p><strong>Notes:</strong> {accountData.notes ? accountData.notes : <span className="text-muted">None</span>}</p>
                                    <p><strong>Last Interaction:</strong> {accountData.last_interaction ? new Date(accountData.last_interaction).toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}</p>
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
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="emails-tab" data-bs-toggle="tab" data-bs-target="#emails" type="button" role="tab">
                                        Emails
                                    </button>
                                </li>
                            </ul>

                            <div className="tab-content border border-top-0 p-3 rounded-bottom" id="crmTabsContent">
                                {/* Interactions Tab */}
                                <div className="tab-pane fade show active" id="interactions" role="tabpanel">

                                    {/* Interactions List */}
                                    {interactions.length === 0 ? (
                                        <p className="text-muted">No interactions found.</p>
                                    ) : (
                                        <div className="list-group">
                                            {interactions.map((interaction, idx) => (
                                                <div key={idx} className="list-group-item list-group-item-action flex-column align-items-start mb-2 border rounded">
                                                    {/* Interaction Type and Date */}
                                                    <div className="d-flex w-100 justify-content-between align-items-start mb-1">
                                                        <div>
                                                            <span className={`badge bg-${getInteractionColor(interaction.type)} me-2`}>
                                                                {interaction.type.toUpperCase()}
                                                            </span>
                                                            <h6 className="mb-0 fw-bold d-inline">{interaction.title || 'Untitled Interaction'}</h6>
                                                        </div>
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
{/* 
                                                    <div
                                                        className="p-2 bg-white rounded border"

                                                        style={{
                                                            whiteSpace: 'pre-wrap',
                                                            direction: isRTL(interaction.summary) ? 'rtl' : 'ltr',
                                                            textAlign: isRTL(interaction.summary) ? 'right' : 'left',
                                                            fontSize: '0.95rem'
                                                        }}
                                                    >
                                                        {interaction.summary}
                                                    </div> */}

                                                    {/* Interaction Details */}
                                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                                        <small className="text-muted">By: {interaction.added_by_name || 'Unknown'}</small>

                                                        <div className="d-flex gap-2">
                                                            {interaction.type === 'email' && interaction.thread_id && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-info"
                                                                    onClick={() => toggleThread(interaction.id)}
                                                                >
                                                                    <i className="bi bi-chat-left-text me-1" />
                                                                    {openThreads.includes(interaction.id) ? 'Hide Thread' : 'View Thread'}
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                title="Edit"
                                                                onClick={() => { setInteractionBeingEdited(interaction); }}
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#editInteractionModal"
                                                            >
                                                                <i className="bi bi-pencil" />
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteInteraction(interaction.id)}
                                                            >
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Gmail Thread Viewer - BELOW the button row */}
                                                    {interaction.type === 'email' && interaction.thread_id && openThreads.includes(interaction.id) && (
                                                        // <div className="mt-3 border rounded p-3 bg-light">
                                                        <GmailThreadViewer
                                                            threadId={interaction.thread_id}
                                                            crmAccountId={account?.id}
                                                            onRequestNewQuote={() => {
                                                                setDefaultQuoteData({
                                                                crm_account: account?.id,
                                                                interaction: interaction.id
                                                                });

                                                                setTimeout(() => {
                                                                const modalEl = document.getElementById("AddQuoteModal");
                                                                if (modalEl) {
                                                                    const modal = new window.bootstrap.Modal(modalEl);
                                                                    modal.show();
                                                                }
                                                                }, 300);
                                                            }}
                                                            />
                                                        // </div>
                                                    )}

                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tasks Tab */}
                                <div className="tab-pane fade" id="tasks" role="tabpanel">
                                    {tasks.length === 0 ? (
                                        <p className="text-muted">No tasks found.</p>
                                    ) : (
                                        <div className="list-group">
                                            {tasks.map((task, idx) => (
                                                <div key={idx} className={`list-group-item list-group-item-action mb-2 border rounded ${task.is_completed ? 'bg-light' : ''}`}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-1 d-flex align-items-center">
                                                            <i className={`bi ${task.is_completed ? 'bi-check-circle-fill text-success' : 'bi-circle text-warning'} me-2`} />
                                                            {task.title || 'Untitled Task'}
                                                            <span className={`badge ms-2 bg-${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                        </h6>

                                                        <small className="text-muted">
                                                            Due: {new Date(task.due_date).toLocaleDateString('en-GB')}
                                                        </small>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-muted small mb-1" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                                        <small className="text-muted">By: {task.added_by_name || 'Unknown'}</small>
                                                        <div className="ms-2 d-flex flex gap-1 align-items-end">
                                                            {/* Mark Task as Completed */}
                                                            <button
                                                                className={`btn btn-sm ${task.is_completed ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                                                                onClick={() => toggleTaskCompleted(task.id, task.is_completed)}
                                                                title={task.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                                                            >
                                                                <i className={`bi ${task.is_completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}`} />
                                                            </button>
                                                            {/* Edit Task */}
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => setTaskBeingEdited(task)}
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#editTaskModal"
                                                                title="Edit Task"
                                                            >
                                                                <i className="bi bi-pencil" />
                                                            </button>

                                                            {/* Delete Task */}
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Delete Task"
                                                            >
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <AddInteractionModal
                id="addInteractionModal"
                accountId={account?.id}
                onInteractionAdded={(newInteraction) => {
                    setInteractions(prev => [newInteraction, ...prev]);
                    refreshAccount();
                }
                }
            />
            <EditInteractionModal
                id="editInteractionModal"
                interaction={interactionBeingEdited}
                onSave={(updatedInteraction) => {
                    setInteractions(prev =>
                        prev.map(i => i.id === updatedInteraction.id ? updatedInteraction : i)
                    );
                    setInteractionBeingEdited(null);
                    refreshAccount();
                }}
            />
            <AddTaskModal
                id="addTaskModal"
                accountId={account?.id}
                onTaskAdded={(newTask) => setTasks(prev => [...prev, newTask])}
            />
            <EditTaskModal
                id="editTaskModal"
                task={taskBeingEdited}
                onSave={(updatedTask) => {
                    setTasks(prev =>
                        prev.map(t => t.id === updatedTask.id ? updatedTask : t)
                    );
                    setTaskBeingEdited(null);
                }}
            />
            <QuoteModal id="AddQuoteModal" mode="create" handleUpdateQuotes={() => {}} />
        </>
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

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'secondary';
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