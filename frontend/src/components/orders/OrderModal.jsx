import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const OrderModal = ({ id = "orderModal" }) => {
    const [form, setForm] = useState(getEmptyForm());
    const [items, setItems] = useState([]);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        // Reset form when modal is opened
        const modalElement = document.getElementById(id);
        const resetForm = () => {
            setForm(getEmptyForm());
            setItems([]);
        }
        if (modalElement) {
            modalElement.addEventListener("show.bs.modal", resetForm);
        }
        return () => {
            if (modalElement) {
                modalElement.removeEventListener("show.bs.modal", resetForm);
            }
        };
    }, [id]);

    const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: ["company", "contact"].includes(name)
        ? value === "" ? "" : Number(value)
        : value,
    }));
  };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await axiosInstance.post('/orders/upload_po/', formData);
            if (data?.form) {
                setForm((f) => ({ ...f, ...data.form }));
            }
            if (data?.items) {
                setItems(data.items);
            }
            showToast({
                title: "AI Assistant",
                message: "PO file processed successfully.",
                type: "info",
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            showToast({
                title: "Error",
                message: "Failed to process PO file.",
                type: "danger",
            });
        } finally {
            setUploading(false);
            e.target.value = null; // Reset file input
        }
    };

    const saveOrder = async () => {
        if (!form.company) {
            showToast({
                title: "Missing Information",
                message: "Company is required.",
                type: "danger",
            });
            return;
        }
        setSaving(true);
        try {
            const body = { 
                ...form,
                items_payload: items.map((it) => ({
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
                    })),
                };

            const { data } = await axiosInstance.post('/api/orders/', body);
            showToast({
                title: "Order Created",
                message: `Order #${data.order_number} created successfully.`,
                type: "success",
            });
        } catch (error) {
            console.error("Error saving order:", error);
            showToast({
                title: "Save Failed",
                message: "Failed to create order.",
                type: "danger",
            });
        } finally {
            setSaving(false);
        }
    };

    function getEmptyForm() {
        return {
            company: "",
            contact: "",
            currency: "USD",
            status: "new",
            payment_status: "unpaid",
            shipping_address: "",
            notes: "",
        };
    }

    return (
        <>
            <Modal id={id} title={"Create New Order"} size="modal-xl">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Company (ID) *</label>
                        <input name="company" className="form-control" value={form.company} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Contact (ID)</label>
                        <input name="contact" className="form-control" value={form.contact} onChange={handleChange} />
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

                    <div className="col-12">
  <label className="form-label">Upload PO file</label>
  <div
    className="border rounded p-3 text-center bg-primary bg-opacity-10"
    style={{ cursor: 'pointer' }}
    onClick={() => document.getElementById("fileInput").click()}
    onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
    }}
    onDrop={(e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        setSelectedFile(e.dataTransfer.files[0]);
      }
    }}
  >
    {selectedFile ? selectedFile.name : "Drag & drop or click to select a file"}
  </div>
  <input
    id="fileInput"
    type="file"
    className="d-none"
    accept=".pdf,.xls,.xlsx,.csv,.txt,.docx,.html"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    }}
  />
  <button
    type="button"
    className="btn btn-outline-primary mt-2"
    onClick={handleUpload}
    disabled={!selectedFile || uploading}
  >
    {uploading ? "Processing..." : "Extract Data from PO"}
  </button>
</div>
                </div>

                <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={saveOrder} disabled={saving}>
                        {saving ? "Saving..." : "Create Order"}
                    </button>
                </div>
            </Modal>
        </>
    );
}

export default OrderModal;