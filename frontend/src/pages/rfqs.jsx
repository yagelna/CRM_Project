import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AddRfqModal from '../components/rfqs/AddRfqModal';
import UploadBulkModal from '../components/rfqs/UploadBulkModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';

ModuleRegistry.registerModules([AllCommunityModule]);


const Rfqs = () => {
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const gridRef = useRef();

    const myTheme = themeQuartz
	.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
    });

    const handleEdit = (rfq) => {
        setSelectedRfq(rfq);
    };

        // delete rfq by id
        const handleDelete = (id) => {
            axios.delete(`http://localhost:8000/api/rfqs/${id}/`)    
                .then((response) => {
                    setRfqs(rfqs.filter((rfq) => rfq.id !== id));
                    fetchRfqs();
                })
                .catch((error) => console.error('Error deleting rfq: ' + error));
        };

    // Column Definitions: Defines & controls grid columns.
    const [colDefs, setColDefs] = useState([
        { field: "mpn", headerName: "MPN"},
        { field: "target_price", headerName: "Target Price" },
        { field: "qty_requested", headerName: "Quantity"},
        { field: "manufacturer", headerName: "Manufacturer" },
        {
            field: "actions",
            headerName: "Actions",
            cellRenderer: "actionCellRenderer",
            cellRendererParams: {
                handleDelete: handleDelete,
                handleEdit: handleEdit,
            },
        },
    ]);

    // fetch rfqs from the backend function
    const fetchRfqs = () => {
        axios.get('http://localhost:8000/api/rfqs')
            .then((response) => {
                setRfqs(response.data);
            })
            .catch((error) => console.error('Error fetching rfqs: ' + error));
    };
    useEffect(() => {
        fetchRfqs();
    }, []);

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
            <div className="mb-3">
                <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addRfqModal"> Add RFQ </button>
                <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#UploadBulkModal"> Upload Bulk RFQs </button>
                <span>Quick Filter:</span>
                <input
                    type="text"
                    id="filter-text-box"
                    placeholder="Filter..."
                    onInput={onFilterTextBoxChanged}
                />
            </div>
            <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
                  <AgGridReact
                    theme={myTheme}
                    ref={gridRef}
                    rowData={rfqs}
                    columnDefs={colDefs}
                    defaultColDef={{ flex: 1, filter: true}}
                    pagination={true}
                    paginationPageSize={20}
                    components={{ actionCellRenderer: ActionCellRenderer }}
                  />
            </div>

            <AddRfqModal id="addRfqModal" mode="create" handleUpdateRfqs={handleUpdateRfqs}/>
            <AddRfqModal id="EditRfqModal" mode="edit" rfqData={selectedRfq} handleUpdateRfqs={handleUpdateRfqs}/>
            <UploadBulkModal id="UploadBulkModal"/>
            
        </div>
    );
}

export default Rfqs;