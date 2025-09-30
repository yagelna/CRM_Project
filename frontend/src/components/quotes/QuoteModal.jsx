import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const defaultItem = {
  mpn: '',
  manufacturer: '',
  qty_offered: null,
  unit_price: null,
  date_code: '',
  lead_time: null,
  stock_source: '',
  remarks: '',
};

const QuoteModal = ({ id, mode = 'create', quoteData = null, handleUpdateQuotes, refetchQuote }) => {
  const [CRMAccounts, setCRMAccounts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [formData, setFormData] = useState({
    crm_account: '',
    interaction: '',
    status: 'draft',
  });

  const [items, setItems] = useState([{ ...defaultItem }]);
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    fetchCRMAccounts();

    if (mode === 'edit' && quoteData) {
      setFormData({
        crm_account: quoteData.crm_account,
        interaction: quoteData.interaction,
        status: quoteData.status,
      });
      setItems(quoteData.items || [{ ...defaultItem }]);
      fetchInteractions(quoteData.crm_account);
    } else {
      resetForm();
    }
  }, [mode, quoteData]);

  const resetForm = () => {
    setFormData({ crm_account: '', interaction: '', status: 'draft' });
    setItems([{ ...defaultItem }]);
    setInteractions([]);
  };

  const fetchCRMAccounts = async () => {
    try {
      const response = await axiosInstance.get('api/crm/accounts/');
      setCRMAccounts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load CRM accounts');
    }
  };

  const fetchInteractions = async (crmId) => {
    try {
      const res = await axiosInstance.get(`api/crm/interactions/?crm_account=${crmId}`);
      setInteractions(res.data);
    } catch {
      setInteractions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'crm_account') {
      setFormData(prev => ({ ...prev, interaction: '' }));
      fetchInteractions(value);
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { ...defaultItem }]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const validateItems = () => {
    return items.every(item =>
      item.mpn?.trim() &&
      item.qty_offered &&
      item.unit_price
    );
  };

const handleSubmit = async (e, sendEmail = false) => {
  e.preventDefault();
  setSubmitAttempted(true);

  if (!validateItems()) {
    showToast({
      type: 'warning',
      title: 'Missing Data',
      message: 'Please complete all required fields in each item.'
    });
    return;
  }

  setIsSaving(true);
  try {
    const payload = {
      ...formData,
      items,
      // ...(sendEmail && { status: 'sent', sent_at: new Date().toISOString() }),
    };

    let response;
    if (mode === 'create') {
      response = await axiosInstance.post('api/crm/quotes/', payload);
    } else {
      response = await axiosInstance.put(`api/crm/quotes/${quoteData.id}/`, payload);
    }

    const savedQuoteId = mode === 'create' ? response.data.id : quoteData.id;

    // Try to send email if needed
    if (sendEmail && savedQuoteId) {
      try {
        await axiosInstance.post(`api/crm/quotes/${savedQuoteId}/send/`);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Quote saved and email sent successfully'
        });
      } catch (sendErr) {
        showToast({
          type: 'warning',
          title: 'Partial Success',
          message: 'Quote saved, but failed to send email'
        });
      }
    } else {
      showToast({
        type: 'success',
        title: mode === 'create' ? 'Created' : 'Updated',
        message: 'Quote saved successfully'
      });
    }

    handleUpdateQuotes();
    if (savedQuoteId && refetchQuote) {
      refetchQuote(savedQuoteId);
    }


  } catch (error) {
    showToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to save quote'
    });
  } finally {
    setIsSaving(false);
  }
};

  return (
    <Modal id={id} title={mode === 'create' ? 'Create Quote' : 'Edit Quote'} size="modal-xl">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Contact Select */}
        <div className="mb-3">
          <label className="form-label">Contact</label>
          <select
            name="crm_account"
            className="form-select"
            value={formData.crm_account}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a contact</option>
            {CRMAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Interaction Select */}
        <div className="mb-3">
          <label className="form-label">Interaction</label>
          <select
            name="interaction"
            className="form-select"
            value={formData.interaction || ''}
            onChange={handleInputChange}
            disabled={!formData.crm_account || interactions.length === 0}
          >
            <option value="">No interaction selected</option>
            {interactions.map(i => (
              <option key={i.id} value={i.id}>{i.title || `Interaction ${i.id}`}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="mb-3">
          <label className="form-label">Status</label>
          <select name="status" className="form-select" value={formData.status} onChange={handleInputChange}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
        </div>


            
        {/* Items */}
        <div className="mb-3">
          <label className="form-label">Items</label>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MPN *</th>
                  <th>Manufacturer</th>
                  <th>Qty *</th>
                  <th>Price *</th>
                  <th>Date Code</th>
                  <th>Lead Time (days)</th>
                  <th>Stock Source</th>
                  <th>Remarks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>
                      <input type="text" className={`form-control form-control-sm ${submitAttempted && !item.mpn ? 'is-invalid' : ''}`}
                        value={item.mpn}
                        onChange={(e) => handleItemChange(index, 'mpn', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" className="form-control form-control-sm"
                        value={item.manufacturer}
                        onChange={(e) => handleItemChange(index, 'manufacturer', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className={`form-control form-control-sm ${!item.qty_offered && submitAttempted ? 'is-invalid' : ''}`}
                        value={item.qty_offered || ''}
                        onChange={(e) => handleItemChange(index, 'qty_offered', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" step="0.0001" className={`form-control form-control-sm ${!item.unit_price && submitAttempted ? 'is-invalid' : ''}`}
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" className="form-control form-control-sm"
                        value={item.date_code}
                        onChange={(e) => handleItemChange(index, 'date_code', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min={0} className="form-control form-control-sm"
                        value={item.lead_time}
                        onChange={(e) => handleItemChange(index, 'lead_time', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" className="form-control form-control-sm"
                        value={item.stock_source}
                        onChange={(e) => handleItemChange(index, 'stock_source', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" className="form-control form-control-sm"
                        value={item.remarks}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveItem(index)} title="Remove">
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-end">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddItem}>+ Add Item</button>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" data-bs-dismiss="modal" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="btn btn-outline-success" data-bs-dismiss="modal" onClick={(e) => handleSubmit(e, true)} disabled={isSaving}>
            {isSaving ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuoteModal;
