import React, { useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const BulkEditModal = ({ id, selectedRows, onSuccess }) => {
  const [fields, setFields] = useState([{ field: '', value: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const availableFields = [
    { key: "date_code", label: "Date Code", type: "text" },
    { key: "target_price", label: "Target Price", type: "number" },
    { key: "manufacturer", label: "Manufacturer", type: "text" },
    { key: "qty_requested", label: "Qty Requested", type: "number" },
    { key: "qty_offered", label: "Qty Offered", type: "number" },
    { key: "offered_price", label: "Offered Price", type: "number" },
    { key: "stock_source", label: "Stock Source", type: "select", options: ["Stock", "Available", "Stock & Available", "Not Specified"] },
    { key: "status", label: "Status", type: "select", options: ["Pending", "Quote Sent", "Reminder Sent", "Closed", "No Stock", "Rejected"] },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "auto_quote_deadline", label: "Auto Quote Deadline", type: "datetime-local" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const updates = fields.reduce((acc, field) => {
      if (field.field && field.value !== "") {
        const type = availableFields.find(f => f.key === field.field)?.type;
        acc[field.field] = type === 'number' ? Number(field.value) : field.value;
      }
      return acc;
    }, {});

    const ids = selectedRows.map(row => row.id);

    if (Object.keys(updates).length === 0) {
      showToast({ type: 'warning', title: 'Missing Fields', message: 'Please add at least one field to update.' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.patch('/api/rfqs/bulk-edit/', { updates, ids });
      showToast({
        type: 'success',
        title: 'RFQs Updated',
        message: res.data.success || 'RFQs updated successfully ✅'
      });

      // Close modal manually
      const modalElement = document.getElementById(id);
      if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
      }

      // Refresh data in grid
      if (onSuccess) onSuccess();
      setFields([{ field: '', value: '' }]);

    } catch (error) {
      console.error("Bulk edit failed", error);
      showToast({
        type: 'danger',
        title: 'Update Failed',
        message: error?.response?.data?.error || 'Something went wrong.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addField = () => setFields([...fields, { field: '', value: '' }]);
  const removeField = (index) => setFields(fields.filter((_, i) => i !== index));
  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };
  const isFieldSelected = (field) => fields.some(f => f.field === field);

  return (
    <Modal id={id} title={`Bulk Edit ${selectedRows.length} RFQs`}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="d-flex flex-column gap-3">
            {fields.map((field, index) => {
              const fieldMeta = availableFields.find(f => f.key === field.field);
              return (
                <div key={index} className="d-flex align-items-start gap-3">
                  <div style={{ flex: 2 }}>
                    <select
                      className="form-select form-select-sm"
                      value={field.field}
                      onChange={(e) => updateField(index, 'field', e.target.value)}
                    >
                      <option value="" disabled>Select field...</option>
                      {availableFields.map(option => (
                        <option
                          key={option.key}
                          value={option.key}
                          disabled={isFieldSelected(option.key) && option.key !== field.field}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 3 }}>
                    {fieldMeta?.type === 'select' ? (
                      <select
                        className="form-select form-select-sm"
                        value={field.value}
                        onChange={(e) => updateField(index, 'value', e.target.value)}
                      >
                        <option value="">Select value...</option>
                        {fieldMeta.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : fieldMeta?.type === 'textarea' ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Enter value"
                        value={field.value}
                        onChange={(e) => updateField(index, 'value', e.target.value)}
                      />
                    ) : (
                      <input
                        type={fieldMeta?.type || 'text'}
                        className="form-control form-control-sm"
                        placeholder="Enter value"
                        value={field.value}
                        onChange={(e) => updateField(index, 'value', e.target.value)}
                      />
                    )}
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeField(index)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" className="btn btn-outline-primary mt-3 w-100" onClick={addField}>
            + Add Field
          </button>
        </div>

        <div className="modal-footer">
          <button type="submit" className="btn btn-success" disabled={isLoading}>
            {isLoading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
            Update
          </button>
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkEditModal;