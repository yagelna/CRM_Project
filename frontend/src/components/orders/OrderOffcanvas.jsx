// src/components/orders/OrderOffcanvas.jsx
import React, { useMemo } from 'react';
import { showToast } from '../common/toast';
import EditOrderModal from './EditOrderModal';

const STATUS_BADGES = {
    new: 'primary',
    awaiting_payment: 'secondary',
    processing: 'warning',
    shipped: 'info',
    completed: 'success',
    cancelled: 'danger',
    returned: 'dark',
    refunded: 'info',
};

const PAYMENT_BADGES = {
    unpaid: 'secondary',
    partial: 'warning',
    paid: 'success',
    refunded: 'info',
};

function fmtMoney(v, digits = 2) {
    if (v === null || v === undefined || v === '') return '';
    const num = Number(v);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString();
}

function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString();
}

const OrderOffcanvas = ({ id = 'OrderOffcanvas', order, onClose, refresh }) => {
    const itemCount = order?.items?.length || 0;

    const totals = useMemo(() => ({
        sub_total: order?.sub_total ?? 0,
        discount_total: order?.discount_total ?? 0,
        tax_total: order?.tax_total ?? 0,
        shipping_total: order?.shipping_total ?? 0,
        grand_total: order?.grand_total ?? 0,
    }), [order]);

    return (
        <div className="offcanvas offcanvas-end lg-offcanvas" tabIndex="-1" id={id} aria-labelledby={`${id}Label`}>
            <div className="offcanvas-header">
                <h5 className="offcanvas-title" id={`${id}Label`}>
                    {order ? `Order ${order.order_number || `#${order.id}`}` : 'Loading…'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" onClick={onClose} />
            </div>

            <div className="offcanvas-body">
                {!order ? (
                    <div className="text-center mt-4">Loading…</div>
                ) : (
                    <>
                        {/* Row 1: Details + Summary */}
                        <div className="row align-items-stretch mb-4">
                            {/* Order Details */}
                            <div className="col-md-8 d-flex">
                                <div className="card border-1 shadow-sm mb-3 w-100 h-100">
                                    <div className="card-body">
                                        <h5 className="mb-3">Order Details</h5>

                                        <div className="row g-3">
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Company</div>
                                                <div className="fw-bold">{order.company_name || '—'}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Contact</div>
                                                <div className="fw-bold">{order.contact_name || '—'}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Customer Order #</div>
                                                <div className="fw-bold">{order.customer_order_number || '—'}</div>
                                            </div>

                                            <div className="col-sm-4">
                                                <div className="text-muted small">Status</div>
                                                <span className={`badge text-bg-${STATUS_BADGES[order.status] || 'secondary'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Payment</div>
                                                <span className={`badge text-bg-${PAYMENT_BADGES[order.payment_status] || 'secondary'}`}>
                                                    {order.payment_status}
                                                </span>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Currency</div>
                                                <div className="fw-bold">{order.currency}</div>
                                            </div>

                                            <div className="col-sm-4">
                                                <div className="text-muted small">Created</div>
                                                <div>{fmtDateTime(order.created_at)}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Updated</div>
                                                <div>{fmtDateTime(order.updated_at)}</div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="text-muted small">Items</div>
                                                <div className="fw-bold">{itemCount}</div>
                                            </div>

                                            <div className="col-sm-12">
                                                <div className="text-muted small">Shipping Address</div>
                                                <div className="preserve-newlines">{order.shipping_address || <span className="text-muted">None</span>}</div>
                                            </div>

                                            <div className="col-sm-12">
                                                <div className="text-muted small">Notes</div>
                                                <div className="preserve-newlines">{order.notes || <span className="text-muted">None</span>}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="col-md-4">
                                <div className="card border-1 shadow-sm mb-3 h-100">
                                    <div className="card-body">
                                        <h5 className="mb-3">Summary</h5>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-muted">Subtotal</span>
                                                <span className="fw-bold">{fmtMoney(totals.sub_total)}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-muted">Discount</span>
                                                <span className="fw-bold">-{fmtMoney(totals.discount_total)}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-muted">Tax</span>
                                                <span className="fw-bold">{fmtMoney(totals.tax_total)}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-muted">Shipping</span>
                                                <span className="fw-bold">{fmtMoney(totals.shipping_total)}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                <span className="fw-bold">Grand Total</span>
                                                <span className="fw-bold fs-5">{fmtMoney(totals.grand_total)}</span>
                                            </li>

                                            {/* Quick Actions */}
                                            <li className="list-group-item mt-2">
                                                <div className="fw-bold mb-2">Quick Actions</div>
                                                <div className="d-grid gap-2">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText(order.order_number || `${order.id}`).then(
                                                                () => showToast({ type: 'info', title: 'Copied', message: 'Order number copied' }),
                                                                () => showToast({ type: 'warning', title: 'Clipboard', message: 'Could not copy' })
                                                            );
                                                        }}
                                                    >
                                                        Copy Order #
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#editOrderModal"
                                                    >
                                                        Edit Order
                                                    </button>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="card border-1 shadow-sm">
                            <div className="card-body">
                                <h5 className="mb-3">Items</h5>
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Customer PN</th>
                                                <th>MPN</th>
                                                <th>Manufacturer</th>
                                                <th>Description</th>
                                                <th className="text-end">Qty</th>
                                                <th className="text-end">Unit Price</th>
                                                <th className="text-end">Line Subtotal</th>
                                                <th>Date Code</th>
                                                <th>Requested Date</th>
                                                <th>Source</th>
                                                <th>Status</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(order.items || []).map((it, idx) => (
                                                <tr key={it.id || idx}>
                                                    <td>{idx + 1}</td>
                                                    <td>{it.customer_part_number || ''}</td>
                                                    <td className="fw-semibold">{it.mpn}</td>
                                                    <td>{it.manufacturer}</td>
                                                    <td>{it.description}</td>
                                                    <td className="text-end">{it.qty_ordered}</td>
                                                    <td className="text-end">{fmtMoney(it.unit_price, 4)}</td>
                                                    <td className="text-end">{fmtMoney(it.line_subtotal, 2)}</td>
                                                    <td>{it.date_code}</td>
                                                    <td>{fmtDate(it.requested_date)}</td>
                                                    <td>{it.source}</td>
                                                    <td>
                                                        <span className={`badge text-bg-${STATUS_BADGES[it.status] || 'secondary'}`}>{it.status}</span>
                                                    </td>
                                                    <td style={{ maxWidth: 240, whiteSpace: 'pre-wrap' }}>{it.notes}</td>
                                                </tr>
                                            ))}
                                            {itemCount === 0 && (
                                                <tr>
                                                    <td colSpan={13} className="text-center text-muted">No items</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderOffcanvas;
