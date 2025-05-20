import React, { useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';
import Modal from '../common/modal';

const AddInteractionModal = ({ id, accountId, onInteractionAdded }) => {
  const [form, setForm] = useState({ type: 'note', summary: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !form.summary.trim()) return;
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/crm/interactions/', {
        account: accountId,
        type: form.type,
        title: form.title,
        summary: form.summary.trim()
      });
      onInteractionAdded?.(response.data);
      setForm({ type: 'note', summary: '' , title: '' });
      document.getElementById(id + '_close')?.click();
      showToast?.({
        type: 'success',
        title: 'Interaction Added',
        message: 'The interaction was successfully saved.'
      });
    } catch (error) {
      console.error('Failed to add interaction:', error);
      showToast?.({
        type: 'danger',
        title: 'Error',
        message: 'Failed to save interaction.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal id={id} title="Add Interaction">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="note">Note</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              name="title"
              className="form-control"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Summary</label>
            <textarea
              className="form-control"
              rows="4"
              name="summary"
              value={form.summary}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !form.summary.trim()}
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

export default AddInteractionModal;
