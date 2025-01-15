import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddRfqModal from '../components/rfqs/AddRfqModal';
import UploadBulkModal from '../components/rfqs/UploadBulkModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';
import StatusCellRenderer from '../components/StatusCellRenderer';
import EmailModal from '../components/rfqs/EmailModal';
import Offcanvas from '../components/modal/offcanvas';

ModuleRegistry.registerModules([AllCommunityModule]);


const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [offcanvasMode, setOffcanvasMode] = useState(null);
    const gridRef = useRef();
    const myTheme = themeQuartz
	.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
    });

    // delete rfq by id
    const handleDelete = (id) => {
        axiosInstance.delete(`api/rfqs/${id}/`)    
            .then((response) => {
                setRfqs(rfqs.filter((rfq) => rfq.id !== id));
                fetchRfqs();
            })
            .catch((error) => console.error('Error deleting rfq: ' + error));
    };

    // Column Definitions: Defines & controls grid columns.
    const [colDefs, setColDefs] = useState([
        { field: "mpn",
            headerName: "MPN",
            cellRenderer: (params) => (
                <a
                    href="#offcanvasRight"
                    data-bs-toggle="offcanvas"
                    className="link-opacity-50-hover fw-medium"
                    onClick={() => { setSelectedRfq(params.data); setOffcanvasMode('mpn'); }}
                >
                    {params.value}
                </a>
            ),
        
        },
        { field: "target_price", headerName: "T/P" },
        { field: "qty_requested", headerName: "Requested Qty" },
        { field: "manufacturer", headerName: "MFG" },
        { field: "source", headerName: "Source" },
        { field: "contact_object.name", headerName: "Contact Name" },
        { field: "contact_object.company_object.name", headerName: "Company Name" },
        { field: "contact_object.company_object.country", headerName: "Country" },
        { field: "created_at", headerName: "Created At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '', sort: 'desc' },
        { field: "updated_at", headerName: "Updated At", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '' },
        { 
            field: "status",
            headerName: "Status",
            cellRenderer: "statusCellRenderer",
        },
        {
            field: "actions",
            headerName: "Actions",
            cellEditorPopup: "true",
            cellRenderer: "actionCellRenderer",
            cellRendererParams: {
                handleDelete: handleDelete,
                handleEdit: (rfq) => setSelectedRfq(rfq),
                mouduleName: "Rfq",
            },
            pinned: "right",
            width: 126,
            filter: false,
            sortable: false,
            cellStyle: { textAlign: 'center' }
        },
    ]);

    const gridOptions = {
        defaultColDef: {
            domLayout: 'normal',
        },
        enableCellTextSelection: true,
    };

    // fetch rfqs from the backend function
    const fetchRfqs = () => {
        axiosInstance.get('api/rfqs/')
            .then((response) => {
                setRfqs(response.data);
            })
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    };
    useEffect(() => {
        fetchRfqs();
        // open websocket connection
    const ws = new WebSocket('ws://localhost:8000/ws/rfqs/');
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
        
    }, []); 


    //update rfqs state after adding or editing an rfq
    const handleUpdateRfqs = (updatedRfq, mode) => { 
        if (mode === 'create') {
            setRfqs((prevRfqs) => [...prevRfqs, updatedRfq]);
        } else if (mode === 'edit') {
            setRfqs((prevRfqs) =>
                prevRfqs.map((rfq) => (rfq.id === updatedRfq.id ? updatedRfq : rfq))
            );
        }
    };

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current.api.setGridOption(
          "quickFilterText",
          document.getElementById("filter-text-box").value,
        );
      }, []);

    return (
        <div className='container mt-4'>
            <h1>Rfqs</h1>
            <div className="d-flex justify-content-between align-items-center mb-3">
    <div>
        <button 
            type="button" 
            className="btn btn-primary btn-sm me-2 " 
            data-bs-toggle="modal" 
            data-bs-target="#addRfqModal">
            Add RFQ
        </button>
    </div>

    <div className="d-flex align-items-center">
            <input
            type="text"
            id="filter-text-box"
            className="form-control"
            placeholder="Search..."
            onInput={onFilterTextBoxChanged}
            style={{ width: '200px' }}
        />
    </div>
</div>
            <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
                  <AgGridReact
                    ref={gridRef}
                    columnDefs={colDefs}
                    gridOptions={gridOptions}
                    rowData={rfqs}
                    theme={myTheme}
                    defaultColDef={{ flex: 1, filter: true}}
                    pagination={true}
                    paginationPageSize={20}
                    components={{ actionCellRenderer: ActionCellRenderer, statusCellRenderer: StatusCellRenderer }}
                    overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading Data...</div>'}
                  />
            </div>

            <AddRfqModal id="addRfqModal" mode="create" handleUpdateRfqs={handleUpdateRfqs}/>
            <AddRfqModal id="EditRfqModal" mode="edit" rfqData={selectedRfq} handleUpdateRfqs={handleUpdateRfqs}/>
            <EmailModal id="SendEmailModal" rfqData={selectedRfq}/>
            <UploadBulkModal id="UploadBulkModal"/>
            <Offcanvas id="offcanvasRight" rfqData={selectedRfq} mode={offcanvasMode} />
            
        </div>
        
    );
}

export default Rfqs;