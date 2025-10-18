// src/components/orders/EditOrderModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import Select from 'react-select';
import { showToast } from '../common/toast';

const EditOrderModal = ({ id="editOrderModal", order, onSaved }) => {
  const [form, setForm] = useState(getEmptyForm());
  const [items, setItems] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [contactOptions, setContactOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [applyTax, setApplyTax] = useState(true);
  const [taxRate, setTaxRate] = useState(18); // %

  // helpers to calculate totals
  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const calcSubtotal = () =>
    items.reduce((s, it) => s + (Number(it.qty_ordered || 0) * Number(it.unit_price || 0)), 0);

  const calcTax = () => (applyTax ? round2(calcSubtotal() * (Number(taxRate || 0) / 100)) : 0);

  const calcGrand = () => {
    const sub = calcSubtotal();
    const tax = calcTax();
    const ship = Number(form.shipping_total || 0);
    const disc = Number(form.discount_total || 0);
    return round2(sub - disc + tax + ship);
  };

  useEffect(() => {
    // fetch company options once
    (async () => {
      try {
        const { data } = await axiosInstance.get('/api/companies/');
        setCompanyOptions(data.map(c => ({ value: c.id, label: c.name })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Initialize form with order data when it changes
    if (!order) return;
    const discount = Number(order.discount_total ?? 0);
    const shipping = Number(order.shipping_total ?? 0);
    const taxAbs   = Number(order.tax_total ?? 0);

    // map items
    const mappedItems = (order.items || []).map(it => ({
      id: it.id,
      mpn: it.mpn || '',
      customer_part_number: it.customer_part_number || '',
      manufacturer: it.manufacturer || '',
      description: it.description || '',
      qty_ordered: it.qty_ordered || 0,
      unit_price: Number(it.unit_price ?? 0),
      status: it.status || 'new',
      date_code: it.date_code || '',
      source: it.source || '',
      requested_date: it.requested_date || '', // YYYY-MM-DD
      notes: it.notes || '',
    }));
    setItems(mappedItems);

    setForm({
      company: order.company || '',
      contact: order.contact || '',
      currency: order.currency || 'USD',
      status: order.status || 'new',
      payment_status: order.payment_status || 'unpaid',
      shipping_address: order.shipping_address || '',
      notes: order.notes || '',
      customer_order_number: order.customer_order_number || '',
      discount_total: discount,
      tax_total: taxAbs,
      shipping_total: shipping,
    });

    // determine tax rate
    const sub = mappedItems.reduce((s, it) => s + (Number(it.qty_ordered||0) * Number(it.unit_price||0)), 0);
    if (sub > 0) {
      const rate = (taxAbs / sub) * 100;
      setTaxRate(Number.isFinite(rate) ? Math.max(0, Math.round(rate * 100) / 100) : 0);
      setApplyTax(taxAbs > 0);
    } else {
      setTaxRate(taxAbs > 0 ? 18 : 0);
      setApplyTax(taxAbs > 0);
    }

    setSubmitAttempted(false);
  }, [order]);

  useEffect(() => {
    // Fetch contacts based on current company
    (async () => {
      if (!form.company) { setContactOptions([]); return; }
      try {
        const { data } = await axiosInstance.get(`/api/companies/${form.company}/contacts/`);
        setContactOptions(data.map(c => ({ value: c.id, label: c.name })));
      } catch { setContactOptions([]); }
    })();
  }, [form.company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: ["company","contact"].includes(name) ? (value===""? "" : Number(value)) : value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      mpn: "", customer_part_number: "", manufacturer: "", description: "",
      qty_ordered: 0, unit_price: 0, status: "new", date_code: "", source: "",
      requested_date: "", notes: ""
    }]);
  };

  const removeItem = (index) => setItems(prev => prev.filter((_,i)=>i!==index));

  const validate = () => {
    if (!form.company) return false;
    return items.every(it => it.mpn && Number(it.qty_ordered) > 0 && it.unit_price !== "" && it.unit_price !== null && !isNaN(it.unit_price));
  };

  const save = async () => {
    if (!order?.id) return;
    setSubmitAttempted(true);
    if (!validate()) {
      showToast({ title: "Validation Error", message: "MPN/Qty/Price נדרשים בכל שורה.", type: "danger" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        tax_total: Number(calcTax()),
        discount_total: Number(form.discount_total || 0),
        shipping_total: Number(form.shipping_total || 0),
        // Item upsert (+delete implicit)
        items_payload: items.map(it => ({
          id: it.id, // may be undefined for new rows – that's okay
          mpn: it.mpn,
          customer_part_number: it.customer_part_number || "",
          manufacturer: it.manufacturer || "",
          description: it.description || "",
          qty_ordered: Number(it.qty_ordered),
          unit_price: Number(it.unit_price),
          status: it.status || "new",
          date_code: it.date_code || "",
          source: it.source || "",
          requested_date: it.requested_date || "",
          notes: it.notes || "",
        })),
      };
      console.log('[EditOrderModal] PUT body =', JSON.parse(JSON.stringify(body)));
      const { data } = await axiosInstance.put(`/api/orders/${order.id}/`, body);
      showToast({ title: "Updated", message: `Order ${data.order_number} updated.`, type: "success" });
      onSaved?.(data); // Refresh table/view
      // Close modal
      const el = document.getElementById(id);
      if (el) window.bootstrap.Modal.getInstance(el)?.hide();
    } catch (err) {
      console.error(err);
      showToast({ title: "Save Failed", message: "Failed to update order.", type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  function getEmptyForm(){
    return {
      company:"", contact:"", currency:"USD", status:"new", payment_status:"unpaid",
      shipping_address:"", notes:"", customer_order_number:"", discount_total:0, tax_total:0, shipping_total:0,
    };
  }

  // Don't render if no order
  if (!order) return null;

  return (
    <Modal id={id} title={`Edit Order ${order.order_number || `#${order.id}`}`} customWidth="90%">
      {/* Row 1: Company | Contact | Customer Order # */}
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4">
          <label className="form-label">Company *</label>
          <Select
            name="company"
            options={companyOptions}
            value={companyOptions.find(o => o.value === form.company) || null}
            onChange={(opt)=> setForm({...form, company: opt?.value ?? ""})}
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Contact</label>
          <Select
            name="contact"
            options={contactOptions}
            value={contactOptions.find(o => o.value === form.contact) || null}
            onChange={(opt)=> setForm({...form, contact: opt?.value ?? ""})}
            isDisabled={!form.company}
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Customer Order #</label>
          <input
            name="customer_order_number"
            className="form-control"
            value={form.customer_order_number}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Row 2: Currency | Status | Payment | Totals card */}
      <div className="row g-3 mt-1 align-items-end">
        <div className="col-6 col-md-2">
          <label className="form-label">Currency</label>
          <select name="currency" className="form-select" value={form.currency} onChange={handleChange}>
            <option value="USD">USD</option><option value="EUR">EUR</option><option value="ILS">ILS</option>
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label">Status</label>
          <select name="status" className="form-select" value={form.status} onChange={handleChange}>
            <option value="new">new</option>
            <option value="awaiting_payment">awaiting_payment</option>
            <option value="processing">processing</option>
            <option value="shipped">shipped</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="returned">returned</option>
            <option value="refunded">refunded</option>
          </select>
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label">Payment</label>
          <select name="payment_status" className="form-select" value={form.payment_status} onChange={handleChange}>
            <option value="unpaid">unpaid</option>
            <option value="partial">partial</option>
            <option value="paid">paid</option>
            <option value="refunded">refunded</option>
          </select>
        </div>

        <div className="col-6 col-md-4">
          <div className="border rounded p-2 bg-light">
            <div className="d-flex justify-content-between small">
              <span>Subtotal</span><strong>{round2(calcSubtotal()).toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Grand Total</span><strong>{calcGrand().toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Discount | Shipping | Tax (checkbox + %) | spacer */}
      <div className="row g-3 mt-1 align-items-end">
        <div className="col-6 col-md-2">
          <label className="form-label">Discount</label>
          <input
            type="number"
            step="0.01"
            name="discount_total"
            className="form-control"
            value={form.discount_total}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
          />
        </div>

        <div className="col-6 col-md-2">
          <label className="form-label">Shipping</label>
          <input
            type="number"
            step="0.01"
            name="shipping_total"
            className="form-control"
            value={form.shipping_total}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
          />
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label">Tax</label>
          <div className="input-group">
            <span className="input-group-text">
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={applyTax}
                onChange={() => setApplyTax(v => !v)}
              />
            </span>
            <input
              type="number"
              className="form-control"
              value={taxRate}
              onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value) || 0))}
              step="0.1"
              min="0"
              disabled={!applyTax}
            />
            <span className="input-group-text">%</span>
            <span className="input-group-text">= {calcTax().toFixed(2)}</span>
          </div>
        </div>

        <div className="col-md-5 d-none d-md-block">{/* spacer */}</div>
      </div>

      {/* Row 4: Shipping Address | Notes */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-md-6">
          <label className="form-label">Shipping Address</label>
          <textarea name="shipping_address" className="form-control" rows={2} value={form.shipping_address} onChange={handleChange}/>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Notes</label>
          <textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange}/>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 mt-2">
        <div className="d-flex justify-content-between align-items-center">
          <label className="form-label mb-0">Items</label>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItem}>+ Add Item</button>
        </div>
        <div className="table-responsive" style={{maxHeight: 300, overflowY: 'auto'}}>
          <table className="table table-hover align-middle table-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '3ch' }}/>     {/* # */}
              <col />                               {/* Customer PN */}
              <col />                               {/* MPN * */}
              <col />                               {/* Manufacturer */}
              <col style={{ width: '12ch' }} />    {/* Qty * */}
              <col style={{ width: '12ch' }} />    {/* Price * */}
              <col />                               {/* Line Total */}
              <col style={{ width: '12ch' }} />    {/* Date Code */}
              <col />                               {/* Requested Date */}
              <col />                               {/* Source */}
              <col />                               {/* Notes */}
              <col style={{ width: '25ch' }} />    {/* Status */}
              <col style={{ width: '44px' }} />    {/* X */}
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer PN</th>
                <th>MPN *</th>
                <th>Manufacturer</th>
                <th>Qty *</th>
                <th>Price *</th>
                <th>Line Total</th>
                <th>Date Code</th>
                <th>Requested Date</th>
                <th>Source</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id ?? `new-${idx}`}>
                  <th scope="row">{idx+1}</th>
                  <td><input className="form-control form-control-sm" value={it.customer_part_number} onChange={e=>handleItemChange(idx,'customer_part_number', e.target.value)}/></td>
                  <td><input className={`form-control form-control-sm ${submitAttempted && !it.mpn ? 'is-invalid':''}`} value={it.mpn} onChange={e=>handleItemChange(idx,'mpn', e.target.value)}/></td>
                  <td><input className="form-control form-control-sm" value={it.manufacturer} onChange={e=>handleItemChange(idx,'manufacturer', e.target.value)}/></td>
                  <td><input type="number" className={`form-control form-control-sm ${submitAttempted && (!it.qty_ordered || it.qty_ordered<=0)? 'is-invalid':''}`} value={it.qty_ordered || ''} onChange={e=>handleItemChange(idx,'qty_ordered', e.target.value)}/></td>
                  <td><input type="number" step="0.0001" className={`form-control form-control-sm ${submitAttempted && (it.unit_price===""||it.unit_price===null||isNaN(it.unit_price))? 'is-invalid':''}`} value={it.unit_price ?? ''} onChange={e=>handleItemChange(idx,'unit_price', e.target.value)}/></td>
                  <td><input type="text" className="form-control form-control-sm" value={((Number(it.qty_ordered)||0) * (Number(it.unit_price)||0)).toFixed(4)} readOnly tabIndex={-1} /></td>
                  <td><input className="form-control form-control-sm" value={it.date_code} onChange={e=>handleItemChange(idx,'date_code', e.target.value)}/></td>
                  <td><input type="date" className="form-control form-control-sm" value={it.requested_date || ''} onChange={e=>handleItemChange(idx,'requested_date', e.target.value)}/></td>
                  <td><input className="form-control form-control-sm" value={it.source} onChange={e=>handleItemChange(idx,'source', e.target.value)}/></td>
                  <td><input className="form-control form-control-sm" value={it.notes} onChange={e=>handleItemChange(idx,'notes', e.target.value)}/></td>
                  <td>
                    <select className="form-select form-select-sm" value={it.status} onChange={e=>handleItemChange(idx,'status', e.target.value)}>
                      <option value="new">new</option>
                      <option value="reserved">reserved</option>
                      <option value="awaiting">awaiting</option>
                      <option value="picked">picked</option>
                      <option value="shipped">shipped</option>
                      <option value="cancelled">cancelled</option>
                      <option value="returned">returned</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => removeItem(idx)}>&times;</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td colSpan={13} className="text-center text-muted">No items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal-footer mt-2">
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
};

export default EditOrderModal;
