import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import axiosInstance from "../AxiosInstance";

// --- Bootstrap ---
// Make sure Bootstrap CSS is loaded globally in your app (index.html or root).

/**
 * Orders.jsx — CRUD בסיסי + תצוגת פריטים (Offcanvas)
 *
 * Highlights:
 * - AG-Grid with quick filters (status/payment/company/date range)
 * - Server fetch with query params that mirror the backend API
 * - Row click opens an Offcanvas with order details + items
 * - Minimal Create/Edit/Delete hooks (stubs) — ready to wire to modal
 * - Recalc Totals action
 *
 * Notes:
 * - The API client below will use window.CONFIG.API_BASE_URL if present, otherwise "" (relative).
 * - If you have an existing axiosInstance (with auth headers), replace api with that instance.
 */


// Helper: map status/payment to Bootstrap badges
const StatusBadge = ({ value, map = {} }) => {
  if (!value) return null;
  const variant = map[value] || "secondary";
  return <span className={`badge text-bg-${variant}`}>{value}</span>;
};

const ORDER_STATUS_TO_BOOTSTRAP = {
  new: "primary",
  processing: "warning",
  shipped: "info",
  completed: "success",
  cancelled: "danger",
  returned: "dark",
};

const PAYMENT_STATUS_TO_BOOTSTRAP = {
  unpaid: "secondary",
  partial: "warning",
  paid: "success",
  refunded: "info",
};

function formatMoney(num) {
  if (num == null || num === "") return "-";
  try {
    const n = Number(num);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return String(num);
  }
}

