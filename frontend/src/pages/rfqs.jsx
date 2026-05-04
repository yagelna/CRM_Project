import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddRfqModal from '../components/rfqs/AddRfqModal';
import UploadBulkModal from '../components/rfqs/UploadBulkModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';
import StatusCellRenderer from '../components/rfqs/StatusCellRenderer';
import EmailModal from '../components/rfqs/EmailModal';
import BulkEmailModal from '../components/rfqs/BulkEmailModal';
import BulkEditModal from '../components/rfqs/BulkEditModal';
import Offcanvas from '../components/rfqs/RfqOffcanvas';
import { CONFIG } from '../config';
import { showToast } from '../components/common/toast';
import { Button } from 'react-bootstrap';

ModuleRegistry.registerModules([AllCommunityModule]);

const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [statusFilter, setStatusFilter] = useState(["pending"]);
    const [dateRange, setDateRange] = useState("14");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [autoFillData, setAutoFillData] = useState(null);
    const [colDefs, setColDefs] = useState([]);
    const gridRef = useRef();
    const abortControllerRef = useRef(null);
    const requestIdRef = useRef(0);
    const myTheme = themeQuartz
	.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#5A34F1",
        headerTextColor:"#ffffff",
    });

    const mobileColDefs = [
  {
    field: "mpn",
    headerName: "MPN",
    cellRenderer: (params) => (
        <a
            href="#offcanvasRight"
            data-bs-toggle="offcanvas"
            className="link-opacity-50-hover fw-medium"
            onClick={() => { setSelectedRfq(params.data) }}
        >
            {params.value}
        </a>
    ),
    flex: 1,
  },
  {
    field: "status",
    headerName: "Status",
    cellRenderer: "statusCellRenderer",
    flex: 1,
  },
];

    // delete rfq by id
    const handleDelete = async (ids) => {
        if (!ids) return;
        
        const isMultiple = Array.isArray(ids);
        const confirmed = window.confirm(`Are you sure you want to delete ${isMultiple ? ids.length : 1} item(s)?`);
        if (!confirmed) return;

        const url = isMultiple ? 'api/rfqs/bulk-delete/' : `api/rfqs/${ids}/`;
        const data = isMultiple ? { ids } : null;

        try {
            await axiosInstance.delete(url, { data });
            setRfqs((prevRfqs) => prevRfqs.filter((rfq) => isMultiple ? !ids.includes(rfq.id) : rfq.id !== ids));
            setSelectedRfq(null);
            fetchRfqs();
            setSelectedRows([]);
        } catch (error) {
            console.error('Error deleting rfq: ' + error);   
        }   

        // axiosInstance.delete(`api/rfqs/${ids}/`)    
        //     .then((response) => {
        //         console.log('Rfq deleted successfully');
        //         setRfqs((prevRfqs) => prevRfqs.filter((rfq) => isMultiple ? !ids.includes(rfq.id) : rfq.id !== ids));
        //         // fetchRfqs();
        //         setSelectedRfq(null);
        //     })
        //     .catch((error) => console.error('Error deleting rfq: ' + error));
    };

    const handleDeleteSelected = () => {
        console.log("delete selected rows");
        if(selectedRows.length > 0){
            const ids = selectedRows.map(row => row.id);
            handleDelete(ids);
        }
    };

    // Column Definitions: Defines & controls grid columns.
    useEffect(() => {
    const isMobile = window.innerWidth < 768; // או 576, אם אתה רוצה עוד יותר הדוק
    if (isMobile) {
        setColDefs(mobileColDefs);
    } else {
        setColDefs([
            {
                field: "id",
                headerName: "ID",
                width: 80,
                valueFormatter: (params) => '#'+ params.value.toString().padStart(5, '0'),
                filter: false
            },
            {
                field: "mpn",
                headerName: "MPN",
                cellRenderer: (params) => (
                    <a
                        href="#offcanvasRight"
                        data-bs-toggle="offcanvas"
                        className="link-opacity-50-hover fw-medium"
                        onClick={() => { setSelectedRfq(params.data) }}
                    >
                        {params.value}
                    </a>
                ),
                width: 200,
            },
            { field: "target_price", headerName: "TP", width: 80 },
            { field: "qty_requested", headerName: "QTY", width: 80 },
            { field: "manufacturer", headerName: "MFG", flex: 0.7 },
            { field: "stock_source", headerName: "Stock Source", flex: 1 },
            { field: "source", headerName: "RFQ Source", flex: 1 },
            { field: "contact_object.company_object.name", headerName: "Company", flex: 1 },
            { field: "contact_object.company_object.country", headerName: "Country", flex: 1 },
            { field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', hide: true },
            { field: "updated_at", headerName: "Updated At",flex: 1, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '' },
            {
                field: "status",
                headerName: "Status",
                cellRenderer: "statusCellRenderer",
                flex: 0.8,
            },
        ]);
    }
}, []);

    // const [colDefs, setColDefs] = useState([
    //     {
    //         field: "id",
    //         headerName: "ID",
    //         width: 80,
    //         valueFormatter: (params) => '#'+ params.value.toString().padStart(5, '0'),
    //         filter: false
    //     },
    //     {   field: "mpn",
    //         headerName: "MPN",
    //         cellRenderer: (params) => (
    //             <a
    //                 href="#offcanvasRight"
    //                 data-bs-toggle="offcanvas"
    //                 className="link-opacity-50-hover fw-medium"
    //                 onClick={() => { setSelectedRfq(params.data) }}
    //             >
    //                 {params.value}
    //             </a>
    //         ),
    //         width: 200,
    //     },
    //     {   field: "target_price", headerName: "TP", width: 80 },
    //     {   field: "qty_requested", headerName: "QTY", width: 80 },
    //     {   field: "manufacturer", headerName: "MFG", flex: 0.7 },
    //     {   field: "stock_source", headerName: "Stock Source", flex: 1 },
    //     {   field: "source", headerName: "RFQ Source", flex: 1 },
    //     // { field: "contact_object.name", headerName: "Contact Name" },
    //     {   field: "contact_object.company_object.name", headerName: "Company", flex: 1 },
    //     {   field: "contact_object.company_object.country", headerName: "Country", flex: 1 },
    //     {   field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', hide: true },
    //     {   field: "updated_at", headerName: "Updated At",flex: 1, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '' },
    //     { 
    //         field: "status",
    //         headerName: "Status",
    //         cellRenderer: "statusCellRenderer",
    //         flex: 0.8,
    //     },
    // ]);

    const onSelectionChanged = (event) =>{
        const selectedData = event.api.getSelectedRows();
        console.log("selection changed, " + selectedData.length + " rows selected");
        setSelectedRows(selectedData);
        console.log("selected rows: ", selectedRows);
    };

    const gridOptions = {   
        defaultColDef: {
            domLayout: 'normal',
        },
        enableCellTextSelection: true,
        rowSelection: {
            mode: 'multiRow',
            selectAll: 'filtered',
        },
        onSelectionChanged,
    };

    const overlayLoadingTemplate = `
        <div class="text-primary">
            <div class="spinner-grow spinner-grow-sm me-1" role="status"></div>
            <div class="spinner-grow spinner-grow-sm me-1" role="status"></div>
            <div class="spinner-grow spinner-grow-sm" role="status"></div>
            <br/><br/>
            Loading RFQs...
        </div>
    `;

    const overlayNoRowsTemplate = `
        <div class="text-muted">
            <i class="bi bi-inbox fs-3 d-block mb-2"></i>
            No RFQs found for the selected filters.
        </div>
    `;

    // fetch rfqs from the backend function with filters for status and date range
    const fetchRfqs = useCallback(async () => {
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setSelectedRows([]);
        setRfqs([]);

        const currentStatus = statusFilter.includes("all") ? "all" : statusFilter.join(",");
        const currentDateRange = dateRange;

        try {
            const response = await axiosInstance.get('api/rfqs/', {
                params: {
                    status: currentStatus,
                    date_range: currentDateRange,
                },
                signal: controller.signal,
            });

            if (requestId !== requestIdRef.current) return;

            setRfqs(response.data || []);
        } catch (error) {
            if (
                error.name === "CanceledError" ||
                error.name === "AbortError" ||
                error.code === "ERR_CANCELED"
            ) {
                return;
            }

            if (requestId === requestIdRef.current) {
                console.error('Error fetching rfqs: ' + error);
                setRfqs([]);
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        }
    }, [statusFilter, dateRange]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleMarkUnattractive = () => {
        const ids = selectedRows.map(row => row.id);
        const updates = { status: 'unattractive' };

        axiosInstance.patch('api/rfqs/bulk-edit/', { updates, ids })
            .then((response) => {
                showToast({
                    type: 'info',
                    title: 'RFQs Marked as Unattractive',
                    message: `Marked ${response.data.updated_count || ids.length} RFQs.`
                });
                fetchRfqs();
            })
            .catch((error) => {
                console.error('Error marking rfqs as unattractive: ' + error);
                showToast({
                    type: 'danger',
                    title: 'Update Failed',
                    message: error?.response?.data?.error || 'Something went wrong.'
                });
            });
    };

    useEffect(() => {
        fetchRfqs();
    }, [fetchRfqs]);

    useEffect(() => {
        // fetchRfqs();
        // WebSocket connection
        const ws = new WebSocket(CONFIG.WS_BASE_URL);

        ws.onopen = () => {
            console.log('Websocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("New data received via websocket: ", data);
            fetchRfqs();
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        const emailModal = document.getElementById('SendEmailModal');

        const handleModalClose = () => {
            setAutoFillData(null);
        };

        if (emailModal) {
            emailModal.addEventListener('hidden.bs.modal', handleModalClose);
        }

        return () => {
            ws.close();

            if (emailModal) {
                emailModal.removeEventListener('hidden.bs.modal', handleModalClose);
            }
        };
    }, [fetchRfqs]);


    //update rfqs state after adding or editing an rfq
    const handleUpdateRfqs = (updatedRfq, mode) => { 
        if (mode === 'create') {
            setRfqs((prevRfqs) => [...prevRfqs, updatedRfq]);
        } else if (mode === 'edit') {
            setRfqs((prevRfqs) =>
                prevRfqs.map((rfq) => (rfq.id === updatedRfq.id ? updatedRfq : rfq))
            );
            if (selectedRfq && selectedRfq.id === updatedRfq.id) {
                setSelectedRfq(updatedRfq);
            }
        }
    };

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current.api.setGridOption(
          "quickFilterText",
          document.getElementById("filter-text-box").value,
        );
      }, []);

    return (
        <div className='module-container'>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h2 className="mb-2">Rfqs</h2>
                    <p className="text-muted">Manage your requests for quotes (RFQs) </p>
                </div>
                <button 
                    type="button" 
                    className="btn btn-primary me-2 " 
                    data-bs-toggle="modal" 
                    data-bs-target="#addRfqModal">
                    + Add RFQ
                </button>
            </div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

        {/* LEFT SIDE */}
        <div className="d-flex flex-wrap align-items-center gap-2">
            <input
                type="text"
                id="filter-text-box"
                className="form-control"
                placeholder="Quick Filter..."
                onInput={onFilterTextBoxChanged}
                style={{ width: '200px' }}
            />

            <span className="text-muted small ms-1">Active filters:</span>

            <span className="badge rounded-pill text-bg-light border">
                Status: {statusFilter.includes("all") ? "All" : statusFilter.join(", ")}
            </span>

            <span className="badge rounded-pill text-bg-light border">
                Date: {dateRange === "all" ? "All time" : `Last ${dateRange} days`}
            </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
            {/* BULK ACTIONS */}
            <div>
                {selectedRows.length > 0 && (
                    <div className="btn-group w-100">
                        <button type="button" className="btn btn-sm btn-danger dropdown-toggle w-100" data-bs-toggle="dropdown">
                            Bulk Actions ({selectedRows.length})
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#BulkEmailModal">
                                    <i className="bi bi-envelope"></i> Send Email
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item" onClick={handleMarkUnattractive}>
                                    <i className="bi bi-eye-slash"></i> Mark as Unattractive
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#BulkEditModal">
                                    <i className="bi bi-pencil-square"></i> Edit
                                </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button className="dropdown-item text-danger" onClick={handleDeleteSelected}>
                                    <i className="bi bi-trash"></i> Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

        {/* FILTERS */}
        <div className="dropdown">
            <button
                className="btn btn-sm btn-outline-primary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
            >
                <i className="bi bi-funnel me-1"></i>
                Filters
            </button>

            <div className="dropdown-menu dropdown-menu-end p-3 shadow" style={{ minWidth: "300px" }}>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Status</label>

                    {[
                        { value: "pending", label: "Pending" },
                        { value: "T/P Request Sent", label: "T/P Request Sent" },
                        { value: "Quote Sent", label: "Quote Sent" },
                        { value: "unattractive", label: "Unattractive" },
                        { value: "Reminder Sent", label: "Reminder Sent" },
                        { value: "MOV Requirement Sent", label: "MOV Requirement Sent" },
                        { value: "No Stock Alert Sent", label: "No Stock Alert Sent" },
                        { value: "No Export Alert Sent", label: "No Export Alert Sent" },
                    ].map((option) => (
                        <div className="form-check" key={option.value}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`status-${option.value.replace(/\s+/g, "-")}`}
                                checked={statusFilter.includes(option.value)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setStatusFilter(prev => {
                                            const cleanPrev = prev.filter(s => s !== "all");
                                            return [...cleanPrev, option.value];
                                        });
                                    } else {
                                        setStatusFilter(prev => {
                                            const next = prev.filter(s => s !== option.value);
                                            return next.length > 0 ? next : ["pending"];
                                        });
                                    }
                                }}
                            />
                            <label
                                className="form-check-label small"
                                htmlFor={`status-${option.value.replace(/\s+/g, "-")}`}
                            >
                                {option.label}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-semibold">Date range</label>
                    <select
                        className="form-select form-select-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="14">Last 14 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All time</option>
                    </select>
                </div>

                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary w-50"
                        onClick={() => {
                            setStatusFilter(["pending"]);
                            setDateRange("14");
                        }}
                    >
                        Default
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary w-50"
                        onClick={() => {
                            setStatusFilter(["all"]);
                            setDateRange("all");
                        }}
                    >
                        Show all
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

            <div className="card border-0 shadow-sm mb-4 mt-2">
                <div className="card-body p-2">
                <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={colDefs}
                        gridOptions={gridOptions}
                        rowData={rfqs}
                        loading={isLoading}
                        theme={myTheme}
                        defaultColDef={{filter: true}}
                        pagination={true}
                        paginationPageSize={20}
                        components={{ actionCellRenderer: ActionCellRenderer, statusCellRenderer: StatusCellRenderer }}
                        overlayLoadingTemplate={overlayLoadingTemplate}
                        overlayNoRowsTemplate={overlayNoRowsTemplate}
                    />
                </div>
                </div>
            </div>

            <AddRfqModal id="addRfqModal" mode="create" handleUpdateRfqs={handleUpdateRfqs}/>
            <AddRfqModal id="EditRfqModal" mode="edit" rfqData={selectedRfq} handleUpdateRfqs={handleUpdateRfqs}/>
            <EmailModal id="SendEmailModal" rfqData={selectedRfq} autoFillData={autoFillData} onHide={() => console.log('Email modal closed')}/>
            <BulkEmailModal id="BulkEmailModal" rfqs={selectedRows}/>
            <BulkEditModal id="BulkEditModal" selectedRows={selectedRows} size="modal-lg" onSuccess={() => fetchRfqs()}/>
            <UploadBulkModal id="UploadBulkModal"/>
            <Offcanvas id="offcanvasRight" rfqData={selectedRfq} handleAutoFill={(data) => setAutoFillData(data)} onDeleteRequest={handleDelete} refreshRfqs={fetchRfqs}/>
        </div>
    );
}

export default Rfqs;