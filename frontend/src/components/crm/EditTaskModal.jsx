import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';
import { useAuth } from '../../context/AuthContext';

const EditTaskModal = ({ id, task, onSave }) => {
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
    });

    const [isGeneralTask, setIsGeneralTask] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedAssignedToId, setSelectedAssignedToId] = useState('');

    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);

    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!task) return;

        setForm({
            title: task.title || '',
            description: task.description || '',
            due_date: task.due_date ? task.due_date.slice(0, 16) : '',
            priority: task.priority || 'medium',
        });

        setSelectedAccountId(task.account ? String(task.account) : '');
        setIsGeneralTask(!task.account);

        setSelectedAssignedToId(
            task.assigned_to
                ? String(task.assigned_to)
                : user?.id
                    ? String(user.id)
                    : ''
        );
    }, [task, user?.id]);

    useEffect(() => {
        const modalEl = document.getElementById(id);

        const handleModalShow = () => {
            if (accounts.length === 0) {
                fetchAccounts();
            }

            if (users.length === 0) {
                fetchUsers();
            }
        };

        modalEl?.addEventListener('show.bs.modal', handleModalShow);

        return () => {
            modalEl?.removeEventListener('show.bs.modal', handleModalShow);
        };
    }, [id, accounts.length, users.length]);

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
                message: 'Failed to load accounts.',
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
                message: 'Failed to load users.',
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

        if (!task || !form.title || !form.due_date) {
            showToast?.({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Title and Due Date are required.',
            });
            return;
        }

        if (!selectedAssignedToId) {
            showToast?.({
                type: 'warning',
                title: 'Missing Assignee',
                message: 'Please select who this task is assigned to.',
            });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...form,
                account: isGeneralTask || !selectedAccountId ? null : selectedAccountId,
                assigned_to: selectedAssignedToId,
            };

            const res = await axiosInstance.patch(`/api/crm/tasks/${task.id}/`, payload);

            onSave?.(res.data);

            showToast?.({
                type: 'success',
                title: 'Task Updated',
            });

            document.getElementById(id + '_close')?.click();
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast?.({
                type: 'danger',
                title: 'Error updating task',
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
        value: String(account.id),
        accountName: account.name,
        companyName: getAccountCompanyName(account),
    }));

    const selectedAccountOption =
        accountOptions.find(option => String(option.value) === String(selectedAccountId)) || null;

    const baseUserOptions = users.map((u) => ({
        value: String(u.id),
        label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
    }));

    const currentUserOption = user?.id
        ? {
            value: String(user.id),
            label:
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.email ||
                'Me',
        }
        : null;

    const userOptions = currentUserOption
        ? [
            currentUserOption,
            ...baseUserOptions.filter(option => option.value !== currentUserOption.value),
        ]
        : baseUserOptions;

    const selectedAssignedToOption =
        userOptions.find(option => String(option.value) === String(selectedAssignedToId)) || null;

    return (
        <Modal id={id} title="Edit Task">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
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
                    </div>

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
                            className="form-control"
                            name="title"
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
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Due Date <span className="text-danger">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            name="due_date"
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

export default EditTaskModal;