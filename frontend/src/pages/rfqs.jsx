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

ModuleRegistry.registerModules([AllCommunityModule]);


const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [autoFillData, setAutoFillData] = useState(null);
    const gridRef = useRef();
    const myTheme = themeQuartz
	.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#5A34F1",
        headerTextColor:"#ffffff",
    });

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
    const [colDefs, setColDefs] = useState([
        {
            field: "id",
            headerName: "ID",
            width: 80,
            valueFormatter: (params) => '#'+ params.value.toString().padStart(5, '0'),
            filter: false
        },
        {   field: "mpn",
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
        {   field: "target_price", headerName: "TP", width: 80 },
        {   field: "qty_requested", headerName: "QTY", width: 80 },
        {   field: "manufacturer", headerName: "MFG", flex: 0.7 },
        {   field: "stock_source", headerName: "Stock Source", flex: 1 },
        {   field: "source", headerName: "RFQ Source", flex: 1 },
        // { field: "contact_object.name", headerName: "Contact Name" },
        {   field: "contact_object.company_object.name", headerName: "Company", flex: 1 },
        {   field: "contact_object.company_object.country", headerName: "Country", flex: 1 },
        {   field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc', hide: true },
        {   field: "updated_at", headerName: "Updated At",flex: 1, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '' },
        { 
            field: "status",
            headerName: "Status",
            cellRenderer: "statusCellRenderer",
            flex: 0.8,
        },
    ]);

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

    // fetch rfqs from the backend function
    const fetchRfqs = () => {
        axiosInstance.get('api/rfqs/')
            .then((response) => {
                setRfqs(response.data);
            })
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    };

    const handleMarkUnattractive = () => {
        const ids = selectedRows.map(row => row.id);
        const updates = { status: 'Unattractive' };

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
        // WebSocket connection
        const ws = new WebSocket(CONFIG.WS_BASE_URL);
        ws.onopen = () => {
            console.log('Websocket connected');
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("New data received via websocket: ", data);
            fetchRfqs(); // fetch rfqs after receiving new data
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
        const emailModal = document.getElementById('SendEmailModal');
        const handleModalClose = () => {
            console.log('Email modal closed');
            setAutoFillData(null);
        };
        emailModal.addEventListener('hidden.bs.modal', handleModalClose);

        return () => {
            ws.close();
            emailModal.removeEventListener('hidden.bs.modal', handleModalClose);
        };
        
    }, []); 


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
                    <h2 className="mb-1">Rfqs</h2>
                    <p className="text-muted">Manage your requests for quotes (RFQs) </p>
                </div>
                <button 
                    type="button" 
                    className="btn btn-primary btn me-2 " 
                    data-bs-toggle="modal" 
                    data-bs-target="#addRfqModal">
                    + Add RFQ
                </button>
            </div>
            <div>
                <div className="d-flex justify-content-between align-items-center">
                        <input
                        type="text"
                        id="filter-text-box"
                        className="form-control"
                        placeholder="Quick Filter..."
                        onInput={onFilterTextBoxChanged}
                        style={{ width: '200px' }}
                    />

                    {selectedRows.length > 0 && (
                        <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-danger dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            Bulk Actions
                            </button>
                            <ul className="dropdown-menu">
                                <li><button className="dropdown-item" type="button" data-bs-toggle="modal" data-bs-target="#BulkEmailModal"> 
                                    <i className="bi bi-envelope"></i> Send Email</button></li>
                                <li><button className="dropdown-item" type="button" onClick={handleMarkUnattractive}>
                                <i className="bi bi-eye-slash"></i> Mark as Unattractive</button></li>
                                <li><button className="dropdown-item" type="button" data-bs-toggle="modal" data-bs-target="#BulkEditModal">
                                    <i className="bi bi-pencil-square"></i> Edit</button></li>
                                <li><hr className="dropdown-divider"></hr></li>
                                <li><button className="dropdown-item text-danger" type="button" onClick={handleDeleteSelected}> <i className="bi bi-trash"></i> Delete</button></li>
                            </ul>
                        </div>
                    )}

                    
                </div>
            </div>
            <div className="card border-0 shadow-sm mb-4 mt-2">
                <div className="card-body p-2">
                <div className="ag-theme-alpine" style={{ height: 650, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={colDefs}
                        gridOptions={gridOptions}
                        rowData={rfqs}
                        theme={myTheme}
                        defaultColDef={{filter: true}}
                        pagination={true}
                        paginationPageSize={20}
                        components={{ actionCellRenderer: ActionCellRenderer, statusCellRenderer: StatusCellRenderer }}
                        overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}
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