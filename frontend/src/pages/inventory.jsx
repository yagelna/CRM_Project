import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import UploadBulkModal from '../components/inventory/UploadBulkModal';
import BulkEditModal from '../components/inventory/BulkEditModal';
import ExportModal from '../components/inventory/ExportModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';

ModuleRegistry.registerModules([AllCommunityModule]);

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const gridRef = useRef();
    const myTheme = themeQuartz
    .withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
    });

    // delete selected rows 
    const handleDelete = async (ids) => {
        if(window.confirm(`Are you sure you want to delete ${Array.isArray(ids) ? ids.length : 1} item(s)?`)){
            const url = Array.isArray(ids) ? `api/inventory/bulk-delete/` : `api/inventory/${ids}/`;
            const data = Array.isArray(ids) ? { ids } : null;
            try {
                const res = await axiosInstance.delete(url, { data });
                console.log(res.data);
                setInventory(prevInventory => prevInventory.filter(item => !ids.includes(item.id)));
                fetchInventory();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleDeleteSelected = () => {
        console.log("delete selected rows");
        if(selectedRows.length > 0){
            const ids = selectedRows.map(row => row.id);
            handleDelete(ids);
            setSelectedRows([]);
        }
    };
    
    const [colDefs, setColDefs] = useState([
        { field: "mpn", headerName: "MPN"},
        //{ field: "description", headerName: "Description" },
        { field: "manufacturer", headerName: "Manufacturer" },
        { field: "quantity", headerName: "Quantity"},
        { field: "date_code", headerName: "Date Code" },
        { field: "supplier", headerName: "Supplier" },
        { field: "location", headerName: "Location" }, 
        { field: "cost", headerName: "Cost" }, // purchase price
        { field: "price", headerName: "Price" }, // selling price
        {
            field: "actions",
            headerName: "Actions",
            cellRenderer: "actionCellRenderer",
            cellRendererParams: {
                handleDelete: handleDelete,
                handleEdit: (inventoryItem) => setSelectedItem(inventoryItem),
                mouduleName: "Inventory",
            },
            pinned: "right",
            width: 126,
            filter: false,
            sortable: false,
            cellStyle: { textAlign: 'center' }
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


    // fetch inventory from the backend
    const fetchInventory = () => {
        axiosInstance.get('api/inventory/')
            .then((response) => {
                setInventory(response.data);
            })
            .catch((error) => console.error('Error fetching inventory: ' + error));
    };

    useEffect(() => { 
        fetchInventory();
    }, []);

    //update inventory state after adding or editing an inventory
    const handleUpdateInventory = (updatedInventoryItem, mode) => { 
        if (mode === 'create') {
            setInventory((prevInventory) => [...prevInventory, updatedInventoryItem]);
        } else if (mode === 'edit') {
            setInventory((prevInventory) =>
                prevInventory.map((inventory) => (inventory.id === updatedInventoryItem.id ? updatedInventoryItem : inventory))
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
            <h1>Inventory</h1>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                    <input
                        type="text"
                        id="filter-text-box"
                        className="form-control form-control-sm me-2"
                        placeholder="Filter..."
                        onInput={onFilterTextBoxChanged}
                        style={{ width: "200px" }}
                    />

                    {selectedRows.length > 0 && (
                        <div className="d-flex align-items-center">
                            <span className="me-2 text-muted small">{selectedRows.length} of {inventory.length} selected</span>
                            <button className="btn btn-outline-danger btn-sm me-2" onClick={handleDeleteSelected}>
                                <i className="bi bi-trash"></i> Delete
                            </button>
                            <button className="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#BulkEditModal">
                                <i className="bi bi-pencil"></i> Edit
                            </button>
                            {/* archive button */}
                            <button className="btn btn-outline-primary btn-sm ms-2">
                                <i className="bi bi-archive"></i> Archive
                            </button>
                        </div>
                    )}
                </div>
                {/* צד ימין - כפתורים קבועים */}
                <div>
                    <button type="button" className="btn btn-primary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#addInventoryModal"> 
                        Add Item 
                    </button>
                    <button type="button" className="btn btn-primary btn-sm me-2" data-bs-toggle="modal" data-bs-target="#UploadBulkModal"> 
                        Upload Bulk Inventory 
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#ExportModal">
                        Export
                    </button>
                </div>
            </div>
            <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    columnDefs={colDefs}
                    gridOptions={gridOptions}
                    rowData={inventory}
                    theme={myTheme}
                    defaultColDef={{ flex: 1, filter: true}}
                    pagination={true}
                    paginationPageSize={20}
                    components={{ actionCellRenderer: ActionCellRenderer }}
                    overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}

                />
            </div>
            <AddInventoryModal id="addInventoryModal" mode="create" handleUpdateInventory={handleUpdateInventory}/>
            <AddInventoryModal id="EditInventoryModal" mode="edit" itemData={selectedItem} handleUpdateInventory={handleUpdateInventory}/>
            <UploadBulkModal id="UploadBulkModal"/>
            <BulkEditModal id="BulkEditModal" selectedRows={selectedRows}/>
            <ExportModal id="ExportModal"/>
            
        </div>
    );
}

export default Inventory;