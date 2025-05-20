import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const EditTaskModal = ({ id, task, onSave }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium'
    });

    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || '',
                description: task.description || '',
                due_date: task.due_date ? task.due_date.slice(0, 16) : '',
                priority: task.priority || 'medium'
            });
        }
    }, [task]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!task || !form.title || !form.due_date) return;
        setLoading(true);
        try {
            const res = await axiosInstance.patch(`/api/crm/tasks/${task.id}/`, form);
            onSave?.(res.data);
            showToast?.({ type: 'success', title: 'Task Updated' });
            document.getElementById(id + '_close')?.click();
        } catch (err) {
            console.error('Failed to update task:', err);
            showToast?.({ type: 'danger', title: 'Error updating task' });
        }
        setLoading(false);
    };

    return (
        <Modal id={id} title="Edit Task">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="mb-2">
                        <label className="form-label">Title</label>
                        <input className="form-control" name="title" value={form.title} onChange={handleChange} />
                    </div>
                    <div className="mb-2">
                        <label className="form-label">Description</label>
                        <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} />
                    </div>
                    <div className="mb-2">
                        <label className="form-label">Due Date</label>
                        <input type="datetime-local" className="form-control" name="due_date" value={form.due_date} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>


                <div className="modal-footer">
                    <button type="submit"
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
    </Modal >
  );
};

export default EditTaskModal;