import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';
import Select from 'react-select';

const OrderModal = ({ id = "orderModal", handleUpdateOrders }) => {
    const [form, setForm] = useState(getEmptyForm());
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [contactOptions, setContactOptions] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showShipping, setShowShipping] = useState(false);
    const [showHandling, setShowHandling] = useState(false);

    useEffect(() => {
        // Reset form when modal is opened
        const modalElement = document.getElementById(id);
        const resetForm = () => {
            setForm(getEmptyForm());
            setItems([]);
            setSelectedFile(null);
            setSubmitAttempted(false);
            setShowDiscount(false);
            setShowShipping(false);
            setShowHandling(false);
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

    useEffect(() => {
        // Fetch company options for select dropdown
        const fetchCompanies = async () => {
            try {
                const { data } = await axiosInstance.get('/api/companies/');
                const options = data.map(comp => ({ value: comp.id, label: comp.name }));
                setCompanyOptions(options);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Update contact options when company changes
        const fetchContacts = async () => {
            if (form.company) {
                try {
                    const { data } = await axiosInstance.get(`/api/companies/${form.company}/contacts/`);
                    const options = data.map(contact => ({ value: contact.id, label: contact.name }));
                    setContactOptions(options);
                } catch (error) {
                    console.error("Error fetching contacts:", error);
                }
            } else {
                setContactOptions([]);
            }
        };
        fetchContacts();
    }, [form.company, companyOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: ["company", "contact"].includes(name)
                ? value === "" ? "" : Number(value)
                : value,
        }));
    };

    const handleItemChange = (index, field, value) => {
        setItems((prevItems) => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
            return newItems;
        });
    };

    const handleAddItem = () => {
        setItems((prevItems) => [
            ...prevItems,
            {
                mpn: "",
                customer_part_number: "",
                manufacturer: "",
                description: "",
                qty_ordered: 0,
                unit_price: 0,
                status: "new",
                date_code: "",
                source: "",
                requested_date: "",
                notes: "",
            },
        ]);
    };

    const handleRemoveItem = (index) => {
        setItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const handleUpload = async (e) => {
        if (!selectedFile) {
            showToast({
                title: "No File Selected",
                message: "Please select a file to upload.",
                type: "warning",
            });
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
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
            setSelectedFile(null);
        }
    };

    const saveOrder = async () => {
        console.log("Saving order with data:", form, items);
        setSubmitAttempted(true);
        // Basic validation
        const hasMissingFormFields = !form.company;
        const hasInvalidItems = items.some
            (it => !it.mpn || !it.qty_ordered || !it.unit_price);
        if (hasMissingFormFields || hasInvalidItems) {
            showToast({
                title: "Validation Error",
                message: "Please fill all required fields and ensure items have MPN, Quantity, and Price.",
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

            const { data } = await axiosInstance.post('/api/orders/', body);
            handleUpdateOrders();
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
            const modalElement = document.getElementById(id);
            if (modalElement) {
                const modal = window.bootstrap.Modal.getInstance(modalElement);
                modal.hide();
            }
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
            customer_order_number: "",
            discount_total: 0,
            tax_total: 0,
            shipping_total: 0,
            handling_total: 0,
        };
    }

    return (
        <>
            <Modal id={id} title={"Create New Order"} size="modal-xl">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Company *</label>
                        <Select
                            name="company"
                            className="basic-single"
                            options={companyOptions}
                            value={companyOptions.find(option => option.value === form.company) || null}
                            onChange={(selectedOption) => {
                                setForm({ ...form, company: selectedOption.value });
                            }}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Contact</label>
                        <Select
                            name="contact"
                            className="basic-single"
                            options={contactOptions}
                            value={contactOptions.find(option => option.value === form.contact) || null}
                            onChange={(selectedOption) => {
                                setForm({ ...form, contact: selectedOption.value });
                            }}
                            isDisabled={!form.company}
                        />
                    </div>
                    <div className="col-md-2">
                        <label className="form-label">Customer Order #</label>
                        <input type="text" name="customer_order_number" className="form-control" value={form.customer_order_number} onChange={handleChange} />
                    </div>
                    </div>
                    <div className="row g-3 mt-1">
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
                    </div>
                    <div className="row g-3 mt-1">
                        <div className="col-md-6">
                            <label className="form-label">Shipping Address</label>
                            <textarea name="shipping_address" className="form-control" rows={2} value={form.shipping_address} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Notes</label>
                            <textarea name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} />
                        </div>
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
                    {/* Items */}
                    <div className="mb-3">
                        <label className="form-label">Items</label>
                        {/* table with very small text */}
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="table table-hover align-middle table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th> Customer PN</th>
                                        <th>MPN *</th>
                                        <th>Manufacturer</th>
                                        <th>Qty *</th>
                                        <th>Price *</th>
                                        <th>Date Code</th>
                                        <th>Requested Date</th>
                                        <th>Source</th>
                                        <th>Remarks</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <th scope="row">{index + 1}</th>
                                            <td>
                                                <input type="text" className="form-control form-control-sm"
                                                    value={item.customer_part_number}
                                                    onChange={(e) => handleItemChange(index, 'customer_part_number', e.target.value)} />
                                            </td>
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
                                                <input type="number" className={`form-control form-control-sm ${!item.qty_ordered && submitAttempted ? 'is-invalid' : ''}`}
                                                    value={item.qty_ordered || ''}
                                                    onChange={(e) => handleItemChange(index, 'qty_ordered', e.target.value)} />
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
                                                <input type="date" className="form-control form-control-sm"
                                                    value={item.requested_date}
                                                    onChange={(e) => handleItemChange(index, 'requested_date', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="text" className="form-control form-control-sm"
                                                    value={item.source}
                                                    onChange={(e) => handleItemChange(index, 'source', e.target.value)} />
                                            </td>
                                            <td>
                                                <input type="text" className="form-control form-control-sm"
                                                    value={item.remarks}
                                                    onChange={(e) => handleItemChange(index, 'remarks', e.target.value)} />
                                            </td>
                                            <td>
                                                <select className="form-select form-select-sm"
                                                    value={item.status}
                                                    onChange={(e) => handleItemChange(index, 'status', e.target.value)}>
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
                    <div className="col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="toggleDiscount" checked={showDiscount} onChange={() => setShowDiscount(!showDiscount)} />
                        <label className="form-check-label" htmlFor="toggleDiscount">Add Discount</label>
                        {showDiscount && (
                            <input
                                type="number"
                                name="discount_total"
                                className="form-control form-control-sm mt-2"
                                value={form.discount_total}
                                onChange={handleChange}
                                placeholder="Discount Amount"
                            />
                        )}
                    </div>
                    <div className="col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="toggleShipping" checked={showShipping} onChange={() => setShowShipping(!showShipping)} />
                        <label className="form-check-label" htmlFor="toggleShipping">Add Shipping</label>
                        {showShipping && (
                            <input
                                type="number"
                                name="shipping_total"
                                className="form-control form-control-sm mt-2"
                                value={form.shipping_total}
                                onChange={handleChange}
                                placeholder="Shipping Amount"
                            />
                        )}
                    </div>
                    <div className="col-md-4 form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="toggleHandling" checked={showHandling} onChange={() => setShowHandling(!showHandling)} />
                        <label className="form-check-label" htmlFor="toggleHandling">Add Handling Fee </label>
                        {showHandling && (
                            <input
                                type="number"
                                name="handling_total"
                                className="form-control form-control-sm mt-2"
                                value={form.handling_total}
                                onChange={handleChange}
                                placeholder="Handling Fee"
                            />
                        )}
                    </div>
                <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={saveOrder} disabled={saving} >
                        {saving ? "Saving..." : "Create Order"}
                    </button>
                </div>
            </Modal>
        </>
    );
}

export default OrderModal;