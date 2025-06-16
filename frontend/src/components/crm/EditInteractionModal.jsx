import React, { useState, useEffect } from 'react';
import Modal from '../common/modal';
import axiosInstance from '../../AxiosInstance';
import { showToast } from '../common/toast';

const EditInteractionModal = ({ id, interaction, onSave }) => {
  const [form, setForm] = useState({
    type: 'note',
    title: '',
    summary: '',
    timestamp: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (interaction) {
      setForm({
        type: interaction.type || 'note',
        title: interaction.title || '',
        summary: interaction.summary || '',
        timestamp: formatToLocalDatetime(interaction.timestamp) || '',
      });
    }
  }, [interaction]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interaction?.id || !form.summary) return;
    setLoading(true);
    try {
      const res = await axiosInstance.patch(`/api/crm/interactions/${interaction.id}/`, form);
      onSave?.(res.data);
      showToast({ type: 'success', title: 'Interaction Updated' });
      document.getElementById(id + '_close')?.click();
    } catch (err) {
      console.error('Failed to update interaction:', err);
      showToast({ type: 'danger', title: 'Error updating interaction' });
    }
    setLoading(false);
  };

  const formatToLocalDatetime = (timestamp) => {
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset(); // בדקות
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <Modal id={id} title="Edit Interaction">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select name="type" className="form-select" value={form.type} onChange={handleChange}>
              <option value="note">Note</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input name="title" className="form-control" value={form.title} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              name="timestamp"
              className="form-control"
              value={form.timestamp}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Summary</label>
            <textarea name="summary" className="form-control" rows="4" value={form.summary} onChange={handleChange} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" id={id + '_close'}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditInteractionModal;