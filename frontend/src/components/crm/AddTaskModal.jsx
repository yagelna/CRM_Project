import React, { useState } from 'react';
import Modal from '../common/modal';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';

const AddTaskModal = ({ id, accountId, onTaskAdded }) => {
    const [form, setForm] = useState({
        title: '',
        due_date: '',
        description: '',
        priority: 'medium',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountId || !form.title || !form.due_date) return;

        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/crm/tasks/', {
                account: accountId,
                title: form.title,
                due_date: form.due_date,
                description: form.description,
                priority: form.priority,
            });
            onTaskAdded?.(response.data);
            setForm({ title: '', due_date: '', description: '', priority: 'medium' });
            document.getElementById(id + '_close')?.click();
            showToast?.({ type: 'success', title: 'Task Added', message: 'The task was successfully saved.' });
        } catch (error) {
            console.error('Failed to add task:', error);
            showToast?.({ type: 'danger', title: 'Error', message: 'Failed to save task.' });
        }
        setLoading(false);
    };

    return (
        <Modal id={id} title="Add Task">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="mb-3">
                        <label className="form-label">Title</label>
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
                        <label className="form-label">Due Date</label>
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
                    <button type="submit"
                        id
                        className="btn btn-primary" disabled={loading}>
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