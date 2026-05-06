import React, { useState, useEffect } from 'react';
import Modal from '../common/modal';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';
import Select from 'react-select';

const AddTaskModal = ({ id, accountId, onTaskAdded }) => {
    const [form, setForm] = useState({
        title: '',
        due_date: '',
        description: '',
        priority: 'medium',
    });
    const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
    const [accounts, setAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loading, setLoading] = useState(false);

    // Determine if we're in global mode (no accountId provided)
    const isGlobalMode = !accountId;

    // Fetch accounts when in global mode
    useEffect(() => {
        if (!isGlobalMode) {
            setSelectedAccountId(accountId);
            return;
        }

        const modalEl = document.getElementById(id);

        const handleModalShow = () => {
            if (accounts.length === 0) {
                fetchAccounts();
            }
        };

        modalEl?.addEventListener('show.bs.modal', handleModalShow);

        return () => {
            modalEl?.removeEventListener('show.bs.modal', handleModalShow);
        };
    }, [id, accountId, isGlobalMode, accounts.length]);

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

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAccountChange = (selectedOption) => {
        setSelectedAccountId(selectedOption ? selectedOption.value : '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!form.title || !form.due_date) {
            showToast?.({ type: 'warning', title: 'Missing Fields', message: 'Title and Due Date are required.' });
            return;
        }

        // In global mode, account selection is required
        if (isGlobalMode && !selectedAccountId) {
            showToast?.({ type: 'warning', title: 'Missing Account', message: 'Please select a CRM Account.' });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/crm/tasks/', {
                account: selectedAccountId,
                title: form.title,
                due_date: form.due_date,
                description: form.description,
                priority: form.priority,
            });
            onTaskAdded?.(response.data);
            setForm({ title: '', due_date: '', description: '', priority: 'medium' });
            if (isGlobalMode) {
                setSelectedAccountId('');
            }
            document.getElementById(id + '_close')?.click();
            showToast?.({ type: 'success', title: 'Task Added', message: 'The task was successfully saved.' });
        } catch (error) {
            console.error('Failed to add task:', error);
            showToast?.({ type: 'danger', title: 'Error', message: 'Failed to save task.' });
        }
        setLoading(false);
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

    return (
        <Modal id={id} title="Add Task">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    {/* Account Selector - Only in Global Mode */}
                    {isGlobalMode && (
                        <div className="mb-3">
                            <label className="form-label">CRM Account <span className="text-danger">*</span></label>
                            <Select
                                options={accountOptions}
                                value={selectedAccountOption}
                                onChange={handleAccountChange}
                                placeholder="Search for an account..."
                                isClearable
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
                    )}

                    <div className="mb-3">
                        <label className="form-label">Title <span className="text-danger">*</span></label>
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
                        <label className="form-label">Due Date <span className="text-danger">*</span></label>
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