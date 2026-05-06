import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import Modal from '../common/modal';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';
import { useAuth } from '../../context/AuthContext';

const AddTaskModal = ({ id, accountId, onTaskAdded }) => {
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: '',
        due_date: '',
        description: '',
        priority: 'medium',
    });

    const [isGeneralTask, setIsGeneralTask] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
    const [selectedAssignedToId, setSelectedAssignedToId] = useState(user?.id ? String(user.id) : '');

    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);

    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loading, setLoading] = useState(false);

    // Determine if we're in global mode (no accountId provided)
    const isGlobalMode = !accountId;

    useEffect(() => {
        if (user?.id && !selectedAssignedToId) {
            setSelectedAssignedToId(String(user.id));
        }
    }, [user?.id, selectedAssignedToId]);


    // Fetch accounts and users when modal is shown
    useEffect(() => {
        if (!isGlobalMode) {
            setSelectedAccountId(accountId);
        }

        const modalEl = document.getElementById(id);

        const handleModalShow = () => {
            if (isGlobalMode && accounts.length === 0) {
                fetchAccounts();
            }

            if (users.length === 0) {
                fetchUsers();
            }

            if (user?.id && !selectedAssignedToId) {
                setSelectedAssignedToId(String(user.id));
            }
        };

        modalEl?.addEventListener('show.bs.modal', handleModalShow);

        return () => {
            modalEl?.removeEventListener('show.bs.modal', handleModalShow);
        };
    }, [id, accountId, isGlobalMode, accounts.length, users.length, user?.id, selectedAssignedToId]);

    const fetchAccounts = async () => {
        setLoadingAccounts(true);

        try {
            const response = await axiosInstance.get('/api/crm/accounts/');
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            showToast?.({
                type: 'danger',
                title: 'Error',
                message: 'Failed to load accounts.'
            });
        } finally {
            setLoadingAccounts(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);

        try {
            const response = await axiosInstance.get('api/user/');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showToast?.({
                type: 'danger',
                title: 'Error',
                message: 'Failed to load users.'
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAccountChange = (selectedOption) => {
        setSelectedAccountId(selectedOption ? selectedOption.value : '');
        if (selectedOption) {
            setIsGeneralTask(false);
        }
    };

    const handleAssignedToChange = (selectedOption) => {
        setSelectedAssignedToId(selectedOption ? selectedOption.value : '');
    };

    const assignToMe = () => {
        if (user?.id) {
            setSelectedAssignedToId(String(user.id));
        }
    };

    const markAsGeneralTask = () => {
        setSelectedAccountId('');
        setIsGeneralTask(true);
    };

    const clearGeneralTask = () => {
        setIsGeneralTask(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title || !form.due_date) {
            showToast?.({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Title and Due Date are required.'
            });
            return;
        }

        if (!selectedAssignedToId) {
            showToast?.({
                type: 'warning',
                title: 'Missing Assignee',
                message: 'Please select who this task is assigned to.'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/crm/tasks/', {
                account: isGeneralTask || !selectedAccountId ? null : selectedAccountId,
                assigned_to: selectedAssignedToId,
                title: form.title,
                due_date: form.due_date,
                description: form.description,
                priority: form.priority,
            });

            onTaskAdded?.(response.data);

            setForm({
                title: '',
                due_date: '',
                description: '',
                priority: 'medium',
            });

            if (isGlobalMode) {
                setSelectedAccountId('');
                setIsGeneralTask(false);
            }

            if (user?.id) {
                setSelectedAssignedToId(String(user.id));
            }

            document.getElementById(id + '_close')?.click();

            showToast?.({
                type: 'success',
                title: 'Task Added',
                message: 'The task was successfully saved.'
            });
        } catch (error) {
            console.error('Failed to add task:', error);
            showToast?.({
                type: 'danger',
                title: 'Error',
                message: 'Failed to save task.'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const getAccountCompanyName = (account) => {
        return (
            account.company_name ||
            account.company_details?.name ||
            ''
        );
    };

    const accountOptions = accounts.map((account) => ({
        value: account.id,
        accountName: account.name,
        companyName: getAccountCompanyName(account),
    }));

    const selectedAccountOption =
        accountOptions.find(option => option.value === selectedAccountId) || null;

    const userOptions = users.map((u) => ({
        value: String(u.id),
        label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
    }));

    const selectedAssignedToOption = userOptions.find(option => String(option.value) === String(selectedAssignedToId)) || null;

    return (
        <Modal id={id} title="Add Task">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    {isGlobalMode && (
                        <div className="mb-3">
                            <label className="form-label">CRM Account</label>

                            <div className="d-flex gap-2 align-items-start">
                                <div className="flex-grow-1">
                                    <Select
                                        options={accountOptions}
                                        value={isGeneralTask ? null : selectedAccountOption}
                                        onChange={handleAccountChange}
                                        placeholder={isGeneralTask ? 'General task selected' : 'Search for an account...'}
                                        isClearable
                                        isDisabled={isGeneralTask}
                                        isLoading={loadingAccounts}
                                        getOptionLabel={(option) =>
                                            option.companyName
                                                ? `${option.accountName} - ${option.companyName}`
                                                : option.accountName
                                        }
                                        formatOptionLabel={(option) => (
                                            <span dir="ltr" style={{ unicodeBidi: 'plaintext' }}>
                                                <span>{option.accountName}</span>
                                                {option.companyName && (
                                                    <>
                                                        <span> - </span>
                                                        <span>{option.companyName}</span>
                                                    </>
                                                )}
                                            </span>
                                        )}
                                        styles={{
                                            option: (base) => ({
                                                ...base,
                                                direction: 'ltr',
                                                textAlign: 'left',
                                            }),
                                            singleValue: (base) => ({
                                                ...base,
                                                direction: 'ltr',
                                                textAlign: 'left',
                                            }),
                                            input: (base) => ({
                                                ...base,
                                                direction: 'ltr',
                                            }),
                                        }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={`btn ${isGeneralTask ? 'btn-secondary' : 'btn-outline-secondary'} task-inline-btn`}
                                    onClick={isGeneralTask ? clearGeneralTask : markAsGeneralTask}
                                >
                                    General Task
                                </button>
                            </div>

                            <div className="form-text">
                                Link the task to a CRM account, or mark it as a general task.
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">
                            Assigned To <span className="text-danger">*</span>
                        </label>

                        <div className="d-flex gap-2 align-items-start">
                            <div className="flex-grow-1">
                                <Select
                                    options={userOptions}
                                    value={selectedAssignedToOption}
                                    onChange={handleAssignedToChange}
                                    placeholder="Select user..."
                                    isClearable
                                    isLoading={loadingUsers}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn btn-outline-secondary task-inline-btn"
                                onClick={assignToMe}
                                disabled={!user?.id}
                            >
                                Assign to Me
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Title <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            name="description"
                            rows="3"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Due Date <span className="text-danger">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            name="due_date"
                            className="form-control"
                            value={form.due_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select
                            className="form-select"
                            name="priority"
                            value={form.priority}
                            onChange={handleChange}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                        id={id + '_close'}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTaskModal;