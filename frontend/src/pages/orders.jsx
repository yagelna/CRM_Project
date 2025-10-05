import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import axiosInstance from "../AxiosInstance";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { showToast } from '../components/common/toast';
import OrderModal from '../components/orders/OrderModal';

ModuleRegistry.registerModules([AllCommunityModule]);

const Orders = () => {
    // Filters
    const [orderStatus, setOrderStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [company, setCompany] = useState(""); // company ID (string/number)
    const [contact, setContact] = useState(""); // contact ID
    const [createdFrom, setCreatedFrom] = useState(""); // YYYY-MM-DD
    const [createdTo, setCreatedTo] = useState("");

    // Data
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    
    const gridRef = useRef();
    const myTheme = themeQuartz.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#5A34F1",
    });

    // // Helper: map status/payment to Bootstrap badges
    const StatusBadge = ({ value, map = {} }) => {
        if (!value) return null;
        const variant = map[value] || "secondary";
        return <span className={`badge text-bg-${variant}`}>{value}</span>;
    };

    const ORDER_STATUS_TO_BOOTSTRAP = {
        new: "primary",
        awaiting_payment: "secondary",
        processing: "warning",
        shipped: "info",
        completed: "success",
        cancelled: "danger",
        returned: "dark",
        refunded: "info",
    };

    const PAYMENT_STATUS_TO_BOOTSTRAP = {
        unpaid: "secondary",
        partial: "warning",
        paid: "success",
        refunded: "info",
    };

    const colDefs = useMemo(
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
                // valueFormatter: (p) => formatMoney(p.value),
            },
            {
                field: "created_at",
                headerName: "Created",
                width: 150,
                valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
                sort: "desc",
            },
        ],
        []
    );

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (orderStatus) params.set("status", orderStatus);
        if (paymentStatus) params.set("payment_status", paymentStatus);
        if (company) params.set("company", company);
        if (contact) params.set("contact", contact);
        if (createdFrom) params.set("created_from", createdFrom);
        if (createdTo) params.set("created_to", createdTo);
        return params.toString();
    };

    const fetchOrders = useCallback(async () => {
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
        console.log("Fetched orders:", shaped);
        console.log("Data:", data);
        } catch (err) {
        console.error(err);
        showToast("Error fetching orders: " + (err?.response?.data?.detail || err.message), "danger");
        }
    }, [orderStatus, paymentStatus, company, contact, createdFrom, createdTo]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center mb-2">
  <h3 className="m-0">Orders</h3>
  <button type="button" className="btn btn-primary ms-auto" data-bs-toggle="modal" data-bs-target="#orderModal" onClick={() => setSelectedOrder(null)}>
    + Create Order
  </button>
</div>


      <div className="ag-theme-quartz" style={{ height: "50vh", width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={orders}
          columnDefs={colDefs}
          defaultColDef={{filter: true, flex: 1}}
          animateRows
          rowSelection="single"
          onRowDoubleClicked={(e) => onOpenOrder(e.data)}
        />
      </div>
    <OrderModal id="orderModal" order={selectedOrder} handleUpdateOrders={fetchOrders} />

    </div>
  );

}


export default Orders;