function toDateOnly(str) {
  if (!str) return "";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// =====================
// Order Modal + Items Editor
// =====================
function ItemEditorModal({ show, onClose, onSave, initial }) {
  const [form, setForm] = useState(() => ({
    id: initial?.id || null,
    mpn: initial?.mpn || "",
    manufacturer: initial?.manufacturer || "",
    description: initial?.description || "",
    qty_ordered: initial?.qty_ordered ?? 1,
    unit_price: initial?.unit_price ?? 0,
    status: initial?.status || "new",
    date_code: initial?.date_code || "",
    source: initial?.source || "",
    requested_date: initial?.requested_date || "",
    notes: initial?.notes || "",
  }));

  useEffect(() => {
    if (show) {
      setForm({
        id: initial?.id || null,
        mpn: initial?.mpn || "",
        manufacturer: initial?.manufacturer || "",
        description: initial?.description || "",
        qty_ordered: initial?.qty_ordered ?? 1,
        unit_price: initial?.unit_price ?? 0,
        status: initial?.status || "new",
        date_code: initial?.date_code || "",
        source: initial?.source || "",
        requested_date: initial?.requested_date || "",
        notes: initial?.notes || "",
      });
    }
  }, [show, initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "qty_ordered" ? Number(value) : name === "unit_price" ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // minimal validation
    if (!form.mpn?.trim()) return alert("MPN is required");
    if (!form.qty_ordered || form.qty_ordered <= 0) return alert("Quantity must be > 0");
    if (form.unit_price == null || isNaN(form.unit_price)) return alert("Unit price is required");
    onSave({ ...form });
  };

  return (
    <div className={`modal ${show ? "d-block" : ""}`} tabIndex="-1" style={{ background: show ? "rgba(0,0,0,.4)" : "transparent" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{form.id ? "Edit Item" : "Add Item"}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">MPN *</label>
                  <input name="mpn" className="form-control" value={form.mpn} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Manufacturer</label>
                  <input name="manufacturer" className="form-control" value={form.manufacturer} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                    <option value="new">new</option>
                    <option value="reserved">reserved</option>
                    <option value="awaiting">awaiting</option>
                    <option value="picked">picked</option>
                    <option value="shipped">shipped</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <input name="description" className="form-control" value={form.description} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Qty *</label>
                  <input name="qty_ordered" type="number" min={1} className="form-control" value={form.qty_ordered} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Unit Price *</label>
                  <input name="unit_price" type="number" step="0.01" className="form-control" value={form.unit_price} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Date Code</label>
                  <input name="date_code" className="form-control" value={form.date_code} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Source</label>
                  <input name="source" className="form-control" value={form.source} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Requested Date (YYYY-MM-DD)</label>
                  <input name="requested_date" type="date" className="form-control" value={form.requested_date} onChange={handleChange} />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Notes</label>
                  <input name="notes" className="form-control" value={form.notes} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Item</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ show, onClose, order, onSaved }) {
  const isEdit = Boolean(order?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    id: order?.id || null,
    company: order?.company || "",
    contact: order?.contact ?? "",
    currency: order?.currency || "USD",
    status: order?.status || "new",
    payment_status: order?.payment_status || "unpaid",
    shipping_address: order?.shipping_address || "",
    notes: order?.notes || "",
  }));
  const [items, setItems] = useState(() => (order?.items || []).map((it) => ({ ...it })));

  useEffect(() => {
    if (show) {
      setForm({
        id: order?.id || null,
        company: order?.company || "",
        contact: order?.contact ?? "",
        currency: order?.currency || "USD",
        status: order?.status || "new",
        payment_status: order?.payment_status || "unpaid",
        shipping_address: order?.shipping_address || "",
        notes: order?.notes || "",
      });
      setItems((order?.items || []).map((it) => ({ ...it })));
    }
  }, [show, order]);

  const [itemEditorOpen, setItemEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const openAddItem = () => { setEditingItem(null); setItemEditorOpen(true); };
  const openEditItem = (row) => { setEditingItem(row); setItemEditorOpen(true); };

  const upsertItem = (it) => {
    setItems((prev) => {
      if (it.id) {
        return prev.map((p) => (p.id === it.id ? { ...p, ...it } : p));
      }
      // local key to avoid duplicate keys in UI when id missing
      return [...prev, { ...it, _localKey: Math.random().toString(36).slice(2) }];
    });
    setItemEditorOpen(false);
  };

  const removeItem = (row) => {
    if (!window.confirm(`Remove item ${row.mpn}?`)) return;
    setItems((prev) => prev.filter((p) => (row.id ? p.id !== row.id : p._localKey !== row._localKey)));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "company" || name === "contact" ? (value === "" ? "" : Number(value)) : value }));
  };

  const payloadFromState = () => {
    const items_payload = items.map((it) => {
      const out = {
        mpn: it.mpn,
        manufacturer: it.manufacturer || "",
        description: it.description || "",
        qty_ordered: Number(it.qty_ordered),
        unit_price: Number(it.unit_price),
        status: it.status || "new",
        date_code: it.date_code || "",
        source: it.source || "",
        requested_date: it.requested_date || "",
        notes: it.notes || "",
      };
      if (it.id) out.id = it.id; // include id only if exists
      return out;
    });

    const body = {
      company: form.company ? Number(form.company) : null,
      contact: form.contact === "" ? null : Number(form.contact),
      currency: form.currency,
      status: form.status,
      payment_status: form.payment_status,
      shipping_address: form.shipping_address || "",
      notes: form.notes || "",
      items_payload,
    };
    return body;
  };

  const saveOrder = async () => {
    // minimal validation
    if (!form.company) return alert("Company ID is required");
    if (!items.length) {
      if (!window.confirm("No items added. Create/Update anyway?")) return;
    }
    setSaving(true);
    try {
      const body = payloadFromState();
      let resp;
      if (isEdit) {
        resp = await axiosInstance.patch(`/api/orders/${form.id}/`, body);
      } else {
        resp = await axiosInstance.post(`/api/orders/`, body);
      }
      onSaved?.(resp.data);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`modal ${show ? "d-block" : ""}`} tabIndex="-1" style={{ background: show ? "rgba(0,0,0,.4)" : "transparent" }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEdit ? `Edit Order ${order?.order_number || ""}` : "New Order"}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Company (ID) *</label>
                  <input name="company" className="form-control" value={form.company} onChange={handleChange} placeholder="e.g. 2" />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Contact (ID)</label>
                  <input name="contact" className="form-control" value={form.contact} onChange={handleChange} placeholder="optional" />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Currency</label>
                  <select name="currency" className="form-select" value={form.currency} onChange={handleChange}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ILS">ILS</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                    <option value="new">new</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="returned">returned</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Payment</label>
                  <select name="payment_status" className="form-select" value={form.payment_status} onChange={handleChange}>
                    <option value="unpaid">unpaid</option>
                    <option value="partial">partial</option>
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Shipping Address</label>
                  <textarea name="shipping_address" className="form-control" rows={2} value={form.shipping_address} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Notes</label>
                  <textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} />
                </div>
              </div>

              <hr className="my-3" />
              <div className="d-flex align-items-center mb-2">
                <h6 className="m-0">Items</h6>
                <button className="btn btn-sm btn-success ms-auto" onClick={openAddItem}>+ Add item</button>
              </div>

              <div className="table-responsive" style={{ maxHeight: 300, overflowY: "auto" }}>
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>MPN</th>
                      <th>Manufacturer</th>
                      <th>Description</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Unit</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-muted">No items</td></tr>
                    )}
                    {items.map((it) => (
                      <tr key={it.id || it._localKey}>
                        <td>{it.mpn}</td>
                        <td>{it.manufacturer}</td>
                        <td className="text-truncate" style={{maxWidth:240}}>{it.description}</td>
                        <td className="text-end">{it.qty_ordered}</td>
                        <td className="text-end">{formatMoney(it.unit_price)}</td>
                        <td>{it.status}</td>
                        <td>{it.requested_date ? toDateOnly(it.requested_date) : ""}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-secondary" onClick={() => openEditItem(it)}>Edit</button>
                            <button className="btn btn-outline-danger" onClick={() => removeItem(it)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveOrder} disabled={saving}>{saving ? "Saving..." : (isEdit ? "Save changes" : "Create order")}</button>
            </div>
          </div>
        </div>
      </div>

      <ItemEditorModal show={itemEditorOpen} onClose={() => setItemEditorOpen(false)} onSave={upsertItem} initial={editingItem} />
    </>
  );
}

export default function Orders() {
  // Filters
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [company, setCompany] = useState(""); // company ID (string/number)
  const [contact, setContact] = useState(""); // contact ID
  const [createdFrom, setCreatedFrom] = useState(""); // YYYY-MM-DD
  const [createdTo, setCreatedTo] = useState("");

  // Data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Offcanvas
  const [activeOrder, setActiveOrder] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Grid refs
  const gridRef = useRef();

  const columnDefs = useMemo(
    () => [
      { field: "order_number", headerName: "Order #", filter: true, width: 160 },
      { field: "company_name", headerName: "Company", filter: true, flex: 1, minWidth: 160 },
      { field: "contact_name", headerName: "Contact", filter: true, flex: 1, minWidth: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        filter: true,
        cellRenderer: (p) => <StatusBadge value={p.value} map={ORDER_STATUS_TO_BOOTSTRAP} />,
      },
      {
        field: "payment_status",
        headerName: "Payment",
        width: 140,
        filter: true,
        cellRenderer: (p) => <StatusBadge value={p.value} map={PAYMENT_STATUS_TO_BOOTSTRAP} />,
      },
      { field: "currency", headerName: "Curr", width: 90 },
      {
        field: "grand_total",
        headerName: "Grand Total",
        width: 150,
        valueFormatter: (p) => formatMoney(p.value),
      },
      {
        field: "created_at",
        headerName: "Created",
        width: 150,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
        sort: "desc",
      },
      {
        headerName: "Actions",
        width: 220,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-primary" onClick={() => onOpenOrder(p.data)}>Open</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(p.data)}>Edit</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p.data)}>Delete</button>
          </div>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (paymentStatus) params.set("payment_status", paymentStatus);
    if (company) params.set("company", company);
    if (contact) params.set("contact", contact);
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);
    return params.toString();
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery();
      const url = qs ? `/api/orders/?${qs}` : "/api/orders/";
      const { data } = await axiosInstance.get(url);

      const shaped = data.map((o) => ({
        ...o,
        company_name: o.company_name || o.company?.name || o.company || "",
        contact_name: o.contact_name || o.contact?.name || o.contact || "",
      }));

      setOrders(shaped);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [status, paymentStatus, company, contact, createdFrom, createdTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onOpenOrder = (row) => setActiveOrder(row);

  const onEdit = (row) => {
    setEditingOrder(row ? row : { id: null, items: [], status: "new", payment_status: "unpaid", currency: "USD" });
    setShowModal(true);
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    if (!window.confirm(`Delete order ${row.order_number}?`)) return;
    try {
      await axiosInstance.delete(`/api/orders/${row.id}/`);
      fetchOrders();
      if (activeOrder?.id === row.id) setActiveOrder(null);
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || "Failed to delete");
    }
  };

  const onRecalcTotals = async (orderId) => {
    try {
      await axiosInstance.post(`/api/orders/${orderId}/recalc-totals/`);
      await fetchOrders();
      if (activeOrder?.id === orderId) {
        const updated = (orders || []).find((o) => o.id === orderId);
        if (updated) setActiveOrder(updated);
      }
    } catch (err) {
      alert(err?.response?.data?.detail || err.message || "Failed to recalc totals");
    }
  };

  const clearFilters = () => {
    setStatus("");
    setPaymentStatus("");
    setCompany("");
    setContact("");
    setCreatedFrom("");
    setCreatedTo("");
  };

  const Toolbar = () => (
    <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
      <div>
        <label className="form-label mb-1">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="new">new</option>
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
          <option value="returned">returned</option>
        </select>
      </div>

      <div>
        <label className="form-label mb-1">Payment</label>
        <select className="form-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All</option>
          <option value="unpaid">unpaid</option>
          <option value="partial">partial</option>
          <option value="paid">paid</option>
          <option value="refunded">refunded</option>
        </select>
      </div>

      <div>
        <label className="form-label mb-1">Company (ID)</label>
        <input className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. 2" />
      </div>

      <div>
        <label className="form-label mb-1">Contact (ID)</label>
        <input className="form-control" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. 15" />
      </div>

      <div>
        <label className="form-label mb-1">Created from</label>
        <input type="date" className="form-control" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
      </div>

      <div>
        <label className="form-label mb-1">Created to</label>
        <input type="date" className="form-control" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
      </div>

      <div className="ms-auto d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={clearFilters}>נקה סינון</button>
        <button className="btn btn-primary" onClick={fetchOrders} disabled={loading}>
          {loading ? "טוען..." : "רענן"}
        </button>
        <button className="btn btn-success" onClick={() => onEdit(null)}>
          + הזמנה חדשה
        </button>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center mb-2">
        <h3 className="m-0">Orders</h3>
      </div>

      <Toolbar />

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="ag-theme-quartz" style={{ height: "50vh", width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={orders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows
          rowSelection="single"
          onRowDoubleClicked={(e) => onOpenOrder(e.data)}
        />
      </div>

      {/* Offcanvas: Order details + items */}
      <div className="offcanvas offcanvas-end show" tabIndex="-1" style={{ visibility: activeOrder ? "visible" : "hidden", width: 520 }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{activeOrder ? `Order ${activeOrder.order_number}` : ""}</h5>
          <button type="button" className="btn-close" onClick={() => setActiveOrder(null)}></button>
        </div>
        <div className="offcanvas-body">
          {!activeOrder ? (
            <div className="text-muted">בחר שורה לצפייה בפרטי ההזמנה</div>
          ) : (
            <>
              <div className="d-flex flex-column gap-1 mb-3">
                <div><strong>Company:</strong> {activeOrder.company_name || "-"}</div>
                <div><strong>Contact:</strong> {activeOrder.contact_name || "-"}</div>
                <div><strong>Status:</strong> <StatusBadge value={activeOrder.status} map={ORDER_STATUS_TO_BOOTSTRAP} /></div>
                <div><strong>Payment:</strong> <StatusBadge value={activeOrder.payment_status} map={PAYMENT_STATUS_TO_BOOTSTRAP} /></div>
                <div><strong>Totals:</strong> {activeOrder.currency || ""} {formatMoney(activeOrder.grand_total)}</div>
                <div><strong>Created:</strong> {new Date(activeOrder.created_at).toLocaleString()}</div>
              </div>

              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(activeOrder)}>Edit</button>
                <button className="btn btn-outline-primary btn-sm" onClick={() => onRecalcTotals(activeOrder.id)}>Recalc totals</button>
              </div>

              <h6 className="mt-3">Items</h6>
              <div className="table-responsive" style={{ maxHeight: 260, overflowY: "auto" }}>
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>MPN</th>
                      <th>Manufacturer</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Unit</th>
                      <th className="text-end">Subtotal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeOrder.items || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">No items</td>
                      </tr>
                    )}
                    {(activeOrder.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.mpn}</td>
                        <td>{it.manufacturer}</td>
                        <td className="text-end">{it.qty_ordered}</td>
                        <td className="text-end">{formatMoney(it.unit_price)}</td>
                        <td className="text-end">{formatMoney(it.line_subtotal)}</td>
                        <td><StatusBadge value={it.status} map={{ new: "secondary", reserved: "primary", awaiting: "warning", picked: "info", shipped: "success", cancelled: "danger" }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeOrder.notes && (
                <div className="mt-3">
                  <h6>Notes</h6>
                  <div className="border rounded p-2 bg-light" style={{ whiteSpace: "pre-wrap" }}>{activeOrder.notes}</div>
                </div>
              )}

              {activeOrder.shipping_address && (
                <div className="mt-3">
                  <h6>Shipping address</h6>
                  <div className="border rounded p-2 bg-light" style={{ whiteSpace: "pre-wrap" }}>{activeOrder.shipping_address}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <OrderModal
        show={showModal}
        onClose={() => setShowModal(false)}
        order={editingOrder}
        onSaved={() => {
          fetchOrders();
          // try to keep offcanvas in sync if edited
          if (editingOrder?.id) {
            const updated = (orders || []).find((o) => o.id === editingOrder.id);
            if (updated) setActiveOrder(updated);
          }
        }}
      />
    </div>
  );
}

