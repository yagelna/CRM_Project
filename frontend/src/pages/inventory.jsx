import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import UploadBulkModal from '../components/inventory/UploadBulkModal';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import ActionCellRenderer from '../components/ActionCellRenderer';
import axios from 'axios';

ModuleRegistry.registerModules([AllCommunityModule]);

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const gridRef = useRef();
    const myTheme = themeQuartz
    .withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#CFDEEB",
        headerFontSize: 14,
        headerFontWeight: 600
    });

    // delete inventory by id
    const handleDelete = (id) => {
        axiosInstance.delete(`api/inventory/${id}/`)
            .then((response) => {
                setInventory(inventory.filter((inventory) => inventory.id !== id));
                fetchInventory();
            })
            .catch((error) => console.error('Error deleting inventory: ' + error)); 
    };

    const [colDefs, setColDefs] = useState([
        { field: "mpn", headerName: "MPN"},
        { field: "manufacturer", headerName: "Manufacturer" },
        { field: "quantity", headerName: "Quantity"},
        { field: "date_code", headerName: "Date Code" },
        { field: "supplier", headerName: "Supplier" },
        { field: "location", headerName: "Location" },
        { field: "cost", headerName: "Cost" },
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

    const gridOptions = {
        defaultColDef: {
            domLayout: 'normal', 
        },
        enableCellTextSelection: true,
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
            <div className="mb-3">
                <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addInventoryModal"> Add Item </button>
                <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#UploadBulkModal"> Upload Bulk Inventory </button>
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
                    ref={gridRef}
                    columnDefs={colDefs}
                    gridOptions={gridOptions}
                    rowData={inventory}
                    theme={myTheme}
                    defaultColDef={{ flex: 1, filter: true}}
                    pagination={true}
                    paginationPageSize={20}
                    components={{ actionCellRenderer: ActionCellRenderer }}
                    overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading Data...</div>'}

                />
            </div>
            <AddInventoryModal id="addInventoryModal" mode="create" handleUpdateInventory={handleUpdateInventory}/>
            <AddInventoryModal id="EditInventoryModal" mode="edit" itemData={selectedItem} handleUpdateInventory={handleUpdateInventory}/>
            <UploadBulkModal id="UploadBulkModal"/>
        </div>
    );
}

export default Inventory;